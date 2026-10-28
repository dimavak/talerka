// Разбор тэксту, які дало распазнаванне фота чэка (Lidl, Бядронка, Карфур).
// Тэкст з камеры брудны: літары блытаюцца (w/u, ł/l, 0/o), мінусы губляюцца, радкі зліпаюцца.
// Таму ўсё тут — эўрыстыкі, а апошняе слова за экранам «праверце радкі».
import { PRODUCTS, BY_ID, matchReceiptName, NOT_FOOD_HINT } from './products.js';

const ACCENTS = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' };

// Звядзенне да «шкілета» для параўнання: без дыякрытыкі, w=u (у шрыфце чэкаў іх блытае распазнаванне).
export function fold(s) {
  return String(s ?? '').toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (c) => ACCENTS[c])
    .replace(/(?<=[a-z])0|0(?=[a-z])/g, 'o')
    .replace(/(?<=[a-z])1(?=[a-z])/g, 'l')
    .replace(/w/g, 'u')
    .replace(/rn/g, 'm')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function editDistance(a, b) {
  const m = a.length, n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}

// Літаральныя кавалкі з польскіх шаблонаў назваў: 'papryk', 'borów', 'jagod'…
function stemsOf(re) {
  const src = re.replace(/\(\?<?[!=][^)]*\)/g, ' ').replace(/\\[a-zA-Z]\*?/g, ' ').replace(/\.\*/g, ' ');
  return [...new Set((src.match(/[a-ząćęłńóśźż]{4,}/gi) ?? []).map(fold).filter((s) => s.length >= 4))];
}
const STEMS = PRODUCTS.map((p) => ({ p, stems: stemsOf(p.pl) }));
const NOT_FOOD_STEMS = stemsOf(NOT_FOOD_HINT.source);

// Слова з чэка падобнае на пачатак шаблону з адной памылкай распазнавання.
function nearStem(token, stem) {
  if (token.startsWith(stem)) return true;
  if (stem.length < 5 || token.length < 4) return false;
  for (let L = stem.length - 1; L <= stem.length + 1; L++) {
    if (editDistance(token.slice(0, L), stem) <= 1) return true;
  }
  return false;
}

function fuzzyHit(name, stems) {
  const tokens = fold(name).split(' ').filter((t) => t.length >= 4);
  let best = 0;
  for (const s of stems) for (const t of tokens) if (nearStem(t, s)) best = Math.max(best, s.length);
  return best;
}

// Назва радка → складнік. Спачатку ваш слоўнік, потым дакладныя шаблоны, потым з улікам памылак.
export function matchOCRName(name, aliases = {}) {
  const key = aliasKey(name);
  if (key && key in aliases) return { id: aliases[key] || null, how: 'alias' };
  const exact = matchReceiptName(name);
  if (exact) return { id: exact.id, how: 'exact' };
  if (NOT_FOOD_HINT.test(name) || fuzzyHit(name, NOT_FOOD_STEMS)) return { id: null, how: 'not-food' };
  let best = null, score = 0;
  for (const { p, stems } of STEMS) {
    const s = fuzzyHit(name, stems);
    if (s > score) { best = p; score = s; }
  }
  return best ? { id: best.id, how: 'fuzzy' } : { id: null, how: 'none' };
}

// Ключ слоўніка: першыя два значныя словы, без лічбаў і вагі («Hummus 160g» → «hummus»).
export function aliasKey(name) {
  return fold(name).split(' ').filter((t) => t.length >= 3 && !/\d/.test(t)).slice(0, 2).join(' ');
}

// Катэгорыя для кошыка, калі радок не складнік страў.
const CATEGORY_HINTS = [
  ['non_food', /karma|reklam|torb|recznik|papier|kaucj|szczot|sensod|past[ay] do|chusteczk|plyn|proszek|kapsulk|zapal|baterie|tulip|gozdzik/],
  ['sweets', /czekol|kinder|prali|cukier|lody|baton|uafel|uafl|ciast|zelk|pianki|tic tac|jelly|deser|babka|serniczek|herbatnik|cukierk/],
  ['drinks', /piu[oa]|uino|likier|uodk|uhisk/],
  ['drinks_sugary', /\bsok|nektar|napoj|cola|pepsi|fanta|sprite|oranzad|energy/],
  ['snacks', /chips|chrup|paluszk|krakers|star mix|popcorn/],
  ['ready_meal', /pizza|pierog|lasagn|kebab|zapiekank|hot dog/],
  ['sauce', /\bsos\b|ketchup|majonez/],
];
const GROUP_TO_CATEGORY = {
  veg: 'vegetables', starch: 'vegetables', fruit: 'fruit', grain_whole: 'whole_grain', grain_refined: 'refined_grain',
  legume: 'legumes', fish: 'fish', poultry: 'poultry', meat: 'meat', processed: 'processed_meat', eggs: 'eggs',
  dairy: 'dairy', nuts: 'nuts_seeds', sauce: 'sauce',
};
export function categoryOf(name, productId) {
  if (productId) return GROUP_TO_CATEGORY[BY_ID[productId]?.group] ?? 'unknown';
  const f = fold(name);
  return CATEGORY_HINTS.find(([, re]) => re.test(f))?.[0] ?? 'unknown';
}

// ── Радкі ──

const MONEY = /-?\d{1,4}\s?[,.]\s?\d{2}(?!\d)/g;
const QTY = /(\d+(?:[,.]\d{1,3})?)\s*[x×*]\s*(\d{1,4}[,.]\d{2})/i;
const DISCOUNT = /\b(opust|rabat|upust|obnizk|znizk|promoc|kupon)/;
const START = /aragon|fiskal|skaln/;
const END = /^(suma|podsuma|razem|do zaplaty)|sprzeda|opodatk|suma pln|suma ptu|rozliczen/;
const TOTAL = /suma\s*(pln|:)?|do zaplaty|razem/;
const SERVICE = /siedzib|podgorn|sp z o|^(nip|adres|ul |tel|nr |kasa|kasjer|paragon|lidl plus|niefiskal|karta|gotouk|reszta|kaucj|zuro|uydruk)/;

// «OPUST» з чэка распазнаецца як «pust», «(PJST», «QPUST»: першае слова блізкае да «opust».
function isDiscount(f) {
  if (DISCOUNT.test(f)) return true;
  const first = f.split(' ')[0] ?? '';
  return first.length >= 3 && first.length <= 6 && /p/.test(first) && editDistance(first, 'opust') <= 2;
}

const num = (s) => parseFloat(s.replace(/\s/g, '').replace(',', '.'));

function amounts(line) {
  return (line.match(MONEY) ?? []).map(num).filter((n) => Number.isFinite(n));
}

// Назва — тое, што да першага слупка з лічбамі ці падатковай літарай.
export function nameOf(line) {
  let s = line.replace(/\s{2,}.*$/, '');
  if (s === line) s = line.replace(/\s+\d+([,.]\d+)?\s*[x×*].*$/i, '').replace(MONEY, ' ');
  s = s.replace(/\s+[A-DFX|Il1](\s.*)?$/, '');
  const words = s.split(/\s+/).filter(Boolean);
  // Шум ад краю паперы: кароткія кавалкі без галосных у пачатку.
  while (words.length > 1 && (words[0].length <= 2 || !/[aeiouyąęó]/i.test(words[0])) && !/^\d/.test(words[0])) words.shift();
  return words.join(' ').replace(/^[^\p{L}\d]+|[^\p{L}\d.%]+$/gu, '').trim();
}

const letters = (s) => (s.match(/\p{L}/gu) ?? []).length;

// Тэкст аднаго кадра → чарнавік чэка: радкі тавараў, сума, крама, дата.
export function parseReceiptOCR(text, aliases = {}) {
  const raw = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const folded = raw.map(fold);
  const all = folded.join(' ');

  const store = /lidl/.test(all) ? 'Lidl' : /biedronk|jeronimo/.test(all) ? 'Biedronka' : /carrefour/.test(all) ? 'Carrefour' : '';
  const joined = raw.join(' ');
  const iso = joined.match(/(20\d\d)[-./](\d\d)[-./](\d\d)/);
  const eu = joined.match(/(\d\d)[-./](\d\d)[-./](20\d\d)/);
  let date = iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : eu ? `${eu[3]}-${eu[2]}-${eu[1]}` : null;
  if (date && (+date.slice(5, 7) > 12 || +date.slice(5, 7) < 1 || +date.slice(8) > 31 || +date.slice(8) < 1)) date = null;

  let total = null;
  const totals = [];
  folded.forEach((f, i) => {
    if (TOTAL.test(f) && !/ptu|podsuma/.test(f)) {
      const a = amounts(raw[i]);
      if (a.length) totals.push(a[a.length - 1]);
    }
    if (/karta|platnicz|gotouk/.test(f)) {
      const a = amounts(raw[i]);
      if (a.length) totals.push(a[a.length - 1]);
    }
  });
  if (totals.length) total = totals[0];

  let start = folded.findIndex((f) => START.test(f));
  start = start < 0 ? 0 : start + 1;
  // Канец спіса тавараў: «SPRZEDAŻ OPODATKOWANA», «SUMA» — і іх скалечаныя варыянты.
  const endLike = (f) => END.test(f) || f.split(' ').some((t) => t.length >= 7 && (editDistance(t, 'opodatkouana') <= 4 || editDistance(t, 'sprzedaz') <= 2));
  let end = folded.findIndex((f, i) => i >= start && endLike(f));
  if (end < 0) end = raw.length;

  const items = [];
  let last = null;
  for (let i = start; i < end; i++) {
    const line = raw[i], f = folded[i];
    const money = amounts(line);
    // Радок скідкі без слова «OPUST»: тая ж назва, што ў папярэдняга, і адмоўная сума.
    const negative = money.length && money[money.length - 1] < 0;
    if (isDiscount(f) || (last && negative && editDistance(fold(nameOf(line)), fold(last.name)) <= Math.max(3, fold(last.name).length * 0.4))) {
      if (last && money.length) {
        const d = Math.abs(money[money.length - 1]);
        if (d < last.paid) { last.discount = +(last.discount + d).toFixed(2); last.paid = +(last.paid - d).toFixed(2); last.afterDiscount = last.paid; }
      } else if (last) last.check = true;
      continue;
    }
    if (letters(line) < 3) {
      // Радок толькі з лічбамі: цана да папярэдняга тавара, калі яе яшчэ няма.
      if (last && money.length && !last.paid) last.paid = money[money.length - 1];
      continue;
    }
    if (SERVICE.test(f)) continue;
    const name = nameOf(line);
    if (letters(name) < 3) continue;
    const q = line.match(QTY);
    const qty = q ? num(q[1]) : 1;
    const unit = q && /[,.]/.test(q[1]) ? 'kg' : 'szt';
    let paid = money.length ? money[money.length - 1] : 0;
    // Колькасць × цана — больш надзейная за апошні лік, калі той зліпся з падатковай літарай.
    if (q) {
      const expected = +(qty * num(q[2])).toFixed(2);
      if (expected < 100 && (!paid || Math.abs(paid - expected) > 0.05)) paid = expected;
    }
    const m = matchOCRName(name, aliases);
    last = {
      raw: line, name, qty, unit, paid, discount: 0,
      productId: m.id, how: m.how, category: categoryOf(name, m.id),
      include: Boolean(m.id || m.how === 'not-food' || m.how === 'alias' || (paid && letters(name) >= 5)),
    };
    // Падазронае варта паказаць першым на экране праверкі.
    last.check = !paid || paid >= 100 || (unit === 'kg' && qty >= 5) || m.how === 'fuzzy' || m.how === 'none';
    items.push(last);
  }
  // Пасля скідкі Lidl друкуе цану без скідкі ў асобным радку — гэта не новы тавар, і ён ужо адкінуты вышэй.
  for (const it of items) delete it.afterDiscount;
  return { store, date, total, items };
}

// Падабенства назваў двух радкоў з розных кадраў.
function sameLine(a, b) {
  const x = fold(a.name), y = fold(b.name);
  if (!x || !y) return false;
  const near = editDistance(x, y) <= Math.max(1, Math.round(Math.max(x.length, y.length) * 0.25));
  return near && (!a.paid || !b.paid || Math.abs(a.paid - b.paid) < 0.02);
}

// Доўгі чэк некалькімі кадрамі: радкі, што трапілі ў нахлёст двух кадраў, бяруцца адзін раз.
export function mergeFrames(frames) {
  const out = { store: '', date: null, total: null, items: [] };
  for (const fr of frames) {
    out.store ||= fr.store;
    out.date ||= fr.date;
    if (fr.total != null) out.total = fr.total;
    const a = out.items, b = fr.items;
    let k = Math.min(a.length, b.length);
    for (; k > 0; k--) {
      let ok = true;
      for (let i = 0; i < k && ok; i++) ok = sameLine(a[a.length - k + i], b[i]);
      if (ok) break;
    }
    out.items = [...a, ...b.slice(k)];
  }
  return out;
}

// Праверка сумы: колькі не хапае да «SUMA PLN».
export function sumCheck(draft) {
  const sum = +draft.items.filter((it) => it.include).reduce((s, it) => s + (Number(it.paid) || 0), 0).toFixed(2);
  if (draft.total == null) return { sum, total: null, diff: null, ok: false };
  const diff = +(draft.total - sum).toFixed(2);
  return { sum, total: draft.total, diff, ok: Math.abs(diff) < 0.05 };
}

// Чарнавік → радкі гісторыі пакупак у тым жа выглядзе, што і раней (store, date, item, qty, unit, paid, category, productId).
export function draftToLines(draft) {
  return draft.items.filter((it) => it.include && it.name).map((it) => ({
    store: draft.store || 'Крама',
    date: draft.date,
    item: it.name,
    qty: it.qty || 1,
    unit: it.unit || 'szt',
    paid: Number(it.paid) || 0,
    category: categoryOf(it.name, it.productId),
    productId: it.productId || null,
    src: 'photo',
  }));
}
