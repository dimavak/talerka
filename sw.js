// Service worker: аплікацыя адкрываецца і без сеткі (спіс пакупак у краме), значок на экране.
// Свае файлы — спачатку з сеткі, каб абнаўленні прыходзілі адразу; без сеткі — з кэша.
// Распазнаванне (vendor/) вялікае і не мяняецца — бярэцца з кэша, калі ўжо загружалася.
const CACHE = 'talerka-r3-1';
const SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css', 'icon.svg', 'icon-192.png',
  'js/app.js', 'js/products.js', 'js/templates.js', 'js/recipe-parts.js', 'js/recipes-more.js', 'js/engine.js', 'js/receipt.js', 'js/store.js', 'js/demo.js',
  'js/stock.js', 'js/plan.js', 'js/shopping.js', 'js/receipt-ocr.js', 'js/receipt-image.js', 'js/ocr.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  e.respondWith(fetch(e.request).then((res) => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('index.html'))));
});
