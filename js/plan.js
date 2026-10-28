// Захаваны план тыдня. План не пералічваецца пры кожным адкрыцці: новыя дні дадаюцца,
// а будучыя прыёмы перабудоўваюцца толькі па змене карыстальніка. Без DOM, каб працавала ў тэстах.
import { BY_ID } from './products.js';
import { BY_TEMPLATE } from './templates.js';
import {
  MEALS, addDays, weekdayOf, timeLimit, usableMethods, nutrition, pickDish,
  emptyCtx, addToCtx, checkRules, mainIds,
} from './engine.js';
import { stockOn, availability, purchaseEvents } from './stock.js';

export const HORIZON = 7;

// Стан прыёму ежы. planned і eaten маюць страву; астатнія — не.
// off — па графіку не плануем; empty — не хапіла прадуктаў; moved — страву перанеслі ў іншы слот.
export const STATES = ['planned', 'eaten', 'skipped', 'replaced', 'moved', 'off', 'empty'];
const HAS_DISH = new Set(['planned', 'eaten']);

export const REPLACED = { office: 'у офісе', guests: 'у гасцях', store: 'гатовае з крамы', other: 'іншае дома' };

export const keyOf = (date, meal) => `${date}:${meal}`;
export function parseKey(key) {
  const [date, meal] = key.split(':');
  return { date, meal };
}
const keyOrder = (k) => { const { date, meal } = parseKey(k); return `${date}:${MEALS.indexOf(meal)}`; };
const byKey = (a, b) => (keyOrder(a) < keyOrder(b) ? -1 : keyOrder(a) > keyOrder(b) ? 1 : 0);

export function getSlot(state, key) {
  const { date, meal } = parseKey(key);
  return state.plan?.[date]?.[meal] ?? null;
}

function setSlot(state, key, slot) {
  const { date, meal } = parseKey(key);
  state.plan[date] ??= {};
  state.plan[date][meal] = slot;
}

// ── Сям'я і графік ──

export function members(settings) {
  return settings.members?.length ? settings.members : [{ name: 'Я', take: [] }];
}
export const people = (settings) => members(settings).length;
export const takeCount = (settings, weekday) => members(settings).filter((m) => m.take?.includes(weekday)).length;

// Абед «з сабой», калі хоць адзін удзельнік бярэ яго ў гэты дзень.
export function slotMode(settings, date, meal) {
  const wd = weekdayOf(date);
  if (settings.schedule?.[wd]?.[meal] === 'skip') return 'skip';
  if (meal === 'lunch' && takeCount(settings, wd) > 0) return 'take';
  return 'home';
}

export function limitFor(state, date, meal) {
  if (meal === 'breakfast') return state.settings.breakfastMinutes ?? 15;
  const m = state.dayMinutes?.[date];
  if (m === 'batch') return null;
  if (m != null) return m;
  return timeLimit(state.settings, weekdayOf(date), meal);
}

// ── Страва ў слоце ──

// Слот захоўвае толькі шаблон, складнікі па слотах шаблона і спосаб, а харчовыя лічбы лічацца нанова.
export function dishFromSlot(slot, settings) {
  if (!slot?.tpl || !HAS_DISH.has(slot.state)) return null;
  const t = BY_TEMPLATE[slot.tpl];
  if (!t) return null;
  const chosen = t.slots
    .map((s, i) => ({ slot: s, ids: (slot.fill?.[i] ?? []).filter((id) => BY_ID[id]) }))
    .filter((c) => c.ids.length);
  const method = t.methods[slot.m] ?? usableMethods(t, settings.equipment, null)[0] ?? t.methods[0];
  return { template: t, method, chosen, missing: [], check: [], ...nutrition({ chosen, missing: [] }) };
}

export function dishFields(dish) {
  const parts = [...dish.chosen, ...dish.missing];
  return {
    tpl: dish.template.id,
    fill: dish.template.slots.map((s) => parts.filter((c) => c.slot === s).flatMap((c) => c.ids)),
    m: Math.max(0, dish.template.methods.indexOf(dish.method)),
  };
}

export const slotIds = (slot) => (slot?.fill ?? []).flat();

export function dishAt(state, key) {
  return dishFromSlot(getSlot(state, key), state.settings);
}

// Што ўжо з'едзена і запланавана вакол даты — каб тыдзень быў збалансаваны.
function ctxFor(state, date, meal, pending) {
  const ctx = emptyCtx();
  ctx.dayIds = null;
  const self = keyOf(date, meal);
  let lastKey = null;
  const dayIds = new Set();
  for (let i = -3; i <= 3; i++) {
    const d = addDays(date, i);
    for (const m of MEALS) {
      const k = keyOf(d, m);
      if (k === self || pending.has(k)) continue;
      const dish = dishAt(state, k);
      if (!dish) continue;
      addToCtx(ctx, dish);
      if (d === date) mainIds(dish).forEach((id) => dayIds.add(id));
      if (byKey(k, self) < 0) lastKey = k;
    }
  }
  ctx.dayIds = dayIds;
  ctx.lastId = lastKey ? getSlot(state, lastKey)?.tpl ?? null : null;
  return ctx;
}

// Перазапаўняе слоты ў храналагічным парадку. Кожная страва можа патрабаваць адну дакупку;
// купленае далей лічыцца даступным. avoid — {key: Set шаблонаў}, ад якіх адмовіліся.
export function refill(state, keys, today, { avoid = {} } = {}) {
  const settings = state.settings;
  const sorted = [...new Set(keys)].sort(byKey);
  const pending = new Set(sorted);
  const buys = new Set();
  // Тое, што трэба для захаваных страў, будзе куплена, таму можна разлічваць і на гэта.
  for (const [date, day] of Object.entries(state.plan)) {
    if (date < today) continue;
    for (const m of MEALS) if (!pending.has(keyOf(date, m)) && day[m]?.state === 'planned') slotIds(day[m]).forEach((id) => buys.add(id));
  }
  const stockCache = {};
  for (const key of sorted) {
    const { date, meal } = parseKey(key);
    pending.delete(key);
    const old = getSlot(state, key) ?? {};
    const mode = old.userMode ? old.mode : slotMode(settings, date, meal);
    const base = { mode, ...(old.userMode ? { userMode: true } : {}) };
    if (mode === 'skip') {
      setSlot(state, key, { ...base, state: 'off' });
      continue;
    }
    // Абед з сабой: калі ўчорашняя вячэра трывае кантэйнер — гатуем яе з запасам.
    if (meal === 'lunch' && mode === 'take') {
      const prevKey = keyOf(addDays(date, -1), 'dinner');
      const prev = getSlot(state, prevKey);
      if (prev && HAS_DISH.has(prev.state) && !prev.leftoverOf && BY_TEMPLATE[prev.tpl]?.portable && !avoid[key]?.has(prev.tpl)) {
        setSlot(state, key, { ...base, state: 'planned', tpl: prev.tpl, fill: prev.fill.map((x) => [...x]), m: prev.m, leftoverOf: prevKey });
        continue;
      }
    }
    stockCache[date] ??= availability(stockOn(state, date));
    const have = new Set(stockCache[date].have);
    const maybe = new Set(stockCache[date].maybe);
    buys.forEach((id) => { have.add(id); maybe.delete(id); });
    const dish = pickDish({
      meal, mode, have, maybe, settings,
      limit: mode === 'take' ? null : limitFor(state, date, meal),
      ctx: ctxFor(state, date, meal, pending),
      avoid: avoid[key] ?? new Set(),
    });
    if (!dish) {
      setSlot(state, key, { ...base, state: 'empty' });
      continue;
    }
    for (const m of dish.missing) buys.add(m.ids[0]);
    setSlot(state, key, {
      ...base, state: 'planned', ...dishFields(dish),
      ...(avoid[key]?.size ? { rejected: [...avoid[key]] } : {}),
    });
  }
}

export const hasStock = (state) => purchaseEvents(state).length > 0;

// Дадае дні, якіх не хапае ў гарызонце, і прыбірае старую гісторыю. Існыя прыёмы не чапае.
export function ensurePlan(state, today) {
  state.plan ??= {};
  const oldest = addDays(today, -14);
  for (const d of Object.keys(state.plan)) if (d < oldest) delete state.plan[d];
  if (!hasStock(state)) return false;
  const missing = [];
  for (let i = 0; i < HORIZON; i++) {
    const d = addDays(today, i);
    for (const m of MEALS) if (!state.plan[d]?.[m]) missing.push(keyOf(d, m));
  }
  if (missing.length) refill(state, missing, today);
  return missing.length > 0;
}

// Перабудоўвае будучыя прыёмы з даты from. Адзначанае, перанесенае і з'едзенае застаецца.
export function rebuildFrom(state, from, today) {
  const keys = [];
  for (let i = 0; i < HORIZON; i++) {
    const d = addDays(today, i);
    if (d < from) continue;
    for (const m of MEALS) {
      const s = state.plan?.[d]?.[m];
      if (!s || (['planned', 'empty', 'off'].includes(s.state) && !s.movedFrom)) keys.push(keyOf(d, m));
    }
  }
  refill(state, keys, today);
}

// Калі вячэра змянілася, абед з яе рэштак на заўтра падбіраецца нанова.
function refreshLeftover(state, dinnerKey, today) {
  const { date, meal } = parseKey(dinnerKey);
  if (meal !== 'dinner') return;
  const lunchKey = keyOf(addDays(date, 1), 'lunch');
  const lunch = getSlot(state, lunchKey);
  if (lunch?.leftoverOf === dinnerKey && lunch.state === 'planned') refill(state, [lunchKey], today);
}

// ── Адзнакі прыёму ежы ──

export function markEaten(state, key) {
  const slot = getSlot(state, key);
  const dish = dishFromSlot(slot, state.settings);
  if (!dish) return null;
  slot.state = 'eaten';
  const { date, meal } = parseKey(key);
  state.cooked = (state.cooked ?? []).filter((c) => !(c.date === date && c.meal === meal));
  state.cooked.push({
    date, meal, templateId: dish.template.id, ids: slot.leftoverOf ? [] : mainIds(dish),
    fish: dish.fish, legume: dish.legume, redMeat: dish.redMeat, plants: [...dish.plants],
  });
  state.cooked = state.cooked.slice(-300);
  return dish;
}

export function markSkipped(state, key, today) {
  const slot = getSlot(state, key);
  if (!slot) return;
  slot.state = 'skipped';
  refreshLeftover(state, key, today);
}

export function markReplaced(state, key, by, today) {
  const slot = getSlot(state, key);
  if (!slot) return;
  slot.state = 'replaced';
  slot.replacedBy = REPLACED[by] ? by : 'other';
  refreshLeftover(state, key, today);
}

// Вяртае прыём да «запланавана», калі страва ў ім захавалася.
export function unmark(state, key) {
  const slot = getSlot(state, key);
  if (!slot) return;
  const { date, meal } = parseKey(key);
  if (slot.state === 'eaten') state.cooked = (state.cooked ?? []).filter((c) => !(c.date === date && c.meal === meal));
  delete slot.replacedBy;
  slot.state = slot.tpl ? 'planned' : 'empty';
}

// «Перанесці» ставіць тую ж страву ў іншы слот, а стары становіцца вольным.
export function moveMeal(state, from, to, today) {
  const src = getSlot(state, from);
  if (!src?.tpl || src.state !== 'planned' || from === to) return false;
  const dst = getSlot(state, to) ?? {};
  const mode = dst.mode && dst.mode !== 'skip' ? dst.mode : 'home';
  setSlot(state, to, { mode, state: 'planned', tpl: src.tpl, fill: src.fill, m: src.m, movedFrom: from, ...(dst.mode === 'skip' ? { userMode: true } : {}) });
  setSlot(state, from, { mode: src.mode, state: 'moved', movedTo: to });
  refreshLeftover(state, from, today);
  refreshLeftover(state, to, today);
  return true;
}

// Страва, выбраная карыстальнікам у рэжыме «зараз», займае гэты прыём.
export function setDish(state, key, dish, today) {
  const old = getSlot(state, key) ?? {};
  setSlot(state, key, { mode: old.mode && old.mode !== 'skip' ? old.mode : 'home', state: 'planned', ...dishFields(dish) });
  refreshLeftover(state, key, today);
}

// «Іншая страва»: падбірае новую, не паўтараючы адхіленыя ў гэтым слоце.
export function reroll(state, key, today) {
  const slot = getSlot(state, key) ?? {};
  const avoid = new Set(slot.rejected ?? []);
  if (slot.tpl && slot.state === 'planned') avoid.add(slot.tpl);
  if (slot.mode === 'skip') setSlot(state, key, { mode: 'home', userMode: true, state: 'empty' });
  else if (slot.state && !['planned', 'empty', 'off'].includes(slot.state)) setSlot(state, key, { mode: slot.mode, state: 'empty' });
  refill(state, [key], today, { avoid: { [key]: avoid } });
  // Калі ўсе варыянты адхілены, пачынаем кола зноў.
  if (getSlot(state, key).state === 'empty' && avoid.size > 1) refill(state, [key], today, { avoid: { [key]: new Set([slot.tpl].filter(Boolean)) } });
  refreshLeftover(state, key, today);
}

// Што страву «з рэштак» трэба згатаваць з запасам: колькі порцый на заўтрашні абед.
export function portionsFor(state, key) {
  const eat = people(state.settings);
  const { date, meal } = parseKey(key);
  if (meal !== 'dinner') return { eat, take: 0 };
  const nextDate = addDays(date, 1);
  const lunch = state.plan?.[nextDate]?.lunch;
  const take = lunch?.leftoverOf === key && HAS_DISH.has(lunch.state) ? takeCount(state.settings, weekdayOf(nextDate)) : 0;
  return { eat, take };
}

// Прыкладная вага адной штукі — каб пісаць «4 яйкі», а не «240 г яек».
const PIECE = { eggs: 55, avocado: 150, banana: 120, apple: 170, pear: 170, tortilla: 60, lemon: 100, mandarin: 80, pepper: 150, zucchini: 250, onion: 100 };

function roundGrams(g) {
  return g < 50 ? Math.max(5, Math.round(g / 5) * 5) : Math.round(g / 10) * 10;
}

// Грамы для ўсёй сям'і: колькасць порцый × грамы на порцыю ў слоце шаблона.
export function gramsFor(dish, portions) {
  const out = [];
  for (const { slot, ids } of dish.chosen) {
    const per = slot.g / ids.length;
    for (const id of ids) {
      const grams = roundGrams(per * portions);
      const piece = PIECE[id];
      out.push({ id, name: BY_ID[id].name, grams, pieces: piece ? Math.max(1, Math.round(grams / piece)) : null });
    }
  }
  return out;
}

// Дні для праверкі правілаў: замененыя, прапушчаныя і перанесеныя прыёмы баланс не псуюць.
export function planDays(state, today) {
  const days = [];
  for (let i = 0; i < HORIZON; i++) {
    const date = addDays(today, i);
    const meals = {};
    for (const m of MEALS) meals[m] = { slot: getSlot(state, keyOf(date, m)), dish: dishAt(state, keyOf(date, m)) };
    days.push({ date, weekday: weekdayOf(date), meals });
  }
  return days;
}

export function planRules(state, today) {
  return checkRules(planDays(state, today));
}

// Куды можна перанесці прыём: усе слоты гарызонту, акрамя гэтага і ўжо з'едзенага.
export function moveTargets(state, from, today) {
  const out = [];
  for (let i = 0; i < HORIZON; i++) {
    const date = addDays(today, i);
    for (const m of MEALS) {
      const k = keyOf(date, m);
      if (k === from) continue;
      const s = getSlot(state, k);
      if (s && ['eaten', 'replaced'].includes(s.state)) continue;
      out.push({ key: k, date, meal: m, current: dishAt(state, k)?.template.title ?? null });
    }
  }
  return out;
}

export { HAS_DISH };
