/**
 * ドリル記録の localStorage ラッパー。
 *
 * キー名とバージョンはここに集約する（文字列リテラルを各所に散らさない）。
 * 日付ごとにキーを分けているので、1レコードが壊れても被害はその日のぶんで済む。
 * 件数が小さいので索引キーは持たず、一覧は prefix で絞り込んで取る。
 *
 * localStorage の呼び出しはすべて try/catch で包む。Safari のプライベートモードや
 * 容量超過で例外が出ても、画面の操作は続けられるようにするため。
 * 保存に失敗したかどうかは戻り値で返し、呼ぶ側が控えめに知らせる。
 *
 * 将来の予約（今回は実装しない）:
 *   ichi.measure.v1.day.<YYYY-MM-DD> … 月次計測（打球速度・50m走・遠投・片足ホップ）
 *
 * @typedef {import('../data/drills').DrillId} DrillId
 *
 * @typedef {object} DrillDayLog
 * @property {1} v
 * @property {string} date                          'YYYY-MM-DD'（端末ローカル日付）
 * @property {Partial<Record<DrillId, number>>} values  done は 0 / 1。未実施の種目はキーごと持たない
 * @property {string} [note]                        任意。ふりかえり
 * @property {string} updatedAt                     ISO8601
 */

const NAMESPACE = 'ichi.drill';
const VERSION = 'v1';
const PREFIX = `${NAMESPACE}.${VERSION}.`;
export const DRILL_DAY_KEY_PREFIX = `${PREFIX}day.`;
export const DRILL_META_KEY = `${PREFIX}meta`;
export const DRILL_LOG_VERSION = 1;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function dayKey(date) {
  return `${DRILL_DAY_KEY_PREFIX}${date}`;
}

/** 空の1日ぶん。未実施の種目はキーを持たない（「0回」と「やらなかった」を区別する） */
export function emptyDayLog(date) {
  return { v: DRILL_LOG_VERSION, date, values: {}, updatedAt: new Date(0).toISOString() };
}

/** 読めない・壊れているレコードは null。呼ぶ側はその日を新規として扱う。 */
function parseDayLog(raw, date) {
  if (typeof raw !== 'string') return null;
  try {
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (data.v !== DRILL_LOG_VERSION) return null;
    if (!data.values || typeof data.values !== 'object') return null;
    const values = {};
    for (const [id, value] of Object.entries(data.values)) {
      if (typeof value === 'number' && Number.isFinite(value)) values[id] = value;
    }
    return {
      v: DRILL_LOG_VERSION,
      date: typeof data.date === 'string' && DATE_RE.test(data.date) ? data.date : date,
      values,
      ...(typeof data.note === 'string' && data.note !== '' ? { note: data.note } : {}),
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

/** 1日ぶんを読む。無い・壊れている日は空のレコードを返す。 */
export function readDayLog(date) {
  try {
    return parseDayLog(localStorage.getItem(dayKey(date)), date) ?? emptyDayLog(date);
  } catch {
    return emptyDayLog(date);
  }
}

/** 1日ぶんを書く。保存できたら true。失敗しても例外は投げない。 */
export function writeDayLog(log) {
  try {
    localStorage.setItem(dayKey(log.date), JSON.stringify(log));
    return true;
  } catch {
    return false;
  }
}

/** 保存されている日付（'YYYY-MM-DD'）を新しい順に返す。 */
export function listDayDates() {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(DRILL_DAY_KEY_PREFIX))
      .map((k) => k.slice(DRILL_DAY_KEY_PREFIX.length))
      .filter((d) => DATE_RE.test(d))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

/** 全 day レコードを新しい順に返す。壊れた日は飛ばし、他の日を巻き込まない。 */
export function listDayLogs() {
  const logs = [];
  for (const date of listDayDates()) {
    try {
      const log = parseDayLog(localStorage.getItem(dayKey(date)), date);
      if (log) logs.push(log);
    } catch {
      // その日だけ飛ばす
    }
  }
  return logs;
}

/** 全 day レコードを JSON 文字列にする（localStorage が消えたときの保険用）。 */
export function exportDayLogs() {
  return JSON.stringify(listDayLogs(), null, 2);
}

export function readMeta() {
  try {
    const data = JSON.parse(localStorage.getItem(DRILL_META_KEY));
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

/** 最後に開いた日時を残す。失敗しても何もしない。 */
export function touchMeta() {
  try {
    localStorage.setItem(
      DRILL_META_KEY,
      JSON.stringify({ ...readMeta(), lastOpened: new Date().toISOString() }),
    );
  } catch {
    // 保険用の情報なので、失敗しても画面には影響させない
  }
}
