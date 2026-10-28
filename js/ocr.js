// Распазнаванне фота чэка ў браўзеры (Tesseract.js, польская мова). Фота не пакідае прыладу:
// бібліятэка і мадэль мовы ляжаць у vendor/ і грузяцца толькі тады, калі вы ўпершыню дадаеце фота.
import { prepare, grayToRGBA } from './receipt-image.js';

const BASE = new URL('../vendor/tesseract/', import.meta.url).href;
// Вялікія фота памяншаюцца: 12 Мп з камеры не патрэбныя, а памяць тэлефона не бясконцая.
const MAX_SIDE = 3200;

let workerPromise = null;
let onProgress = () => {};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (globalThis.Tesseract) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Не атрымалася загрузіць распазнаванне'));
    document.head.append(s);
  });
}

async function worker() {
  workerPromise ??= (async () => {
    await loadScript(BASE + 'tesseract.min.js');
    const w = await globalThis.Tesseract.createWorker('pol', 1, {
      workerPath: BASE + 'worker.min.js',
      corePath: BASE + 'core',
      langPath: BASE + 'lang',
      logger: (m) => onProgress(m),
    });
    await w.setParameters({ tessedit_pageseg_mode: '4', preserve_interword_spaces: '1' });
    return w;
  })().catch((e) => { workerPromise = null; throw e; });
  return workerPromise;
}

async function imageData(file) {
  let bmp;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(/heic|heif/i.test(file.type || file.name) ? 'Гэты браўзер не адкрывае HEIC. Зрабіце скрыншот фота або захавайце яго як JPG.' : 'Не атрымалася адкрыць выяву');
  }
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * k);
  c.height = Math.round(bmp.height * k);
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return ctx.getImageData(0, 0, c.width, c.height);
}

function toCanvas(p) {
  const c = document.createElement('canvas');
  c.width = p.width;
  c.height = p.height;
  const { data } = grayToRGBA(p);
  c.getContext('2d').putImageData(new ImageData(data, p.width, p.height), 0, 0);
  return c;
}

// Адзін кадр → тэкст. progress(0..1, стадыя) — для паласы на экране.
export async function recognizeFile(file, progress = () => {}) {
  progress(0.02, 'Рыхтую фота');
  const img = await imageData(file);
  const p = prepare(img);
  onProgress = (m) => {
    if (m.status === 'recognizing text') progress(0.15 + 0.85 * m.progress, 'Чытаю радкі');
    else if (/load|initializ/.test(m.status)) progress(0.05 + 0.1 * (m.progress || 0), 'Загружаю распазнаванне (адзін раз)');
  };
  const w = await worker();
  const { data } = await w.recognize(toCanvas(p));
  progress(1, 'Гатова');
  return data.text;
}
