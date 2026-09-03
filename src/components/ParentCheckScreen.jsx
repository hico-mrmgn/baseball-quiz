import { useMemo, useState } from 'react';
import { getDailyLog, getDailyStreak, getDailyData, toDateKey } from '../utils/daily';

/**
 * 保護者向け：今日のトレーニングを「毎日やったか」をカレンダーで確かめる画面。
 *
 * 子ども向けの結果画面は「何点だったか」「次に何を練習するか」で作っているが、
 * 保護者が知りたいのは「今日やったのか」「今週は何日やったのか」のほう。
 * なので点数より先に、やった日の印だけが並ぶカレンダーを出す。
 *
 * 印がつくのは、実戦5場面 → 守り切れ1回 を最後まで終えた日だけ。
 * 途中でやめた日にはつかない（ストリークの判定と同じ基準）。
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatTime(ms) {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** その月のカレンダーの升目（前後の空白を含めて7の倍数）を作る */
function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function ParentCheckScreen({ onBack }) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selectedKey, setSelectedKey] = useState(todayKey);

  const log = useMemo(() => getDailyLog(), []);
  const streak = getDailyStreak();
  const bestStreak = getDailyData().bestStreak || 0;

  const cells = buildMonthCells(cursor.year, cursor.month);
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  // その月の「やった日数 / 今日までの日数」
  const monthPrefix = `${cursor.year}-${String(cursor.month + 1).padStart(2, '0')}-`;
  const doneInMonth = Object.keys(log).filter((k) => k.startsWith(monthPrefix)).length;
  const daysSoFar = isCurrentMonth
    ? today.getDate()
    : new Date(cursor.year, cursor.month + 1, 0).getDate();

  // 直近7日（今日を含む）
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return toDateKey(d);
  });
  const doneLast7 = last7.filter((k) => log[k]).length;

  const totalDays = Object.keys(log).length;
  const selected = selectedKey ? log[selectedKey] : null;

  function moveMonth(delta) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  const isFuture = (key) => key > todayKey;

  return (
    <div className="min-h-screen bg-gray-50 px-3 lg:px-6 py-6">
      <div className="max-w-md lg:max-w-2xl w-full mx-auto">

        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={onBack}
            className="px-4 h-10 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 font-bold text-base active:scale-95 transition-all cursor-pointer gap-1"
          >
            ← もどる
          </button>
          <h1 className="text-xl font-black text-gray-900">📅 毎日のチェック</h1>
        </div>

        {/* 今日やったか。保護者が最初に知りたいのはこれ */}
        <div className={`rounded-3xl p-5 mb-4 shadow-lg text-center ${
          log[todayKey]
            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
            : 'bg-white border-2 border-gray-200 text-gray-700'
        }`}>
          <div className={`text-xs font-black mb-1 ${log[todayKey] ? 'text-green-100' : 'text-gray-400'}`}>
            今日（{today.getMonth() + 1}/{today.getDate()}）
          </div>
          <div className="text-3xl font-black">
            {log[todayKey] ? '✅ やりました' : '⬜ まだです'}
          </div>
          {log[todayKey]?.at && (
            <div className="text-xs font-bold text-green-100 mt-1">
              {formatTime(log[todayKey].at)} に終了
            </div>
          )}
        </div>

        {/* 集計 */}
        <div className="bg-white rounded-3xl shadow-xl p-4 mb-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <div className="text-2xl font-black text-green-600">{doneLast7}<span className="text-xs text-gray-400">/7</span></div>
              <div className="text-[10px] text-gray-500 font-bold">この7日</div>
            </div>
            <div>
              <div className="text-2xl font-black text-blue-600">{doneInMonth}<span className="text-xs text-gray-400">/{daysSoFar}</span></div>
              <div className="text-[10px] text-gray-500 font-bold">{isCurrentMonth ? '今月' : 'この月'}</div>
            </div>
            <div>
              <div className="text-2xl font-black text-orange-500">{streak}</div>
              <div className="text-[10px] text-gray-500 font-bold">連続</div>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-500">{bestStreak}</div>
              <div className="text-[10px] text-gray-500 font-bold">最長連続</div>
            </div>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-3xl shadow-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => moveMonth(-1)}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-black active:scale-95 transition-all cursor-pointer"
              aria-label="前の月"
            >
              ‹
            </button>
            <div className="text-base font-black text-gray-800">
              {cursor.year}年{cursor.month + 1}月
            </div>
            <button
              onClick={() => moveMonth(1)}
              disabled={isCurrentMonth}
              className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 font-black active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
              aria-label="次の月"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`text-center text-[10px] font-black ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-400'
                }`}
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={`blank-${i}`} />;
              const key = toDateKey(d);
              const done = Boolean(log[key]);
              const future = isFuture(key);
              const isToday = key === todayKey;
              const isSelected = key === selectedKey;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedKey(key)}
                  disabled={future}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer disabled:cursor-default ${
                    done
                      ? 'bg-green-500 text-white shadow-sm'
                      : future
                        ? 'bg-gray-50 text-gray-300'
                        : 'bg-gray-100 text-gray-500'
                  } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''} ${
                    isToday && !isSelected ? 'ring-2 ring-amber-400 ring-offset-1' : ''
                  }`}
                >
                  <span className="leading-none">{d.getDate()}</span>
                  <span className="text-[10px] leading-none mt-0.5">{done ? '✓' : future ? '' : '·'}</span>
                </button>
              );
            })}
          </div>

          {/* 選んだ日の中身 */}
          <div className="mt-3 pt-3 border-t border-gray-100 min-h-[3rem]">
            {selectedKey && (
              <div className="text-sm text-gray-700">
                <span className="font-black">
                  {Number(selectedKey.slice(5, 7))}/{Number(selectedKey.slice(8, 10))}
                </span>
                {selected ? (
                  <>
                    <span className="ml-2 font-bold text-green-600">✅ やりました</span>
                    <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {selected.at && <span>終了 {formatTime(selected.at)}</span>}
                      {selected.bestRate != null && <span>最善手率 {selected.bestRate}%</span>}
                      {selected.cleared != null && (
                        <span>守り切れ {selected.cleared ? '成功 🛡️' : '失敗 💧'}</span>
                      )}
                      {!selected.at && selected.bestRate == null && (
                        <span>記録あり（くわしい内容は残っていません）</span>
                      )}
                    </div>
                  </>
                ) : (
                  <span className="ml-2 font-bold text-gray-400">
                    {isFuture(selectedKey) ? 'これから' : 'やっていません'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-4 text-xs text-gray-500 leading-relaxed">
          <div className="font-black text-gray-700 mb-1">印がつく条件</div>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>「今日のトレーニング」（実戦5場面 → 守り切れ1回）を最後まで終えた日につきます。</li>
            <li>途中でやめた日にはつきません。「選んで練習」「基本練習」だけの日にもつきません。</li>
            <li>記録はこの端末（ブラウザ）の中だけに残ります。別の端末では見られません。</li>
          </ul>
          <div className="mt-2 text-gray-400">これまでにやった日数：{totalDays}日</div>
        </div>
      </div>
    </div>
  );
}
