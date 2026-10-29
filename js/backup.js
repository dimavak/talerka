// Копія дадзеных у файл і аднаўленне з яго. Гэта адзіны спосаб не страціць чэкі і план,
// калі браўзер ачысціць сховішча, і перанесці ўсё на іншы тэлефон, пакуль няма сервера.
import { VERSION, migrate } from './store.js';
import { receiptCount } from './receipt.js';

export const KIND = 'talerka-backup';

// Колькі дзён без копіі — ужо варта нагадаць.
export const REMIND_DAYS = 30;

export function backupName(today) {
  return `talerka-${today}.json`;
}

export function makeBackup(state, now) {
  return JSON.stringify({ kind: KIND, version: VERSION, savedAt: now, state }, null, 1);
}

export class BackupError extends Error {}

// Тэкст файла → стан бягучай версіі і кароткае апісанне, што ў копіі.
// Прымае і голы стан (калі нехта захаваў talerka.v2 з кансолі).
export function readBackup(text, today) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new BackupError('Гэта не файл копіі Talerka');
  }
  if (!data || typeof data !== 'object') throw new BackupError('Гэта не файл копіі Talerka');
  const raw = data.kind === KIND ? data.state : data;
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lines) || !raw.settings) {
    throw new BackupError('Гэта не файл копіі Talerka');
  }
  if ((data.version ?? raw.version ?? 1) > VERSION) {
    throw new BackupError('Копія з навейшай версіі Talerka: абнавіце старонку і паспрабуйце зноў');
  }
  const state = migrate(raw, today);
  const savedAt = typeof data.savedAt === 'string' ? data.savedAt.slice(0, 10) : null;
  state.backupAt = savedAt ?? state.backupAt ?? null;
  return { state, savedAt, summary: summarize(state) };
}

export function summarize(state) {
  const dates = state.lines.map((l) => l.date).filter(Boolean).sort();
  return {
    receipts: receiptCount(state.lines),
    from: dates[0] ?? null,
    to: dates[dates.length - 1] ?? null,
    cooked: (state.cooked ?? []).length,
    planDays: new Set(Object.keys(state.plan ?? {}).map((k) => k.slice(0, 10))).size,
  };
}

// Ці нагадаць пра копію: ёсць што губляць, а копіі даўно не было.
export function needsBackup(state, today) {
  if (!state.lines.length) return false;
  if (!state.backupAt) return true;
  const days = (Date.parse(today) - Date.parse(state.backupAt)) / 864e5;
  return days >= REMIND_DAYS;
}
