// Service worker: аплікацыя адкрываецца і без сеткі (спіс пакупак у краме), значок на экране.
// Свае файлы — спачатку з сеткі, каб абнаўленні прыходзілі адразу; без сеткі — з кэша.
// Распазнаванне (vendor/) вялікае і не мяняецца — бярэцца з кэша, калі ўжо загружалася.
const CACHE = 'talerka-r4-3';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'icon.svg', 'icon-192.png',
  'js/app.js', 'js/products.js', 'js/templates.js', 'js/recipe-parts.js', 'js/recipes-more.js', 'js/engine.js', 'js/receipt.js', 'js/store.js', 'js/demo.js',
  'js/stock.js', 'js/plan.js', 'js/shopping.js', 'js/receipt-ocr.js', 'js/receipt-image.js', 'js/ocr.js',
  'js/trends.js', 'js/backup.js', 'js/dish-names.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' — не браць старыя файлы з кэша браўзера (GitHub Pages аддае іх з max-age=600).
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.includes('/vendor/')) {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return res;
    })));
    return;
  }
  // no-cache: кожны раз пытаемся ў сервера, ці змяніўся файл, інакш да 10 хвілін пасля абнаўлення
  // браўзер аддае старыя модулі (новая назва стравы не з'яўляецца, ці старое мяшаецца з новым).
  e.respondWith(fetch(e.request, { cache: 'no-cache' }).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('index.html'))));
});
