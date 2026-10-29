// Рухавік канструктара: запаўняе шаблоны з запасаў, лічыць карыснасць, складае тыдзень
// і правярае яго па правілах П1–П7. Без DOM, каб працаваў і ў браўзеры, і ў тэстах на Node.
import { BY_ID } from './products.js';
import { TEMPLATES } from './templates.js';

export const MEALS = ['breakfast', 'lunch', 'dinner'];
export const MEAL_NAMES = { breakfast: 'Сняданак', lunch: 'Абед', dinner: 'Вячэра' };
export const EQUIPMENT = {
  stove: 'Пліта',
  oven: 'Духоўка',
  microwave: 'Мікрахвалёўка',
  multicooker: 'Мультыварка',
  airfryer: 'Аэрагрыль',
  blender: 'Блэндэр',
};

// Мэты тыдня (П3–П6). Лікі — з афіцыйных рэкамендацый, гл. даследаванне праекта.
export const WEEK_GOALS = { fish: 2, legume: 3, redMeatMax: 2, plants: 30, fiberPerDay: 25, proteinPerMeal: 20 };

// Спосабы прыгатавання, даступныя на гэтай кухні ў межах часу. limit = null — без абмежавання.
export function usableMethods(template, equipment, limit) {
  return template.methods
    .filter((m) => m.equip === 'none' || equipment.includes(m.equip))
    .filter((m) => limit == null || m.total <= limit)
    .sort((a, b) => a.total - b.total);
}

// Падстаўляе складнікі з запасаў у слоты шаблона.
// have — Set з id складнікаў, якія ёсць (запасы плюс ужо запланаваныя дакупкі).
// maybe — тыя з have, што, магчыма, ужо скончыліся: бяруцца толькі калі няма надзейнейшых.
export function fillTemplate(template, have, exclude = [], maybe = null) {
  const chosen = [];
  const missing = [];
  for (const slot of template.slots) {
    const opts = slot.opts.filter((id) => !exclude.includes(id));
    let avail = opts.filter((id) => have.has(id));
    if (maybe) avail = [...avail.filter((id) => !maybe.has(id)), ...avail.filter((id) => maybe.has(id))];
    const ids = avail.slice(0, slot.pick || 1);
    if (ids.length) chosen.push({ slot, ids });
    else if (slot.req) {
      // Калі ўсе варыянты слота выключаныя, страва для гэтай сям'і немагчымая.
      if (!opts.length) return null;
      missing.push({ slot, ids: [opts[0]] });
    }
  }
  return { chosen, missing };
}

// Грамы на порцыю: gx — свае грамы для асобных варыянтаў (бульбы бярэцца больш, чым сухой крупы).
export const slotGrams = (slot, id) => slot.gx?.[id] ?? slot.g;

// Лічыць бялок, валакно, расліны і тэгі для запоўненага шаблона.
// Пасля дакупкі: missing таксама ўлічваецца, бо страву ацэньваюць такой, якой яна будзе.
export function nutrition(filled) {
  let protein = 0;
  let fiber = 0;
  const plants = new Set();
  const groups = new Set();
  const grams = {};
  const plate = { plant: 0, grain: 0, protein: 0 };
  for (const { slot, ids } of [...filled.chosen, ...filled.missing]) {
    for (const id of ids) {
      const g = slotGrams(slot, id) / ids.length;
      const p = BY_ID[id];
      if (!p) continue;
      protein += (p.p * g) / 100;
      fiber += (p.f * g) / 100;
      if (p.plant) plants.add(id);
      groups.add(p.group);
      grams[p.group] = (grams[p.group] ?? 0) + g;
      if (p.group === 'veg' || p.group === 'fruit') plate.plant += g;
      else if (p.group === 'grain_whole' || p.group === 'grain_refined' || p.group === 'starch') plate.grain += g;
      else if (slot.role === 'protein' || slot.role === 'extra') plate.protein += g;
    }
  }
  const total = plate.plant + plate.grain + plate.protein || 1;
  return {
    protein: Math.round(protein),
    fiber: Math.round(fiber * 10) / 10,
    plants,
    // Рыбнай ці бабовай страва лічыцца толькі з поўнай порцыяй, а не лыжкай хумусу ў соусе.
    fish: (grams.fish ?? 0) >= 60,
    legume: (grams.legume ?? 0) >= 80,
    redMeat: groups.has('meat'),
    processed: groups.has('processed'),
    wholeGrain: groups.has('grain_whole'),
    plantShare: plate.plant / total,
    plate: { plant: plate.plant / total, grain: plate.grain / total, protein: plate.protein / total },
  };
}

// Адна страва: шаблон + спосаб + складнікі + харчовыя лічбы.
export function buildDish(template, have, settings, limit, maybe = null) {
  const methods = usableMethods(template, settings.equipment, limit);
  if (!methods.length) return null;
  const filled = fillTemplate(template, have, settings.exclude || [], maybe);
  if (!filled) return null;
  const n = nutrition(filled);
  return {
    template,
    method: methods[0],
    chosen: filled.chosen,
    missing: filled.missing,
    check: maybe ? filled.chosen.flatMap((c) => c.ids).filter((id) => maybe.has(id)) : [],
    ...n,
  };
}

// Як добра страва падыходзіць зараз. ctx — што ўжо з'едзена на гэтым тыдні.
export function scoreDish(dish, ctx = {}) {
  let s = 0;
  s += (Math.min(dish.protein, 35) / 35) * 3;
  s += (Math.min(dish.fiber, 10) / 10) * 2;
  s += Math.min(dish.plantShare / 0.5, 1) * 1.5;
  if (dish.wholeGrain) s += 0.5;
  if (dish.fish && (ctx.fish ?? 0) < WEEK_GOALS.fish) s += 1.5;
  if (dish.legume && (ctx.legume ?? 0) < WEEK_GOALS.legume) s += 1.5;
  if (dish.redMeat) s -= (ctx.redMeat ?? 0) >= WEEK_GOALS.redMeatMax ? 4 : 0.5;
  if (dish.processed) s -= 2;
  if (ctx.plants) s += [...dish.plants].filter((id) => !ctx.plants.has(id)).length * 0.25;
  const uses = ctx.uses?.[dish.template.id] ?? 0;
  s -= uses * 1.5;
  if (ctx.lastId === dish.template.id) s -= 3;
  // Страва, задуманая менавіта для гэтага прыёму ежы, крыху важнейшая за запасны варыянт.
  if (ctx.meal && dish.template.meal[0] === ctx.meal) s += 0.75;
  s -= dish.missing.length * 2.5;
  // Густы сям'і: «падабаецца» — часцей, адно «не падабаецца» — радзей (два — страва схаваная).
  if (ctx.loved?.has(dish.template.id)) s += 1.5;
  if (ctx.disliked?.has(dish.template.id)) s -= 1.5;
  // «Правер, ці ёсць» — горш за тое, што амаль напэўна дома, але лепш за дакупку.
  s -= (dish.check?.length ?? 0) * 0.6;
  // Тры тартылі за дзень — не разнастайнасць: асноўныя складнікі за сёння штрафуюцца.
  if (ctx.dayIds) s -= mainIds(dish).filter((id) => ctx.dayIds.has(id)).length * 1.2;
  return s;
}

const MAIN_ROLES = new Set(['base', 'protein', 'sauce', 'extra']);
export function mainIds(dish) {
  return dish.chosen.filter((c) => MAIN_ROLES.has(c.slot.role)).flatMap((c) => c.ids);
}

export function dishLabel(dish) {
  return dish.chosen.flatMap((c) => c.ids).map((id) => BY_ID[id].name).join(' · ');
}

// Адна і тая ж страва — не часцей за два разы на тыдзень.
export const MAX_PER_WEEK = 2;

// Ці можна прапанаваць шаблон: не схаваны сям'ёй і яшчэ не два разы на тыдні.
export function allowed(t, ctx = {}) {
  if (ctx.hidden?.has(t.id)) return false;
  return ctx.capped ? !ctx.capped.has(t.id) : (ctx.uses?.[t.id] ?? 0) < MAX_PER_WEEK;
}

// Рэжым «зараз»: тры стравы з таго, што ёсць, і адна прапанова «дакупі адно».
export function suggestNow({ pantry, settings, meal, limit, ctx = {}, maybe = null }) {
  const have = new Set(pantry);
  const all = TEMPLATES.filter((t) => t.meal.includes(meal) && !ctx.hidden?.has(t.id))
    .map((t) => buildDish(t, have, settings, limit, maybe))
    .filter(Boolean)
    .map((d) => ({ ...d, score: scoreDish(d, { ...ctx, meal }) }));

  const ready = all.filter((d) => d.missing.length === 0).sort((a, b) => b.score - a.score).slice(0, 3);
  return { ready, upgrade: bestSinglePurchase({ pantry, settings, meal, limit, ctx, best: ready[0] }) };
}

// «Дакупі адно»: якая адна пакупка найбольш паляпшае найлепшую страву, што можна зрабіць.
// Не раім другую рыбу ці мяса, калі такое ўжо ёсць дома: вэнджаны ласось побач са свежым — не паляпшэнне.
const NO_SECOND = new Set(['fish', 'poultry', 'meat', 'processed']);

function bestSinglePurchase({ pantry, settings, meal, limit, ctx, best }) {
  const have = new Set(pantry);
  const haveGroups = new Set(pantry.map((id) => BY_ID[id]?.group));
  const templates = TEMPLATES.filter((t) => t.meal.includes(meal) && !ctx.hidden?.has(t.id));
  const candidates = new Set(templates.flatMap((t) => t.slots.flatMap((s) => s.opts)));
  const baseScore = best ? best.score : 0;
  let top = null;
  for (const id of candidates) {
    const p = BY_ID[id];
    if (!p || have.has(id) || (settings.exclude || []).includes(id)) continue;
    if (NO_SECOND.has(p.group) && haveGroups.has(p.group)) continue;
    const withIt = new Set([...have, id]);
    for (const t of templates) {
      const d = buildDish(t, withIt, settings, limit);
      if (!d || d.missing.length) continue;
      if (!d.chosen.some((c) => c.ids.includes(id))) continue;
      // Тое, што сям'я ўжо калісьці купляла, раім ахвотней за незнаёмае.
      const score = scoreDish(d, { ...ctx, meal }) + (ctx.known?.has(id) ? 0.6 : 0);
      if (!top || score > top.dish.score) top = { dish: { ...d, score }, buy: id };
    }
  }
  if (!top) return null;
  const d = top.dish;
  const worth = !best || d.score - baseScore > 0.8 || d.protein >= best.protein + 8 || (d.fish && !best.fish) || (d.legume && !best.legume);
  return worth ? { ...top, reasons: upgradeReasons(d, best, ctx) } : null;
}

function upgradeReasons(d, best, ctx) {
  const r = [];
  if (best && d.protein > best.protein + 3) r.push(`бялку ${d.protein} г замест ${best.protein}`);
  else r.push(`бялку ${d.protein} г`);
  if (d.fish && (ctx.fish ?? 0) < WEEK_GOALS.fish) r.push(`рыбных дзён на тыдні будзе ${(ctx.fish ?? 0) + 1} з ${WEEK_GOALS.fish}`);
  if (d.legume && (ctx.legume ?? 0) < WEEK_GOALS.legume) r.push(`бабовых на тыдні будзе ${(ctx.legume ?? 0) + 1} з ${WEEK_GOALS.legume}`);
  if (best && d.fiber > best.fiber + 2) r.push(`валакна ${d.fiber} г замест ${best.fiber}`);
  return r;
}

// Дні тыдня ў парадку JS Date.getDay(): 0 — нядзеля.
export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
export const WEEKDAY_SHORT = { mon: 'Пн', tue: 'Аў', wed: 'Ср', thu: 'Чц', fri: 'Пт', sat: 'Сб', sun: 'Нд' };

export function addDays(iso, n) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function weekdayOf(iso) {
  return WEEKDAYS[new Date(iso + 'T12:00:00').getDay()];
}

// Ліміт часу на прыём ежы ў гэты дзень.
export function timeLimit(settings, weekday, meal) {
  if (meal === 'breakfast') return settings.breakfastMinutes ?? 15;
  const over = settings.dayMinutes?.[weekday];
  if (over != null) return over;
  const weekend = weekday === 'sat' || weekday === 'sun';
  return weekend ? settings.weekendMinutes ?? 60 : settings.eveningMinutes ?? 30;
}

export function emptyCtx() {
  return { fish: 0, legume: 0, redMeat: 0, plants: new Set(), uses: {}, lastId: null, dayIds: new Set() };
}

export function addToCtx(ctx, dish) {
  if (ctx.dayIds) mainIds(dish).forEach((id) => ctx.dayIds.add(id));
  if (dish.fish) ctx.fish++;
  if (dish.legume) ctx.legume++;
  if (dish.redMeat) ctx.redMeat++;
  dish.plants.forEach((id) => ctx.plants.add(id));
  ctx.uses[dish.template.id] = (ctx.uses[dish.template.id] ?? 0) + 1;
  ctx.lastId = dish.template.id;
}

// Найлепшая страва для аднаго прыёму: максімум адна дакупка, «з сабой» — толькі тое, што трывае кантэйнер.
// avoid — шаблоны, ад якіх карыстальнік ужо адмовіўся ў гэтым слоце.
export function pickDish({ meal, mode, have, maybe = null, settings, limit, ctx, avoid = new Set() }) {
  const candidates = TEMPLATES.filter((t) => t.meal.includes(meal) && (mode !== 'take' || t.portable) && !avoid.has(t.id) && allowed(t, ctx))
    .map((t) => buildDish(t, have, settings, limit, maybe))
    .filter((d) => d && d.missing.length <= 1)
    .map((d) => ({ ...d, score: scoreDish(d, { ...ctx, meal }) }))
    .sort((a, b) => b.score - a.score);
  return candidates[0] ?? null;
}

// Тая ж страва з іншым напаўненнем: у кожным слоце бярэцца наступны варыянт з тых, што ёсць.
// Вяртае да limit розных страў, не падобных на тую, што ўжо ў плане (fillKey).
export function fillVariants(template, have, settings, timeLimit, maybe = null, skip = new Set(), limit = 2) {
  const methods = usableMethods(template, settings.equipment, timeLimit);
  if (!methods.length) return [];
  const exclude = settings.exclude || [];
  const out = [];
  const seen = new Set(skip);
  for (let shift = 1; shift <= 4 && out.length < limit; shift++) {
    const chosen = [];
    let ok = true;
    for (const slot of template.slots) {
      const avail = slot.opts.filter((id) => !exclude.includes(id) && have.has(id) && !maybe?.has(id));
      const n = slot.pick || 1;
      if (!avail.length) {
        if (slot.req) { ok = false; break; }
        continue;
      }
      // Зрух па коле: shift=1 — пачынаем з другога даступнага, shift=2 — з трэцяга…
      const start = avail.length > n ? (shift * n) % avail.length : 0;
      const ids = [...avail.slice(start), ...avail.slice(0, start)].slice(0, n);
      chosen.push({ slot, ids });
    }
    if (!ok) break;
    const key = fillKey(chosen);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ template, method: methods[0], chosen, missing: [], check: [], ...nutrition({ chosen, missing: [] }) });
  }
  return out;
}

export function fillKey(chosen) {
  return chosen.map((c) => [...c.ids].sort().join('+')).join('|');
}

// Замена не павінна быць горшай па правілах: бялок, доля раслін, валакно, без каўбас.
export function noWorse(alt, cur) {
  return alt.protein >= Math.min(cur.protein, WEEK_GOALS.proteinPerMeal) - 2
    && alt.plantShare >= Math.min(cur.plantShare, 0.4) - 0.05
    && alt.fiber >= Math.min(cur.fiber, 6) - 1
    && (!alt.processed || cur.processed)
    && (!alt.redMeat || cur.redMeat);
}

// П1–П7 для тыдня. Вяртае спіс правіл з фактам, мэтай і ці выканана.
export function checkRules(days) {
  let fish = 0, legume = 0, redMeat = 0, processed = 0, fiber = 0, meals = 0, lowProtein = 0, plateOk = 0, wholeGrain = 0;
  const plants = new Set();
  for (const day of days) {
    for (const meal of MEALS) {
      const d = day.meals[meal]?.dish;
      if (!d) continue;
      meals++;
      if (d.fish) fish++;
      if (d.legume) legume++;
      if (d.redMeat) redMeat++;
      if (d.processed) processed++;
      if (d.wholeGrain) wholeGrain++;
      if (d.protein < WEEK_GOALS.proteinPerMeal) lowProtein++;
      if (d.plantShare >= 0.4) plateOk++;
      fiber += d.fiber;
      d.plants.forEach((id) => plants.add(id));
    }
  }
  const daysCount = days.length || 1;
  const fiberDay = Math.round(fiber / daysCount);
  return [
    { id: 'plate', label: 'палова талеркі — расліны', value: `${plateOk}/${meals}`, ok: plateOk >= meals * 0.7 },
    { id: 'protein', label: 'бялок у кожным прыёме', value: lowProtein ? `${lowProtein} слабыя` : 'усюды', ok: lowProtein <= 2 },
    { id: 'fiber', label: 'валакно з дамашняй ежы', value: `${fiberDay} г/дзень`, ok: fiberDay >= WEEK_GOALS.fiberPerDay * 0.7 },
    { id: 'plants', label: 'розных раслін', value: `${plants.size}/${WEEK_GOALS.plants}`, ok: plants.size >= WEEK_GOALS.plants * 0.8 },
    { id: 'fish', label: 'рыба', value: `${fish}/${WEEK_GOALS.fish}`, ok: fish >= WEEK_GOALS.fish },
    { id: 'legume', label: 'бабовыя', value: `${legume}/${WEEK_GOALS.legume}`, ok: legume >= WEEK_GOALS.legume },
    { id: 'meat', label: 'чырвонае мяса', value: `${redMeat}/${WEEK_GOALS.redMeatMax}`, ok: redMeat <= WEEK_GOALS.redMeatMax && processed === 0 },
    { id: 'grain', label: 'цэльнае зерне', value: `${wholeGrain} разоў`, ok: wholeGrain >= 5 },
  ];
}
