// Інтэрфейс Talerka: экраны па першым дызайне, маршрутызацыя праз #.
import { BY_ID, PRODUCTS, GROUPS } from './products.js';
import { BY_TEMPLATE } from './templates.js';
import {
  MEALS, MEAL_NAMES, EQUIPMENT, WEEKDAY_SHORT, WEEK_GOALS,
  suggestNow, weekdayOf, addDays, dishLabel,
} from './engine.js';
import {
  CATEGORIES, GOOD, LESS, parseTypedList, basketStats, basketAdvice, lastPrice, receiptCount,
} from './receipt.js';
import { loadState, saveState, defaultState } from './store.js';
import { DEMO_STORE, demoLines } from './demo.js';
import { stockOn, availability, levelOf, reminders, addPurchase, markNotHome } from './stock.js';
import {
  REPLACED, keyOf, parseKey, getSlot, dishAt, ensurePlan, hasStock, rebuildFrom, refill,
  markEaten, markSkipped, markReplaced, unmark, swapMeals, reroll, setDish,
  REASONS, alternatives, chooseAlternative, toggleLove, forgetTaste, tasteCtx, HIDE_AFTER,
  portionsFor, gramsFor, planRules, moveTargets, members, people,
} from './plan.js';
import { buildList, toggleBought, addManual, removeManual, clearBought, snooze, shareText } from './shopping.js';
import { parseReceiptOCR, mergeFrames, sumCheck, draftToLines, aliasKey } from './receipt-ocr.js';

function todayISO() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let state = loadState(todayISO());
const ui = { alt: null, altReason: 'today', altList: [], addTab: 'photo', receipt: null, preview: null, nowMeal: null, lastNow: null, open: new Set(), more: null, confirmReset: false, listText: '', swap: false, swapFrom: null, undo: null, said: null };
// Запасы на сёння лічацца адзін раз на перамалёўку.
let stock = {};

const main = document.getElementById('main');
const nav = document.getElementById('nav');

// ── Дапаможнікі ──

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const MONTHS = ['студзеня', 'лютага', 'сакавіка', 'красавіка', 'мая', 'чэрвеня', 'ліпеня', 'жніўня', 'верасня', 'кастрычніка', 'лістапада', 'снежня'];
const DAYS_LONG = { mon: 'панядзелак', tue: 'аўторак', wed: 'серада', thu: 'чацвер', fri: 'пятніца', sat: 'субота', sun: 'нядзеля' };
function longDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${DAYS_LONG[weekdayOf(iso)]}, ${d} ${MONTHS[m - 1]}`;
}
const shortDate = (iso) => `${Number(iso.slice(8))}.${iso.slice(5, 7)}`;
const dayName = (iso) => (iso === todayISO() ? 'сёння' : iso === addDays(todayISO(), 1) ? 'заўтра' : `${WEEKDAY_SHORT[weekdayOf(iso)]} ${shortDate(iso)}`);
const slotName = (key) => { const { date, meal } = parseKey(key); return `${dayName(date)}, ${MEAL_NAMES[meal].toLowerCase()}`; };
const zl = (n) => n.toFixed(2).replace('.', ',') + ' зл';
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const name = (id) => BY_ID[id]?.name ?? id;

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}
const portionsWord = (n) => `${n} ${plural(n, 'порцыя', 'порцыі', 'порцый')}`;
const daysWord = (n) => `${n} ${plural(n, 'дзень', 'дні', 'дзён')}`;

function save() {
  if (!saveState(state)) toast('Не атрымалася захаваць: браўзер не дае доступу да сховішча.');
}

let toastTimer;
function toast(text, { undo = false } = {}) {
  ui.said = text;
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = text;
  if (undo) {
    const b = document.createElement('button');
    b.dataset.action = 'undo';
    b.textContent = 'Адмяніць';
    el.append(b);
  }
  document.body.append(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), undo ? 7000 : 2600);
}

const svg = (w, body, sw = 2) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
const ICON = {
  plus: svg(22, '<path d="M12 5v14M5 12h14"/>'),
  back: svg(20, '<path d="M15 5l-7 7 7 7"/>'),
  today: svg(22, '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>'),
  week: svg(22, '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>'),
  list: svg(22, '<path d="M9 7h11M9 12h11M9 17h11"/><path d="M4 7l1 1 2-2M4 12l1 1 2-2M4 17l1 1 2-2"/>'),
  basket: svg(22, '<path d="M4 8h16l-1.5 11h-13z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  kitchen: svg(22, '<rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7h.01M11 7h.01"/>'),
  camera: svg(26, '<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M9 6l1.5-2h3L15 6"/>', 1.8),
  words: svg(26, '<path d="M5 7h14M5 12h14M5 17h9"/>', 1.8),
  cart: svg(20, '<path d="M4 8h16l-1.5 11h-13z"/><path d="M12 11v5M9.5 13.5h5"/>'),
  share: svg(20, '<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7"/>'),
  check: svg(16, '<path d="M5 12l5 5 9-10"/>', 2.5),
  heart: svg(20, '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),
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
  const m = state.dayMinutes[t];
  if (m != null) return m;
  const wd = weekdayOf(t);
  return wd === 'sat' || wd === 'sun' ? state.settings.weekendMinutes : state.settings.eveningMinutes;
}

function knownProducts() {
  return new Set(state.lines.map((l) => l.productId).filter(Boolean));
}

// Што з'едзена за апошні тыдзень — каб «зараз» ведаў, чаго не хапае.
function weekContext() {
  const from = addDays(todayISO(), -6);
  const ctx = { fish: 0, legume: 0, redMeat: 0, plants: new Set(), uses: {}, known: knownProducts(), ...tasteCtx(state) };
  for (const c of state.cooked.filter((x) => x.date >= from)) {
    if (c.fish) ctx.fish++;
    if (c.legume) ctx.legume++;
    if (c.redMeat) ctx.redMeat++;
    (c.plants || []).forEach((id) => ctx.plants.add(id));
    ctx.uses[c.templateId] = (ctx.uses[c.templateId] ?? 0) + 1;
  }
  return ctx;
}

function plateStyle(d) {
  const a = Math.round(d.plate.plant * 100);
  const b = Math.round((d.plate.plant + d.plate.grain) * 100);
  return `background: conic-gradient(#7BA05B 0 ${a}%, #E9B949 ${a}% ${b}%, #2F6B3A ${b}% 100%)`;
}

const methodLine = (m) => `${m.total} хв${m.equip === 'none' ? '' : ' · ' + EQUIPMENT[m.equip].toLowerCase()}`;

// Падрабязны рэцэпт схаваны: грамы на ўсю сям'ю і крокі.
function recipe(d, key, portions, forceOpen = false) {
  const total = portions.eat + portions.take;
  const open = forceOpen || ui.open.has(key) ? ' open' : '';
  const note = d.method.note ? ` (${esc(d.method.note)})` : '';
  const rows = gramsFor(d, total).map((g) => `<li><span>${esc(cap(g.name))}</span><span>${g.pieces ? `${g.pieces} шт · ` : ''}${g.grams} г</span></li>`).join('');
  const who = portions.take ? `${portionsWord(total)}: ${portions.eat} зараз і ${portions.take} з сабой на заўтра` : portionsWord(total);
  return `<details class="recipe" data-key="${esc(key)}"${open}>
    <summary>Падрабязна: грамы і крокі${note}</summary>
    <p class="small muted">На ${esc(who)}</p>
    <ul class="grams">${rows}</ul>
    <p class="small muted">Плюс алей, соль, спецыі.</p>
    <ol>${d.method.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${recipeLinks(d.template)}
  </details>`;
}

// Адкуль ідэя і дзе пачытаць падрабязней. Чужыя рэцэпты не капіруюцца: толькі спасылкі на пошук па сайце.
const SRC = { pl: 'польская хатняя кухня, лёгкі варыянт', own: 'страва Talerka' };
const siteSearch = (site, q) => `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${q}`)}`;
function recipeLinks(t) {
  const q = t.pl ?? t.title;
  return `<p class="small muted links">Ідэя: ${esc(SRC[t.src] ?? SRC.own)}.
    Падобны рэцэпт: <a href="${siteSearch('ncez.pzh.gov.pl', q)}" target="_blank" rel="noopener">NCEZ</a> ·
    <a href="${siteSearch('diety.nfz.gov.pl', q)}" target="_blank" rel="noopener">Diety NFZ</a>.
    Чаму так: <a href="https://nutritionsource.hsph.harvard.edu/healthy-eating-plate/" target="_blank" rel="noopener">Harvard Healthy Eating Plate</a>,
    <a href="${siteSearch('ncez.pzh.gov.pl', 'talerz zdrowego żywienia')}" target="_blank" rel="noopener">Talerz Zdrowego Żywienia</a>.</p>`;
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

// Што для стравы, хутчэй за ўсё, трэба купіць і што варта праверыць дома.
function availabilityLine(d) {
  const ids = [...new Set(d.chosen.flatMap((c) => c.ids))];
  const buy = ids.filter((id) => levelOf(stock, id) === 'gone');
  const check = ids.filter((id) => levelOf(stock, id) === 'maybe');
  const out = [];
  if (buy.length) out.push(`<p class="sub">Дакупіць: <b>${esc(buy.map(name).join(', '))}</b> · <a href="#/list">спіс</a></p>`);
  if (check.length) {
    out.push(`<div class="checkline"><span class="sub">Правер, ці ёсць:</span>${check.map((id) => `<span class="chip">${esc(name(id))}<button data-action="not-home" data-id="${id}" aria-label="${esc(name(id))}: няма дома">няма</button></span>`).join('')}</div>`);
  }
  return out.join('');
}

// Картка аднаго прыёму ежы з адзнакамі: з'еў, прапусціў, замяніў іншым, перанёс.
function slotCard(key, { forceMore = false } = {}) {
  const { date, meal } = parseKey(key);
  const slot = getSlot(state, key);
  const where = date === todayISO() ? '' : ` · ${dayName(date)}`;
  const head = (extra = '') => `<div class="eyebrow">${MEAL_NAMES[meal]}${where}${extra}</div>`;
  const simple = (text, buttons) => `<div class="card quiet">${head()}<p class="sub">${text}</p><div class="actions">${buttons}</div></div>`;
  if (!slot) return simple('Пакуль не спланавана.', '<a class="btn ghost" href="#/add">Дадаць прадукты</a>');
  if (slot.state === 'off') return simple('Па графіку не плануем.', `<button class="btn ghost" data-action="reroll" data-key="${key}">Усё ж спланаваць</button>`);
  if (slot.state === 'empty') return simple('Не хапае прадуктаў, каб нешта прапанаваць.', `<button class="btn ghost" data-action="reroll" data-key="${key}">Падабраць яшчэ раз</button><a class="btn ghost" href="#/add">Дадаць прадукты</a>`);
  if (slot.state === 'skipped') return simple('Прапушчаны.', `<button class="btn ghost" data-action="unmark" data-key="${key}">Вярнуць</button>`);
  if (slot.state === 'replaced') return simple(`Замест плана: ${esc(REPLACED[slot.replacedBy] ?? 'іншае')}. На баланс тыдня не ўплывае.`, `<button class="btn ghost" data-action="unmark" data-key="${key}">Вярнуць</button>`);
  if (slot.state === 'moved') return simple(`Страва перанесена: ${esc(slotName(slot.movedTo))}.`, `<button class="btn ghost" data-action="reroll" data-key="${key}">Падабраць іншую страву</button>`);

  const d = dishAt(state, key);
  if (!d) return simple('Страва з гэтага прыёму больш недаступная.', `<button class="btn ghost" data-action="reroll" data-key="${key}">Падабраць</button>`);
  const portions = portionsFor(state, key);
  const chips = [];
  if (slot.mode === 'take') chips.push('<span class="tag warn">з сабой</span>');
  if (slot.leftoverOf) chips.push('<span class="tag">з учорашняй вячэры</span>');
  if (portions.take) chips.push(`<span class="tag warn">гатуйце на ${portions.eat + portions.take}: заўтра з сабой</span>`);
  if (slot.movedFrom) chips.push('<span class="tag">перанесена</span>');

  if (slot.state === 'eaten') {
    return `<div class="card quiet">
      ${head(` <span class="tag good">${ICON.check} з'едзена</span>`)}
      <div class="title">${esc(d.template.title)}</div>
      <div class="actions"><button class="btn ghost" data-action="unmark" data-key="${key}">Адмяніць</button></div>
    </div>`;
  }

  const more = forceMore || ui.more === key;
  const targets = more ? moveTargets(state, key, todayISO()) : [];
  const panel = more ? `<div class="more">
      <div class="small muted">Замяніў іншым</div>
      <div class="pills">${Object.entries(REPLACED).map(([k, label]) => `<button class="pill" data-action="replace" data-key="${key}" data-by="${k}">${esc(label)}</button>`).join('')}</div>
      <label class="small muted" for="move-${esc(key)}">Памяняць месцамі з іншым прыёмам або перанесці на вольны</label>
      <div class="inline">
        <select id="move-${esc(key)}" class="input">${targets.map((t) => `<option value="${t.key}">${esc(cap(slotName(t.key)))}: ${t.current ? esc(t.current.toLowerCase()) : 'вольна'}</option>`).join('')}</select>
        <button class="btn ghost" data-action="move" data-key="${key}">Памяняць</button>
      </div>
      <div class="actions"><button class="btn ghost" data-action="alt-open" data-key="${key}" aria-expanded="${ui.alt === key}">Іншы варыянт</button></div>
      ${ui.alt === key ? altPanel(key, d) : ''}
    </div>` : '';

  return `<div class="card">
    <div class="meal">
      <div class="plate" style="${plateStyle(d)}" aria-hidden="true"></div>
      <div class="meal-body">
        ${head(` · ${slot.leftoverOf ? 'гатова' : methodLine(d.method)} ${chips.join('')}`)}
        <div class="title">${esc(d.template.title)}</div>
        <div class="sub">${esc(dishLabel(d))}</div>
      </div>
    </div>
    ${slot.leftoverOf ? '' : availabilityLine(d)}
    ${slot.leftoverOf ? '' : recipe(d, key, portions, forceMore)}
    <div class="actions">
      <button class="btn" data-action="eaten" data-key="${key}">Гатова</button>
      <button class="btn ghost" data-action="skip" data-key="${key}">Прапусціць</button>
      ${heartButton(d.template.id)}
      ${forceMore ? '' : `<button class="btn ghost" data-action="more" data-key="${key}" aria-expanded="${more}">${more ? 'Схаваць' : 'Іншае…'}</button>`}
    </div>
    ${panel}
  </div>`;
}

function heartButton(tpl) {
  const on = Boolean(state.tastes?.[tpl]?.love);
  return `<button class="btn ghost heart" data-action="love" data-tpl="${tpl}" aria-pressed="${on}" aria-label="${on ? 'Падабаецца: зняць' : 'Падабаецца: прапаноўваць часцей'}" title="Падабаецца">${ICON.heart}</button>`;
}

// «Іншы варыянт»: прычына ў адзін дотык, потым тая ж страва з іншым напаўненнем і іншыя стравы.
function altPanel(key, cur) {
  const reason = ui.altReason;
  const { variants, others } = alternatives(state, key, todayISO(), reason);
  ui.altList = [...variants, ...others];
  const row = (d, i) => `<div class="altrow">
      <div class="grow"><div class="title">${esc(d.template.title)}</div>
        <div class="sub">${esc(dishLabel(d))}</div>
        <div class="sub">${methodLine(d.method)} · бялок ${d.protein} г${d.missing.length ? ` · дакупіць: ${esc(name(d.missing[0].ids[0]))}` : ''}${d.check.length ? ' · праверыць дома' : ''}</div></div>
      <button class="btn ghost" data-action="pick-alt" data-key="${key}" data-i="${i}">Выбраць</button>
    </div>`;
  const dis = state.tastes?.[cur.template.id]?.dislike ?? 0;
  const hint = reason === 'dislike'
    ? `<p class="note">${dis + 1 >= HIDE_AFTER ? `«${esc(cur.template.title)}» больш не будзе прапаноўвацца. Вярнуць можна на «Кухні».` : `«${esc(cur.template.title)}» будзе трапляцца радзей. Яшчэ адно «не падабаецца» — і яна знікне з прапаноў.`}</p>`
    : reason === 'missing' ? `<div class="checkline"><span class="sub">Чаго няма? Адзначце, і план гэта ўлічыць:</span>${[...new Set(cur.chosen.flatMap((c) => c.ids))].map((id) => `<span class="chip">${esc(name(id))}<button data-action="not-home" data-id="${id}" aria-label="${esc(name(id))}: няма дома">няма</button></span>`).join('')}</div>`
    : reason === 'long' ? `<p class="note">Толькі хутчэйшыя за ${cur.method.total} хв.</p>` : '';
  return `<div class="alt">
    <div class="small muted">Чаму?</div>
    <div class="pills">${Object.entries(REASONS).map(([k, label]) => `<button class="pill" data-action="alt-reason" data-key="${key}" data-reason="${k}" aria-pressed="${k === reason}">${label}</button>`).join('')}</div>
    ${hint}
    ${variants.length ? `<div class="small muted">Тая ж страва, іншае напаўненне</div>${variants.map((d, i) => row(d, i)).join('')}` : ''}
    ${others.length ? `<div class="small muted">Іншыя стравы, не горшыя па правілах талеркі</div>${others.map((d, i) => row(d, variants.length + i)).join('')}` : ''}
    ${ui.altList.length ? '' : `<p class="sub">Нічога не горшага з таго, што ёсць, не знайшлося.</p><div class="actions"><button class="btn ghost" data-action="reroll" data-key="${key}">Падабраць усё роўна</button></div>`}
  </div>`;
}

// ── Экраны ──

function emptyStart() {
  return `
    <div class="empty">
      <h1>Пачнём з таго, што вы купляеце</h1>
      <p class="muted">Talerka мяркуе па чэках, што хутчэй за ўсё ёсць дома, складае план на тыдзень і спіс пакупак. Сфатаграфуйце чэк ці напішыце, што купілі, словамі.</p>
      <a class="btn" href="#/add">Дадаць прадукты</a>
      ${demoButton()}
    </div>`;
}

function reminderPlaque() {
  const rs = reminders(state, todayISO());
  if (!rs.length) return '';
  const text = rs.map((r) => `${r.label} — ${r.since == null ? 'не было ў чэках' : daysWord(r.since)}`).join(', ');
  return `<div class="upgrade remind">
    <div class="eyebrow">${ICON.cart} Даўно не куплялі карыснае</div>
    <p>${esc(cap(text))}. Ужо ў спісе пакупак.</p>
    <div class="actions"><a class="btn" href="#/list">Спіс пакупак</a><button class="btn ghost" data-action="snooze" data-groups="${rs.map((r) => r.group).join(',')}">Схаваць на тыдзень</button></div>
  </div>`;
}

function viewToday() {
  const t = todayISO();
  const top = `<div class="top"><div><div class="brand">talerka</div><div class="sub">${longDate(t)}</div></div>
    <a class="round fill" href="#/add" aria-label="Дадаць прадукты">${ICON.plus}</a></div>`;
  if (!hasStock(state)) return `${top}${emptyStart()}${kitchenHint()}`;
  const cur = todayMinutes();
  const r = Object.fromEntries(planRules(state, t).map((x) => [x.id, x]));
  const list = buildList(state, t);
  const toBuy = [...list.plan, ...list.remind].filter((x) => !x.bought).length + list.manual.filter((m) => !m.bought).length;
  return `
    ${top}
    <div class="section">
      <h2>Колькі часу сёння</h2>
      <div class="seg" role="group" aria-label="Час на гатаванне">
        ${TIME_CHOICES.map((c) => `<button data-action="minutes" data-v="${c.v}" aria-pressed="${String(cur) === String(c.v)}">${c.label}</button>`).join('')}
      </div>
    </div>
    ${reminderPlaque()}
    <div class="section">${MEALS.map((m) => slotCard(keyOf(t, m))).join('')}
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
      ${toBuy ? `<a class="small" href="#/list">У спісе пакупак: ${toBuy}</a>` : ''}
    </div>`;
}

function hasDemo() {
  return state.lines.some((l) => l.store === DEMO_STORE);
}

function demoButton() {
  return hasDemo() ? '' : '<button class="btn ghost" data-action="load-demo">Паспрабаваць на дэма-чэках</button>';
}

function demoSection() {
  const text = hasDemo()
    ? 'Загружаны дэма-чэкі. Калі дадасце свае, дэма можна прыбраць.'
    : 'Каб паспрабаваць аплікацыю без сваіх чэкаў, загрузіце восем выдуманых чэкаў тыповай сям’і за месяц.';
  const btn = hasDemo()
    ? '<button class="btn ghost" data-action="clear-demo">Прыбраць дэма</button>'
    : '<button class="btn ghost" data-action="load-demo">Загрузіць дэма-чэкі</button>';
  return `<div class="section"><h2>Дэма</h2><p class="sub">${text}</p>${btn}</div>`;
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
  const { have, maybe } = availability(stock);
  const { ready, upgrade } = suggestNow({ pantry: [...have], maybe, settings: state.settings, meal, limit, ctx });
  ui.lastNow = ready;
  const eq = state.settings.equipment.map((e) => EQUIPMENT[e].toLowerCase()).join(', ');
  const portions = { eat: people(state.settings), take: 0 };

  const cards = ready.length ? ready.map((d, i) => `
    <div class="card ${i === 0 ? 'selected' : ''}">
      <div class="row"><div class="title">${esc(d.template.title)}</div><div class="time">${d.method.total} хв</div></div>
      <div class="sub">${esc(dishLabel(d))}</div>
      ${dishTags(d)}
      ${availabilityLine(d)}
      ${recipe(d, `now:${d.template.id}`, portions)}
      <div class="actions"><button class="btn" data-action="cook-now" data-tpl="${d.template.id}" data-meal="${meal}">Гатую гэта</button></div>
    </div>`).join('')
    : `<div class="empty"><p>З таго, што, хутчэй за ўсё, ёсць дома, у межах ${limit ?? 'любога'} хв нічога не складаецца.</p><a class="btn" href="#/add">Дадаць прадукты</a></div>`;

  let up = '';
  if (upgrade) {
    const price = lastPrice(state.lines, upgrade.buy);
    up = `<div class="upgrade">
      <div class="eyebrow">${ICON.cart} Дакупі адно</div>
      <p><b>${esc(cap(name(upgrade.buy)))}</b>${price ? `, апошні раз ${zl(price.price)} за ${price.unit} у ${esc(price.store)}` : ''}. Тады атрымаецца «${esc(upgrade.dish.template.title)}»: ${esc(upgrade.reasons.join(', '))}.</p>
      <div class="actions"><button class="btn" data-action="wish" data-ids="${upgrade.buy}">У спіс пакупак</button></div>
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

function stockChips(ids, buttons) {
  return `<div class="chips">${ids.map((id) => `<span class="chip">${esc(name(id))}${buttons(id)}</span>`).join('')}</div>`;
}

function viewAdd() {
  let preview = '';
  const pv = ui.preview;
  if (pv) {
    const rows = pv.ids.map((id) => `<div><span>${esc(name(id))}</span><span>${levelOf(stock, id) === 'likely' ? 'ужо, хутчэй за ўсё, ёсць' : 'новае'}</span></div>`).join('');
    const unk = pv.unknown.slice(0, 8).map((u) => `<div class="unknown"><span>${esc(u)}</span><span>не ведаю</span></div>`).join('');
    preview = `<div class="card">
      <div class="row"><div class="title">Распазнана</div>${pv.ids.length ? `<span class="tag good">${pv.ids.length} складн.</span>` : ''}</div>
      <div class="receipt">${rows}${unk}</div>
      <button class="btn big" data-action="apply-preview" ${pv.ids.length ? '' : 'disabled'}>Купілі сёння</button>
    </div>`;
  }

  const ids = Object.keys(stock).sort((a, b) => name(a).localeCompare(name(b), 'be'));
  const likely = ids.filter((id) => stock[id].level === 'likely');
  const maybe = ids.filter((id) => stock[id].level === 'maybe');
  const noBtn = (id) => `<button data-action="not-home" data-id="${id}" aria-label="${esc(name(id))}: няма дома">×</button>`;
  const yesBtn = (id) => `<button data-action="have" data-id="${id}" aria-label="${esc(name(id))}: ёсць дома">✓</button>`;

  return `
    <div class="back"><a class="round" href="#/" aria-label="Назад">${ICON.back}</a><h1>Што вы купілі?</h1></div>
    <div class="tabs two-tabs" role="group" aria-label="Як дадаць">
      <button class="tab" data-action="add-tab" data-tab="photo" aria-pressed="${ui.addTab === 'photo'}">${ICON.camera}Фота чэка</button>
      <button class="tab" data-action="add-tab" data-tab="list" aria-pressed="${ui.addTab === 'list'}">${ICON.words}Спіс словамі</button>
    </div>
    ${ui.addTab === 'photo' ? photoPanel() : `
    <label for="typed-list" class="small muted">Праз коску ці з новага радка</label>
    <textarea id="typed-list" placeholder="яйкі, грэчка, марожаныя брокалі, кефір">${esc(ui.listText)}</textarea>
    <button class="btn" data-action="parse-list">Распазнаць</button>
    ${preview}`}
    <div class="section"><h2>Хутчэй за ўсё ёсць дома</h2>
      ${likely.length ? stockChips(likely, noBtn) : '<p class="sub">Пакуль нічога: дадайце пакупкі.</p>'}
    </div>
    ${maybe.length ? `<div class="section"><h2>Магчыма, ужо скончылася</h2>${stockChips(maybe, (id) => yesBtn(id) + noBtn(id))}</div>` : ''}
    <p class="note">Talerka не вядзе дакладны ўлік: яна мяркуе па датах пакупак і тым, як часта вы купляеце. Праверыць халадзільнік перад гатаваннем — ваша справа. × — «гэтага няма», ✓ — «ёсць».</p>
    ${demoSection()}
    <p class="note">Усё захоўваецца толькі ў гэтым браўзеры на вашай прыладзе.</p>`;
}

// ── Фота чэка ──

const STORES = ['Lidl', 'Biedronka', 'Carrefour'];
const STORE_NAMES = { Lidl: 'Lidl', Biedronka: 'Бядронка', Carrefour: 'Карфур' };

function productOptions(selected) {
  const groups = Object.entries(GROUPS).map(([g, label]) => {
    const opts = PRODUCTS.filter((p) => p.group === g).sort((a, b) => a.name.localeCompare(b.name, 'be'))
      .map((p) => `<option value="${p.id}" ${p.id === selected ? 'selected' : ''}>${esc(p.name)}</option>`).join('');
    return `<optgroup label="${esc(label)}">${opts}</optgroup>`;
  }).join('');
  return `<option value="" ${selected ? '' : 'selected'}>не для страў (салодкае, не ежа…)</option>${groups}`;
}

function frameHTML(f, i) {
    const state = f.status === 'error' ? `<span class="tag warn">${esc(f.error)}</span>`
      : f.status === 'done' ? `<span class="tag good">${f.count} радк.</span>`
      : f.status === 'work' ? `<span class="sub">${esc(f.stage)}</span>` : '<span class="sub">чакае</span>';
    const bar = f.status === 'work' ? `<div class="track"><div class="fill good" style="width:${Math.round(f.progress * 100)}%"></div></div>` : '';
    return `<div class="frame" data-frame="${i}"><div class="row"><span>Кадр ${i + 1}</span>${state}</div>${bar}</div>`;
}

function framesBox(rc) {
  return `<div class="frames">${rc.frames.map(frameHTML).join('')}</div>`;
}

function sumBox(d) {
  const c = sumCheck(d);
  if (c.total == null) return `<div class="sumcheck warn">Радкі: ${zl(c.sum)}. Сумы чэка не відаць — упішыце яе, каб праверыць.</div>`;
  if (c.ok) return `<div class="sumcheck ok">${ICON.check} Сума супала: ${zl(c.sum)}</div>`;
  const what = c.diff > 0 ? `не хапае ${zl(c.diff)}: мабыць, прапушчаны радок або не адняўся мінус` : `лішне ${zl(-c.diff)}: мабыць, не адняўся «OPUST» або радок паўтараецца`;
  return `<div class="sumcheck warn">На чэку ${zl(c.total)}, у радках ${zl(c.sum)} — ${what}.</div>`;
}

function reviewRows(d) {
  return d.items.map((it, i) => `
    <div class="rline ${it.include ? '' : 'off'} ${it.check && it.include ? 'check' : ''}">
      <input type="checkbox" class="rinc" data-rc="include" data-i="${i}" ${it.include ? 'checked' : ''} aria-label="Улічваць радок">
      <div class="rbody">
        <div class="rtop">
          <input class="input rname" data-rc="name" data-i="${i}" value="${esc(it.name)}" aria-label="Назва з чэка">
          <input class="input rpaid" data-rc="paid" data-i="${i}" inputmode="decimal" value="${it.paid ? String(it.paid).replace('.', ',') : ''}" placeholder="0,00" aria-label="Цана, зл">
        </div>
        <select class="input rprod" data-rc="productId" data-i="${i}" aria-label="Што гэта">${productOptions(it.productId)}</select>
      </div>
    </div>`).join('');
}

function photoPanel() {
  const rc = ui.receipt;
  const pick = `<div class="photo-pick">
      <label class="btn big">${ICON.camera}<span>${rc ? 'Яшчэ кадр' : 'Сфатаграфаваць чэк'}</span><input type="file" accept="image/*" capture="environment" data-photo hidden></label>
      <label class="btn ghost">${rc ? 'Яшчэ з галерэі' : 'З галерэі ці скрыншот'}<input type="file" accept="image/*,.heic,.heif" multiple data-photo hidden></label>
    </div>`;
  if (!rc) {
    return `${pick}
      <p class="note">Чэк кладзіце на цёмны стол, каб папера была добра відаць. Доўгі чэк здымайце некалькімі кадрамі зверху ўніз, так каб 2–3 радкі паўтараліся. Падыходзяць і скрыншоты e-чэкаў з Lidl Plus ці Moja Biedronka. Распазнаванне ідзе на гэтым тэлефоне, фота нікуды не адпраўляецца.</p>`;
  }
  const busy = rc.frames.some((f) => f.status === 'work' || f.status === 'wait');
  const d = rc.draft;
  const review = d ? `
    <div class="card">
      <div class="row"><div class="title">Праверце радкі</div><span class="tag">${d.items.filter((x) => x.include).length} з ${d.items.length}</span></div>
      <div class="seg" style="--n:4" role="group" aria-label="Крама">
        ${STORES.map((st) => `<button data-action="rc-store" data-store="${st}" aria-pressed="${d.store === st}">${STORE_NAMES[st]}</button>`).join('')}
        <button data-action="rc-store" data-store="" aria-pressed="${!STORES.includes(d.store)}">Іншая</button>
      </div>
      <div class="two">
        <div class="field"><label for="rc-date">Дата</label><input id="rc-date" type="date" data-rc="date" value="${esc(d.date ?? todayISO())}"></div>
        <div class="field"><label for="rc-total">Сума на чэку, зл</label><input id="rc-total" data-rc="total" inputmode="decimal" value="${d.total != null ? String(d.total).replace('.', ',') : ''}" placeholder="—"></div>
      </div>
      <div id="rc-sum">${sumBox(d)}</div>
      <p class="note">Аранжавым пазначана тое, у чым распазнаванне не ўпэўнена. Знятая птушка — радок не ідзе ў гісторыю. Тое, што вы паправіце ў «Што гэта», Talerka запомніць для наступных чэкаў.</p>
      <div class="rlines">${reviewRows(d)}</div>
      <button class="btn dashed" data-action="rc-add-line">+ Радок, якога няма</button>
      <button class="btn big" data-action="rc-save" ${busy || !d.items.some((x) => x.include) ? 'disabled' : ''}>Захаваць чэк</button>
      <button class="btn ghost" data-action="rc-cancel">Скасаваць</button>
    </div>` : '';
  return `${framesBox(rc)}${busy ? '' : pick}${review}`;
}

let ocrQueue = Promise.resolve();

function updateFrame(i) {
  const el = document.querySelector(`.frames [data-frame="${i}"]`);
  if (el && ui.receipt) el.outerHTML = frameHTML(ui.receipt.frames[i], i);
}

function addPhotos(files) {
  if (!files.length) return;
  ui.receipt ??= { frames: [], draft: null };
  const rc = ui.receipt;
  for (const file of files) {
    const i = rc.frames.push({ status: 'wait', progress: 0, stage: '', count: 0 }) - 1;
    ocrQueue = ocrQueue.then(async () => {
      if (ui.receipt !== rc) return;
      const f = rc.frames[i];
      f.status = 'work';
      render();
      let last = 0;
      try {
        const { recognizeFile } = await import('./ocr.js');
        const text = await recognizeFile(file, (p, stage) => {
          f.progress = p;
          f.stage = stage;
          if (Date.now() - last > 250) { last = Date.now(); updateFrame(i); }
        });
        const parsed = parseReceiptOCR(text, state.aliases ?? {});
        f.count = parsed.items.length;
        f.status = 'done';
        rc.draft = rc.draft ? mergeFrames([rc.draft, parsed]) : parsed;
        // Дата не прачыталася ці выйшла ў будучыні — па змаўчанні сёння, яе відаць і можна змяніць.
        if (!rc.draft.date || rc.draft.date > todayISO()) rc.draft.date = todayISO();
      } catch (e) {
        f.status = 'error';
        f.error = e?.message || 'Не атрымалася распазнаць';
      }
      if (ui.receipt === rc && route().r === 'add') render();
    });
  }
  render();
}

function rcInput(el) {
  const d = ui.receipt?.draft;
  if (!d) return;
  const field = el.dataset.rc;
  const money = (v) => { const n = parseFloat(String(v).replace(/\s/g, '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
  if (field === 'date') d.date = el.value || null;
  else if (field === 'total') d.total = el.value.trim() ? money(el.value) : null;
  else {
    const it = d.items[Number(el.dataset.i)];
    if (!it) return;
    if (field === 'include') { it.include = el.checked; el.closest('.rline')?.classList.toggle('off', !el.checked); }
    else if (field === 'paid') it.paid = money(el.value);
    else if (field === 'name') it.name = el.value;
    else if (field === 'productId') { it.productId = el.value || null; it.userSet = true; it.include = true; it.check = false; }
  }
  const box = document.getElementById('rc-sum');
  if (box) box.innerHTML = sumBox(d);
}

// Чэк з той жа крамы, датай і сумай ужо ў гісторыі — другі раз не дадаецца.
function sameReceiptSaved(lines) {
  const key = (ls) => `${ls[0]?.store}|${ls[0]?.date}|${ls.reduce((s, l) => s + l.paid, 0).toFixed(2)}`;
  const k = key(lines);
  const old = {};
  for (const l of state.lines) (old[`${l.store}|${l.date}`] ??= []).push(l);
  return Object.values(old).some((ls) => key(ls) === k);
}

function cellText(slot, dish) {
  if (!slot) return ['—', ''];
  switch (slot.state) {
    case 'off': return ['не плануем', 'skip'];
    case 'empty': return ['не хапае прадуктаў', 'skip'];
    case 'skipped': return ['прапушчаны', 'skip'];
    case 'replaced': return [REPLACED[slot.replacedBy] ?? 'іншае', 'skip'];
    case 'moved': return ['перанесена', 'skip'];
    case 'eaten': return [`✓ ${dish?.template.title ?? ''}`, 'done'];
    default: return [(slot.leftoverOf ? 'З сабой: рэшткі' : slot.mode === 'take' ? 'З сабой: ' + dish.template.title.toLowerCase() : dish.template.title), slot.mode === 'take' ? 'take' : ''];
  }
}

function viewWeek() {
  if (!hasStock(state)) return `<h1>Тыдзень</h1>${emptyStart()}`;
  const t = todayISO();
  const rules = planRules(state, t);
  const rows = Array.from({ length: 7 }, (_, i) => addDays(t, i)).map((date) => `
    <div class="week-row">
      <div class="day">${WEEKDAY_SHORT[weekdayOf(date)]}<small>${shortDate(date)}</small></div>
      ${MEALS.map((meal) => {
        const key = keyOf(date, meal);
        const slot = getSlot(state, key);
        const [text, cls] = cellText(slot, dishAt(state, key));
        const label = `${MEAL_NAMES[meal]} ${shortDate(date)}: ${esc(text)}`;
        if (ui.swap) {
          const can = slot?.state === 'planned' || (ui.swapFrom && !['eaten', 'replaced'].includes(slot?.state));
          const picked = ui.swapFrom === key;
          return `<button class="cell ${cls}${picked ? ' picked' : ''}" data-action="pick-swap" data-key="${key}" ${can ? '' : 'disabled'} aria-pressed="${picked}" aria-label="${label}">${esc(text)}</button>`;
        }
        return `<a class="cell ${cls}${date === t ? ' today' : ''}" href="#/slot/${key}" aria-label="${label}. Адкрыць рэцэпт і дзеянні">${esc(text)}</a>`;
      }).join('')}
    </div>`).join('');

  return `
    <div class="row"><h1>Тыдзень</h1><span class="sub">${shortDate(t)} – ${shortDate(addDays(t, 6))}</span></div>
    <div class="tags">${rules.map((r) => `<span class="tag ${r.ok ? 'good' : 'warn'}">${esc(r.label)}: ${esc(r.value)}</span>`).join('')}</div>
    <div class="week">
      <div class="week-row head"><div></div><div>Снядан.</div><div>Абед</div><div>Вячэра</div></div>
      ${rows}
    </div>
    ${ui.swap
      ? `<p class="swaphint">${ui.swapFrom ? `Цяпер націсніце, з чым памяняць «${esc(cellText(getSlot(state, ui.swapFrom), dishAt(state, ui.swapFrom))[0])}».` : 'Націсніце на першую страву, потым на другую — яны памяняюцца месцамі.'}</p>
         <div class="actions"><button class="btn ghost" data-action="swap-mode">Гатова</button></div>`
      : `<p class="note">Націсніце на страву, каб убачыць рэцэпт з грамамі і адзначыць, што з'елі, прапусцілі ці замянілі.</p>`}
    <div class="actions">
      ${ui.swap ? '' : '<button class="btn" data-action="swap-mode">Памяняць месцамі</button>'}
      <a class="btn ghost" href="#/list">Спіс пакупак</a>
      <button class="btn ghost" data-action="rebuild">${ui.confirmRebuild ? 'Націсніце яшчэ раз: перабудаваць' : 'Перабудаваць астатняе'}</button>
    </div>
    <p class="note">«Перабудаваць» мяняе толькі незакранутыя прыёмы з сёння: адзначанае і перанесенае застаецца.</p>`;
}

function viewSlot(key) {
  const { date, meal } = parseKey(key ?? '');
  if (!date || !MEALS.includes(meal)) return viewWeek();
  return `
    <div class="back"><a class="round" href="#/week" aria-label="Назад">${ICON.back}</a>
      <div><h1>${MEAL_NAMES[meal]}</h1><div class="sub">${longDate(date)}</div></div></div>
    ${slotCard(key, { forceMore: true })}`;
}

function listRow(x, { manual = false } = {}) {
  const label = manual ? x.text : x.name;
  const pr = x.id ? lastPrice(state.lines, x.id) : null;
  let why = '';
  if (x.need) why = `для: ${slotName(keyOf(x.need.date, x.need.meal))}`;
  else if (x.reminder) why = x.reminder.since == null ? `${x.reminder.label}: не было ў чэках` : `${x.reminder.label}: не куплялі ${daysWord(x.reminder.since)}`;
  const price = pr ? `${zl(pr.price)}/${pr.unit} · ${pr.store}` : '';
  return `<div class="listrow ${x.bought ? 'bought' : ''}">
    <button class="tick" data-action="bought" data-key="${esc(x.key)}" aria-pressed="${x.bought}" aria-label="${esc(label)}: ${x.bought ? 'купіў' : 'не купіў'}">${x.bought ? ICON.check : ''}</button>
    <div class="grow"><div>${esc(cap(label))}</div>${why || price ? `<div class="small muted">${esc([why, price].filter(Boolean).join(' · '))}</div>` : ''}</div>
    ${manual ? `<button class="x" data-action="remove-manual" data-key="${esc(x.key)}" aria-label="Прыбраць ${esc(label)}">×</button>` : ''}
  </div>`;
}

function viewList() {
  const t = todayISO();
  const list = buildList(state, t);
  const any = list.plan.length + list.remind.length + list.manual.length;
  const anyBought = [...list.plan, ...list.remind, ...list.manual].some((x) => x.bought);
  return `
    <div class="row"><h1>Спіс пакупак</h1>
      <button class="round" data-action="share" aria-label="Падзяліцца спісам">${ICON.share}</button></div>
    <div class="inline">
      <label for="manual" class="sr">Дадаць свой пункт</label>
      <input id="manual" class="input" placeholder="Дапісаць сваё: хлеб, кава…" enterkeyhint="done">
      <button class="btn" data-action="add-manual">Дадаць</button>
    </div>
    ${list.plan.length ? `<div class="section"><h2>Для плана</h2><div class="card list">${list.plan.map((x) => listRow(x)).join('')}</div></div>` : ''}
    ${list.remind.length ? `<div class="section"><h2>Даўно не куплялі</h2><div class="card list">${list.remind.map((x) => listRow(x)).join('')}</div></div>` : ''}
    ${list.manual.length ? `<div class="section"><h2>Сваё</h2><div class="card list">${list.manual.map((x) => listRow(x, { manual: true })).join('')}</div></div>` : ''}
    ${any ? '' : '<div class="empty"><p class="muted">Для плана на тыдзень, хутчэй за ўсё, усё ёсць. Можна дапісаць сваё.</p></div>'}
    ${list.check.length ? `<div class="section"><h2>Правер дома</h2><p class="sub">Для сёння і заўтра, магчыма, ужо скончылася: ${esc(list.check.map((x) => x.name).join(', '))}.</p></div>` : ''}
    ${anyBought ? '<button class="btn ghost" data-action="clear-bought">Прыбраць купленае</button>' : ''}
    <p class="note">Спіс складаецца сам з плана тыдня і напамінаў. «Купіў» лічыцца пакупкай. Пакуль няма сервера, спіс жыве на гэтым тэлефоне, а «Падзяліцца» адпраўляе яго тэкстам у месенджар.</p>`;
}

function viewBasket() {
  if (!state.lines.length) {
    return `<h1>Ваш кошык</h1>
      <div class="empty"><p class="muted">Тут з'явіцца, на што ідуць грошы, і тры змены з найбольшым эфектам. Для аналізу патрэбныя чэкі.</p><a class="btn" href="#/add">Дадаць фота чэка</a>${demoButton()}</div>`;
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
        <div class="actions"><button class="btn ghost" data-action="wish" data-ids="${a.add.join(',')}">У спіс пакупак</button></div></div>`).join('') || '<p class="sub">Кошык выглядае збалансаваным.</p>'}
    </div>
    <div class="card" style="border:1px dashed var(--mid);background:transparent"><div class="row"><span class="small">Скідкі тыдня ў Lidl, Бядронцы і Карфуры пад вашы замены</span><span class="small muted">пазней</span></div></div>`;
}

const WEEK = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

function viewKitchen() {
  const s = state.settings;
  const grid = MEALS.map((meal) => `
    <div>${MEAL_NAMES[meal]}</div>
    ${WEEK.map((wd) => {
      const mode = s.schedule[wd]?.[meal] === 'skip' ? 'skip' : 'home';
      const label = mode === 'home' ? 'плануем' : 'не плануем';
      return `<button class="slot ${mode}" data-action="sched" data-wd="${wd}" data-meal="${meal}" aria-label="${WEEKDAY_SHORT[wd]}, ${MEAL_NAMES[meal].toLowerCase()}: ${label}"></button>`;
    }).join('')}`).join('');
  const excluded = s.exclude.map((id) => BY_ID[id]?.name).filter(Boolean).join(', ');
  const ms = members(s);
  const memberCards = ms.map((m, i) => `
    <div class="card">
      <div class="inline">
        <label class="sr" for="member-${i}">Імя</label>
        <input id="member-${i}" class="input" value="${esc(m.name)}" data-member="${i}">
        ${ms.length > 1 ? `<button class="btn ghost" data-action="remove-member" data-i="${i}" aria-label="Прыбраць ${esc(m.name)}">×</button>` : ''}
      </div>
      <div class="small muted">Абед з сабой</div>
      <div class="pills">${WEEK.map((wd) => `<button class="pill" data-action="take" data-i="${i}" data-wd="${wd}" aria-pressed="${m.take?.includes(wd) ?? false}">${WEEKDAY_SHORT[wd]}</button>`).join('')}</div>
    </div>`).join('');

  return `
    <h1>Кухня і графік</h1>
    <div class="section"><h2>Што ёсць дома</h2>
      <div class="pills">${Object.entries(EQUIPMENT).map(([id, label]) => `<button class="pill" data-action="equip" data-id="${id}" aria-pressed="${s.equipment.includes(id)}">${label}</button>`).join('')}</div>
    </div>
    <div class="section"><h2>Сям'я · ${ms.length} ${plural(ms.length, 'чалавек', 'чалавекі', 'чалавек')}</h2>
      <p class="note">Грамы ў рэцэптах лічацца на ўсіх. У дні «з сабой» абед складаецца з учорашняй вячэры, згатаванай з запасам.</p>
      ${memberCards}
      <button class="btn ghost" data-action="add-member">Дадаць удзельніка</button>
    </div>
    <div class="section"><h2>Звычайны тыдзень</h2>
      <div class="grid-sched"><div></div>${WEEK.map((wd) => `<div class="h">${WEEKDAY_SHORT[wd]}</div>`).join('')}${grid}</div>
      <div class="legend"><span><i style="background:var(--accent)"></i>плануем</span><span><i style="border:1px dashed var(--mid)"></i>не плануем</span></div>
    </div>
    <div class="two">
      <div class="field"><label for="k-evening">Будні вечар, хв</label><input id="k-evening" type="number" min="5" max="180" step="5" value="${s.eveningMinutes}" data-setting="eveningMinutes"></div>
      <div class="field"><label for="k-weekend">Выхадныя, хв</label><input id="k-weekend" type="number" min="5" max="240" step="5" value="${s.weekendMinutes}" data-setting="weekendMinutes"></div>
      <div class="field"><label for="k-breakfast">Сняданак, хв</label><input id="k-breakfast" type="number" min="3" max="60" step="1" value="${s.breakfastMinutes}" data-setting="breakfastMinutes"></div>
    </div>
    <div class="section">
      <label for="k-exclude"><h2>Чаго не ямо</h2></label>
      <input id="k-exclude" class="input" placeholder="напрыклад: грыбы, печань" value="${esc(excluded)}">
      <button class="btn ghost" data-action="save-exclude">Захаваць</button>
    </div>
    ${tastesSection()}
    <p class="note">Змены тут перабудоўваюць план з заўтрашняга дня; сённяшнія прыёмы і вашы адзнакі застаюцца.</p>
    <div class="section">
      <h2>Дадзеныя</h2>
      <p class="note">${receiptCount(state.lines)} чэкаў, ${Object.keys(stock).length} прадуктаў у гісторыі пакупак, ${state.cooked.length} з'едзеных страў. Усё ляжыць толькі ў гэтым браўзеры.</p>
      <button class="btn ghost" data-action="reset">${ui.confirmReset ? 'Націсніце яшчэ раз, каб выдаліць усё' : 'Выдаліць усе дадзеныя'}</button>
    </div>`;
}

function tastesSection() {
  const t = tasteCtx(state);
  const chips = (ids, label) => `<div class="chips">${[...ids].filter((id) => BY_TEMPLATE[id]).map((id) => `<span class="chip">${esc(BY_TEMPLATE[id].title)}<button data-action="forget-taste" data-tpl="${id}" aria-label="${esc(BY_TEMPLATE[id].title)}: ${label}">${label}</button></span>`).join('')}</div>`;
  if (!t.loved.size && !t.hidden.size) {
    return `<div class="section"><h2>Густы</h2><p class="note">Сэрца на страве — прапаноўваць часцей. «Не падабаецца» ў «Іншым варыянце» двойчы — больш не прапаноўваць.</p></div>`;
  }
  return `<div class="section"><h2>Густы</h2>
    ${t.loved.size ? `<p class="sub">Падабаецца, прапануем часцей:</p>${chips(t.loved, 'зняць')}` : ''}
    ${t.hidden.size ? `<p class="sub">Не прапануем:</p>${chips(t.hidden, 'вярнуць')}` : ''}
  </div>`;
}

// ── Маршрутызацыя і падзеі ──

const ROUTES = { '': viewToday, now: viewNow, add: viewAdd, week: viewWeek, slot: viewSlot, list: viewList, basket: viewBasket, kitchen: viewKitchen };
const NAV = [
  { r: '', label: 'Сёння', icon: ICON.today, also: ['now', 'add'] },
  { r: 'week', label: 'Тыдзень', icon: ICON.week, also: ['slot'] },
  { r: 'list', label: 'Спіс', icon: ICON.list, also: [] },
  { r: 'basket', label: 'Кошык', icon: ICON.basket, also: [] },
  { r: 'kitchen', label: 'Кухня', icon: ICON.kitchen, also: [] },
];
const TITLES = { '': 'Talerka', now: 'Зараз', add: 'Дадаць', week: 'Тыдзень', slot: 'Прыём ежы', list: 'Спіс пакупак', basket: 'Кошык', kitchen: 'Кухня' };

function route() {
  const [r, param] = location.hash.replace(/^#\/?/, '').split('?')[0].split('/');
  return { r: r || '', param: param ? decodeURIComponent(param) : null };
}

function render() {
  const t = todayISO();
  if (ensurePlan(state, t)) save();
  stock = stockOn(state, t);
  const { r, param } = route();
  const view = ROUTES[r] ?? viewToday;
  main.innerHTML = view(param);
  nav.innerHTML = NAV.map((n) => `<a href="#/${n.r}" ${n.r === r || n.also.includes(r) ? 'aria-current="page"' : ''}>${n.icon}${n.label}</a>`).join('');
  document.title = r ? `Talerka · ${TITLES[r] ?? ''}` : 'Talerka';
}

// Налады змяніліся — перабудоўваем план з заўтра.
function settingsChanged() {
  const t = todayISO();
  rebuildFrom(state, addDays(t, 1), t);
  save();
}

const actions = {
  minutes(el) {
    const t = todayISO();
    state.dayMinutes = { [t]: el.dataset.v === 'batch' ? 'batch' : Number(el.dataset.v) };
    // Час на сёння — змена карыстальніка: абед і вячэра сёння падбіраюцца нанова, калі іх яшчэ не чапалі.
    const keys = ['lunch', 'dinner'].map((m) => keyOf(t, m)).filter((k) => {
      const s = getSlot(state, k);
      return s && ['planned', 'empty'].includes(s.state) && !s.movedFrom && !s.leftoverOf;
    });
    if (keys.length) refill(state, keys, t);
    save();
  },
  more(el) { ui.more = ui.more === el.dataset.key ? null : el.dataset.key; },
  eaten(el) {
    const d = markEaten(state, el.dataset.key);
    save();
    if (d) toast(`Смачна! «${d.template.title}» адзначана`);
  },
  skip(el) { markSkipped(state, el.dataset.key, todayISO()); ui.more = null; save(); },
  replace(el) { markReplaced(state, el.dataset.key, el.dataset.by, todayISO()); ui.more = null; save(); },
  unmark(el) { unmark(state, el.dataset.key); save(); },
  move(el) {
    const to = document.getElementById(`move-${el.dataset.key}`)?.value;
    const done = to && swapMeals(state, el.dataset.key, to, todayISO());
    if (done) {
      ui.more = null;
      save();
      toast(`${done === 'swapped' ? 'Памяняна з' : 'Перанесена на'}: ${slotName(to)}`);
    }
  },
  'swap-mode'() { ui.swap = !ui.swap; ui.swapFrom = null; },
  'pick-swap'(el) {
    const key = el.dataset.key;
    if (!ui.swapFrom || ui.swapFrom === key) { ui.swapFrom = ui.swapFrom === key ? null : key; return; }
    const done = swapMeals(state, ui.swapFrom, key, todayISO());
    ui.swapFrom = null;
    if (done) {
      save();
      toast(done === 'swapped' ? 'Памяняна месцамі' : 'Перанесена');
    }
  },
  undo() {
    if (!ui.undo) return;
    state = JSON.parse(ui.undo);
    ui.undo = null;
    save();
    toast('Адменена');
  },
  reroll(el) { reroll(state, el.dataset.key, todayISO()); ui.alt = null; save(); },
  'alt-open'(el) { ui.alt = ui.alt === el.dataset.key ? null : el.dataset.key; ui.altReason = 'today'; },
  'alt-reason'(el) { ui.altReason = el.dataset.reason; },
  'pick-alt'(el) {
    const d = ui.altList[Number(el.dataset.i)];
    if (!d) return;
    const old = getSlot(state, el.dataset.key)?.tpl;
    const { hidden } = chooseAlternative(state, el.dataset.key, d, ui.altReason, todayISO());
    ui.alt = null;
    ui.more = null;
    save();
    toast(hidden && BY_TEMPLATE[old] ? `«${BY_TEMPLATE[old].title}» больш не прапануем. Вярнуць — на «Кухні».` : `Замест гэтага: «${d.template.title}»`);
  },
  love(el) {
    const on = toggleLove(state, el.dataset.tpl);
    save();
    toast(on ? 'Будзем прапаноўваць часцей' : 'Сэрца знята');
  },
  'forget-taste'(el) { forgetTaste(state, el.dataset.tpl); save(); },
  rebuild() {
    if (!ui.confirmRebuild) { ui.confirmRebuild = true; return; }
    ui.confirmRebuild = false;
    const t = todayISO();
    rebuildFrom(state, t, t);
    save();
    toast('Незакранутыя прыёмы перабудаваны');
  },
  'not-home'(el) {
    markNotHome(state, el.dataset.id, todayISO());
    save();
    toast(`Зразумела: ${name(el.dataset.id)} няма. Калі трэба для плана — ужо ў спісе пакупак.`);
  },
  have(el) {
    addPurchase(state, el.dataset.id, todayISO(), 'list');
    save();
  },
  'cook-now'(el) {
    const meal = el.dataset.meal;
    const d = (ui.lastNow ?? []).find((x) => x.template.id === el.dataset.tpl) ?? null;
    if (!d) return;
    const t = todayISO();
    const key = keyOf(t, meal);
    setDish(state, key, d, t);
    markEaten(state, key);
    save();
    toast(`Смачна! «${d.template.title}» адзначана`);
    location.hash = '#/';
  },
  'now-meal'(el) { ui.nowMeal = el.dataset.meal; },
  'add-tab'(el) { ui.addTab = el.dataset.tab; },
  'rc-store'(el) { if (ui.receipt?.draft) ui.receipt.draft.store = el.dataset.store; },
  'rc-add-line'() {
    ui.receipt?.draft?.items.push({ raw: '', name: '', qty: 1, unit: 'szt', paid: 0, discount: 0, productId: null, how: 'user', include: true, check: false });
  },
  'rc-cancel'() { ui.receipt = null; },
  'rc-save'() {
    const d = ui.receipt?.draft;
    if (!d) return;
    if (!d.date || d.date > todayISO()) { toast('Праверце дату чэка'); return; }
    const lines = draftToLines(d);
    if (!lines.length) return;
    if (sameReceiptSaved(lines)) { toast('Такі чэк ужо ёсць у гісторыі'); return; }
    // Слоўнік назваў: тое, што вы паправілі, наступным разам пазнаецца само.
    state.aliases = { ...(state.aliases ?? {}) };
    for (const it of d.items) if (it.userSet && aliasKey(it.name)) state.aliases[aliasKey(it.name)] = it.productId || '';
    state.lines = [...state.lines, ...lines];
    const n = new Set(lines.map((l) => l.productId).filter(Boolean)).size;
    ui.receipt = null;
    save();
    toast(`Чэк захаваны: ${lines.length} радк., ${n} складн. для страў. Каб план іх улічыў — «Перабудаваць астатняе» на «Тыдні».`);
  },
  'parse-list'() {
    ui.listText = document.getElementById('typed-list').value;
    const r = parseTypedList(ui.listText);
    ui.preview = { ids: r.ids, unknown: r.unknown };
  },
  'apply-preview'() {
    const pv = ui.preview;
    if (!pv) return;
    const t = todayISO();
    pv.ids.forEach((id) => addPurchase(state, id, t, 'list'));
    ui.preview = null;
    ui.listText = '';
    save();
    toast(`Дададзена: ${pv.ids.length}. Каб план іх улічыў, на «Тыдні» ёсць «Перабудаваць астатняе».`);
  },
  'load-demo'() {
    const lines = demoLines(todayISO());
    state.lines = [...state.lines.filter((l) => l.store !== DEMO_STORE), ...lines];
    save();
    toast(`Дэма: ${receiptCount(lines)} чэкаў у гісторыі`);
  },
  'clear-demo'() {
    state.lines = state.lines.filter((l) => l.store !== DEMO_STORE);
    // План з дэма-прадуктаў больш не адпавядае пакупкам: незакранутыя прыёмы складаюцца нанова.
    const t = todayISO();
    if (hasStock(state)) rebuildFrom(state, t, t);
    else state.plan = {};
    save();
    toast('Дэма прыбрана');
  },
  wish(el) {
    const added = el.dataset.ids.split(',').filter((id) => addManual(state, '', id)).length;
    save();
    toast(added ? 'Дададзена ў спіс пакупак' : 'Ужо ёсць у спісе пакупак');
  },
  bought(el) { toggleBought(state, el.dataset.key, todayISO()); save(); },
  'add-manual'() {
    const input = document.getElementById('manual');
    const parts = input.value.split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);
    parts.forEach((p) => addManual(state, p));
    save();
  },
  'remove-manual'(el) { removeManual(state, el.dataset.key); save(); },
  'clear-bought'() { clearBought(state); save(); },
  async share() {
    const text = shareText(buildList(state, todayISO()));
    if (!text) { toast('Спіс пусты'); return; }
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast('Спіс скапіяваны: устаўце ў месенджар'); }
    } catch (e) {
      if (e?.name !== 'AbortError') toast('Не атрымалася падзяліцца');
    }
  },
  snooze(el) {
    const t = todayISO();
    el.dataset.groups.split(',').forEach((g) => snooze(state, g, t));
    save();
  },
  equip(el) {
    const id = el.dataset.id;
    const eq = new Set(state.settings.equipment);
    eq.has(id) ? eq.delete(id) : eq.add(id);
    state.settings.equipment = [...eq];
    settingsChanged();
  },
  sched(el) {
    const { wd, meal } = el.dataset;
    const day = { ...(state.settings.schedule[wd] ?? {}) };
    day[meal] = day[meal] === 'skip' ? 'home' : 'skip';
    state.settings.schedule = { ...state.settings.schedule, [wd]: day };
    settingsChanged();
  },
  take(el) {
    const m = members(state.settings)[Number(el.dataset.i)];
    if (!m) return;
    const take = new Set(m.take ?? []);
    take.has(el.dataset.wd) ? take.delete(el.dataset.wd) : take.add(el.dataset.wd);
    m.take = WEEK.filter((wd) => take.has(wd));
    state.settings.members = members(state.settings);
    settingsChanged();
  },
  'add-member'() {
    const ms = members(state.settings);
    state.settings.members = [...ms, { name: `Дарослы ${ms.length + 1}`, take: [] }];
    settingsChanged();
  },
  'remove-member'(el) {
    state.settings.members = members(state.settings).filter((_, i) => i !== Number(el.dataset.i));
    settingsChanged();
  },
  'save-exclude'() {
    const { ids, unknown } = parseTypedList(document.getElementById('k-exclude').value);
    state.settings.exclude = ids;
    settingsChanged();
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

const SAID = {
  skip: 'Прапушчана', replace: 'Адзначана: замест плана', unmark: 'Вернута', reroll: 'Падабрана іншая страва',
  take: 'Дні «з сабой» зменены, план з заўтра перабудаваны', sched: 'Графік зменены, план з заўтра перабудаваны',
  equip: 'Кухня зменена, план з заўтра перабудаваны', minutes: 'Час на сёння зменены', snooze: 'Схавана на тыдзень',
  'add-member': 'Удзельнік дададзены', 'remove-member': 'Удзельнік прыбраны', 'remove-manual': 'Прыбрана са спіса',
  'clear-bought': 'Купленае прыбрана', 'forget-taste': 'Густ скінуты', have: 'Адзначана: ёсць дома',
};
// Адзнаку «купіў» і так можна зняць тым жа дотыкам.
const NO_UNDO = new Set(['undo', 'share', 'bought', 'alt-open', 'alt-reason', 'add-tab', 'rc-store', 'rc-add-line', 'rc-cancel']);

// Любое дзеянне, што змяніла дадзеныя, можна адмяніць з падказкі ўнізе.
async function withUndo(fn, said = null) {
  const before = JSON.stringify(state);
  ui.said = null;
  document.querySelector('.toast')?.remove();
  await fn();
  if (JSON.stringify(state) !== before) {
    ui.undo = before;
    toast(ui.said ?? said ?? 'Зменена', { undo: true });
  }
}

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !actions[el.dataset.action]) return;
  e.preventDefault();
  const a = el.dataset.action;
  if (a !== 'reset') ui.confirmReset = false;
  if (a !== 'rebuild') ui.confirmRebuild = false;
  if (NO_UNDO.has(a)) await actions[a](el);
  else await withUndo(() => actions[a](el), SAID[a]);
  render();
});

// Enter у полі свайго пункта дадае яго.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'manual') {
    e.preventDefault();
    withUndo(() => actions['add-manual']());
    render();
    document.getElementById('manual')?.focus();
  }
});

// Адкрытыя рэцэпты застаюцца адкрытымі пасля перамалёўкі.
document.addEventListener('toggle', (e) => {
  const el = e.target;
  if (el.matches?.('details.recipe')) el.open ? ui.open.add(el.dataset.key) : ui.open.delete(el.dataset.key);
}, true);

// Экран праверкі чэка: змены не перамалёўваюць экран, каб не губляць фокус, толькі пералічваюць суму.
document.addEventListener('input', (e) => {
  if (e.target.dataset?.rc) rcInput(e.target);
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset.photo != null) { addPhotos([...el.files]); el.value = ''; return; }
  if (el.dataset.rc) { rcInput(el); return; }
  if (el.dataset.setting || el.dataset.member != null) withUndo(() => applyChange(el), 'Захавана').then(render);
});

function applyChange(el) {
  if (el.dataset.setting) {
    const v = Number(el.value);
    if (Number.isFinite(v) && v > 0) {
      state.settings[el.dataset.setting] = v;
      settingsChanged();
    }
  }
  if (el.dataset.member != null) {
    const m = members(state.settings)[Number(el.dataset.member)];
    if (m && el.value.trim()) {
      m.name = el.value.trim();
      state.settings.members = members(state.settings);
      save();
    }
  }
}

window.addEventListener('hashchange', () => { ui.preview = null; ui.more = null; ui.alt = null; ui.swap = false; ui.swapFrom = null; render(); window.scrollTo(0, 0); });
render();

// Значок на экране і адкрыццё без сеткі.
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Дапаможная інфармацыя для распрацоўкі ў кансолі.
window.talerka = { get state() { return state; }, PRODUCTS, GROUPS, BY_TEMPLATE };
