import { useState } from 'react';
import { themes, questions } from '../data/questions';
import { DIFFICULTY_FILTERS, countByDifficulty } from '../utils/questionPrep';
import { getWrongAnswers } from '../utils/weakness';

/**
 * きそ練習（従来の問題編）の専用画面。
 *
 * テーマ14個と難易度5段階をトップに並べると、それだけで画面の半分を
 * 占めてしまい、主導線が埋もれていた。使う頻度は実戦トレーニングより
 * 低いので、1階層下ろしている。
 */

const themeGroups = [
  { label: '守備ポジション', emoji: '🧤', color: 'blue',
    keys: ['pitcher', 'catcher', 'first', 'second', 'short', 'third', 'outfield'] },
  { label: '攻撃', emoji: '🏏', color: 'rose',
    keys: ['batting', 'baserun', 'coach'] },
  { label: 'ルール知識', emoji: '📖', color: 'amber',
    keys: ['rules', 'umpire'] },
  { label: '特別編', emoji: '🌟', color: 'violet',
    keys: ['fighters', 'npb2025'] },
];

// Tailwindはクラス名を静的に検出するため、色ごとに完全なクラス文字列を持つ
const groupStyles = {
  blue:   { badge: 'bg-blue-100 text-blue-700',     iconBg: 'bg-blue-50',   hover: 'hover:border-blue-400 hover:bg-blue-50',     dot: 'bg-blue-500' },
  rose:   { badge: 'bg-rose-100 text-rose-700',     iconBg: 'bg-rose-50',   hover: 'hover:border-rose-400 hover:bg-rose-50',     dot: 'bg-rose-500' },
  amber:  { badge: 'bg-amber-100 text-amber-700',   iconBg: 'bg-amber-50',  hover: 'hover:border-amber-400 hover:bg-amber-50',   dot: 'bg-amber-500' },
  violet: { badge: 'bg-violet-100 text-violet-700', iconBg: 'bg-violet-50', hover: 'hover:border-violet-400 hover:bg-violet-50', dot: 'bg-violet-500' },
};

export default function DrillScreen({ onBack, onSelectTheme, onRandom, onWeaknessQuiz }) {
  const [difficulty, setDifficulty] = useState('all');
  const wrongCount = getWrongAnswers().length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer text-sm font-bold flex-shrink-0"
          >
            ← 戻る
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900">📖 きそ練習</h1>
            <p className="text-xs text-gray-400">ポジション別の基本を覚える・{questions.length}問</p>
          </div>
        </div>

        {/* むずかしさで絞り込む */}
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
            <span className="text-xs font-black text-gray-500 flex-shrink-0">むずかしさ</span>
            {DIFFICULTY_FILTERS.map((d) => {
              const active = difficulty === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setDifficulty(d.id)}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black border transition-all cursor-pointer ${
                    active
                      ? `${d.color} ring-2 ring-offset-1 ring-gray-300`
                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {d.emoji} {d.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 py-4">

        {/* まとめて解く */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => onRandom(difficulty)}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            <span className="text-2xl">🎲</span>
            <div className="text-left">
              <div className="text-xs font-black text-white">ぜんぶからランダム</div>
              <div className="text-xs font-bold text-sky-100">15問</div>
            </div>
          </button>
          <button
            onClick={wrongCount > 0 ? onWeaknessQuiz : undefined}
            disabled={wrongCount === 0}
            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-2xl transition-all ${
              wrongCount > 0
                ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer'
                : 'bg-gray-100 border border-gray-200 opacity-50 cursor-not-allowed'
            }`}
          >
            <span className="text-2xl">📝</span>
            <div className="text-left">
              <div className={`text-xs font-black ${wrongCount > 0 ? 'text-white' : 'text-gray-400'}`}>
                まちがえた問題
              </div>
              <div className={`text-xs font-bold ${wrongCount > 0 ? 'text-violet-100' : 'text-gray-400'}`}>
                {wrongCount > 0 ? `${wrongCount}問` : 'まだなし'}
              </div>
            </div>
          </button>
        </div>

        {/* テーマ別 */}
        <div className="grid gap-4">
          {themeGroups.map((group) => {
            const style = groupStyles[group.color];
            return (
              <div key={group.label}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`w-1 h-4 rounded-full ${style.dot}`} />
                  <span className="text-sm font-black text-gray-700">
                    {group.emoji} {group.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {group.keys.map((key) => {
                    const theme = themes[key];
                    if (!theme) return null;
                    const themeQuestions = questions.filter((q) => q.theme === key);
                    const count = countByDifficulty(themeQuestions, difficulty);
                    // その難易度の問題が1問もないテーマは選べないようにする
                    const isComingSoon = theme.comingSoon;
                    const isEmpty = !isComingSoon && count === 0;
                    const disabled = isComingSoon || isEmpty;
                    return (
                      <button
                        key={key}
                        onClick={() => !disabled && onSelectTheme(key, difficulty)}
                        disabled={disabled}
                        className={`relative flex flex-col items-center justify-center gap-1 p-2 pt-3 rounded-2xl border shadow-sm h-24 active:scale-[0.96] transition-all ${
                          disabled
                            ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                            : `bg-white border-gray-200 text-gray-800 hover:shadow-md cursor-pointer ${style.hover}`
                        }`}
                      >
                        <span className={`flex items-center justify-center w-10 h-10 rounded-full text-2xl ${disabled ? 'bg-gray-100' : style.iconBg}`}>
                          {theme.icon}
                        </span>
                        <span className="font-bold text-xs text-center leading-tight">{theme.name}</span>
                        {isComingSoon ? (
                          <span className="text-xs text-gray-400">準備中</span>
                        ) : isEmpty ? (
                          <span className="text-xs text-gray-400">この難易度はなし</span>
                        ) : (
                          <span className={`absolute top-1 right-1 text-[10px] font-bold px-1.5 py-px rounded-full ${style.badge}`}>
                            {count}問
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
