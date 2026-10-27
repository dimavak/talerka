// Стан аплікацыі ў localStorage браўзера. Дадзеныя не пакідаюць прыладу.
const KEY = 'talerka.v1';

const HOME = { breakfast: 'home', lunch: 'home', dinner: 'home' };

export function defaultState() {
  return {
    version: 1,
    pantry: [],
    lines: [],
    settings: {
      equipment: ['stove', 'oven', 'microwave'],
      people: 2,
      exclude: [],
      breakfastMinutes: 15,
      eveningMinutes: 30,
      weekendMinutes: 60,
      schedule: Object.fromEntries(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) => [d, { ...HOME }])),
    },
    dayMinutes: {},
    overrides: {},
    cooked: [],
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const saved = JSON.parse(raw);
    const base = defaultState();
    return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
  } catch {
    return defaultState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
