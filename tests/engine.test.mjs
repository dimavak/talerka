import { test } from 'node:test';
import assert from 'node:assert/strict';
import { matchReceiptName, matchTypedName, PRODUCTS, BY_ID } from '../js/products.js';
import { TEMPLATES } from '../js/templates.js';
import { suggestNow, planWeek, usableMethods } from '../js/engine.js';
import { linesFromCSV, parseTypedList, parseReceiptText, basketStats, basketAdvice, latestReceiptIds } from '../js/receipt.js';

const KITCHEN = { equipment: ['stove', 'oven', 'microwave'], exclude: [] };

test('польскія назвы з чэка распазнаюцца', () => {
  const cases = {
    'MSC Łosoś tusza': 'salmon',
    'Łosoś wędzony 100g': 'smoked_salmon',
    'Parówki z fil.indyka': 'sausages',
    'Filet z indyka XXL': 'turkey',
    'Kurczak w marynac.': 'chicken_marinated',
    'Udo z kurczaka XXL': 'chicken_thigh',
    'Fasolka w sosie': 'beans_sauce',
    'Fasola czerw. Kidney': 'beans',
    'Serek wiejski': 'cottage',
    'Łaciaty Serek natur.': 'cream_cheese',
    'Ser z kozier./czar.': 'goat_cheese',
    'Morele suszone': 'apricots_dried',
    'Morele luz': 'berries_fresh',
    'Pom.Jedyne Malin.': 'tomato',
    'Tortilla pełnoziar.': 'tortilla',
    'Kasza gryczana XXL': 'buckwheat',
    'Jaja ściółkowe L': 'eggs',
  };
  for (const [name, id] of Object.entries(cases)) assert.equal(matchReceiptName(name)?.id, id, name);
});

test('салодкае, напоі і не-ежа не трапляюць у запасы', () => {
  for (const name of ['Kinder Mlecz.Kanapka', 'Tortilla Chips', 'Śliwka w czekoladzie', 'Summer piwo', 'G.Gold Karma d.kota', 'Batonik twarog.mali.', 'Sok 100% jabłko.']) {
    assert.equal(matchReceiptName(name), null, name);
  }
});

test('спіс словамі разумее беларускія і рускія формы', () => {
  const { ids, unknown } = parseTypedList('яйкі, грэчка, марожаная гародніна, брокалі, курица');
  assert.deepEqual(ids.sort(), ['broccoli', 'buckwheat', 'chicken_breast', 'eggs', 'frozen_veg'].sort());
  assert.deepEqual(unknown, []);
  assert.equal(matchTypedName('памідоры').id, 'tomato');
});

test('усе спасылкі ў шаблонах вядуць на існыя складнікі', () => {
  assert.ok(TEMPLATES.length >= 30);
  for (const t of TEMPLATES) {
    for (const s of t.slots) for (const id of s.opts) assert.ok(BY_ID[id], `${t.id}: ${id}`);
    assert.ok(t.methods.length, t.id);
  }
  assert.equal(new Set(PRODUCTS.map((p) => p.id)).size, PRODUCTS.length);
});

test('без блэндэра смузі не прапануецца', () => {
  const smoothie = TEMPLATES.find((t) => t.id === 'b-smoothie');
  assert.equal(usableMethods(smoothie, KITCHEN.equipment, 15).length, 0);
  assert.equal(usableMethods(smoothie, [...KITCHEN.equipment, 'blender'], 15).length, 1);
});

test('рэжым «зараз» дае гатовыя стравы і адну дакупку', () => {
  const pantry = ['salmon', 'pepper', 'tortilla', 'hummus', 'rocket', 'cottage', 'blueberries', 'banana'];
  const { ready, upgrade } = suggestNow({ pantry, settings: KITCHEN, meal: 'dinner', limit: 30 });
  assert.ok(ready.length >= 2);
  for (const d of ready) {
    assert.equal(d.missing.length, 0);
    assert.ok(d.method.total <= 30);
  }
  assert.ok(ready.some((d) => d.template.id === 'd-fish-tray'));
  if (upgrade) assert.ok(!pantry.includes(upgrade.buy));
});

test('выключаныя прадукты не трапляюць у стравы', () => {
  const pantry = ['salmon', 'mackerel', 'pepper', 'zucchini', 'eggs', 'tomato'];
  const { ready } = suggestNow({ pantry, settings: { ...KITCHEN, exclude: ['salmon'] }, meal: 'dinner', limit: 30 });
  for (const d of ready) assert.ok(!d.chosen.some((c) => c.ids.includes('salmon')));
});

test('план тыдня паважае графік і абеды з сабой', () => {
  const schedule = {};
  for (const wd of ['mon', 'tue', 'wed', 'thu', 'fri']) schedule[wd] = { breakfast: 'home', lunch: 'take', dinner: 'home' };
  schedule.sat = { breakfast: 'home', lunch: 'home', dinner: 'home' };
  schedule.sun = { breakfast: 'home', lunch: 'skip', dinner: 'home' };
  const pantry = ['salmon', 'pepper', 'tortilla', 'hummus', 'rocket', 'cottage', 'blueberries', 'eggs', 'tomato', 'chicken_breast', 'buckwheat', 'cucumber', 'oats', 'milk', 'banana'];
  const plan = planWeek({ pantry, settings: { ...KITCHEN, schedule }, start: '2026-10-26' });
  assert.equal(plan.days.length, 7);
  const sunday = plan.days.find((d) => d.weekday === 'sun');
  assert.equal(sunday.meals.lunch.mode, 'skip');
  for (const day of plan.days) {
    const l = day.meals.lunch;
    if (l.mode === 'take' && l.dish) assert.ok(l.dish.template.portable, day.date);
  }
  const fish = plan.rules.find((r) => r.id === 'fish');
  assert.ok(fish.ok, `рыба: ${fish.value}`);
  // Кожная страва — максімум адна дакупка, і ўсе дакупкі ёсць у спісе.
  for (const day of plan.days) for (const m of Object.values(day.meals)) {
    for (const miss of m.dish?.missing ?? []) assert.ok(plan.buy.includes(miss.ids[0]));
  }
});

test('аналіз кошыка па CSV', () => {
  const csv = [
    'store,date,item_pl,qty,unit,paid_pln,category',
    'Lidl A,2026-10-26,Kinder Mlecz.Kanapka,3,szt,11.39,sweets',
    'Lidl A,2026-10-26,Hummus 160g,1,szt,3.29,legumes',
    'Lidl A,2026-10-26,MSC Łosoś tusza,0.776,kg,23.20,fish',
    'Lidl A,2026-10-26,Papryka czerwona luz,0.452,kg,8.13,vegetables',
    'Lidl A,2026-10-26,"Czereśnie, luz",0.444,kg,5.72,fruit',
    'Lidl A,2026-10-26,G.Gold Karma d.kota,2,szt,3.98,non_food',
    'Lidl A,2026-10-10,Kinder Mlecz.Kanapka,1,szt,5.69,sweets',
    'Lidl A,2026-10-10,Szynka Szwarcw. XXL,1,szt,12.99,processed_meat',
  ].join('\n');
  const lines = linesFromCSV(csv);
  assert.equal(lines.length, 8);
  assert.equal(lines[4].item, 'Czereśnie, luz');
  const st = basketStats(lines);
  assert.equal(st.receipts, 2);
  assert.equal(Math.round(st.foodTotal * 100), 7041);
  const advice = basketAdvice(lines);
  assert.ok(advice.some((a) => a.title.includes('Kinder')));
  assert.ok(advice.some((a) => a.title.includes('хумус')));
  assert.deepEqual(latestReceiptIds(lines).sort(), ['berries_fresh', 'hummus', 'pepper', 'salmon']);
});

test('тэкст чэка: службовыя радкі і цэны адкідаюцца', () => {
  const text = 'PARAGON FISKALNY\nMSC Łosoś tusza 0,776 x29,90 23,20C\nOPUST Hummus 160g -0,90\nHummus 160g 1 x4,19 4,19C\nKinder Mlecz.Kanapka 3 x5,69 17,07C\nSUMA PLN 191,42';
  const { ids } = parseReceiptText(text);
  assert.deepEqual(ids.sort(), ['hummus', 'salmon']);
});
