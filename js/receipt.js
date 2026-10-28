// Разбор чэкаў і спісаў: CSV з гісторыі пакупак, тэкст чэка, спіс словамі.
// І аналіз кошыка: долі выдаткаў па групах і парады, што памяняць.
import { BY_ID, matchReceiptName, matchTypedName } from './products.js';

// Катэгорыі ў CSV і як яны называюцца па-беларуску.
export const CATEGORIES = {
  vegetables: 'Гародніна',
  fruit: 'Садавіна',
  sweets: 'Салодкае',
  dairy: 'Малочка',
  drinks: 'Піва і віно',
  poultry: 'Птушка',
  fish: 'Рыба',
  processed_meat: 'Каўбасы і вяндліна',
  meat: 'Мяса',
  legumes: 'Бабовыя',
  eggs: 'Яйкі',
  nuts_seeds: 'Арэхі',
  whole_grain: 'Цэльнае зерне',
  refined_grain: 'Белае зерне',
  snacks: 'Снэкі',
  drinks_sugary: 'Сокі і салодкія напоі',
  sauce: 'Соусы',
  fats_oils: 'Алей',
  ready_meal: 'Гатовая ежа',
  non_food: 'Не ежа',
  unknown: 'Іншае',
};

const GROUP_TO_CATEGORY = {
  veg: 'vegetables', starch: 'vegetables', fruit: 'fruit', grain_whole: 'whole_grain', grain_refined: 'refined_grain',
  legume: 'legumes', fish: 'fish', poultry: 'poultry', meat: 'meat', processed: 'processed_meat', eggs: 'eggs',
  dairy: 'dairy', nuts: 'nuts_seeds', sauce: 'sauce',
};

// Катэгорыі, якія лічацца «добрымі» і «тымі, што варта зменшыць» — для колеру ў аналізе.
export const GOOD = new Set(['vegetables', 'fruit', 'fish', 'legumes', 'whole_grain', 'nuts_seeds', 'eggs']);
export const LESS = new Set(['sweets', 'processed_meat', 'drinks', 'drinks_sugary', 'snacks', 'refined_grain', 'ready_meal']);

// Просты CSV-парсер з падтрымкай двукоссяў («"Czereśnie, luz"»).
export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map((h) => h.trim().replace(/^﻿/, ''));
  return rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}

// Радкі CSV у фармаце store,date,item_pl,qty,unit,paid_pln,category → радкі пакупак.
export function linesFromCSV(text) {
  return parseCSV(text)
    .filter((r) => r.item_pl && r.date)
    .map((r) => {
      const product = matchReceiptName(r.item_pl);
      return {
        store: r.store || '',
        date: r.date,
        item: r.item_pl,
        qty: parseFloat(r.qty) || 1,
        unit: r.unit || 'szt',
        paid: parseFloat(r.paid_pln) || 0,
        category: r.category || (product ? GROUP_TO_CATEGORY[product.group] : 'unknown'),
        productId: product?.id ?? null,
      };
    });
}

// Тэкст чэка, перапісаны ці ўстаўлены: бярэм радкі з літарамі, адкідаем службовыя.
const SERVICE = /^(suma|ptu|sprzeda|rozlicz|karta|nip|paragon|opust|rabat|reszta|got[oó]wka|razem|kaucj|zwrot|lidl plus|niefiskal|nr |adres)/i;

export function parseReceiptText(text) {
  const found = new Map();
  const unknown = [];
  for (const raw of text.split(/\n/)) {
    const line = raw.replace(/\s+\d+[,.]\d+\s*[A-D]?\s*$/i, '').replace(/\s+\d+\s*x\s*[\d,.]+.*$/i, '').trim();
    if (!/[a-ząćęłńóśźż]{3}/i.test(line) || SERVICE.test(line)) continue;
    const p = matchReceiptName(line);
    if (p) found.set(p.id, line);
    else unknown.push(line);
  }
  return { ids: [...found.keys()], matched: [...found.entries()].map(([id, line]) => ({ id, line })), unknown };
}

// «яйкі, грэчка, марожаныя брокалі» → складнікі.
export function parseTypedList(text) {
  const ids = new Set();
  const unknown = [];
  for (const part of text.split(/[,;\n]+/)) {
    const w = part.trim();
    if (!w) continue;
    const p = matchTypedName(w);
    if (p) ids.add(p.id);
    else unknown.push(w);
  }
  return { ids: [...ids], unknown };
}

// Складнікі з апошняга чэка ў гісторыі — тое, што, хутчэй за ўсё, яшчэ ляжыць дома.
export function latestReceiptIds(lines) {
  if (!lines.length) return [];
  const last = lines.reduce((m, l) => (l.date > m ? l.date : m), '');
  return [...new Set(lines.filter((l) => l.date === last && l.productId).map((l) => l.productId))];
}

export function receiptCount(lines) {
  return new Set(lines.map((l) => `${l.date}|${l.store}`)).size;
}

// Долі выдаткаў на ежу і пітво (без не-ежы).
export function basketStats(lines) {
  const food = lines.filter((l) => l.category !== 'non_food');
  const total = food.reduce((s, l) => s + l.paid, 0);
  const by = {};
  for (const l of food) by[l.category] = (by[l.category] ?? 0) + l.paid;
  const shares = Object.entries(by)
    .map(([category, sum]) => ({ category, sum, share: total ? sum / total : 0 }))
    .sort((a, b) => b.sum - a.sum);
  const dates = lines.map((l) => l.date).sort();
  return {
    total: lines.reduce((s, l) => s + l.paid, 0),
    foodTotal: total,
    receipts: receiptCount(lines),
    from: dates[0],
    to: dates[dates.length - 1],
    shares,
    share: (c) => (total ? (by[c] ?? 0) / total : 0),
  };
}

// Як часта тавар трапляе ў чэкі: колькі чэкаў з яго ўдзелам.
export function frequentItems(lines, category, limit = 3) {
  const seen = new Map();
  for (const l of lines.filter((x) => x.category === category)) {
    const key = l.item.replace(/\s+\d.*$/, '').replace(/\.$/, '');
    if (!seen.has(key)) seen.set(key, new Set());
    seen.get(key).add(`${l.date}|${l.store}`);
  }
  return [...seen.entries()].map(([name, s]) => ({ name, receipts: s.size })).sort((a, b) => b.receipts - a.receipts).slice(0, limit);
}

// Парады, што памяняць у закупах. Вяртае самыя важныя спачатку.
export function basketAdvice(lines) {
  const st = basketStats(lines);
  const n = st.receipts;
  const pct = (c) => Math.round(st.share(c) * 100);
  const out = [];

  const sweets = frequentItems(lines, 'sweets', 1)[0];
  if (st.share('sweets') >= 0.08) {
    out.push({
      weight: st.share('sweets') * 25,
      title: sweets ? `Палова «${sweets.name}» → сырок з садавінай ці арэхі` : 'Палова салодкага → сырок з садавінай ці арэхі',
      why: sweets ? `салодкае ${pct('sweets')}% выдаткаў, «${sweets.name}» у ${sweets.receipts} чэках з ${n}` : `салодкае ${pct('sweets')}% выдаткаў`,
      add: ['cottage', 'pistachio', 'walnut'],
    });
  }
  if (st.share('whole_grain') < 0.05) {
    out.push({
      weight: (0.05 - st.share('whole_grain')) * 100,
      title: '+ грэчка, аўсянка і марожаная гародніна',
      why: `цэльнае зерне ўсяго ${pct('whole_grain')}%, з ім з'яўляюцца гарачыя поўныя стравы`,
      add: ['buckwheat', 'oats', 'frozen_veg'],
    });
  }
  if (st.share('legumes') < 0.06) {
    const hummusOnly = lines.filter((l) => l.category === 'legumes').every((l) => /hummus/i.test(l.item));
    out.push({
      weight: (0.06 - st.share('legumes')) * 100,
      title: hummusOnly ? 'Да хумусу + нут і сачавіца' : '+ нут, фасоля, сачавіца',
      why: hummusOnly ? `бабовыя ${pct('legumes')}%, і амаль усё — хумус` : `бабовыя ${pct('legumes')}%, мэта — тры разы на тыдзень`,
      add: ['chickpeas', 'lentils', 'beans'],
    });
  }
  if (st.share('processed_meat') >= 0.04) {
    out.push({
      weight: st.share('processed_meat') * 60,
      title: 'Сасіскі і вяндліну → яйкі, птушка, рыбныя кансервы',
      why: `каўбасы ${pct('processed_meat')}%: найгоршая група па даследаваннях (+22% рызыкі на 50 г у дзень)`,
      add: ['eggs', 'turkey', 'sprats'],
    });
  }
  if (st.share('fish') < 0.06) {
    out.push({
      weight: (0.06 - st.share('fish')) * 80,
      title: '+ рыба двойчы на тыдзень',
      why: `рыба ${pct('fish')}% выдаткаў`,
      add: ['mackerel', 'salmon'],
    });
  }
  return out.sort((a, b) => b.weight - a.weight);
}

// Апошняя цана складніка з чэкаў: «3,29 зл · Lidl».
export function lastPrice(lines, productId) {
  const ls = lines.filter((l) => l.productId === productId && l.paid > 0).sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!ls.length) return null;
  const l = ls[0];
  const per = l.unit === 'kg' ? l.paid / l.qty : l.paid / Math.max(l.qty, 1);
  return { price: per, unit: l.unit === 'kg' ? 'кг' : 'шт', store: l.store.split(' ')[0] };
}

export function productName(id) {
  return BY_ID[id]?.name ?? id;
}
