import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays } from '../js/engine.js';
import { defaultState, migrate, VERSION } from '../js/store.js';
import { stockOn, probability, rhythm, reminders, availability, addPurchase, markNotHome } from '../js/stock.js';
import {
  ensurePlan, keyOf, getSlot, dishAt, planDays, planRules, rebuildFrom, markEaten, markSkipped,
  markReplaced, unmark, moveMeal, reroll, portionsFor, gramsFor, slotMode,
} from '../js/plan.js';
import { buildList, toggleBought, addManual, clearBought, shareText } from '../js/shopping.js';

const TODAY = '2026-10-28'; // серада

function line(date, productId, category = 'x') {
  return { store: 'Test', date, item: productId, qty: 1, unit: 'szt', paid: 5, category, productId };
}

// Сям'я, што купляе раз на тыдзень, а ласось — два тыдні таму.
function household() {
  const s = defaultState();
  const d = (n) => addDays(TODAY, -n);
  for (const n of [1, 8, 15]) {
    for (const id of ['eggs', 'cottage', 'banana', 'apple', 'tomato', 'cucumber', 'pepper', 'chicken_breast', 'kefir', 'tortilla']) s.lines.push(line(d(n), id));
  }
  for (const id of ['buckwheat', 'oats', 'chickpeas', 'frozen_veg', 'walnut', 'hummus']) s.lines.push(line(d(1), id));
  s.lines.push(line(d(14), 'salmon', 'fish'));
  return s;
}

test('свежая рыба з чэка двухтыднёвай даўніны лічыцца скончанай, а грэчка — не', () => {
  const s = household();
  const st = stockOn(s, TODAY);
  assert.equal(st.salmon.level, 'gone');
  assert.equal(st.buckwheat.level, 'likely');
  assert.equal(st.eggs.level, 'likely');
});

test('верагоднасць падае з часам і ўлічвае рытм пакупак', () => {
  assert.equal(rhythm(['2026-10-01', '2026-10-06']), null);
  assert.equal(rhythm(['2026-10-01', '2026-10-06', '2026-10-11']), 5);
  const p = (on) => probability({ id: 'buckwheat', dates: ['2026-10-01'], on });
  assert.equal(p('2026-10-10'), 1);
  assert.ok(p('2026-12-01') < 0.5);
  // Грэчку купляюць кожныя 5 дзён — значыць, праз 10 дзён яе, хутчэй за ўсё, ужо няма.
  const fast = probability({ id: 'buckwheat', dates: ['2026-10-01', '2026-10-06', '2026-10-11'], on: '2026-10-21' });
  assert.ok(fast < 0.15, String(fast));
  // З'едзеная страва крыху змяншае шанец.
  const used = probability({ id: 'buckwheat', dates: ['2026-10-01'], on: '2026-10-05', uses: ['2026-10-03', '2026-10-04'] });
  assert.ok(used < 1 && used > 0.5);
});

test('«гэтага няма» абнуляе прадукт да наступнай пакупкі', () => {
  const s = household();
  markNotHome(s, 'eggs', TODAY);
  assert.equal(stockOn(s, TODAY).eggs.level, 'gone');
  addPurchase(s, 'eggs', TODAY, 'bought');
  assert.equal(stockOn(s, TODAY).eggs.level, 'likely');
});

test('напамін, калі карыснае даўно не куплялі', () => {
  const s = household();
  const r = reminders(s, TODAY);
  const fish = r.find((x) => x.group === 'fish');
  assert.ok(fish, JSON.stringify(r));
  assert.equal(fish.since, 14);
  assert.equal(fish.suggest, 'salmon');
  assert.ok(!r.some((x) => x.group === 'legume'));
  s.shopping.snooze.fish = TODAY;
  assert.ok(!reminders(s, TODAY).some((x) => x.group === 'fish'));
});

test('план захоўваецца: паўторнае адкрыццё нічога не мяняе, новы дзень дадаецца', () => {
  const s = household();
  assert.equal(ensurePlan(s, TODAY), true);
  const snapshot = JSON.stringify(s.plan);
  assert.equal(ensurePlan(s, TODAY), false);
  assert.equal(JSON.stringify(s.plan), snapshot);
  const days = planDays(s, TODAY);
  assert.equal(days.length, 7);
  assert.ok(days.every((d) => Object.values(d.meals).some((m) => m.dish)));
  // Праз дзень: стары план застаецца, дадаецца толькі адзін новы дзень.
  const tomorrow = addDays(TODAY, 1);
  const before = JSON.stringify(s.plan[addDays(TODAY, 3)]);
  ensurePlan(s, tomorrow);
  assert.equal(JSON.stringify(s.plan[addDays(TODAY, 3)]), before);
  assert.ok(s.plan[addDays(TODAY, 7)]);
});

test('рыба двухтыднёвай даўніны не трапляе ў стравы як наяўная', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const st = stockOn(s, TODAY);
  const list = buildList(s, TODAY);
  for (const d of planDays(s, TODAY)) for (const m of Object.values(d.meals)) {
    if (m.dish?.chosen.some((c) => c.ids.includes('salmon'))) {
      assert.equal(st.salmon.level, 'gone');
      assert.ok(list.plan.some((x) => x.id === 'salmon'));
    }
  }
});

test('адзнакі: з\'еў, прапусціў, замяніў іншым, перанёс', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const b = keyOf(TODAY, 'breakfast');
  const l = keyOf(TODAY, 'lunch');
  const dn = keyOf(TODAY, 'dinner');
  const dish = markEaten(s, b);
  assert.ok(dish);
  assert.equal(getSlot(s, b).state, 'eaten');
  assert.equal(s.cooked.length, 1);
  unmark(s, b);
  assert.equal(getSlot(s, b).state, 'planned');
  assert.equal(s.cooked.length, 0);

  const meals = () => Number(planRules(s, TODAY).find((r) => r.id === 'plate').value.split('/')[1]);
  const before = meals();
  markReplaced(s, l, 'office', TODAY);
  assert.equal(getSlot(s, l).state, 'replaced');
  assert.equal(dishAt(s, l), null);
  // Прыём «у офісе» баланс тыдня не лічыць і не карае.
  assert.equal(meals(), before - 1);

  const title = dishAt(s, dn).template.title;
  const target = keyOf(addDays(TODAY, 2), 'lunch');
  assert.equal(moveMeal(s, dn, target, TODAY), true);
  assert.equal(getSlot(s, dn).state, 'moved');
  assert.equal(getSlot(s, dn).movedTo, target);
  assert.equal(dishAt(s, target).template.title, title);

  markSkipped(s, keyOf(addDays(TODAY, 1), 'dinner'), TODAY);
  assert.equal(getSlot(s, keyOf(addDays(TODAY, 1), 'dinner')).state, 'skipped');
});

test('«іншая страва» не паўтарае адхіленую', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const k = keyOf(addDays(TODAY, 2), 'dinner');
  const first = getSlot(s, k).tpl;
  reroll(s, k, TODAY);
  const second = getSlot(s, k).tpl;
  assert.notEqual(second, first);
  reroll(s, k, TODAY);
  assert.ok(![first, second].includes(getSlot(s, k).tpl));
  assert.deepEqual(getSlot(s, k).rejected.sort(), [first, second].sort());
});

test('змена налад перабудоўвае толькі будучыя прыёмы, адзначанае застаецца', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const todayPlan = JSON.stringify(s.plan[TODAY]);
  const k = keyOf(addDays(TODAY, 3), 'breakfast');
  markEaten(s, k);
  const eaten = JSON.stringify(getSlot(s, k));
  s.settings.schedule.fri = { breakfast: 'skip', lunch: 'home', dinner: 'home' };
  rebuildFrom(s, addDays(TODAY, 1), TODAY);
  assert.equal(JSON.stringify(s.plan[TODAY]), todayPlan);
  assert.equal(JSON.stringify(getSlot(s, k)), eaten);
  assert.equal(getSlot(s, keyOf('2026-11-06', 'breakfast'))?.state ?? 'off', 'off');
  assert.equal(getSlot(s, keyOf('2026-10-30', 'breakfast')).state, 'off');
});

test('абед з сабой — па днях кожнага ўдзельніка, вячэра гатуецца з запасам', () => {
  const s = household();
  s.settings.members[0].take = ['thu'];
  assert.equal(slotMode(s.settings, '2026-10-29', 'lunch'), 'take');
  assert.equal(slotMode(s.settings, '2026-10-30', 'lunch'), 'home');
  ensurePlan(s, TODAY);
  const lunch = getSlot(s, keyOf('2026-10-29', 'lunch'));
  assert.equal(lunch.mode, 'take');
  assert.equal(lunch.leftoverOf, keyOf(TODAY, 'dinner'));
  assert.deepEqual(portionsFor(s, keyOf(TODAY, 'dinner')), { eat: 2, take: 1 });
  // Вячэру прапусцілі — абед на заўтра падбіраецца нанова.
  markSkipped(s, keyOf(TODAY, 'dinner'), TODAY);
  const after = getSlot(s, keyOf('2026-10-29', 'lunch'));
  assert.equal(after.leftoverOf, undefined);
  assert.equal(after.state, 'planned');
});

test('грамы ў рэцэпце — на дваіх дарослых', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const k = keyOf(TODAY, 'breakfast');
  const d = dishAt(s, k);
  const p = portionsFor(s, k);
  assert.equal(p.eat, 2);
  const one = gramsFor(d, 1);
  const two = gramsFor(d, 2);
  assert.equal(one.length, two.length);
  for (let i = 0; i < one.length; i++) assert.ok(Math.abs(two[i].grams - one[i].grams * 2) <= 10, `${two[i].name}`);
  const eggs = gramsFor({ chosen: [{ slot: { g: 120 }, ids: ['eggs'] }] }, 2)[0];
  assert.equal(eggs.pieces, 4);
});

test('спіс пакупак: з плана, з напамінаў, свае пункты, «купіў» і тэкст для месенджара', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const list = buildList(s, TODAY);
  assert.ok(list.remind.some((x) => x.id === 'salmon') || list.plan.some((x) => x.id === 'salmon'));
  addManual(s, 'кава');
  addManual(s, 'грэчка');
  const l2 = buildList(s, TODAY);
  assert.equal(l2.manual.length, 2);
  assert.equal(l2.manual[1].id, 'buckwheat');
  const first = [...l2.plan, ...l2.remind][0];
  toggleBought(s, first.key, TODAY);
  const l3 = buildList(s, TODAY);
  const again = [...l3.plan, ...l3.remind].find((x) => x.key === first.key);
  assert.ok(again?.bought, 'купленае застаецца ў спісе адзначаным');
  assert.equal(stockOn(s, TODAY)[first.id].level, 'likely');
  const text = shareText(l3);
  assert.ok(text.includes('кава'));
  assert.ok(!text.includes(`• ${first.name}\n`));
  toggleBought(s, l3.manual[0].key, TODAY);
  clearBought(s);
  assert.equal(buildList(s, TODAY).manual.length, 1);
});

test('міграцыя з talerka.v1', () => {
  const v1 = {
    version: 1,
    pantry: ['eggs', 'buckwheat', 'salmon'],
    lines: [line('2026-10-20', 'salmon')],
    settings: { equipment: ['stove'], people: 2, exclude: ['mushrooms'], schedule: { mon: { breakfast: 'home', lunch: 'take', dinner: 'skip' } } },
    wish: ['walnut'],
    cooked: [{ date: '2026-10-27', meal: 'dinner', templateId: 'x' }],
    overrides: { '2026-10-28:lunch': 'skip' },
  };
  const s = migrate(v1, TODAY);
  assert.equal(s.version, VERSION);
  assert.deepEqual(s.extra.map((e) => e.id).sort(), ['buckwheat', 'eggs']);
  assert.ok(s.extra.every((e) => e.date === TODAY));
  assert.equal(s.lines.length, 1);
  assert.deepEqual(s.settings.equipment, ['stove']);
  assert.deepEqual(s.settings.exclude, ['mushrooms']);
  assert.equal(s.settings.members.length, 2);
  assert.deepEqual(s.settings.members[0].take, ['mon']);
  assert.equal(s.settings.schedule.mon.lunch, 'home');
  assert.equal(s.settings.schedule.mon.dinner, 'skip');
  assert.equal(s.shopping.manual[0].id, 'walnut');
  assert.equal(s.cooked.length, 1);
  assert.equal(s.pantry, undefined);
  assert.equal(migrate(s, TODAY).version, VERSION);
  assert.ok(availability(stockOn(s, TODAY)).have.has('eggs'));
});
