// Дынаміка пакупак па месяцах: долі выдаткаў па групах і змена супраць мінулага месяца.
// Лічыцца з радкоў чэкаў; пакупкі «словамі» без цаны ў грошы не трапляюць.
import { basketStats, GOOD, LESS } from './receipt.js';

export const MONTH_NAMES = ['студзень', 'люты', 'сакавік', 'красавік', 'май', 'чэрвень', 'ліпень', 'жнівень', 'верасень', 'кастрычнік', 'лістапад', 'снежань'];
const MONTH_SHORT = ['студз', 'лют', 'сак', 'крас', 'май', 'чэрв', 'ліп', 'жн', 'вер', 'кастр', 'ліст', 'снеж'];

// Групы, за якімі сочым асобна: карысныя і тыя, што варта зменшыць.
export const WATCH = ['vegetables', 'fruit', 'fish', 'legumes', 'whole_grain', 'nuts_seeds', 'sweets', 'processed_meat', 'snacks', 'drinks_sugary'];

// Змены, меншыя за гэта, — шум аднаго чэка, не тэндэнцыя.
export const MIN_CHANGE = 0.02;

export const monthOf = (iso) => iso.slice(0, 7);

export function monthLabel(month, { short = false } = {}) {
  const [y, m] = month.split('-').map(Number);
  return short ? `${MONTH_SHORT[m - 1]} ${String(y).slice(2)}` : `${MONTH_NAMES[m - 1]} ${y}`;
}

// Месяцы з чэкамі, ад старога да новага: {month, receipts, total, foodTotal, share(c), good, less}.
export function monthlyStats(lines) {
  const by = new Map();
  for (const l of lines) {
    if (!l.date) continue;
    const m = monthOf(l.date);
    if (!by.has(m)) by.set(m, []);
    by.get(m).push(l);
  }
  return [...by.keys()].sort().map((month) => {
    const st = basketStats(by.get(month));
    const sum = (set) => st.shares.filter((x) => set.has(x.category)).reduce((s, x) => s + x.share, 0);
    return { month, receipts: st.receipts, total: st.total, foodTotal: st.foodTotal, shares: st.shares, share: st.share, good: sum(GOOD), less: sum(LESS) };
  });
}

// Якая змена лепшая: больш карыснага ці менш таго, што варта зменшыць.
export function verdict(category, delta) {
  if (Math.abs(delta) < MIN_CHANGE) return 'same';
  if (GOOD.has(category)) return delta > 0 ? 'better' : 'worse';
  if (LESS.has(category)) return delta < 0 ? 'better' : 'worse';
  return 'neutral';
}

// Змены ад папярэдняга месяца да бягучага, найбольшыя спачатку. Без дробязяў меншых за MIN_CHANGE.
export function compareMonths(cur, prev) {
  if (!cur || !prev) return [];
  const cats = new Set([...cur.shares, ...prev.shares].map((x) => x.category));
  return [...cats]
    .map((category) => {
      const delta = cur.share(category) - prev.share(category);
      return { category, now: cur.share(category), before: prev.share(category), delta, verdict: verdict(category, delta) };
    })
    .filter((x) => x.verdict !== 'same' && x.category !== 'unknown')
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

// Кароткі вывад за месяц для загалоўка: карыснага больш/менш, чым у мінулым.
export function monthSummary(cur, prev) {
  if (!cur || !prev) return null;
  const good = cur.good - prev.good;
  const less = cur.less - prev.less;
  return { good, less, better: good - less >= MIN_CHANGE, worse: less - good >= MIN_CHANGE };
}

// Месяц яшчэ ідзе — доля па ім можа змяніцца да канца.
export const isPartial = (month, today) => month === monthOf(today);
