// Назва стравы павінна адпавядаць таму, што ў ёй рэальна ляжыць, пры любым напаўненні слотаў.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES } from '../js/templates.js';
import { PRODUCTS, BY_ID } from '../js/products.js';
import { FORMS, renderPattern, dishTitle, dishSteps } from '../js/dish-names.js';
import { buildDish, fillVariants } from '../js/engine.js';
import { gramsFor } from '../js/plan.js';

const group = (...gs) => PRODUCTS.filter((p) => gs.includes(p.group)).map((p) => p.id);
const GRAINS = ['buckwheat', 'barley', 'brown_rice', 'millet', 'bulgur', 'rice'];

// Словы ў назвах і што пад імі можна разумець. Больш дакладныя стаяць раней:
// знойдзены кавалак тэксту выразаецца, каб «зялёная цыбуля» не лічылася яшчэ і «цыбуляй».
const L = '(?<![а-яёіўʼ])';
const TERMS = [
  ['рыбныя кансервы', ['sprats', 'tuna', 'herring', 'mackerel']],
  ['вэнджан\\S* ласос', ['smoked_salmon']],
  ['вэнджан\\S* стронг', ['smoked_trout']],
  ['ласос|ласас', ['salmon', 'smoked_salmon']],
  ['скумбр', ['mackerel']],
  ['трэск', ['cod']],
  ['тунц|тунец', ['tuna']],
  ['селядз|селядц', ['herring']],
  ['шпрот', ['sprats']],
  ['стронг', ['smoked_trout']],
  [`${L}рыб`, group('fish')],
  ['птушк', group('poultry')],
  ['курыныя сцёгн|курыных сцёгн|курынымі сцёгн', ['chicken_thigh']],
  ['курыц|курын', ['chicken_breast', 'chicken_thigh', 'chicken_marinated']],
  ['індыч', ['turkey']],
  [`${L}фарш(?!ыр)`, ['minced_meat']],
  [`${L}мяс`, group('poultry', 'meat')],
  ['свін', ['pork']],
  ['ялавіч', ['beef']],
  ['бабов', group('legume')],
  ['фасол', ['beans', 'beans_sauce']],
  [`${L}нут`, ['chickpeas']],
  ['сачавіц', ['lentils']],
  ['гарош', ['peas']],
  ['хумус', ['hummus']],
  [`${L}(яйк|яйц|яеч|амлет|шакшук)`, ['eggs']],
  ['вясков', ['cottage']],
  ['тварожн', ['cream_cheese']],
  ['тварог|тварагом|тварагу', ['quark', 'cottage']],
  [`${L}сырок|${L}сырк`, ['cottage', 'quark', 'cream_cheese']],
  ['казін', ['goat_cheese']],
  ['брынз', ['feta']],
  ['цвёрд\\S* сыр', ['hard_cheese']],
  [`${L}сыр(ам|ам|ом|у|ы)?(?![а-яёіў])`, ['hard_cheese', 'feta', 'goat_cheese']],
  ['ёгурт', ['yogurt', 'skyr']],
  ['кефір', ['kefir']],
  ['скір', ['skyr']],
  ['грэчк|грэчан', ['buckwheat']],
  ['пярлоўк', ['barley']],
  ['пшан|пшон', ['millet']],
  ['булгур', ['bulgur']],
  [`${L}рыс(ам|у|ы)?(?![а-яёіў])`, ['rice', 'brown_rice']],
  ['макарон', ['pasta', 'wholemeal_pasta']],
  ['аўсян', ['oats']],
  [`${L}круп`, GRAINS],
  [`${L}(хлеб|бутэрброд|тост)`, ['wholemeal_bread']],
  ['тартыл', ['tortilla']],
  ['бульб', ['potato']],
  ['бурак|боршч', ['beet']],
  ['цукіні', ['zucchini']],
  [`${L}(перц|перац)`, ['pepper']],
  ['шпінат', ['spinach']],
  ['брокалі', ['broccoli']],
  ['каляров\\S* капуст', ['cauliflower']],
  ['грыб', ['mushrooms']],
  ['гарбуз', ['pumpkin']],
  ['авакада', ['avocado']],
  ['радыск', ['radish']],
  ['зялён\\S* цыбул|зелянін|кроп', ['greens']],
  ['квашан', ['sauerkraut']],
  ['капуснік|бігас', ['sauerkraut']],
  ['капуст|галубц', ['cabbage', 'sauerkraut']],
  ['морк', ['carrot']],
  ['салён\\S* агурк|агурочн', ['pickles', 'cucumber']],
  ['агур', ['cucumber', 'pickles']],
  ['памідор|таматн|томат', ['tomato', 'tomato_passata']],
  ['цыбул', ['onion', 'leek']],
  ['садавін', group('fruit').filter((id) => id !== 'lemon')],
  ['банан', ['banana']],
  ['арэх', ['walnut', 'pistachio', 'peanuts', 'peanut_butter']],
  ['насенн', ['seeds']],
  ['гароднін', [...group('veg', 'starch'), 'peas', 'tomato_passata']],
].map(([re, ids]) => ({ re: new RegExp(re, 'giu'), ids: new Set(ids), src: re }));

// Якія словы-складнікі ёсць у тэксце. «Тварог ці скір» — адно патрабаванне: хоць адно з двух.
function termsIn(text) {
  let rest = text.toLowerCase();
  const hits = [];
  for (const t of TERMS) {
    rest = rest.replace(t.re, (m, ...args) => {
      hits.push({ at: args.at(-2), end: args.at(-2) + m.length, t });
      return '_'.repeat(m.length);
    });
  }
  hits.sort((a, b) => a.at - b.at);
  const found = [];
  for (const h of hits) {
    const prev = found.at(-1);
    if (prev && /^\S*\s+(ці|або)\s+$/.test(text.slice(prev.end, h.at).toLowerCase())) {
      prev.t = { ids: new Set([...prev.t.ids, ...h.t.ids]), src: `${prev.t.src} ці ${h.t.src}` };
      prev.end = h.end;
    } else found.push({ ...h });
  }
  return found.map((h) => h.t);
}

// Ці будзе нешта з ids у страве пры любым напаўненні: ёсць абавязковы слот, усе варыянты якога падыходзяць.
// fixed — слоты з key, у якіх складнік ужо выбраны (назва будуецца з яго).
function guaranteed(template, ids, fixed = {}) {
  return template.slots.some((s) => {
    if (s.key && fixed[s.key]) return ids.has(fixed[s.key]);
    return s.req && s.opts.every((id) => ids.has(id));
  });
}

// Усе спалучэнні складнікаў у слотах з key (для назваў-узораў). Пусты варыянт — калі слот неабавязковы.
function keyedCombos(template) {
  let combos = [{}];
  for (const s of template.slots.filter((x) => x.key)) {
    const vals = [...s.opts, ...(s.req ? [] : [undefined])];
    combos = combos.flatMap((c) => vals.map((v) => ({ ...c, [s.key]: v })));
  }
  return combos;
}

function problems(template) {
  const out = [];
  const check = (text, fixed, where) => {
    for (const t of termsIn(text)) {
      if (!guaranteed(template, t.ids, fixed)) out.push(`${where} «${text}»: «${t.src}» не заўсёды ёсць у страве`);
    }
  };
  check(template.title, {}, 'агульная назва');
  for (const fixed of keyedCombos(template)) {
    if (template.name) check(renderPattern(template.name, fixed), fixed, 'назва');
  }
  return out;
}

test('кожная назва стравы адпавядае складу пры любым напаўненні', () => {
  const all = TEMPLATES.flatMap((t) => problems(t).map((p) => `${t.id}: ${p}`));
  assert.deepEqual(all, []);
});

test('слоты з key: адзін складнік, і ў кожнага ёсць формы для назвы', () => {
  for (const t of TEMPLATES) {
    const keys = t.slots.filter((s) => s.key).map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length, `${t.id}: key паўтараецца`);
    for (const s of t.slots.filter((x) => x.key)) {
      assert.ok(!s.pick || s.pick === 1, `${t.id}/${s.key}: pick павінен быць 1`);
      for (const id of s.opts) assert.ok(FORMS[id], `${t.id}/${s.key}: няма FORMS для ${id}`);
    }
    for (const text of [t.name ?? '', ...t.methods.flatMap((m) => m.steps)]) {
      for (const [, key] of text.matchAll(/\{(\w+)/g)) assert.ok(keys.includes(key), `${t.id}: у тэксце {${key}}, а такога слота няма`);
    }
    if (t.name) {
      const required = t.slots.filter((s) => s.key && s.req).map((s) => s.key);
      const outside = [...t.name.replace(/\[[^\]]*\]/g, '').matchAll(/\{(\w+)/g)].map((m) => m[1]);
      for (const k of outside) assert.ok(required.includes(k), `${t.id}: {${k}} па-за [ ] — слот павінен быць абавязковым`);
    }
  }
});

test('усе id у слотах — існуючыя складнікі, без паўтораў у адным слоце', () => {
  for (const t of TEMPLATES) {
    for (const s of t.slots) {
      for (const id of s.opts) assert.ok(BY_ID[id], `${t.id}: невядомы складнік ${id}`);
      assert.equal(new Set(s.opts).size, s.opts.length, `${t.id}: паўтор у слоце ${s.role}`);
      if (s.gx) for (const id of Object.keys(s.gx)) assert.ok(s.opts.includes(id), `${t.id}: gx для ${id}, якога няма ў слоце`);
    }
  }
});

// Грамы асноўнай часткі стравы (гарнір і бялок) у разумных межах для кожнага магчымага складніка.
// Дабаўкі зверху (extra, texture) і гародніна ў супах могуць быць меншымі.
const LIMITS = {
  starch: [100, 300], grain_whole: [15, 90], grain_refined: [25, 90], fish: [60, 170], poultry: [100, 180], meat: [50, 150],
  legume: [30, 180], eggs: [30, 160],
};
const BREADISH = new Set(['wholemeal_bread', 'tortilla']);
test('грамы ў слотах рэалістычныя для кожнага складніка', () => {
  const bad = [];
  for (const t of TEMPLATES) {
    for (const s of t.slots.filter((x) => x.role === 'base' || x.role === 'protein')) {
      for (const id of s.opts) {
        const g = (s.gx?.[id] ?? s.g) / (s.pick || 1);
        const lim = BREADISH.has(id) ? [40, 100] : LIMITS[BY_ID[id].group];
        if (lim && (g < lim[0] || g > lim[1])) bad.push(`${t.id}: ${id} ${g} г (норма ${lim[0]}–${lim[1]})`);
      }
    }
  }
  assert.deepEqual(bad, []);
});

// Праверка на жывых стравах: усе запасы дома, кожны варыянт напаўнення — назва з таго, што трапіла.
test('назвы і крокі будуюцца для кожнай стравы і кожнага «іншага напаўнення»', () => {
  const have = new Set(PRODUCTS.map((p) => p.id));
  const settings = { equipment: ['stove', 'oven', 'microwave', 'multicooker', 'airfryer', 'blender'], exclude: [] };
  for (const t of TEMPLATES) {
    const first = buildDish(t, have, settings, null);
    for (const d of [first, ...fillVariants(t, have, settings, null, null, new Set(), 4)]) {
      const title = dishTitle(d);
      assert.ok(title && !title.includes('{') && !title.includes('['), `${t.id}: «${title}»`);
      for (const s of dishSteps(d)) assert.ok(!s.includes('{'), `${t.id}: крок «${s}»`);
      const ids = new Set(d.chosen.flatMap((c) => c.ids));
      for (const term of termsIn(title)) {
        assert.ok([...term.ids].some((id) => ids.has(id)), `${t.id}: «${title}», а ў страве ${[...ids].join(', ')}`);
      }
      assert.ok(gramsFor(d, 2).every((g) => g.grams > 0));
    }
  }
});

test('стары план пасля змены слотаў: складнікі раскладваюцца па новых слотах', async () => {
  const { dishFromSlot } = await import('../js/plan.js');
  // Да змены ў «Макароне з рыбай» быў адзін слот гародніны на два складнікі, а сыр — чацвёртым.
  const slot = { tpl: 'l-pasta-fish', state: 'planned', fill: [['pasta'], ['tuna'], ['tomato', 'spinach'], ['hard_cheese']], m: 0 };
  const d = dishFromSlot(slot, { equipment: ['stove'] });
  const byRole = d.chosen.map((c) => c.ids.join('+'));
  assert.deepEqual(byRole, ['pasta', 'tuna', 'tomato', 'spinach', 'hard_cheese']);
  assert.equal(dishTitle(d), 'Макарон з тунцом і памідорамі');
});
