import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseReceiptOCR, mergeFrames, sumCheck, draftToLines, matchOCRName, aliasKey, fold, nameOf } from '../js/receipt-ocr.js';
import { prepare, paperBox, toGray, invertIfDark } from '../js/receipt-image.js';
import { basketStats } from '../js/receipt.js';
import { migrate } from '../js/store.js';

// Выдуманы чэк у выглядзе, як яго аддае распазнаванне: шум ад краю, «w» як «u», скідкі.
const LIDL = `Lidl sp. z o.o. sp. k.
ul. Prosta 1, 00-001 Warszawa
NIP 7811897358
PARAGON FISKALNY
Jaja ściółkowe L      C    1 x11,99 11,99C
Kasza gryczana 400g   C    1 x4,29 4,29C
Pomidory luz          C    0,540 x9,99 5,39C
OPUST Pomidory luz              -1,00
Mieszanka uarzyu mroż. C   1 x6,49 6,49C
Ciecierzyca konserw.  C    2 x3,99 7,98C
Kinder Mlecz.Kanapka  B    1 x3,79 3,79B
Reklamóuka            A    1 x0,79 0,79A
SPRZEDAŻ OPODATKOWANA A        0,79
SUMA PLN                      39,72
Karta płatnicza               39,72
2026-10-20 18:34`;

test('радкі чэка з распазнавання: назвы, колькасць, цана, скідка, сума', () => {
  const d = parseReceiptOCR(LIDL);
  assert.equal(d.store, 'Lidl');
  assert.equal(d.date, '2026-10-20');
  assert.equal(d.total, 39.72);
  const by = Object.fromEntries(d.items.map((it) => [it.productId ?? it.name, it]));
  assert.deepEqual(d.items.map((it) => it.productId), ['eggs', 'buckwheat', 'tomato', 'frozen_veg', 'chickpeas', null, null]);
  assert.equal(by.tomato.unit, 'kg');
  assert.equal(by.tomato.paid, 4.39);
  assert.equal(by.chickpeas.qty, 2);
  assert.equal(d.items[5].category, 'sweets');
  assert.equal(d.items[6].category, 'non_food');
  assert.ok(sumCheck(d).ok, JSON.stringify(sumCheck(d)));
});

test('скіданы «OPUST» і шум ад краю паперы', () => {
  const d = parseReceiptOCR(`PARAGON FISKALNY
pŁ Borówka amery.400g  F  1 x23,99 23,99C
(PJST Borówka amery.400g F    -8,00
SUMA PLN 15,99`);
  assert.equal(d.items.length, 1);
  assert.equal(d.items[0].name, 'Borówka amery.400g');
  assert.equal(d.items[0].productId, 'blueberries');
  assert.equal(d.items[0].paid, 15.99);
  assert.ok(sumCheck(d).ok);
});

test('назвы з памылкамі распазнавання ўсё роўна пазнаюцца', () => {
  assert.equal(matchOCRName('Serek uiejski').id, 'cottage');
  assert.equal(matchOCRName('Papryka czeruona luz').id, 'pepper');
  assert.equal(matchOCRName('Kasza gryczama').id, 'buckwheat');
  assert.equal(matchOCRName('G.Gold Karna d.kota').id, null);
  assert.equal(fold('Łosoś Wędz.'), 'losos uedz');
  assert.equal(nameOf('Hummus 160g          F   1 x4,19 4,19C'), 'Hummus 160g');
});

test('слоўнік назваў: выпраўленае карыстальнікам пазнаецца наступным разам', () => {
  const aliases = { [aliasKey('Sos Street Food')]: 'tomato_passata', [aliasKey('Krem Nutella')]: '' };
  assert.equal(matchOCRName('Sos Street Food 1', aliases).id, 'tomato_passata');
  assert.equal(matchOCRName('Krem Nutella 350g', aliases).id, null);
  assert.equal(matchOCRName('Krem Nutella 350g', aliases).how, 'alias');
});

test('доўгі чэк некалькімі кадрамі: нахлёст не падвойваецца', () => {
  const a = parseReceiptOCR(`PARAGON FISKALNY
Jaja ściółkowe L   C  1 x11,99 11,99C
Kasza gryczana     C  1 x4,29 4,29C
Brokuł szt.        C  1 x4,99 4,99C`);
  const b = parseReceiptOCR(`Kasza gryczana     C  1 x4,29 4,29C
Brokuł szt.        C  1 x4,99 4,99C
Kefir naturalny    C  2 x2,79 5,58C
SUMA PLN 26,85
2026-10-21 10:00`);
  const d = mergeFrames([a, b]);
  assert.deepEqual(d.items.map((x) => x.productId), ['eggs', 'buckwheat', 'broccoli', 'kefir']);
  assert.equal(d.total, 26.85);
  assert.equal(d.date, '2026-10-21');
  assert.ok(sumCheck(d).ok);
  // Два аднолькавыя тавары запар у адным кадры — гэта два тавары, а не нахлёст.
  const same = parseReceiptOCR(`PARAGON\nRitter Czekolada  B  1 x4,49 4,49B\nRitter Czekolada  B  1 x4,49 4,49B\nSUMA PLN 8,98`);
  assert.equal(same.items.length, 2);
});

test('захаваны чэк трапляе ў гісторыю ў тым жа выглядзе, што і раней', () => {
  const d = parseReceiptOCR(LIDL);
  d.items[1].include = false;
  const lines = draftToLines(d);
  assert.equal(lines.length, d.items.length - 1);
  assert.deepEqual(Object.keys(lines[0]).sort(), ['category', 'date', 'item', 'paid', 'productId', 'qty', 'src', 'store', 'unit']);
  assert.equal(lines[0].store, 'Lidl');
  const st = basketStats(lines);
  assert.equal(st.receipts, 1);
  assert.ok(st.share('eggs') > 0);
});

test('фота: папера выразаецца з цёмнага стала, цёмны скрыншот пераварочваецца', () => {
  const W = 200, H = 300, data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const paper = x >= 60 && x < 140 && y >= 20 && y < 280;
    const text = paper && y % 10 === 0 && x % 7 < 4;
    const v = text ? 30 : paper ? 235 : 70;
    data.set([v, v, v, 255], (y * W + x) * 4);
  }
  const box = paperBox(toGray({ data, width: W, height: H }));
  assert.ok(box.x >= 50 && box.x <= 62 && box.x + box.w >= 138 && box.x + box.w <= 150, JSON.stringify(box));
  const p = prepare({ data, width: W, height: H });
  assert.ok(p.width >= box.w * 3, 'дробны чэк павялічваецца');
  assert.ok(p.gray.every((v) => v === 0 || v === 255));
  const dark = { gray: new Uint8ClampedArray(100).fill(20), width: 10, height: 10 };
  assert.equal(invertIfDark(dark).gray[0], 235);
  // Фота на цёмным стале не пераварочваецца: на ім шмат светлай паперы.
  const g = toGray({ data, width: W, height: H });
  assert.equal(invertIfDark(g).gray, g.gray);
});

test('стары стан без слоўніка атрымлівае пусты слоўнік', () => {
  const s = migrate({ version: 2, lines: [], settings: {} }, '2026-10-28');
  assert.deepEqual(s.aliases, {});
});
