import { useState } from 'react';
import { DRILLS } from '../data/drills';
import { useDrillLog } from '../hooks/useDrillLog';
import { todayKey } from '../utils/daily';
import DrillCard from './DrillCard';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/** 'YYYY-MM-DD' → '9月3日(木)' */
function formatDrillDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}月${d}日(${WEEKDAYS[date.getDay()]})`;
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
  const { log, saveFailed, adjust, toggleDone } = useDrillLog(date);

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
            <h1 className="text-base font-black text-gray-900">📒 きょうのドリル</h1>
            <p className="text-xs font-bold text-gray-700">{formatDrillDate(date)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-3 py-4 pb-24">
        <div className="text-2xl font-black text-gray-900 mb-3">{formatDrillDate(date)}</div>

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
