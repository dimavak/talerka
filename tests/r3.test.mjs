import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addDays, noWorse, MAX_PER_WEEK, fillKey } from '../js/engine.js';
import { defaultState } from '../js/store.js';
import {
  ensurePlan, keyOf, getSlot, dishAt, alternatives, chooseAlternative, toggleLove, addDislike,
  tasteCtx, forgetTaste, rebuildFrom, HIDE_AFTER,
} from '../js/plan.js';
import { MEALS } from '../js/engine.js';

const TODAY = '2026-10-28';

function line(date, productId) {
  return { store: 'Test', date, item: productId, qty: 1, unit: 'szt', paid: 5, category: 'x', productId };
}

// Шмат чаго дома: каб у кожнага слота было з чаго выбіраць.
function household() {
  const s = defaultState();
  const d = (n) => addDays(TODAY, -n);
  for (const n of [1, 8, 15]) {
    for (const id of ['eggs', 'cottage', 'skyr', 'banana', 'apple', 'blueberries', 'tomato', 'cucumber', 'pepper', 'zucchini', 'chicken_breast', 'turkey', 'kefir', 'tortilla', 'wholemeal_bread', 'rocket', 'spinach']) s.lines.push(line(d(n), id));
  }
  for (const id of ['buckwheat', 'oats', 'bulgur', 'chickpeas', 'lentils', 'beans', 'frozen_veg', 'walnut', 'seeds', 'hummus', 'tuna', 'onion', 'carrot']) s.lines.push(line(d(1), id));
  return s;
}

const plannedKeys = (s) => Object.keys(s.plan).filter((d) => d >= TODAY).flatMap((d) => MEALS.map((m) => keyOf(d, m))).filter((k) => getSlot(s, k)?.state === 'planned' && !getSlot(s, k).leftoverOf);

test('«іншы варыянт»: тое ж з іншым напаўненнем і да трох іншых страў, не горшых па правілах', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const k = keyOf(addDays(TODAY, 1), 'dinner');
  const cur = dishAt(s, k);
  const { variants, others } = alternatives(s, k, TODAY);
  assert.ok(others.length >= 1 && others.length <= 3);
  for (const d of variants) {
    assert.equal(d.template.id, cur.template.id);
    assert.notEqual(fillKey(d.chosen), fillKey(cur.chosen));
  }
  for (const d of [...variants, ...others]) assert.ok(noWorse(d, cur), d.template.id);
  assert.ok(others.every((d) => d.template.id !== cur.template.id));
});

test('«задоўга» дае толькі хутчэйшыя стравы, «не падабаецца» — без гэтай стравы', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const k = plannedKeys(s).find((key) => dishAt(s, key).method.total >= 15);
  const cur = dishAt(s, k);
  const long = alternatives(s, k, TODAY, 'long');
  assert.equal(long.variants.length, 0);
  for (const d of long.others) assert.ok(d.method.total < cur.method.total, `${d.template.id} ${d.method.total}`);
  const dis = alternatives(s, k, TODAY, 'dislike');
  assert.equal(dis.variants.length, 0);
});

test('«не падабаецца» двойчы хавае страву, сэрца — прапануе часцей', () => {
  const s = household();
  ensurePlan(s, TODAY);
  const k = keyOf(addDays(TODAY, 2), 'dinner');
  const tpl = getSlot(s, k).tpl;
  const alt = alternatives(s, k, TODAY, 'dislike').others[0];
  assert.equal(chooseAlternative(s, k, alt, 'dislike', TODAY).hidden, false);
  assert.equal(getSlot(s, k).tpl, alt.template.id);
  assert.ok(tasteCtx(s).disliked.has(tpl));
  assert.equal(addDislike(s, tpl), true);
  assert.equal(HIDE_AFTER, 2);
  assert.ok(tasteCtx(s).hidden.has(tpl));
  rebuildFrom(s, TODAY, TODAY);
  assert.ok(!plannedKeys(s).some((key) => getSlot(s, key).tpl === tpl), 'схаваная страва не плануецца');
  forgetTaste(s, tpl);
  assert.ok(!tasteCtx(s).hidden.has(tpl));

  const loved = getSlot(s, keyOf(addDays(TODAY, 3), 'lunch')).tpl;
  assert.equal(toggleLove(s, loved), true);
  assert.ok(tasteCtx(s).loved.has(loved));
  assert.equal(toggleLove(s, loved), false);
});

test('адна страва — не часцей за два разы на тыдзень', () => {
  const s = household();
  ensurePlan(s, TODAY);
  // Улюбёная страва ўсё роўна не займае ўвесь тыдзень.
  const tpl = getSlot(s, keyOf(TODAY, 'breakfast')).tpl;
  toggleLove(s, tpl);
  rebuildFrom(s, TODAY, TODAY);
  const counts = {};
  for (const key of plannedKeys(s)) counts[getSlot(s, key).tpl] = (counts[getSlot(s, key).tpl] ?? 0) + 1;
  // Акно ±3 дні: у любых 7 днях запар — не больш за MAX_PER_WEEK.
  const dates = Object.keys(s.plan).filter((d) => d >= TODAY).sort();
  for (const t of Object.keys(counts)) {
    const days = dates.flatMap((d) => MEALS.filter((m) => { const sl = getSlot(s, keyOf(d, m)); return sl?.tpl === t && sl.state === 'planned' && !sl.leftoverOf; }).map(() => d));
    for (const d of days) {
      const near = days.filter((x) => Math.abs(new Date(x) - new Date(d)) <= 3 * 86400000).length;
      assert.ok(near <= MAX_PER_WEEK, `${t}: ${near}`);
    }
  }
});

test('база страў: каля 80, у кожнай польская назва для пошуку і крыніца ідэі', async () => {
  const { TEMPLATES } = await import('../js/templates.js');
  const { matchReceiptName } = await import('../js/products.js');
  assert.ok(TEMPLATES.length >= 70, String(TEMPLATES.length));
  assert.equal(new Set(TEMPLATES.map((t) => t.id)).size, TEMPLATES.length);
  for (const t of TEMPLATES) {
    assert.ok(t.pl && ['pl', 'own'].includes(t.src), t.id);
    assert.ok(t.methods.every((m) => m.steps.length >= 1), t.id);
  }
  assert.ok(TEMPLATES.filter((t) => t.src === 'pl').length >= 25);
  // Новыя прадукты для польскіх страў пазнаюцца ў чэках і не блытаюцца са свежымі.
  assert.equal(matchReceiptName('Ogórki kiszone 900g').id, 'pickles');
  assert.equal(matchReceiptName('Ogórki grunt. luz').id, 'cucumber');
  assert.equal(matchReceiptName('Kapusta kiszona').id, 'sauerkraut');
  assert.equal(matchReceiptName('Kapusta biała').id, 'cabbage');
  assert.equal(matchReceiptName('Kasza jaglana 400g').id, 'millet');
});
