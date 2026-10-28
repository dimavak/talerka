// Дэма-дадзеныя для тэсту: восем выдуманых чэкаў тыповай сям'і за чатыры тыдні.
// Гэта не нечыя рэальныя пакупкі. Даты лічацца ад сённяшняга дня, каб апошні чэк быў учорашні.
import { linesFromCSV } from './receipt.js';

export const DEMO_STORE = 'Lidl (дэма)';

// [колькі дзён таму, назва ў чэку, колькасць, адзінка, заплачана зл, катэгорыя]
const RECEIPTS = [
  [1, [
    ['Jaja ściółkowe L', 10, 'szt', 11.99, 'eggs'],
    ['Płatki owsiane górsk.', 1, 'szt', 3.49, 'whole_grain'],
    ['Kasza gryczana 400g', 1, 'szt', 4.29, 'whole_grain'],
    ['Brokuł szt.', 1, 'szt', 4.99, 'vegetables'],
    ['Mieszanka warzyw mroż.', 1, 'szt', 6.49, 'vegetables'],
    ['MSC Łosoś tusza', 0.62, 'kg', 18.54, 'fish'],
    ['Ciecierzyca konserw.', 2, 'szt', 7.98, 'legumes'],
    ['Pomidory kiścio. luz', 0.54, 'kg', 5.38, 'vegetables'],
    ['Ogórki grunt. PL luz', 0.48, 'kg', 3.36, 'vegetables'],
    ['Papryka czerwona luz', 0.41, 'kg', 4.92, 'vegetables'],
    ['Rukola', 1, 'szt', 4.49, 'vegetables'],
    ['Cebula żółta luz', 0.6, 'kg', 2.39, 'vegetables'],
    ['Czosnek luz', 1, 'szt', 1.99, 'vegetables'],
    ['Kefir naturalny 400g', 2, 'szt', 5.58, 'dairy'],
    ['Serek wiejski', 2, 'szt', 5.98, 'dairy'],
    ['Tortilla pełnoziar.', 1, 'szt', 5.49, 'whole_grain'],
    ['Filet z piersi kurcz.', 0.82, 'kg', 19.68, 'poultry'],
    ['Banany luz', 1.1, 'kg', 5.49, 'fruit'],
    ['Jabłka Gala luz', 1.2, 'kg', 5.99, 'fruit'],
    ['Hummus 160g', 1, 'szt', 4.19, 'legumes'],
    ['Kinder Mlecz.Kanapka', 2, 'szt', 7.58, 'sweets'],
    ['Reklamówka', 1, 'szt', 0.99, 'non_food'],
  ]],
  [4, [
    ['Hummus 160g', 2, 'szt', 8.38, 'legumes'],
    ['Sałata lodowa szt.', 1, 'szt', 3.99, 'vegetables'],
    ['Pomidory mal. PL luz', 0.5, 'kg', 6.49, 'vegetables'],
    ['Ser gouda plastry', 1, 'szt', 7.99, 'dairy'],
    ['Parówki z szynki', 1, 'szt', 9.99, 'processed_meat'],
    ['Croissant maśl.', 4, 'szt', 7.96, 'refined_grain'],
    ['Lody waniliowe', 1, 'szt', 9.99, 'sweets'],
    ['Banany luz', 0.9, 'kg', 4.49, 'fruit'],
    ['Sok jabłkowy 1l', 1, 'szt', 4.99, 'drinks_sugary'],
  ]],
  [7, [
    ['Makrela wędzona', 0.35, 'kg', 10.47, 'fish'],
    ['Ziemniaki myte luz', 1.5, 'kg', 4.49, 'vegetables'],
    ['Marchew luz', 0.8, 'kg', 2.39, 'vegetables'],
    ['Buraki gotowane 500g', 1, 'szt', 3.99, 'vegetables'],
    ['Twaróg półtłusty', 1, 'szt', 4.79, 'dairy'],
    ['Jogurt natur. 400g', 1, 'szt', 3.29, 'dairy'],
    ['Mięso miel. wołowe', 0.5, 'kg', 17.99, 'meat'],
    ['Makaron spaghetti', 1, 'szt', 4.49, 'refined_grain'],
    ['Szynka Szwarcwaldzka', 1, 'szt', 8.99, 'processed_meat'],
    ['Czekolada mleczna', 2, 'szt', 7.98, 'sweets'],
    ['Gruszki deserowe', 0.8, 'kg', 6.39, 'fruit'],
    ['Mandarynki luz', 1, 'kg', 6.99, 'fruit'],
  ]],
  [10, [
    ['Jaja ściółkowe L', 10, 'szt', 11.99, 'eggs'],
    ['Ogórki grunt. PL luz', 0.6, 'kg', 4.19, 'vegetables'],
    ['Papryka czerwona luz', 0.5, 'kg', 5.99, 'vegetables'],
    ['Rukola', 1, 'szt', 4.49, 'vegetables'],
    ['Serek wiejski', 2, 'szt', 5.98, 'dairy'],
    ['Filet z indyka', 0.6, 'kg', 17.94, 'poultry'],
    ['Kinder Mlecz.Kanapka', 3, 'szt', 11.37, 'sweets'],
    ['Pistacje kalifor.', 1, 'szt', 12.99, 'nuts_seeds'],
    ['Awokado Hass szt.', 2, 'szt', 7.98, 'fruit'],
    ['Ketchup łagodny', 1, 'szt', 5.49, 'sauce'],
    ['Ręcznik papier.', 1, 'szt', 9.99, 'non_food'],
  ]],
  [14, [
    ['Hummus 160g', 2, 'szt', 8.38, 'legumes'],
    ['Pomidory kiścio. luz', 0.6, 'kg', 5.99, 'vegetables'],
    ['Szpinak baby', 1, 'szt', 5.99, 'vegetables'],
    ['Cukinia luz', 0.5, 'kg', 3.49, 'vegetables'],
    ['Kefir naturalny 400g', 2, 'szt', 5.58, 'dairy'],
    ['Ser gouda plastry', 1, 'szt', 7.99, 'dairy'],
    ['Parówki z szynki', 1, 'szt', 9.99, 'processed_meat'],
    ['Croissant maśl.', 4, 'szt', 7.96, 'refined_grain'],
    ['Lody waniliowe', 1, 'szt', 9.99, 'sweets'],
    ['Jabłka Gala luz', 1.4, 'kg', 6.99, 'fruit'],
    ['Borówka amery.400g', 1, 'szt', 12.99, 'fruit'],
  ]],
  [17, [
    ['MSC Łosoś tusza', 0.55, 'kg', 16.45, 'fish'],
    ['Kasza gryczana 400g', 1, 'szt', 4.29, 'whole_grain'],
    ['Brokuł szt.', 1, 'szt', 4.99, 'vegetables'],
    ['Cebula żółta luz', 0.5, 'kg', 1.99, 'vegetables'],
    ['Serek wiejski', 2, 'szt', 5.98, 'dairy'],
    ['Chipsy solone', 1, 'szt', 5.99, 'snacks'],
    ['Czekolada mleczna', 1, 'szt', 3.99, 'sweets'],
    ['Banany luz', 1, 'kg', 4.99, 'fruit'],
    ['Cytryny 500g', 1, 'szt', 4.99, 'fruit'],
  ]],
  [21, [
    ['Jaja ściółkowe L', 10, 'szt', 11.99, 'eggs'],
    ['Ziemniaki myte luz', 2, 'kg', 5.98, 'vegetables'],
    ['Ogórki grunt. PL luz', 0.5, 'kg', 3.49, 'vegetables'],
    ['Sałata lodowa szt.', 1, 'szt', 3.99, 'vegetables'],
    ['Filet z piersi kurcz.', 0.75, 'kg', 18.0, 'poultry'],
    ['Szynka Szwarcwaldzka', 1, 'szt', 8.99, 'processed_meat'],
    ['Kinder Mlecz.Kanapka', 2, 'szt', 7.58, 'sweets'],
    ['Tortilla pełnoziar.', 1, 'szt', 5.49, 'whole_grain'],
    ['Mandarynki luz', 1, 'kg', 6.99, 'fruit'],
    ['Sok jabłkowy 1l', 1, 'szt', 4.99, 'drinks_sugary'],
  ]],
  [25, [
    ['Hummus 160g', 1, 'szt', 4.19, 'legumes'],
    ['Pomidory mal. PL luz', 0.5, 'kg', 6.49, 'vegetables'],
    ['Papryka czerwona luz', 0.4, 'kg', 4.79, 'vegetables'],
    ['Twaróg półtłusty', 1, 'szt', 4.79, 'dairy'],
    ['Mleko 2%', 2, 'szt', 7.58, 'dairy'],
    ['Parówki z szynki', 1, 'szt', 9.99, 'processed_meat'],
    ['Makaron spaghetti', 1, 'szt', 4.49, 'refined_grain'],
    ['Lody waniliowe', 1, 'szt', 9.99, 'sweets'],
    ['Szprot w sosie pomid', 2, 'szt', 7.98, 'fish'],
    ['Jabłka Gala luz', 1, 'kg', 4.99, 'fruit'],
  ]],
];

function isoDaysAgo(today, n) {
  const d = new Date(`${today}T12:00:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// Дэма ў тым жа фармаце CSV, што і сапраўдная гісторыя пакупак.
export function demoCSV(today) {
  const rows = ['store,date,item_pl,qty,unit,paid_pln,category'];
  for (const [ago, items] of RECEIPTS) {
    const date = isoDaysAgo(today, ago);
    for (const [item, qty, unit, paid, category] of items) {
      rows.push([DEMO_STORE, date, item, qty, unit, paid.toFixed(2), category].join(','));
    }
  }
  return rows.join('\n');
}

export function demoLines(today) {
  return linesFromCSV(demoCSV(today));
}
