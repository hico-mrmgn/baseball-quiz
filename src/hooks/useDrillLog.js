import { useCallback, useEffect, useRef, useState } from 'react';
import { DRILLS, clampDrillValue } from '../data/drills';
import { readDayLog, writeDayLog, touchMeta } from '../utils/drillStorage';

/**
 * 1日ぶんのドリル記録を読み込み・更新・保存するフック。
 *
 * 操作のたびに即保存する（データが小さいのでデバウンスは要らない）。
 * 保存に失敗しても画面の操作は続けられるようにし、失敗したことだけを
 * saveFailed で知らせる。成功時は何も出さない。
 *
 * 未実施の種目はキーごと持たない。「0回」と「やらなかった」を区別するため。
 */
export function useDrillLog(date) {
  // どの日のレコードかを状態と一緒に持つ。日付が変わったら（画面を開いたまま
  // 日付をまたいだとき）描画中にその日のレコードへ差し替える。差し替えないと、
  // 翌日の +1 が前日のレコードに入る。
  const [entry, setEntry] = useState(() => ({ date, log: readDayLog(date) }));
  const [saveFailed, setSaveFailed] = useState(false);
  let log = entry.log;
  if (entry.date !== date) {
    log = readDayLog(date);
    setEntry({ date, log });
  }

  // 連打しても直前の値から数えられるよう、最新のレコードを ref にも持つ
  const logRef = useRef(log);
  useEffect(() => {
    logRef.current = log;
  }, [log]);

  useEffect(() => {
    touchMeta();
  }, []);

  const commit = useCallback((nextLog) => {
    const next = { ...nextLog, updatedAt: new Date().toISOString() };
    logRef.current = next;
    setEntry({ date: next.date, log: next });
    setSaveFailed(!writeDayLog(next));
  }, []);

  /** +1 / −1。まだ触っていない種目に −1 をしても何も起きない。 */
  const adjust = useCallback((id, delta) => {
    const def = DRILLS.find((d) => d.id === id);
    if (!def) return;
    const current = logRef.current;
    const hasValue = Object.prototype.hasOwnProperty.call(current.values, id);
    if (!hasValue && delta < 0) return;
    const value = clampDrillValue(def, (current.values[id] ?? 0) + delta);
    commit({ ...current, values: { ...current.values, [id]: value } });
  }, [commit]);

  /** やった／やってない のトグル。やってないに戻したらキーごと消す。 */
  const toggleDone = useCallback((id) => {
    const def = DRILLS.find((d) => d.id === id);
    if (!def) return;
    const current = logRef.current;
    const values = { ...current.values };
    if (values[id]) {
      delete values[id];
    } else {
      values[id] = 1;
    }
    commit({ ...current, values });
  }, [commit]);

  /** きょう いちばん よかった種目。同じ種目をもう一度押したら外す（キーごと消す）。 */
  const setBest = useCallback((id) => {
    if (!DRILLS.some((d) => d.id === id)) return;
    const current = logRef.current;
    const next = { ...current };
    if (next.best === id) {
      delete next.best;
    } else {
      next.best = id;
    }
    commit(next);
  }, [commit]);

  /** ふりかえり。空になったらキーごと消す。 */
  const setNote = useCallback((text) => {
    const current = logRef.current;
    const next = { ...current };
    if (text === '') {
      delete next.note;
    } else {
      next.note = text;
    }
    commit(next);
  }, [commit]);

  return { log, saveFailed, adjust, toggleDone, setBest, setNote };
}
