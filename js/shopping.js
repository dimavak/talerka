// Спіс пакупак: складаецца сам з плана і напамінаў, плюс свае пункты ўручную.
// Адзнака «купіў» лічыцца пакупкай, таму верагодныя запасы адразу ведаюць пра яе.
import { BY_ID, matchTypedName } from './products.js';
import { MEALS, addDays } from './engine.js';
import { stockOn, levelOf, reminders, addPurchase } from './stock.js';
import { HORIZON, keyOf, getSlot, slotIds } from './plan.js';

export function shopping(state) {
  state.shopping ??= {};
  state.shopping.manual ??= [];
  state.shopping.done ??= {};
  state.shopping.snooze ??= {};
  return state.shopping;
}

// Вяртае тры часткі спіса і падказкі «правер дома» для бліжэйшых двух дзён.
export function buildList(state, today) {
  const sh = shopping(state);
  const stock = stockOn(state, today);
  const manualIds = new Set(sh.manual.filter((m) => m.id && !m.bought).map((m) => m.id));
  const plan = new Map();
  const check = new Map();
  for (let i = 0; i < HORIZON; i++) {
    const date = addDays(today, i);
    for (const meal of MEALS) {
      const slot = getSlot(state, keyOf(date, meal));
      if (slot?.state !== 'planned' || slot.leftoverOf) continue;
      for (const id of slotIds(slot)) {
        const lv = levelOf(stock, id);
        if (lv === 'gone' && !plan.has(id)) plan.set(id, { date, meal });
        if (lv === 'maybe' && i < 2 && !check.has(id)) check.set(id, { date, meal });
      }
    }
  }
  const remind = new Map();
  for (const r of reminders(state, today)) {
    if (levelOf(stock, r.suggest) === 'likely' || plan.has(r.suggest)) continue;
    remind.set(r.suggest, r);
  }
  const item = (id, extra) => ({ key: `p:${id}`, id, name: BY_ID[id]?.name ?? id, bought: sh.done[`p:${id}`] === today, ...extra });
  const planItems = [...plan].filter(([id]) => !manualIds.has(id)).map(([id, need]) => item(id, { need }));
  const remindItems = [...remind].filter(([id]) => !manualIds.has(id)).map(([id, r]) => item(id, { reminder: r }));
  // Купленае сёння застаецца ў спісе адзначаным, каб не знікала з-пад пальца ў краме.
  const listed = new Set([...planItems, ...remindItems].map((x) => x.key));
  const boughtToday = Object.entries(sh.done)
    .filter(([key, d]) => d === today && key.startsWith('p:') && !listed.has(key))
    .map(([key]) => item(key.slice(2), {}));
  return {
    plan: [...planItems, ...boughtToday],
    remind: remindItems,
    manual: sh.manual,
    check: [...check].filter(([id]) => !plan.has(id)).map(([id, need]) => ({ id, name: BY_ID[id]?.name ?? id, need })),
  };
}

function addBoughtEvent(state, id, today) {
  addPurchase(state, id, today, 'bought');
}
function removeBoughtEvent(state, id, today) {
  const i = (state.extra ?? []).findIndex((e) => e.id === id && e.date === today && e.src === 'bought');
  if (i >= 0) state.extra.splice(i, 1);
}

export function toggleBought(state, key, today) {
  const sh = shopping(state);
  if (key.startsWith('p:')) {
    const id = key.slice(2);
    if (sh.done[key] === today) {
      delete sh.done[key];
      removeBoughtEvent(state, id, today);
    } else {
      sh.done[key] = today;
      addBoughtEvent(state, id, today);
    }
    return;
  }
  const m = sh.manual.find((x) => x.key === key);
  if (!m) return;
  m.bought = !m.bought;
  if (m.id) m.bought ? addBoughtEvent(state, m.id, today) : removeBoughtEvent(state, m.id, today);
}

// Свой пункт: калі назва знаёмая, ён таксама ўплывае на запасы пасля «купіў».
export function addManual(state, text, id = null) {
  const sh = shopping(state);
  const t = String(text ?? '').trim();
  if (!t && !id) return null;
  const pid = id ?? matchTypedName(t)?.id ?? null;
  if (pid && sh.manual.some((m) => m.id === pid && !m.bought)) return null;
  const entry = { key: `m:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, text: t || BY_ID[pid].name, id: pid, bought: false };
  sh.manual.push(entry);
  return entry;
}

export function removeManual(state, key) {
  const sh = shopping(state);
  sh.manual = sh.manual.filter((m) => m.key !== key);
}

export function clearBought(state) {
  const sh = shopping(state);
  sh.manual = sh.manual.filter((m) => !m.bought);
  sh.done = {};
}

export function snooze(state, group, today) {
  shopping(state).snooze[group] = today;
}

// Тэкст для месенджара: толькі тое, што яшчэ не куплена.
export function shareText(list) {
  const rows = [...list.plan, ...list.remind].filter((x) => !x.bought).map((x) => x.name);
  rows.push(...list.manual.filter((m) => !m.bought).map((m) => m.text));
  if (!rows.length) return '';
  return ['Спіс пакупак (Talerka):', ...[...new Set(rows)].map((r) => `• ${r}`)].join('\n');
}
