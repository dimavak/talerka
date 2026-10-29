import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultState, migrate, VERSION } from '../js/store.js';
import { ensurePlan } from '../js/plan.js';
import { demoLines } from '../js/demo.js';
import { monthlyStats, compareMonths, monthSummary, monthLabel, verdict, isPartial } from '../js/trends.js';
import { makeBackup, readBackup, needsBackup, BackupError, backupName } from '../js/backup.js';

const TODAY = '2026-10-29';

function line(date, category, paid, store = 'Lidl') {
  return { store, date, item: category, qty: 1, unit: 'szt', paid, category, productId: null };
}

test('месяцы ідуць па парадку, долі лічацца ўнутры месяца, не-ежа не ўлічваецца', () => {
  const lines = [
    line('2026-10-02', 'fish', 30), line('2026-10-02', 'sweets', 10), line('2026-10-02', 'non_food', 50),
    line('2026-09-10', 'fish', 10), line('2026-09-10', 'sweets', 30),
    line('2026-09-20', 'vegetables', 40, 'Biedronka'),
  ];
  const ms = monthlyStats(lines);
  assert.deepEqual(ms.map((m) => m.month), ['2026-09', '2026-10']);
  const [sep, oct] = ms;
  assert.equal(sep.receipts, 2);
  assert.equal(sep.foodTotal, 80);
  assert.equal(oct.total, 90);
  assert.equal(oct.share('fish'), 0.75);
  assert.equal(oct.share('non_food'), 0);
  assert.equal(sep.good, 0.625);
  assert.equal(oct.less, 0.25);
});

test('змена супраць мінулага месяца: больш карыснага — лепш, больш салодкага — горш, дробязі не паказваюцца', () => {
  const ms = monthlyStats([
    line('2026-09-10', 'fish', 10), line('2026-09-10', 'sweets', 40), line('2026-09-10', 'dairy', 50),
    line('2026-10-10', 'fish', 35), line('2026-10-10', 'sweets', 20), line('2026-10-10', 'dairy', 44), line('2026-10-10', 'eggs', 1),
  ]);
  const ch = compareMonths(ms[1], ms[0]);
  const by = Object.fromEntries(ch.map((c) => [c.category, c]));
  assert.equal(by.fish.verdict, 'better');
  assert.equal(by.sweets.verdict, 'better');
  assert.ok(Math.abs(by.sweets.delta + 0.2) < 1e-9);
  assert.equal(by.eggs, undefined, 'змена ў 1 п.п. — шум');
  assert.equal(by.dairy.verdict, 'neutral', 'малочка ні добрая, ні дрэнная — змена паказваецца без ацэнкі');
  assert.deepEqual(ch.map((c) => c.category), ['fish', 'sweets', 'dairy']);
  assert.equal(verdict('processed_meat', 0.05), 'worse');
  assert.equal(verdict('dairy', 0.05), 'neutral');
  const sum = monthSummary(ms[1], ms[0]);
  assert.ok(sum.better && !sum.worse);
  assert.deepEqual(compareMonths(ms[0], undefined), []);
});

test('назвы месяцаў і незакончаны месяц', () => {
  assert.equal(monthLabel('2026-10'), 'кастрычнік 2026');
  assert.equal(monthLabel('2026-01', { short: true }), 'студз 26');
  assert.ok(isPartial('2026-10', TODAY));
  assert.ok(!isPartial('2026-09', TODAY));
});

test('дэма: тры месяцы, і апошні карысней за першы', () => {
  const ms = monthlyStats(demoLines(TODAY));
  assert.ok(ms.length >= 3, `месяцаў: ${ms.length}`);
  assert.ok(ms[ms.length - 1].good > ms[0].good);
  assert.ok(ms[ms.length - 1].less < ms[0].less);
});

test('копія: захаваць і аднавіць дае той жа стан', () => {
  const s = defaultState();
  s.lines = demoLines(TODAY);
  s.settings.eveningMinutes = 45;
  s.tastes = { omelette: { love: true } };
  s.shopping.manual = [{ key: 'm:1', text: 'хлеб', bought: false }];
  ensurePlan(s, TODAY);
  const text = makeBackup(s, '2026-10-29T20:00:00.000Z');
  const r = readBackup(text, '2026-11-02');
  assert.equal(r.savedAt, '2026-10-29');
  assert.equal(r.state.backupAt, '2026-10-29');
  assert.deepEqual(r.state.lines, s.lines);
  assert.deepEqual(r.state.plan, s.plan);
  assert.deepEqual(r.state.tastes, s.tastes);
  assert.equal(r.state.settings.eveningMinutes, 45);
  assert.equal(r.state.version, VERSION);
  assert.equal(r.summary.receipts, 14);
  assert.equal(r.summary.planDays, 7);
  assert.equal(backupName(TODAY), 'talerka-2026-10-29.json');
});

test('копія: чужы файл, пашкоджаны файл і копія з будучай версіі не прымаюцца', () => {
  assert.throws(() => readBackup('не json', TODAY), BackupError);
  assert.throws(() => readBackup('{"a":1}', TODAY), BackupError);
  assert.throws(() => readBackup('[1,2]', TODAY), BackupError);
  const future = JSON.stringify({ kind: 'talerka-backup', version: VERSION + 1, state: { ...defaultState(), version: VERSION + 1 } });
  assert.throws(() => readBackup(future, TODAY), /навейшай/);
});

test('копія: голы стан і стары v1 таксама чытаюцца', () => {
  const bare = readBackup(JSON.stringify({ ...defaultState(), lines: [line('2026-10-01', 'fish', 5)] }), TODAY);
  assert.equal(bare.summary.receipts, 1);
  assert.equal(bare.savedAt, null);
  const v1 = readBackup(JSON.stringify({ lines: [], pantry: ['eggs'], settings: { people: 3 } }), TODAY);
  assert.equal(v1.state.version, VERSION);
  assert.equal(v1.state.settings.members.length, 3);
  assert.equal(migrate(v1.state, TODAY).extra[0].id, 'eggs');
});

test('нагадаць пра копію: ёсць чэкі і копіі не было або яна старэйшая за 30 дзён', () => {
  const s = defaultState();
  assert.ok(!needsBackup(s, TODAY), 'пусты стан губляць няма чаго');
  s.lines = [line('2026-10-01', 'fish', 5)];
  assert.ok(needsBackup(s, TODAY));
  s.backupAt = '2026-10-20';
  assert.ok(!needsBackup(s, TODAY));
  s.backupAt = '2026-09-20';
  assert.ok(needsBackup(s, TODAY));
});
