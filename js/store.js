// Стан аплікацыі ў localStorage браўзера. Дадзеныя не пакідаюць прыладу.
// Версія 2: план захоўваецца, запасы вылічваюцца з пакупак, спіс пакупак — асобна.
// Стары ключ talerka.v1 не выдаляецца: ён застаецца як копія да міграцыі.
import { latestReceiptIds } from './receipt.js';
import { BY_ID } from './products.js';

export const KEY = 'talerka.v2';
export const OLD_KEY = 'talerka.v1';
export const VERSION = 2;

const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const HOME = { breakfast: 'home', lunch: 'home', dinner: 'home' };

export function defaultState() {
  return {
    version: VERSION,
    lines: [],
    extra: [],
    notHome: {},
    settings: {
      equipment: ['stove', 'oven', 'microwave'],
      exclude: [],
      breakfastMinutes: 15,
      eveningMinutes: 30,
      weekendMinutes: 60,
      schedule: Object.fromEntries(WEEK.map((d) => [d, { ...HOME }])),
      members: [{ name: 'Дарослы 1', take: [] }, { name: 'Дарослы 2', take: [] }],
    },
    dayMinutes: {},
    plan: {},
    shopping: { manual: [], done: {}, snooze: {} },
    cooked: [],
  };
}

// v1 → v2. Запасы ў v1 — спіс id; тое, што прыйшло з апошняга чэка, і так ёсць у гісторыі,
// а дададзенае рукамі становіцца пакупкай на дзень міграцыі.
export function migrateV1(old, today) {
  const s = defaultState();
  const lines = Array.isArray(old.lines) ? old.lines : [];
  const fromReceipt = new Set(latestReceiptIds(lines));
  const os = old.settings ?? {};
  const schedule = {};
  const takeDays = [];
  for (const wd of WEEK) {
    const day = { ...HOME, ...(os.schedule?.[wd] ?? {}) };
    if (day.lunch === 'take') takeDays.push(wd);
    schedule[wd] = Object.fromEntries(Object.entries(day).map(([m, v]) => [m, v === 'skip' ? 'skip' : 'home']));
  }
  const n = Math.max(1, Math.min(12, Number(os.people) || 2));
  s.lines = lines;
  s.extra = (old.pantry ?? []).filter((id) => !fromReceipt.has(id)).map((id) => ({ id, date: today, src: 'v1' }));
  s.settings = {
    ...s.settings,
    equipment: os.equipment ?? s.settings.equipment,
    exclude: os.exclude ?? [],
    breakfastMinutes: os.breakfastMinutes ?? 15,
    eveningMinutes: os.eveningMinutes ?? 30,
    weekendMinutes: os.weekendMinutes ?? 60,
    schedule,
    members: Array.from({ length: n }, (_, i) => ({ name: `Дарослы ${i + 1}`, take: [...takeDays] })),
  };
  s.dayMinutes = old.dayMinutes ?? {};
  s.cooked = old.cooked ?? [];
  s.shopping.manual = (old.wish ?? []).map((id, i) => ({ key: `m:v1${i}`, text: BY_ID[id]?.name ?? id, id, bought: false }));
  return s;
}

// Даводзіць любы захаваны стан да бягучай версіі.
export function migrate(saved, today) {
  if (!saved || typeof saved !== 'object') return defaultState();
  if (!saved.version || saved.version < 2) return migrateV1(saved, today);
  const base = defaultState();
  return {
    ...base,
    ...saved,
    settings: { ...base.settings, ...saved.settings },
    shopping: { ...base.shopping, ...saved.shopping },
    version: VERSION,
  };
}

function storage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function loadState(today) {
  const ls = storage();
  try {
    const raw = ls?.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw), today);
    const old = ls?.getItem(OLD_KEY);
    if (old) {
      const s = migrate(JSON.parse(old), today);
      saveState(s);
      return s;
    }
  } catch {
    // Пашкоджаны стан: пачынаем з чыстага, старыя ключы не чапаем.
  }
  return defaultState();
}

export function saveState(state) {
  try {
    storage().setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
