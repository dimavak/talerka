// Інтэрфейс Talerka: шэсць экранаў па першым дызайне, маршрутызацыя праз #.
import { BY_ID, PRODUCTS } from './products.js';
import { BY_TEMPLATE } from './templates.js';
import {
  MEALS, MEAL_NAMES, EQUIPMENT, WEEKDAY_SHORT, WEEK_GOALS,
  suggestNow, planWeek, weekdayOf, addDays, timeLimit, dishLabel,
} from './engine.js';
import {
  CATEGORIES, GOOD, LESS, linesFromCSV, parseReceiptText, parseTypedList,
  latestReceiptIds, basketStats, basketAdvice, lastPrice, receiptCount,
} from './receipt.js';
import { loadState, saveState, defaultState } from './store.js';

let state = loadState();
const ui = { addTab: 'receipt', preview: null, nowMeal: null, lastNow: null, open: new Set(), confirmReset: false };

const main = document.getElementById('main');
const nav = document.getElementById('nav');

// ── Дапаможнікі ──

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const MONTHS = ['студзеня', 'лютага', 'сакавіка', 'красавіка', 'мая', 'чэрвеня', 'ліпеня', 'жніўня', 'верасня', 'кастрычніка', 'лістапада', 'снежня'];
const DAYS_LONG = { mon: 'панядзелак', tue: 'аўторак', wed: 'серада', thu: 'чацвер', fri: 'пятніца', sat: 'субота', sun: 'нядзеля' };
function longDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${DAYS_LONG[weekdayOf(iso)]}, ${d} ${MONTHS[m - 1]}`;
}
const shortDate = (iso) => `${Number(iso.slice(8))}.${iso.slice(5, 7)}`;
const zl = (n) => n.toFixed(2).replace('.', ',') + ' зл';

function save() {
  if (!saveState(state)) toast('Не атрымалася захаваць: браўзер не дае доступу да сховішча.');
}

let toastTimer;
function toast(text) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

const ICON = {
  plus: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  back: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
  today: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>',
  week: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/></svg>',
  basket: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 8h16l-1.5 11h-13z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
  kitchen: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h.01M11 7h.01"/></svg>',
  receipt: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>',
  camera: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/></svg>',
  list: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9"/></svg>',
  cart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16l-1.5 11h-13z"/><path d="M12 11v5M9.5 13.5h5"/></svg>',
};

// ── Агульныя разлікі ──

const TIME_CHOICES = [
  { v: 15, label: '15 хв' },
  { v: 30, label: '30 хв' },
  { v: 60, label: '1 гадз' },
  { v: 'batch', label: 'запас' },
];

function todayMinutes() {
  const t = todayISO();
  if (state.dayMinutes[t] != null) return state.dayMinutes[t];
  return timeLimit(state.settings, weekdayOf(t), 'dinner');
}

// Налады з улікам выбару часу на сёння.
function effectiveSettings() {
  const t = todayISO();
  const m = state.dayMinutes[t];
  if (m == null) return state.settings;
  return { ...state.settings, dayMinutes: { [weekdayOf(t)]: m === 'batch' ? Infinity : m } };
}

function knownProducts() {
  return new Set(state.lines.map((l) => l.productId).filter(Boolean));
}

// Што з'едзена за апошні тыдзень — каб «зараз» ведаў, чаго не хапае.
function weekContext() {
  const from = addDays(todayISO(), -6);
  const ctx = { fish: 0, legume: 0, redMeat: 0, plants: new Set(), uses: {}, known: knownProducts() };
  for (const c of state.cooked.filter((x) => x.date >= from)) {
    if (c.fish) ctx.fish++;
    if (c.legume) ctx.legume++;
    if (c.redMeat) ctx.redMeat++;
    (c.plants || []).forEach((id) => ctx.plants.add(id));
    ctx.uses[c.templateId] = (ctx.uses[c.templateId] ?? 0) + 1;
  }
  return ctx;
}

function currentPlan() {
  return planWeek({ pantry: state.pantry, settings: effectiveSettings(), start: todayISO(), overrides: state.overrides });
}

function plateStyle(d) {
  const a = Math.round(d.plate.plant * 100);
  const b = Math.round((d.plate.plant + d.plate.grain) * 100);
  return `background: conic-gradient(#7BA05B 0 ${a}%, #E9B949 ${a}% ${b}%, #2F6B3A ${b}% 100%)`;
}

const methodLine = (m) => `${m.total} хв${m.equip === 'none' ? '' : ' · ' + EQUIPMENT[m.equip].toLowerCase()}`;

function ingredientsList(d) {
  const have = d.chosen.flatMap((c) => c.ids).map((id) => BY_ID[id].name);
  const need = d.missing.flatMap((c) => c.ids).map((id) => BY_ID[id].name);
  return `<p class="ingredients"><b>Складнікі:</b> ${esc(have.join(', '))}${need.length ? ` · <b>дакупіць:</b> ${esc(need.join(', '))}` : ''}. Плюс алей, соль, спецыі.</p>`;
}

function recipe(d, key) {
  const open = ui.open.has(key) ? ' open' : '';
  const note = d.method.note ? ` (${esc(d.method.note)})` : '';
  return `<details class="recipe" data-key="${esc(key)}"${open}>
    <summary>Як гатаваць${note}</summary>
    ${ingredientsList(d)}
    <ol>${d.method.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  </details>`;
}

function dishTags(d) {
  const tags = [];
  if (d.method.active < d.method.total) tags.push(`<span class="tag">актыўна ${d.method.active} хв</span>`);
  if (d.method.pots > 0) tags.push(`<span class="tag">${d.method.pots} ${d.method.pots === 1 ? 'посуд' : 'посуду'}</span>`);
  tags.push(`<span class="tag ${d.protein >= WEEK_GOALS.proteinPerMeal ? 'good' : 'warn'}">бялок ${d.protein} г${d.protein < WEEK_GOALS.proteinPerMeal ? ': мала' : ''}</span>`);
  tags.push(`<span class="tag">валакно ${d.fiber} г</span>`);
  if (d.fish) tags.push('<span class="tag good">рыба</span>');
  if (d.legume) tags.push('<span class="tag good">бабовыя</span>');
  return `<div class="tags">${tags.join('')}</div>`;
}

// ── Экраны ──

function viewToday() {
  const t = todayISO();
  if (!state.pantry.length) {
    return `
      <div class="top"><div><div class="brand">talerka</div><div class="sub">${longDate(t)}</div></div></div>
      <div class="empty">
        <h1>Пачнём з таго, што ў вас ёсць</h1>
        <p class="muted">Дадайце чэк з крамы або проста напішыце, што ляжыць дома. Talerka падбярэ простыя здаровыя стравы на сняданак, абед і вячэру.</p>
        <a class="btn" href="#/add">Дадаць прадукты</a>
      </div>
      ${kitchenHint()}`;
  }
  const plan = currentPlan();
  const day = plan.days[0];
  const cur = todayMinutes();
  const cards = MEALS.map((meal) => {
    const m = day.meals[meal];
    const key = `${t}:${meal}`;
    if (m.mode === 'skip') {
      return `<div class="card"><div class="row"><div class="eyebrow">${MEAL_NAMES[meal]}</div><span class="sub">прапушчаны</span></div>
        <div class="actions"><button class="btn ghost" data-action="mode" data-key="${key}" data-mode="home">Вярнуць</button></div></div>`;
    }
    if (!m.dish) {
      return `<div class="card"><div class="eyebrow">${MEAL_NAMES[meal]}</div><p class="sub">Не хапае прадуктаў для гэтага прыёму. <a href="#/add">Дадаць</a></p></div>`;
    }
    const d = m.dish;
    const cooked = state.cooked.some((c) => c.date === t && c.meal === meal);
    const chips = [];
    if (m.mode === 'take') chips.push('<span class="tag warn">з сабой</span>');
    if (m.leftover) chips.push('<span class="tag">рэшткі ўчорашняй вячэры</span>');
    if (meal === 'dinner' && d.cookDouble) chips.push('<span class="tag warn">гатуйце ўдвая: заўтра абед з сабой</span>');
    return `<div class="card">
      <div class="meal">
        <div class="plate" style="${plateStyle(d)}" aria-hidden="true"></div>
        <div class="meal-body">
          <div class="eyebrow">${MEAL_NAMES[meal]} · ${m.leftover ? 'гатова' : methodLine(d.method)} ${chips.join('')}</div>
          <div class="title">${esc(d.template.title)}</div>
          <div class="sub">${esc(dishLabel(d))}</div>
        </div>
      </div>
      ${d.missing.length ? `<p class="sub">Дакупіць: <b>${esc(d.missing.map((x) => BY_ID[x.ids[0]].name).join(', '))}</b></p>` : ''}
      ${m.leftover ? '' : recipe(d, key)}
      <div class="actions">
        ${cooked ? '<span class="tag good">гатова</span>' : `<button class="btn" data-action="cooked" data-meal="${meal}">Гатова</button>`}
        <button class="btn ghost" data-action="mode" data-key="${key}" data-mode="skip">Прапусціць</button>
        ${meal !== 'breakfast' && m.mode !== 'take' ? `<button class="btn ghost" data-action="mode" data-key="${key}" data-mode="take">З сабой</button>` : ''}
      </div>
    </div>`;
  }).join('');

  const r = Object.fromEntries(plan.rules.map((x) => [x.id, x]));
  return `
    <div class="top">
      <div><div class="brand">talerka</div><div class="sub">${longDate(t)}</div></div>
      <a class="round fill" href="#/add" aria-label="Дадаць прадукты">${ICON.plus}</a>
    </div>
    <div class="section">
      <h2>Колькі часу сёння</h2>
      <div class="seg" role="group" aria-label="Час на гатаванне">
        ${TIME_CHOICES.map((c) => `<button data-action="minutes" data-v="${c.v}" aria-pressed="${String(cur) === String(c.v) || (cur === Infinity && c.v === 'batch')}">${c.label}</button>`).join('')}
      </div>
    </div>
    <div class="section">${cards}
      <a class="btn dashed" href="#/now">Іншыя стравы з таго, што ёсць</a>
    </div>
    <div class="balance">
      <div class="row"><h2>План на 7 дзён</h2><a class="small" href="#/week">увесь тыдзень</a></div>
      <div class="stats">
        <div class="stat ${r.fish.ok ? '' : 'low'}"><b>${r.fish.value}</b><span>рыба</span></div>
        <div class="stat ${r.legume.ok ? '' : 'low'}"><b>${r.legume.value}</b><span>бабовыя</span></div>
        <div class="stat ${r.plants.ok ? '' : 'low'}"><b>${r.plants.value}</b><span>раслін</span></div>
        <div class="stat ${r.fiber.ok ? '' : 'low'}"><b>${r.fiber.value.replace(' г/дзень', ' г')}</b><span>валакно ў дзень</span></div>
      </div>
    </div>`;
}

function kitchenHint() {
  const eq = state.settings.equipment.map((e) => EQUIPMENT[e].toLowerCase()).join(', ');
  return `<p class="note">Кухня: ${esc(eq)}. <a href="#/kitchen">Змяніць</a></p>`;
}

function viewNow() {
  const hour = new Date().getHours();
  const meal = ui.nowMeal ?? (hour < 11 ? 'breakfast' : hour < 16 ? 'lunch' : 'dinner');
  const limitRaw = todayMinutes();
  const limit = meal === 'breakfast' ? state.settings.breakfastMinutes : limitRaw === 'batch' ? null : limitRaw;
  const ctx = weekContext();
  const { ready, upgrade } = suggestNow({ pantry: state.pantry, settings: state.settings, meal, limit, ctx });
  ui.lastNow = ready;
  const eq = state.settings.equipment.map((e) => EQUIPMENT[e].toLowerCase()).join(', ');

  const cards = ready.length ? ready.map((d, i) => `
    <div class="card ${i === 0 ? 'selected' : ''}">
      <div class="row"><div class="title">${esc(d.template.title)}</div><div class="time">${d.method.total} хв</div></div>
      <div class="sub">${esc(dishLabel(d))}</div>
      ${dishTags(d)}
      ${recipe(d, `now:${d.template.id}`)}
      <div class="actions"><button class="btn" data-action="cook-now" data-tpl="${d.template.id}" data-meal="${meal}">Гатую гэта</button></div>
    </div>`).join('')
    : `<div class="empty"><p>З таго, што ёсць, у межах ${limit ?? 'любога'} хв нічога не складаецца.</p><a class="btn" href="#/add">Дадаць прадукты</a></div>`;

  let up = '';
  if (upgrade) {
    const price = lastPrice(state.lines, upgrade.buy);
    const name = BY_ID[upgrade.buy].name;
    up = `<div class="upgrade">
      <div class="eyebrow">${ICON.cart} Дакупі адно</div>
      <p><b>${esc(name[0].toUpperCase() + name.slice(1))}</b>${price ? `, апошні раз ${zl(price.price)} за ${price.unit} у ${esc(price.store)}` : ''}. Тады атрымаецца «${esc(upgrade.dish.template.title)}»: ${esc(upgrade.reasons.join(', '))}.</p>
      <div class="actions"><button class="btn" data-action="wish" data-id="${upgrade.buy}">У спіс пакупак</button></div>
    </div>`;
  }

  return `
    <div class="back">
      <a class="round" href="#/" aria-label="Назад">${ICON.back}</a>
      <div><h1>Што зрабіць з таго, што ёсць</h1><div class="sub">${limit ? `да ${limit} хв` : 'без абмежавання часу'} · ${esc(eq)}</div></div>
    </div>
    <div class="seg" style="--n:3" role="group" aria-label="Прыём ежы">
      ${MEALS.map((m) => `<button data-action="now-meal" data-meal="${m}" aria-pressed="${m === meal}">${MEAL_NAMES[m]}</button>`).join('')}
    </div>
    ${cards}
    ${up}`;
}

function viewAdd() {
  const tab = ui.addTab;
  let body = '';
  if (tab === 'receipt') {
    body = `
      <p class="note">Загрузіце CSV з гісторыяй пакупак (store, date, item_pl, qty, unit, paid_pln, category) або ўстаўце тэкст чэка радкамі. Фота чэка будзе ў наступнай версіі.</p>
      <label class="btn ghost" for="csv-file" style="cursor:pointer">Выбраць CSV-файл</label>
      <input id="csv-file" type="file" accept=".csv,text/csv" hidden>
      <label for="receipt-text" class="small muted">Або тэкст чэка</label>
      <textarea id="receipt-text" placeholder="MSC Łosoś tusza 0,776 x29,90 23,20C&#10;Hummus 160g 1 x4,19 4,19C"></textarea>
      <button class="btn" data-action="parse-receipt">Распазнаць</button>`;
  } else if (tab === 'list') {
    body = `
      <label for="typed-list" class="small muted">Праз коску ці з новага радка</label>
      <textarea id="typed-list" placeholder="яйкі, грэчка, марожаныя брокалі, кефір"></textarea>
      <button class="btn" data-action="parse-list">Распазнаць</button>`;
  }

  let preview = '';
  const pv = ui.preview;
  if (pv) {
    const rows = pv.ids.map((id) => `<div><span>${esc(pv.source?.[id] ?? '')}${pv.source?.[id] ? ' → ' : ''}${esc(BY_ID[id].name)}</span><span>${state.pantry.includes(id) ? 'ужо ёсць' : 'новае'}</span></div>`).join('');
    const unk = pv.unknown.slice(0, 8).map((u) => `<div class="unknown"><span>${esc(u)}</span><span>не ежа ці не ведаю</span></div>`).join('');
    preview = `<div class="card">
      <div class="row"><div class="title">${esc(pv.heading)}</div>${pv.ids.length ? `<span class="tag good">${pv.ids.length} складн.</span>` : ''}</div>
      ${pv.extra ? `<p class="sub">${esc(pv.extra)}</p>` : ''}
      <div class="receipt">${rows}${unk}${pv.unknown.length > 8 ? `<div class="unknown"><span>+ яшчэ ${pv.unknown.length - 8}</span><span></span></div>` : ''}</div>
      <button class="btn big" data-action="apply-preview" ${pv.ids.length || pv.lines?.length ? '' : 'disabled'}>Дадаць у запасы</button>
    </div>`;
  }

  const pantry = state.pantry.length
    ? `<div class="chips">${state.pantry.map((id) => `<span class="chip">${esc(BY_ID[id]?.name ?? id)}<button data-action="remove" data-id="${id}" aria-label="Прыбраць ${esc(BY_ID[id]?.name ?? id)}">×</button></span>`).join('')}</div>
       <button class="btn ghost" data-action="clear-pantry">Усё з'едзена, ачысціць</button>`
    : '<p class="sub">Пакуль пуста.</p>';

  return `
    <div class="back"><a class="round" href="#/" aria-label="Назад">${ICON.back}</a><h1>Што ў вас ёсць?</h1></div>
    <div class="tabs">
      <button class="tab" data-action="add-tab" data-tab="receipt" aria-pressed="${tab === 'receipt'}">${ICON.receipt}Чэк</button>
      <button class="tab" disabled title="Хутка">${ICON.camera}Фота · хутка</button>
      <button class="tab" data-action="add-tab" data-tab="list" aria-pressed="${tab === 'list'}">${ICON.list}Спіс словамі</button>
    </div>
    ${body}
    ${preview}
    <div class="section"><h2>Запасы дома</h2>${pantry}</div>
    <p class="note">Усё захоўваецца толькі ў гэтым браўзеры на вашай прыладзе.</p>`;
}

function viewWeek() {
  if (!state.pantry.length) return emptyPantry('Тыдзень');
  const plan = currentPlan();
  const t = todayISO();
  const rows = plan.days.map((day) => `
    <div class="week-row">
      <div class="day">${WEEKDAY_SHORT[day.weekday]}<small>${shortDate(day.date)}</small></div>
      ${MEALS.map((meal) => {
        const m = day.meals[meal];
        const key = `${day.date}:${meal}`;
        let text = '—';
        let cls = '';
        if (m.mode === 'skip') { text = 'прапушчаны'; cls = 'skip'; }
        else if (m.leftover) { text = `З сабой: ${m.dish.template.title.toLowerCase()}`; cls = 'take'; }
        else if (m.dish) { text = (m.mode === 'take' ? 'З сабой: ' : '') + m.dish.template.title; cls = m.mode === 'take' ? 'take' : ''; }
        if (day.date === t) cls += ' today';
        return `<button class="cell ${cls}" data-action="cycle" data-key="${key}" data-mode="${m.mode}" aria-label="${MEAL_NAMES[meal]} ${shortDate(day.date)}: ${esc(text)}. Націсніце, каб змяніць.">${esc(text)}</button>`;
      }).join('')}
    </div>`).join('');

  const buy = [...new Set([...plan.buy, ...(state.wish ?? [])])].filter((id) => !state.pantry.includes(id));
  const buyRows = buy.map((id) => {
    const pr = lastPrice(state.lines, id);
    return `<div><span>${esc(BY_ID[id].name)}</span><span>${pr ? `${zl(pr.price)}/${pr.unit} · ${esc(pr.store)}` : ''}</span></div>`;
  }).join('');
  const sum = buy.reduce((s, id) => s + (lastPrice(state.lines, id)?.price ?? 0), 0);

  return `
    <div class="row"><h1>Тыдзень</h1><span class="sub">${shortDate(plan.days[0].date)} – ${shortDate(plan.days[6].date)}</span></div>
    <div class="tags">${plan.rules.map((r) => `<span class="tag ${r.ok ? 'good' : 'warn'}">${esc(r.label)}: ${esc(r.value)}</span>`).join('')}</div>
    <div class="week">
      <div class="week-row head"><div></div><div>Снядан.</div><div>Абед</div><div>Вячэра</div></div>
      ${rows}
    </div>
    <p class="note">Націсніце на прыём ежы, каб змяніць: дома → з сабой → прапусціць.</p>
    <div class="balance">
      <h2>Дакупіць на тыдзень</h2>
      ${buy.length ? `<div class="receipt">${buyRows}</div>${sum ? `<p class="small">Па цэнах з вашых чэкаў: каля ${zl(sum)}, астатняе ў вас ёсць.</p>` : ''}` : '<p class="small">Нічога: на тыдзень хапае таго, што ёсць.</p>'}
      ${state.wish?.length ? '<button class="btn ghost" data-action="clear-wish">Ачысціць свой спіс</button>' : ''}
    </div>`;
}

function emptyPantry(title) {
  return `<h1>${title}</h1><div class="empty"><p class="muted">Каб скласці план, дадайце, што ёсць дома.</p><a class="btn" href="#/add">Дадаць прадукты</a></div>`;
}

function viewBasket() {
  if (!state.lines.length) {
    return `<h1>Ваш кошык</h1>
      <div class="empty"><p class="muted">Загрузіце гісторыю пакупак у CSV, і тут з'явіцца, на што ідуць грошы, і тры змены з найбольшым эфектам.</p><a class="btn" href="#/add">Загрузіць чэкі</a></div>`;
  }
  const st = basketStats(state.lines);
  const top = st.shares.slice(0, 11);
  const max = Math.max(...top.map((x) => x.share), 0.01);
  const bars = top.map((x) => {
    const cls = GOOD.has(x.category) ? 'good' : LESS.has(x.category) ? 'less' : '';
    return `<div class="bar"><div>${esc(CATEGORIES[x.category] ?? x.category)}</div><div class="track"><div class="fill ${cls}" style="width:${Math.round((x.share / max) * 100)}%"></div></div><div class="pct">${Math.round(x.share * 100)}%</div></div>`;
  }).join('');
  const advice = basketAdvice(state.lines).slice(0, 3);
  const stores = [...new Set(state.lines.map((l) => l.store.split(' ')[0]))].join(', ');

  return `
    <div><h1>Ваш кошык</h1><div class="sub">${st.receipts} чэкаў ${esc(stores)} · ${shortDate(st.from)}.${st.from.slice(0, 4)} – ${shortDate(st.to)}.${st.to.slice(0, 4)} · ${zl(st.total)}</div></div>
    <div class="card"><h2>Доля выдаткаў на ежу і пітво</h2><div class="bars">${bars}</div>
      <div class="legend"><span><i style="background:var(--accent)"></i>варта больш</span><span><i style="background:var(--less)"></i>варта менш</span></div>
    </div>
    <div class="section"><h2>Змены з найбольшым эфектам</h2>
      ${advice.map((a) => `<div class="card"><div class="title">${esc(a.title)}</div><div class="sub">${esc(a.why)}</div>
        <div class="actions"><button class="btn ghost" data-action="wish-many" data-ids="${a.add.join(',')}">У спіс пакупак</button></div></div>`).join('') || '<p class="sub">Кошык выглядае збалансаваным.</p>'}
    </div>
    <div class="card" style="border:1px dashed var(--mid);background:transparent"><div class="row"><span class="small">Скідкі тыдня ў Lidl, Бядронцы і Карфуры пад вашы замены</span><span class="small muted">хутка</span></div></div>`;
}

function viewKitchen() {
  const s = state.settings;
  const wds = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  const grid = MEALS.map((meal) => `
    <div>${MEAL_NAMES[meal]}</div>
    ${wds.map((wd) => {
      const mode = s.schedule[wd]?.[meal] ?? 'home';
      const label = { home: 'дома', take: 'з сабой', skip: 'не плануем' }[mode];
      return `<button class="slot ${mode}" data-action="sched" data-wd="${wd}" data-meal="${meal}" aria-label="${WEEKDAY_SHORT[wd]}, ${MEAL_NAMES[meal].toLowerCase()}: ${label}"></button>`;
    }).join('')}`).join('');
  const excluded = s.exclude.map((id) => BY_ID[id]?.name).filter(Boolean).join(', ');

  return `
    <h1>Кухня і графік</h1>
    <div class="section"><h2>Што ёсць дома</h2>
      <div class="pills">${Object.entries(EQUIPMENT).map(([id, name]) => `<button class="pill" data-action="equip" data-id="${id}" aria-pressed="${s.equipment.includes(id)}">${name}</button>`).join('')}</div>
    </div>
    <div class="section"><h2>Звычайны тыдзень</h2>
      <div class="grid-sched"><div></div>${wds.map((wd) => `<div class="h">${WEEKDAY_SHORT[wd]}</div>`).join('')}${grid}</div>
      <div class="legend"><span><i style="background:var(--accent)"></i>дома</span><span><i style="background:var(--take)"></i>з сабой</span><span><i style="border:1px dashed var(--mid)"></i>не плануем</span></div>
    </div>
    <div class="two">
      <div class="field"><label for="k-people">Колькі чалавек</label><input id="k-people" type="number" min="1" max="12" value="${s.people}" data-setting="people"></div>
      <div class="field"><label for="k-evening">Будні вечар, хв</label><input id="k-evening" type="number" min="5" max="180" step="5" value="${s.eveningMinutes}" data-setting="eveningMinutes"></div>
      <div class="field"><label for="k-weekend">Выхадныя, хв</label><input id="k-weekend" type="number" min="5" max="240" step="5" value="${s.weekendMinutes}" data-setting="weekendMinutes"></div>
      <div class="field"><label for="k-breakfast">Сняданак, хв</label><input id="k-breakfast" type="number" min="3" max="60" step="1" value="${s.breakfastMinutes}" data-setting="breakfastMinutes"></div>
    </div>
    <div class="section">
      <label for="k-exclude"><h2>Чаго не ямо</h2></label>
      <input id="k-exclude" class="input" placeholder="напрыклад: грыбы, печань" value="${esc(excluded)}">
      <button class="btn ghost" data-action="save-exclude">Захаваць</button>
    </div>
    <div class="section">
      <h2>Дадзеныя</h2>
      <p class="note">${receiptCount(state.lines)} чэкаў, ${state.pantry.length} складнікаў у запасах, ${state.cooked.length} прыгатаваных страў. Усё ляжыць толькі ў гэтым браўзеры.</p>
      <button class="btn ghost" data-action="reset">${ui.confirmReset ? 'Націсніце яшчэ раз, каб выдаліць усё' : 'Выдаліць усе дадзеныя'}</button>
    </div>`;
}

// ── Маршрутызацыя і падзеі ──

const ROUTES = { '': viewToday, now: viewNow, add: viewAdd, week: viewWeek, basket: viewBasket, kitchen: viewKitchen };
const NAV = [
  { r: '', label: 'Сёння', icon: ICON.today },
  { r: 'week', label: 'Тыдзень', icon: ICON.week },
  { r: 'basket', label: 'Кошык', icon: ICON.basket },
  { r: 'kitchen', label: 'Кухня', icon: ICON.kitchen },
];

function route() {
  return (location.hash.replace(/^#\/?/, '').split('?')[0] || '');
}

function render() {
  const r = route();
  const view = ROUTES[r] ?? viewToday;
  main.innerHTML = view();
  nav.innerHTML = NAV.map((n) => `<a href="#/${n.r}" ${n.r === r || (r === 'now' && n.r === '') || (r === 'add' && n.r === '') ? 'aria-current="page"' : ''}>${n.icon}${n.label}</a>`).join('');
  document.title = { '': 'Talerka', now: 'Talerka · Зараз', add: 'Talerka · Дадаць', week: 'Talerka · Тыдзень', basket: 'Talerka · Кошык', kitchen: 'Talerka · Кухня' }[r] ?? 'Talerka';
}

function addToPantry(ids) {
  const set = new Set(state.pantry);
  ids.forEach((id) => set.add(id));
  state.pantry = [...set];
}

function cycleMode(mode) {
  return { home: 'take', take: 'skip', skip: 'home' }[mode] ?? 'home';
}

const actions = {
  minutes(el) {
    const v = el.dataset.v === 'batch' ? 'batch' : Number(el.dataset.v);
    state.dayMinutes = { [todayISO()]: v };
    save();
  },
  mode(el) {
    state.overrides[el.dataset.key] = el.dataset.mode;
    save();
  },
  cycle(el) {
    state.overrides[el.dataset.key] = cycleMode(el.dataset.mode);
    save();
  },
  cooked(el) {
    const meal = el.dataset.meal;
    const d = currentPlan().days[0].meals[meal]?.dish;
    if (d) recordCooked(d, meal);
  },
  'cook-now'(el) {
    const meal = el.dataset.meal;
    const d = (ui.lastNow ?? []).find((x) => x.template.id === el.dataset.tpl) ?? null;
    if (d) {
      recordCooked(d, meal);
      location.hash = '#/';
    }
  },
  'now-meal'(el) { ui.nowMeal = el.dataset.meal; },
  'add-tab'(el) { ui.addTab = el.dataset.tab; ui.preview = null; },
  'parse-list'() {
    const text = document.getElementById('typed-list').value;
    const r = parseTypedList(text);
    ui.preview = { heading: 'Спіс', ids: r.ids, unknown: r.unknown };
  },
  'parse-receipt'() {
    const text = document.getElementById('receipt-text').value;
    const r = parseReceiptText(text);
    ui.preview = { heading: 'Чэк', ids: r.ids, unknown: r.unknown, source: Object.fromEntries(r.matched.map((m) => [m.id, m.line])) };
  },
  'apply-preview'() {
    const pv = ui.preview;
    if (!pv) return;
    addToPantry(pv.ids);
    if (pv.lines) {
      const seen = new Set(state.lines.map((l) => `${l.date}|${l.store}|${l.item}|${l.paid}`));
      state.lines = [...state.lines, ...pv.lines.filter((l) => !seen.has(`${l.date}|${l.store}|${l.item}|${l.paid}`))];
    }
    ui.preview = null;
    save();
    toast(`Дададзена: ${pv.ids.length} складнікаў${pv.lines ? `, ${receiptCount(pv.lines)} чэкаў у гісторыю` : ''}`);
  },
  remove(el) {
    state.pantry = state.pantry.filter((id) => id !== el.dataset.id);
    save();
  },
  'clear-pantry'() {
    state.pantry = [];
    save();
  },
  wish(el) {
    state.wish = [...new Set([...(state.wish ?? []), el.dataset.id])];
    save();
    toast('Дададзена ў спіс пакупак на тыдзень');
  },
  'wish-many'(el) {
    state.wish = [...new Set([...(state.wish ?? []), ...el.dataset.ids.split(',')])];
    save();
    toast('Дададзена ў спіс пакупак на тыдзень');
  },
  'clear-wish'() { state.wish = []; save(); },
  equip(el) {
    const id = el.dataset.id;
    const eq = new Set(state.settings.equipment);
    eq.has(id) ? eq.delete(id) : eq.add(id);
    state.settings.equipment = [...eq];
    save();
  },
  sched(el) {
    const { wd, meal } = el.dataset;
    const day = { ...(state.settings.schedule[wd] ?? {}) };
    day[meal] = cycleMode(day[meal] ?? 'home');
    state.settings.schedule = { ...state.settings.schedule, [wd]: day };
    save();
  },
  'save-exclude'() {
    const { ids, unknown } = parseTypedList(document.getElementById('k-exclude').value);
    state.settings.exclude = ids;
    save();
    toast(unknown.length ? `Не пазнаў: ${unknown.join(', ')}` : 'Захавана');
  },
  reset() {
    if (!ui.confirmReset) { ui.confirmReset = true; return; }
    state = defaultState();
    ui.confirmReset = false;
    save();
    toast('Усе дадзеныя выдалены');
  },
};

function recordCooked(d, meal) {
  state.cooked.push({
    date: todayISO(), meal, templateId: d.template.id,
    fish: d.fish, legume: d.legume, redMeat: d.redMeat, plants: [...d.plants],
  });
  state.cooked = state.cooked.slice(-200);
  save();
  toast(`Смачна! «${d.template.title}» запісана`);
}

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  e.preventDefault();
  if (el.dataset.action !== 'reset') ui.confirmReset = false;
  actions[el.dataset.action](el);
  render();
});

// Адкрытыя рэцэпты застаюцца адкрытымі пасля перамалёўкі.
document.addEventListener('toggle', (e) => {
  const el = e.target;
  if (el.matches?.('details.recipe')) el.open ? ui.open.add(el.dataset.key) : ui.open.delete(el.dataset.key);
}, true);

document.addEventListener('change', async (e) => {
  const el = e.target;
  if (el.id === 'csv-file' && el.files?.[0]) {
    const text = await el.files[0].text();
    const lines = linesFromCSV(text);
    if (!lines.length) {
      toast('У файле не знайшоў радкоў чэка. Патрэбныя слупкі store, date, item_pl, qty, unit, paid_pln.');
      return;
    }
    const ids = latestReceiptIds(lines);
    const last = lines.reduce((m, l) => (l.date > m ? l.date : m), '');
    const unknown = [...new Set(lines.filter((l) => l.date === last && !l.productId && l.category !== 'non_food').map((l) => l.item))];
    ui.preview = {
      heading: `${receiptCount(lines)} чэкаў · апошні ${shortDate(last)}`,
      extra: 'У запасы ідзе толькі апошні чэк, бо старэйшае ўжо, хутчэй за ўсё, з’едзена. Уся гісторыя пойдзе ў аналіз кошыка.',
      ids, unknown, lines,
      source: Object.fromEntries(lines.filter((l) => l.date === last && l.productId).map((l) => [l.productId, l.item])),
    };
    render();
  }
  if (el.dataset.setting) {
    const v = Number(el.value);
    if (Number.isFinite(v) && v > 0) {
      state.settings[el.dataset.setting] = v;
      save();
    }
  }
});

window.addEventListener('hashchange', () => { ui.preview = null; render(); window.scrollTo(0, 0); });
render();

// Дапаможная інфармацыя для распрацоўкі ў кансолі.
window.talerka = { get state() { return state; }, PRODUCTS, BY_TEMPLATE };
