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

function drillLabel(id) {
  return DRILLS.find((d) => d.id === id)?.label ?? '';
}

/**
 * 1日ぶんを、人が読める文章にする。保護者やコーチに LINE などで送るためのもの。
 * JSON のバックアップ（exportDayLogs）とは別。判定や合計は足さない。
 */
function formatDayLogText(log) {
  const lines = [`${formatDrillDate(log.date)} きょうのドリル`];
  for (const def of DRILLS) {
    const unit = def.unitLabel !== '' ? `（${def.unitLabel}）` : '';
    lines.push(`${def.label}${unit} ${valueText(def, log.values[def.id])}`);
  }
  if (log.best) lines.push(`いちばん よかった：${drillLabel(log.best)}`);
  if (log.note) lines.push(`ふりかえり：${log.note}`);
  return lines.join('\n');
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
  const [date, setDate] = useState(todayKey);
  const { log, saveFailed, adjust, toggleDone, setBest, setNote } = useDrillLog(date);
  const [copyState, setCopyState] = useState(null); // null | 'ok' | 'fail'
  const [shareState, setShareState] = useState(null); // null | 'shared' | 'copied' | 'fail'

  const [selectedKey, setSelectedKey] = useState(null);

  // 画面を開いたまま日付をまたぐことがある（前夜に開いたタブを翌日そのまま使う）。
  // 画面に戻ってきたときに今日の日付を取り直し、変わっていたら入力先を今日に切りかえる。
  // 取り直さないと、翌日の +1 が前日のレコードに入り、カレンダーの「今日」も前日のままになる。
  useEffect(() => {
    function refreshDate() {
      if (document.visibilityState === 'hidden') return;
      const now = todayKey();
      setDate((prev) => {
        if (prev === now) return prev;
        setSelectedKey(null);
        return now;
      });
    }
    document.addEventListener('visibilitychange', refreshDate);
    window.addEventListener('focus', refreshDate);
    return () => {
      document.removeEventListener('visibilitychange', refreshDate);
      window.removeEventListener('focus', refreshDate);
    };
  }, []);

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

  useEffect(() => {
    if (!shareState) return undefined;
    const timer = setTimeout(() => setShareState(null), 2000);
    return () => clearTimeout(timer);
  }, [shareState]);

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(exportDayLogs());
      setCopyState('ok');
    } catch {
      setCopyState('fail');
    }
  }

  /**
   * きょうのぶんを読める文章で送る。共有シートがあればそれ、なければクリップボード。
   * navigator.share はユーザー操作の中でしか呼べない。onClick から同期で呼ぶこと。
   * 文章を作る前に await を挟むと iOS Safari では拒否される。
   */
  async function shareToday() {
    const text = formatDayLogText(log);
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text });
        setShareState('shared');
        return;
      } catch (e) {
        // 共有シートを閉じただけなら何も言わない
        if (e?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setShareState('copied');
    } catch {
      setShareState('fail');
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
        <div className="space-y-2">
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

        {/* ふりかえり（任意。書かなくても離れられる）
            「どれ」は6種目からの選択なので、文章ではなくタップで答える。
            キーボードが要るのは「なんで」の一言だけ。順位や点数ではなく本人の選択なので、判定にはならない */}
        <section className="mt-6 bg-white rounded-3xl border-2 border-gray-300 shadow-sm p-4">
          <h2 className="text-lg font-black text-gray-900">ふりかえり</h2>
          <p className="mt-1 text-sm font-bold text-gray-700 leading-snug">
            きょう いちばん よかったのは どれ？
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DRILLS.map((def) => {
              const picked = log.best === def.id;
              return (
                <button
                  type="button"
                  key={def.id}
                  onClick={() => setBest(def.id)}
                  aria-pressed={picked}
                  className={`min-h-12 px-4 rounded-full border-2 border-gray-900 text-sm font-black select-none touch-manipulation active:scale-95 transition-transform cursor-pointer ${
                    picked ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  {def.label}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm font-bold text-gray-700 leading-snug">
            なんで よかった？（かかなくてもいい）
          </p>
          <textarea
            value={log.note ?? ''}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-2xl border-2 border-gray-300 bg-white px-3 py-2 text-base font-bold text-gray-900 focus:outline-none focus:border-gray-900"
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
                  {(selectedLog.best || selectedLog.note) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 text-sm font-bold text-gray-900">
                      {selectedLog.best && <p>いちばん よかった：{drillLabel(selectedLog.best)}</p>}
                      {selectedLog.note && <p className="whitespace-pre-wrap">{selectedLog.note}</p>}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm font-bold text-gray-700">この日は かいていません</p>
              )}
            </div>
          )}
        </section>

        {/* 「おくる」は保護者やコーチに読める文章で渡すため。
            「コピー」は localStorage が消えたときの保険（JSON）。どちらも目立たない位置に小さく */}
        <div className="mt-8 text-center">
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={shareToday}
              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
            >
              きょうのきろくを おくる
            </button>
            <button
              type="button"
              onClick={copyAll}
              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer"
            >
              きろくをコピー
            </button>
          </div>
          {(shareState || copyState) && (
            <p className="mt-2 text-xs font-bold text-gray-700">
              {shareState === 'shared' && 'おくりました'}
              {shareState === 'copied' && 'コピーしました'}
              {shareState === 'fail' && 'おくれませんでした'}
              {!shareState && (copyState === 'ok' ? 'コピーしました' : 'コピーできませんでした')}
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
