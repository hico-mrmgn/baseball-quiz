import { useEffect, useMemo, useState } from 'react';
import { DRILLS } from '../data/drills';
import { useDrillLog } from '../hooks/useDrillLog';
import { listDayLogs, exportDayLogs, hasRecord } from '../utils/drillStorage';
import { todayKey } from '../utils/daily';
import DrillCard from './DrillCard';
import DrillCalendar from './DrillCalendar';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 'YYYY-MM-DD' → '9月3日(木)' */
function formatDrillDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}月${d}日(${WEEKDAYS[date.getDay()]})`;
}

/** 日ごとの中身に出す文字。未実施は「—」、done は「やった」。数字はそのまま。 */
function valueText(def, value) {
  if (value === undefined) return '—';
  if (def.input === 'done') return value ? 'やった' : '—';
  return String(value);
}

/**
 * 自主トレのドリル記録画面。
 *
 * 成績表ではなく記録帳。判定・スコア・達成率・連続日数・前日比は出さず、
 * 数える機能だけを提供する。数字に評価がつくと、フォームを崩してでも本数を
 * 稼ぐ方向に働くため。見ているのは結果ではなく実行の質。
 *
 * 小4が親のいないところで一人で使う前提なので、言葉は平易にし、
 * 指示・叱咤・励ましは出さない。
 */
export default function DrillLogScreen({ onBack }) {
  const [date] = useState(todayKey);
  const { log, saveFailed, adjust, toggleDone, setNote } = useDrillLog(date);
  const [copyState, setCopyState] = useState(null); // null | 'ok' | 'fail'

  const [selectedKey, setSelectedKey] = useState(null);

  // 過去の日は開いたときに1回だけ読めばよい。きょうのぶんは操作のたびに変わる
  const pastLogs = useMemo(
    () => listDayLogs().filter((l) => l.date !== date && hasRecord(l)),
    [date],
  );
  const recordedDates = useMemo(() => {
    const set = new Set(pastLogs.map((l) => l.date));
    if (hasRecord(log)) set.add(date);
    return set;
  }, [pastLogs, log, date]);
  const selectedLog = selectedKey ? pastLogs.find((l) => l.date === selectedKey) : null;

  /** 升目を押したとき。今日は上の入力欄に戻り、過去の日はその日の中身を見せる。 */
  function pickDay(key) {
    if (key === date) {
      setSelectedKey(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedKey((k) => (k === key ? null : key));
  }

  useEffect(() => {
    if (!copyState) return undefined;
    const timer = setTimeout(() => setCopyState(null), 2000);
    return () => clearTimeout(timer);
  }, [copyState]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(exportDayLogs());
      setCopyState('ok');
    } catch {
      setCopyState('fail');
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200">
        <div className="max-w-2xl mx-auto px-3 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 min-h-12 rounded-xl bg-gray-100 text-gray-900 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer text-sm font-bold flex-shrink-0"
          >
            ← 戻る
          </button>
          <div>
            <h1 className="text-sm font-black text-gray-700">📒 きょうのドリル</h1>
            <p className="text-lg font-black text-gray-900 leading-tight">{formatDrillDate(date)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        <div className="space-y-3">
          {DRILLS.map((def) => (
            <DrillCard
              key={def.id}
              def={def}
              value={log.values[def.id]}
              onAdjust={adjust}
              onToggle={toggleDone}
            />
          ))}
        </div>

        {/* ふりかえり（任意。書かなくても離れられる） */}
        <section className="mt-6 bg-white rounded-3xl border-2 border-gray-300 shadow-sm p-4">
          <h2 className="text-lg font-black text-gray-900">ふりかえり</h2>
          <p className="mt-1 text-sm font-bold text-gray-700 leading-snug">
            きょう いちばん よかったのは どれ？<br />
            なんで よかった？
          </p>
          <textarea
            value={log.note ?? ''}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="mt-3 w-full rounded-2xl border-2 border-gray-300 bg-white px-3 py-2 text-base font-bold text-gray-900 focus:outline-none focus:border-gray-900"
          />
        </section>

        {/* カレンダー：どの日に書いたか。押した日の中身を下に出す。判定・強調はしない */}
        <section className="mt-6 bg-white rounded-3xl border-2 border-gray-300 shadow-sm p-4">
          <h2 className="text-lg font-black text-gray-900 mb-3">かいた日</h2>
          <DrillCalendar
            recordedDates={recordedDates}
            todayKey={date}
            selectedKey={selectedKey}
            onPickDay={pickDay}
          />

          {selectedKey && (
            <div className="mt-3 rounded-2xl border-2 border-gray-300 p-3 fade-slide-in">
              <div className="text-base font-black text-gray-900 mb-2">{formatDrillDate(selectedKey)}</div>
              {selectedLog ? (
                <>
                  <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-sm font-bold text-gray-900 tabular-nums">
                    {DRILLS.map((def) => (
                      <div key={def.id} className="contents">
                        <dt>{def.label}</dt>
                        <dd className="text-right">{valueText(def, selectedLog.values[def.id])}</dd>
                      </div>
                    ))}
                  </dl>
                  {selectedLog.note && (
                    <p className="mt-2 pt-2 border-t border-gray-200 text-sm font-bold text-gray-900 whitespace-pre-wrap">
                      {selectedLog.note}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm font-bold text-gray-700">この日は かいていません</p>
              )}
            </div>
          )}
        </section>

        {/* localStorage が消えたときの保険。目立たない位置に小さく */}
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={copyAll}
            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
          >
            きろくをコピー
          </button>
          {copyState && (
            <p className="mt-2 text-xs font-bold text-gray-700">
              {copyState === 'ok' ? 'コピーしました' : 'コピーできませんでした'}
            </p>
          )}
        </div>
      </div>

      {/* 保存に失敗したときだけ、控えめに1行。成功時は何も出さない */}
      {saveFailed && (
        <div className="fixed bottom-0 inset-x-0 bg-white border-t-2 border-gray-200 px-3 py-2 text-center text-xs font-bold text-gray-700">
          きろくが ほぞんできませんでした
        </div>
      )}
    </div>
  );
}
