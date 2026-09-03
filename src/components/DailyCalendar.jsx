import { useState } from 'react';
import { toDateKey, todayKey as getTodayKey } from '../utils/daily';

/**
 * トップのカレンダー。今日のトレーニングの入口そのもの。
 *
 * 升目の意味は3つだけ。
 *   ✓  … 終えた日
 *   ！ … 初めて終えた日よりあとで、やっていない日（あとからやれる）
 *   今日 … まだなら押して始める
 *
 * 初めて終えた日より前には ！ を出さない。初めて開いた月の過去が全部 ！ だと
 * 「見張られている」感じになるだけで、練習にはつながらないため。
 */

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

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

/** 升目ごとの状態 */
function dayStatus(key, { log, firstDoneKey, todayKey }) {
  if (log[key]) return 'done';
  if (key === todayKey) return 'today';
  if (key > todayKey) return 'future';
  if (firstDoneKey && key > firstDoneKey) return 'missed';
  return 'past';
}

const CELL_STYLE = {
  done:   'bg-green-500 text-white shadow-sm',
  today:  'bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-md',
  missed: 'bg-white border-2 border-amber-300 text-amber-700',
  past:   'bg-gray-100 text-gray-400',
  future: 'bg-gray-50 text-gray-300',
};

const CELL_MARK = {
  done: '✓',
  today: '▶',
  missed: '！',
  past: '',
  future: '',
};

export default function DailyCalendar({ log, firstDoneKey, selectedKey, onPickDay }) {
  const today = new Date();
  const todayKey = getTodayKey();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });

  const cells = buildMonthCells(cursor.year, cursor.month);
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth();

  function moveMonth(delta) {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => moveMonth(-1)}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-black active:scale-95 transition-all cursor-pointer"
          aria-label="前の月"
        >
          ‹
        </button>
        <div className="text-sm font-black text-gray-800">
          {cursor.year}年{cursor.month + 1}月
        </div>
        <button
          onClick={() => moveMonth(1)}
          disabled={isCurrentMonth}
          className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 font-black active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default"
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
          const status = dayStatus(key, { log, firstDoneKey, todayKey });
          const isSelected = key === selectedKey;
          return (
            <button
              key={key}
              onClick={() => onPickDay(key, status)}
              disabled={status === 'future'}
              aria-label={`${d.getMonth() + 1}月${d.getDate()}日`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:cursor-default disabled:active:scale-100 ${
                CELL_STYLE[status]
              } ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
            >
              <span className="leading-none">{d.getDate()}</span>
              <span className="text-[10px] leading-none mt-0.5 h-[10px]">{CELL_MARK[status]}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] font-bold text-gray-500">
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-green-500 align-middle mr-1" />やった</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded border-2 border-amber-300 align-middle mr-1" />まだ（押すとやれる）</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-gradient-to-br from-orange-500 to-red-600 align-middle mr-1" />今日</span>
      </div>
    </div>
  );
}
