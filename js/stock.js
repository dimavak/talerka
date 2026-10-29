// Верагодныя запасы: што, хутчэй за ўсё, ёсць дома, без уліку колькасці.
// Крыніцы — даты пакупак з чэкаў і са спіса словамі, адзнакі «купіў» і «гэтага няма», з'едзеныя стравы.
// Праверыць халадзільнік перад гатаваннем — справа карыстальніка, таму вынік — верагоднасць, а не факт.
import { BY_ID } from './products.js';

// Колькі дзён прадукт звычайна ляжыць дома, калі ваш рытм пакупак яшчэ невядомы.
const GROUP_DAYS = {
  fish: 3, poultry: 3, meat: 3, processed: 10, eggs: 21, dairy: 7, veg: 7, starch: 30, fruit: 7,
  grain_whole: 60, grain_refined: 60, legume: 45, nuts: 45, sauce: 90,
};
const PRODUCT_DAYS = {
  smoked_salmon: 7, smoked_trout: 7, herring: 10, sprats: 90, tuna: 90, mackerel: 5,
  hummus: 7, chickpeas: 90, beans: 90, lentils: 120, peas: 60, beans_sauce: 90,
  hard_cheese: 21, feta: 14, goat_cheese: 14, cream_cheese: 10, skyr: 14, yogurt: 10, milk: 6, quark: 6,
  rocket: 4, lettuce: 4, spinach: 4, greens: 4, avocado: 5, tomato: 6, cucumber: 6, broccoli: 6,
  onion: 30, garlic: 45, carrot: 21, beet: 21, cabbage: 21, celery: 14, frozen_veg: 90, mushrooms: 5,
  apple: 21, mandarin: 14, lemon: 21, banana: 5, berries_fresh: 3, blueberries: 4, grapes: 5, nectarine: 5,
  apricots_dried: 90, prunes: 90, wholemeal_bread: 5, tortilla: 21, oats: 90,
  mustard: 120, tomato_passata: 120, peanut_butter: 90,
  pickles: 60, sauerkraut: 21, leek: 14, pumpkin: 30, millet: 90,
};

export const LIKELY = 0.5;
export const MAYBE = 0.15;
const USE_DROP = 0.15;

export function keepDays(id) {
  return PRODUCT_DAYS[id] ?? GROUP_DAYS[BY_ID[id]?.group] ?? 7;
}

export function daysBetween(a, b) {
  return Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 86400000);
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Сярэдні інтэрвал паміж пакупкамі; null, пакуль пакупак менш за тры.
export function rhythm(dates) {
  const ds = [...new Set(dates)].sort();
  if (ds.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < ds.length; i++) gaps.push(daysBetween(ds[i - 1], ds[i]));
  return median(gaps);
}

// Усе пакупкі як {id, date}: радкі чэкаў і дадатковыя адзнакі (спіс словамі, «купіў»).
export function purchaseEvents(state) {
  const fromLines = (state.lines ?? []).filter((l) => l.productId).map((l) => ({ id: l.productId, date: l.date }));
  return [...fromLines, ...(state.extra ?? [])];
}

// Тэрмін «жыцця дома»: калі вы купляеце нешта кожныя 5 дзён, бярэцца ваш рытм, але не даўжэй, чым прадукт трывае.
export function lifeDays(id, dates) {
  const keep = keepDays(id);
  const r = rhythm(dates);
  return r == null ? keep : Math.min(keep, Math.max(2, r));
}

// Верагоднасць, што прадукт ёсць дома на дату `on`.
// Да паловы тэрміну — амаль напэўна, на тэрміне — 50%, у паўтара тэрміну — ужо не.
export function probability({ id, dates, on, notHome, uses = [] }) {
  const past = dates.filter((d) => d <= on).sort();
  if (!past.length) return 0;
  const last = past[past.length - 1];
  if (notHome && notHome >= last) return 0;
  const life = lifeDays(id, past);
  const age = daysBetween(last, on);
  let p = age <= life / 2 ? 1 : 1 - (age - life / 2) / life;
  // Кожная з'едзеная страва з гэтым складнікам пасля пакупкі крыху змяншае шанец, што ён яшчэ ёсць.
  p -= uses.filter((d) => d >= last && d <= on).length * USE_DROP;
  return Math.max(0, Math.min(1, p));
}

export function level(p) {
  return p >= LIKELY ? 'likely' : p >= MAYBE ? 'maybe' : 'gone';
}

// Карта id → {p, level, last, life} на дату. Прадукты без пакупак у карту не трапляюць.
export function stockOn(state, on) {
  const dates = {};
  for (const e of purchaseEvents(state)) (dates[e.id] ??= []).push(e.date);
  const uses = {};
  for (const c of state.cooked ?? []) for (const id of c.ids ?? []) (uses[id] ??= []).push(c.date);
  const out = {};
  for (const [id, ds] of Object.entries(dates)) {
    if (!BY_ID[id]) continue;
    const p = probability({ id, dates: ds, on, notHome: state.notHome?.[id], uses: uses[id] });
    const past = ds.filter((d) => d <= on).sort();
    out[id] = { p, level: level(p), last: past[past.length - 1] ?? null, life: lifeDays(id, past) };
  }
  return out;
}

// Для падбору страў: have — усё, што, магчыма, ёсць; maybe — сумніўнае.
export function availability(stock) {
  const have = new Set();
  const maybe = new Set();
  for (const [id, s] of Object.entries(stock)) {
    if (s.level === 'gone') continue;
    have.add(id);
    if (s.level === 'maybe') maybe.add(id);
  }
  return { have, maybe };
}

export const levelOf = (stock, id) => stock[id]?.level ?? 'gone';

// Новая пакупка здымае адзнаку «гэтага няма».
export function addPurchase(state, id, date, src) {
  state.extra = [...(state.extra ?? []), { id, date, src }];
  if (state.notHome) delete state.notHome[id];
}

export function markNotHome(state, id, date) {
  state.notHome = { ...(state.notHome ?? {}), [id]: date };
}

// ── Напаміны «даўно не куплялі карыснае» ──

// every — колькі дзён паміж пакупкамі лічыцца нармальным, пакуль ваш рытм невядомы.
export const HEALTHY = {
  fish: { label: 'рыба', every: 7, suggest: 'mackerel', of: (p) => p.group === 'fish' },
  legume: { label: 'бабовыя', every: 10, suggest: 'chickpeas', of: (p) => p.group === 'legume' },
  grain_whole: { label: 'цэльнае зерне', every: 21, suggest: 'buckwheat', of: (p) => p.group === 'grain_whole' },
  nuts: { label: 'арэхі і насенне', every: 21, suggest: 'walnut', of: (p) => p.group === 'nuts' },
  eggs: { label: 'яйкі', every: 10, suggest: 'eggs', of: (p) => p.group === 'eggs' },
  frozen_veg: { label: 'марожаная гародніна', every: 21, suggest: 'frozen_veg', of: (p) => p.id === 'frozen_veg' || p.id === 'broccoli' },
};

// Спрацоўвае, калі прайшло больш за паўтара звычайных інтэрвалы. Схаванае на тыдзень не паказваецца.
export function reminders(state, today) {
  const events = purchaseEvents(state).filter((e) => e.date <= today);
  if (!events.length) return [];
  const first = events.reduce((m, e) => (e.date < m ? e.date : m), today);
  const out = [];
  for (const [group, g] of Object.entries(HEALTHY)) {
    const snoozed = state.shopping?.snooze?.[group];
    if (snoozed && daysBetween(snoozed, today) < 7) continue;
    const mine = events.filter((e) => BY_ID[e.id] && g.of(BY_ID[e.id]));
    const dates = [...new Set(mine.map((e) => e.date))].sort();
    const usual = rhythm(dates) ?? g.every;
    const since = dates.length ? daysBetween(dates[dates.length - 1], today) : null;
    const overdue = since == null ? daysBetween(first, today) >= g.every * 1.5 : since > usual * 1.5;
    if (!overdue) continue;
    // Раім тое, што сям'я ўжо купляе ў гэтай групе, але хумус не замяняе цэлых бабовых.
    const counts = {};
    for (const e of mine) if (e.id !== 'hummus') counts[e.id] = (counts[e.id] ?? 0) + 1;
    const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
    out.push({ group, label: g.label, since, usual: Math.round(usual), suggest: fav ?? g.suggest });
  }
  return out.sort((a, b) => (b.since ?? 999) - (a.since ?? 999));
}
