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
export function fillTemplate(template, have, exclude = []) {
  const chosen = [];
  const missing = [];
  for (const slot of template.slots) {
    const opts = slot.opts.filter((id) => !exclude.includes(id));
    const ids = opts.filter((id) => have.has(id)).slice(0, slot.pick || 1);
    if (ids.length) chosen.push({ slot, ids });
    else if (slot.req) {
      // Калі ўсе варыянты слота выключаныя, страва для гэтай сям'і немагчымая.
      if (!opts.length) return null;
      missing.push({ slot, ids: [opts[0]] });
    }
  }
  return { chosen, missing };
}

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
    const g = slot.g / ids.length;
    for (const id of ids) {
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
export function buildDish(template, have, settings, limit) {
  const methods = usableMethods(template, settings.equipment, limit);
  if (!methods.length) return null;
  const filled = fillTemplate(template, have, settings.exclude || []);
  if (!filled) return null;
  const n = nutrition(filled);
  return {
    template,
    method: methods[0],
    chosen: filled.chosen,
    missing: filled.missing,
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

// Рэжым «зараз»: тры стравы з таго, што ёсць, і адна прапанова «дакупі адно».
export function suggestNow({ pantry, settings, meal, limit, ctx = {} }) {
  const have = new Set(pantry);
  const all = TEMPLATES.filter((t) => t.meal.includes(meal))
    .map((t) => buildDish(t, have, settings, limit))
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
  const templates = TEMPLATES.filter((t) => t.meal.includes(meal));
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

function emptyCtx() {
  return { fish: 0, legume: 0, redMeat: 0, plants: new Set(), uses: {}, lastId: null };
}

function addToCtx(ctx, dish) {
  if (ctx.dayIds) mainIds(dish).forEach((id) => ctx.dayIds.add(id));
  if (dish.fish) ctx.fish++;
  if (dish.legume) ctx.legume++;
  if (dish.redMeat) ctx.redMeat++;
  dish.plants.forEach((id) => ctx.plants.add(id));
  ctx.uses[dish.template.id] = (ctx.uses[dish.template.id] ?? 0) + 1;
  ctx.lastId = dish.template.id;
}

// Складае план на 7 дзён. Кожная страва можа патрабаваць адну дакупку; купленае далей лічыцца даступным.
// schedule[weekday][meal] = 'home' | 'take' | 'skip'. overrides — ручныя змены па днях ('YYYY-MM-DD:meal').
export function planWeek({ pantry, settings, start, overrides = {} }) {
  const have = new Set(pantry);
  const buy = new Map();
  const ctx = emptyCtx();
  const days = [];
  let prevDinner = null;

  for (let i = 0; i < 7; i++) {
    const date = addDays(start, i);
    const wd = weekdayOf(date);
    const day = { date, weekday: wd, meals: {} };
    const yesterdayDinner = prevDinner;
    prevDinner = null;
    ctx.dayIds = new Set();
    for (const meal of MEALS) {
      const mode = overrides[`${date}:${meal}`] ?? settings.schedule?.[wd]?.[meal] ?? 'home';
      if (mode === 'skip') {
        day.meals[meal] = { mode };
        continue;
      }
      // Абед з сабой: калі ўчорашняя вячэра трывае кантэйнер — гатуем яе ўдвая.
      if (meal === 'lunch' && mode === 'take' && yesterdayDinner?.template.portable) {
        day.meals[meal] = { mode, dish: yesterdayDinner, leftover: true };
        addToCtx(ctx, yesterdayDinner);
        yesterdayDinner.cookDouble = true;
        continue;
      }
      const limit = mode === 'take' ? null : timeLimit(settings, wd, meal);
      const candidates = TEMPLATES.filter((t) => t.meal.includes(meal) && (mode !== 'take' || t.portable))
        .map((t) => buildDish(t, have, settings, limit))
        .filter((d) => d && d.missing.length <= 1)
        .map((d) => ({ ...d, score: scoreDish(d, { ...ctx, meal }) }))
        .sort((a, b) => b.score - a.score);
      const dish = candidates[0];
      if (!dish) {
        day.meals[meal] = { mode, dish: null };
        continue;
      }
      for (const m of dish.missing) {
        const id = m.ids[0];
        have.add(id);
        buy.set(id, (buy.get(id) ?? 0) + 1);
      }
      day.meals[meal] = { mode, dish };
      addToCtx(ctx, dish);
      if (meal === 'dinner') prevDinner = dish;
    }
    days.push(day);
  }
  return { start, days, buy: [...buy.keys()], rules: checkRules(days) };
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
