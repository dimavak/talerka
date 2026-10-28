// Падрыхтоўка фота чэка перад распазнаваннем. Чыстыя функцыі над {data, width, height} (RGBA),
// каб іх можна было праверыць у Node без браўзера.
// Крокі: шэры колер → выразаць светлую паперу з цёмнага фону → павялічыць дробны шрыфт →
// адаптыўны парог (цень ад рукі ці тэлефона не робіць палову чэка чорнай).

export function toGray({ data, width, height }) {
  const g = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0; j < g.length; i += 4, j++) g[j] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  return { gray: g, width, height };
}

// Парог Оцу: дзяляе пікселі на «папера» і «фон».
export function otsu(gray) {
  const hist = new Array(256).fill(0);
  for (const v of gray) hist[v]++;
  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, level = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB, mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) ** 2;
    if (between > best) { best = between; level = t; }
  }
  return level;
}

// Найдаўжэйшы адрэзак, дзе доля светлых пікселяў вышэй за мяжу.
function longestRun(profile, min) {
  let best = [0, profile.length - 1], start = -1, bestLen = 0;
  for (let i = 0; i <= profile.length; i++) {
    if (i < profile.length && profile[i] >= min) { if (start < 0) start = i; }
    else if (start >= 0) {
      if (i - start > bestLen) { bestLen = i - start; best = [start, i - 1]; }
      start = -1;
    }
  }
  return bestLen ? best : [0, profile.length - 1];
}

// Рамка чэка: светлая паласа паперы. Калі фон таксама светлы (скрыншот), вяртае ўвесь кадр.
export function paperBox({ gray, width, height }) {
  const t = otsu(gray);
  const bright = (x, y) => gray[y * width + x] > t;
  const cols = new Array(width).fill(0);
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x++) if (bright(x, y)) cols[x]++;
  const rowsSampled = Math.ceil(height / 2);
  // Мяжа адносна самай светлай калонкі: асветлены край стала не павінен перамагчы паперу.
  const colShare = cols.map((c) => c / rowsSampled);
  const [x0, x1] = longestRun(colShare, Math.max(0.2, Math.min(0.35, 0.5 * Math.max(...colShare))));
  const rows = new Array(height).fill(0);
  for (let y = 0; y < height; y++) for (let x = x0; x <= x1; x++) if (bright(x, y)) rows[y]++;
  const [y0, y1] = longestRun(rows.map((r) => r / (x1 - x0 + 1)), 0.3);
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  // Амаль увесь кадр светлы ці рамка надта малая — гэта не фота паперы на стале.
  if (w * h > 0.85 * width * height || w < width * 0.12 || h < height * 0.12) return { x: 0, y: 0, w: width, h: height };
  const m = Math.round(w * 0.02);
  const x = Math.max(0, x0 - m), y = Math.max(0, y0 - m);
  return { x, y, w: Math.min(width, x1 + m + 1) - x, h: Math.min(height, y1 + m + 1) - y };
}

// Выразаць і змяніць памер (білінейна).
export function cropScale({ gray, width }, box, scale) {
  const W = Math.max(1, Math.round(box.w * scale)), H = Math.max(1, Math.round(box.h * scale));
  const out = new Uint8ClampedArray(W * H);
  for (let Y = 0; Y < H; Y++) {
    const sy = Math.min(box.h - 1.001, Math.max(0, (Y + 0.5) / scale - 0.5));
    const y = Math.floor(sy), fy = sy - y;
    for (let X = 0; X < W; X++) {
      const sx = Math.min(box.w - 1.001, Math.max(0, (X + 0.5) / scale - 0.5));
      const x = Math.floor(sx), fx = sx - x;
      const i = (box.y + y) * width + box.x + x;
      const a = gray[i], b = gray[i + 1], c = gray[i + width], d = gray[i + width + 1];
      out[Y * W + X] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }
  }
  return { gray: out, width: W, height: H };
}

// Адаптыўны парог Брэдлі: піксель цёмны, калі ён на t цямнейшы за сярэдняе вакол.
export function adaptiveThreshold({ gray, width, height }, t = 0.15) {
  const r = Math.max(8, Math.round(width / 16)) >> 1;
  const sat = new Float64Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += gray[y * width + x];
      sat[(y + 1) * (width + 1) + x + 1] = sat[y * (width + 1) + x + 1] + row;
    }
  }
  const out = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    const ya = Math.max(0, y - r), yb = Math.min(height, y + r + 1);
    for (let x = 0; x < width; x++) {
      const xa = Math.max(0, x - r), xb = Math.min(width, x + r + 1);
      const n = (yb - ya) * (xb - xa);
      const s = sat[yb * (width + 1) + xb] - sat[ya * (width + 1) + xb] - sat[yb * (width + 1) + xa] + sat[ya * (width + 1) + xa];
      out[y * width + x] = gray[y * width + x] * n < s * (1 - t) ? 0 : 255;
    }
  }
  return { gray: out, width, height };
}

// Маштаб так, каб шырыня чэка была каля 1200 px: шрыфт чэка становіцца ~30 px, як любіць Tesseract.
// Вялікія скрыншоты не павялічваюцца, а памяншаюцца, каб не губляць памяць тэлефона.
export function targetScale(w, h) {
  const s = Math.min(4, Math.max(0.5, 1200 / w));
  return Math.min(s, Math.sqrt(36e6 / (w * h)));
}

// Цёмная тэма скрыншота: светлы тэкст на цёмным фоне пераварочваецца.
export function invertIfDark(g) {
  // Фота чэка на цёмным стале таксама цёмнае ў сярэднім, але ў ім ёсць шмат светлай паперы.
  let sum = 0, bright = 0, n = 0;
  for (let i = 0; i < g.gray.length; i += 7, n++) { sum += g.gray[i]; if (g.gray[i] > 180) bright++; }
  if (sum / n >= 70 || bright / n >= 0.12) return g;
  return { ...g, gray: g.gray.map((v) => 255 - v) };
}

export function prepare(rgba) {
  const g = invertIfDark(toGray(rgba));
  const box = paperBox(g);
  const scaled = cropScale(g, box, targetScale(box.w, box.h));
  return { ...adaptiveThreshold(scaled), box };
}

export function grayToRGBA({ gray, width, height }) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < gray.length; i++) {
    data[i * 4] = data[i * 4 + 1] = data[i * 4 + 2] = gray[i];
    data[i * 4 + 3] = 255;
  }
  return { data, width, height };
}
