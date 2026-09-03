import { useState } from 'react';
import { toDateKey } from '../utils/daily';

/**
 * ドリル記録の月カレンダー。「どの日に書いたか」を見るためのもの。
 *
 * 升目の意味は2つだけ。
 *   ●   … 記録を書いた日
 *   今日 … 押すと上の入力欄に戻る
 *
 * 書いていない日には何も出さない。「！」や色分けで催促はしない。
 * トップのカレンダー（DailyCalendar）とは意味が違うので、部品を共有しない。
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

const NAV_BUTTON =
  'w-12 h-12 rounded-full bg-gray-100 text-gray-900 text-xl font-black active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-default';

export default function DrillCalendar({ recordedDates, todayKey, selectedKey, onPickDay }) {
  const today = new Date();
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
        <button type="button" onClick={() => moveMonth(-1)} className={NAV_BUTTON} aria-label="前の月">
          ‹
        </button>
        <div className="text-base font-black text-gray-900">
          {cursor.year}年{cursor.month + 1}月
        </div>
        <button
          type="button"
          onClick={() => moveMonth(1)}
          disabled={isCurrentMonth}
          className={NAV_BUTTON}
          aria-label="次の月"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[10px] font-black text-gray-700">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} />;
          const key = toDateKey(d);
          const isToday = key === todayKey;
          const isFuture = key > todayKey;
          const recorded = recordedDates.has(key);
          const isSelected = key === selectedKey;
          const style = isToday
            ? 'bg-gray-900 text-white'
            : isFuture
              ? 'bg-gray-50 text-gray-300'
              : recorded
                ? 'bg-white border-2 border-gray-900 text-gray-900'
                : 'bg-gray-100 text-gray-500';
          return (
            <button
              type="button"
              key={key}
              onClick={() => onPickDay(key)}
              disabled={isFuture}
              aria-label={`${d.getMonth() + 1}月${d.getDate()}日${recorded ? '（きろくあり）' : ''}`}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-bold transition-all cursor-pointer active:scale-95 disabled:cursor-default disabled:active:scale-100 ${style} ${
                isSelected ? 'ring-2 ring-gray-900 ring-offset-2' : ''
              }`}
            >
              <span className="leading-none">{d.getDate()}</span>
              <span className="text-[10px] leading-none mt-0.5 h-[10px]">{recorded ? '●' : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[10px] font-bold text-gray-700">
        <span>● かいた日</span>
        <span><span className="inline-block w-2.5 h-2.5 rounded bg-gray-900 align-middle mr-1" />今日</span>
      </div>
    </div>
  );
}
