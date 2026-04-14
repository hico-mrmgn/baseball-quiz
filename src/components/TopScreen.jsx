import { useState } from 'react';
import { themes, questions } from '../data/questions';
import { formations, formationCategories } from '../data/formations';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWrongAnswers } from '../utils/weakness';

const themeGroups = [
  {
    label: '守備ポジション',
    keys: ['pitcher', 'catcher', 'first', 'second', 'short', 'third', 'outfield'],
  },
  {
    label: '攻撃',
    keys: ['batting', 'baserun', 'coach'],
  },
  {
    label: 'ルール知識',
    keys: ['rules', 'umpire'],
  },
  {
    label: '特別編',
    keys: ['fighters', 'npb2025'],
  },
];

export default function TopScreen({ onSelectTheme, onHistory, onBadges, onDailyChallenge, onWeaknessQuiz, onFormations }) {
  const [openSection, setOpenSection] = useState(null); // null | 'quiz' | 'guide'
  const levelInfo = getLevelInfo(getLevelData().xp);
  const dailyDone = isDailyCompleted();
  const dailyStreak = getDailyStreak();
  const wrongCount = getWrongAnswers().length;

  const totalQuestions = questions.length;
  const totalFormations = formations.length;

  return (
    <div className="min-h-screen bg-gray-50 px-3 lg:px-6 py-6">
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        {/* ヘッダー */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black text-gray-900">⚾ つぎ、どうする？</h1>
            <p className="text-xs text-gray-400">野球の状況判断クイズ</p>
          </div>
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{levelInfo.emoji}</span>
              <div className="flex-1">
                <div className="text-xs font-black text-gray-800">Lv.{levelInfo.level} {levelInfo.title}</div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onHistory}
            className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all cursor-pointer w-14 h-14 flex-shrink-0"
          >
            <span className="text-xl">📊</span>
            <span className="text-xs font-bold">戦績</span>
          </button>
          <button
            onClick={onBadges}
            className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl border border-gray-200 bg-white shadow-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 active:scale-95 transition-all cursor-pointer w-14 h-14 flex-shrink-0"
          >
            <span className="text-xl">🏅</span>
            <span className="text-xs font-bold">バッジ</span>
          </button>
        </div>

        {/* 今日やること */}
        <div className="mb-4">
          <div className="text-xs font-bold text-gray-400 tracking-wider mb-1.5">今日やること</div>
          <div className="flex gap-1.5">
            <button
              onClick={onDailyChallenge}
              disabled={dailyDone}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl shadow-sm active:scale-[0.98] transition-all cursor-pointer ${
                dailyDone
                  ? 'bg-gray-100 border border-gray-200 opacity-60'
                  : 'bg-blue-50 border border-blue-200 hover:border-blue-300'
              }`}
            >
              <span className="text-2xl">{dailyDone ? '✅' : '📅'}</span>
              <div className={`text-xs font-bold text-center ${dailyDone ? 'text-gray-400' : 'text-blue-800'}`}>
                {dailyDone ? 'クリア済み' : 'きょうのチャレンジ'}
              </div>
              <div className={`text-xs ${dailyDone ? 'text-gray-400' : 'text-blue-600'}`}>
                {dailyStreak > 0 ? `${dailyStreak}日連続 🔥` : '毎日5もん！'}
              </div>
            </button>

            <button
              onClick={wrongCount > 0 ? onWeaknessQuiz : undefined}
              disabled={wrongCount === 0}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl border transition-all ${
                wrongCount > 0
                  ? 'bg-blue-100 border-blue-200 hover:border-blue-300 active:scale-[0.98] cursor-pointer'
                  : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-2xl">📝</span>
              <div className={`text-xs font-bold text-center ${wrongCount > 0 ? 'text-blue-800' : 'text-gray-400'}`}>にがてこくふく</div>
              <div className={`text-xs ${wrongCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{wrongCount > 0 ? `${wrongCount}問` : 'まだなし'}</div>
            </button>

            <button
              onClick={() => onSelectTheme('random')}
              className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-white border border-gray-200 shadow-sm text-gray-700 hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="text-2xl">🎲</span>
              <div className="text-xs font-bold text-center">全テーマランダム</div>
              <div className="text-xs text-gray-400">15問</div>
            </button>
          </div>
        </div>

        {/* ═══ 2枚の大カード ═══ */}
        <div className="grid grid-cols-2 gap-3 mb-4">

          {/* 解説編カード */}
          <button
            onClick={() => setOpenSection(openSection === 'guide' ? null : 'guide')}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-6 aspect-square transition-all active:scale-[0.97] cursor-pointer ${
              openSection === 'guide'
                ? 'bg-green-50 border-green-400 shadow-lg'
                : 'bg-white border-gray-200 shadow-sm hover:border-green-300 hover:shadow-md'
            }`}
          >
            <span className="text-5xl mb-3">📖</span>
            <span className={`text-xl font-black ${openSection === 'guide' ? 'text-green-800' : 'text-gray-900'}`}>解説編</span>
            <span className={`text-xs mt-1 ${openSection === 'guide' ? 'text-green-600' : 'text-gray-400'}`}>フォーメーションを学ぶ</span>
            <span className={`absolute top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
              openSection === 'guide' ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>{totalFormations}項目</span>
          </button>

          {/* 問題編カード */}
          <button
            onClick={() => setOpenSection(openSection === 'quiz' ? null : 'quiz')}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 p-6 aspect-square transition-all active:scale-[0.97] cursor-pointer ${
              openSection === 'quiz'
                ? 'bg-blue-50 border-blue-400 shadow-lg'
                : 'bg-white border-gray-200 shadow-sm hover:border-blue-300 hover:shadow-md'
            }`}
          >
            <span className="text-5xl mb-3">✏️</span>
            <span className={`text-xl font-black ${openSection === 'quiz' ? 'text-blue-800' : 'text-gray-900'}`}>問題編</span>
            <span className={`text-xs mt-1 ${openSection === 'quiz' ? 'text-blue-600' : 'text-gray-400'}`}>クイズに挑戦する</span>
            <span className={`absolute top-2.5 right-3 text-xs font-bold px-2 py-0.5 rounded-full ${
              openSection === 'quiz' ? 'bg-blue-200 text-blue-700' : 'bg-gray-100 text-gray-500'
            }`}>{totalQuestions}問</span>
          </button>
        </div>

        {/* ═══ 展開エリア：解説編 ═══ */}
        {openSection === 'guide' && (
          <div className="mb-4 animate-[fadeSlideIn_0.2s_ease-out]">
            <div className="grid gap-2">
              <button
                onClick={onFormations}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-white border border-gray-200 shadow-sm hover:border-green-300 hover:bg-green-50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="text-3xl">⚾</span>
                <div className="flex-1 text-left">
                  <div className="text-sm font-black text-gray-900">守備フォーメーション</div>
                  <div className="text-xs text-gray-400 mt-0.5">ランナー別に{totalFormations}パターンの守備を解説</div>
                </div>
                <span className="text-gray-300 font-bold text-xl">›</span>
              </button>
            </div>
          </div>
        )}

        {/* ═══ 展開エリア：問題編 ═══ */}
        {openSection === 'quiz' && (
          <div className="mb-4 animate-[fadeSlideIn_0.2s_ease-out]">
            <div className="grid gap-2.5">
              {themeGroups.map((group) => (
                <div key={group.label}>
                  <div className="text-xs font-bold text-gray-400 mb-1">{group.label}</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {group.keys.map((key) => {
                      const theme = themes[key];
                      if (!theme) return null;
                      const isComingSoon = theme.comingSoon;
                      return (
                        <button
                          key={key}
                          onClick={() => !isComingSoon && onSelectTheme(key)}
                          disabled={isComingSoon}
                          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl border shadow-sm h-20 active:scale-[0.98] transition-all ${
                            isComingSoon
                              ? 'bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                              : 'bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                          }`}
                        >
                          <span className="text-2xl">{theme.icon}</span>
                          <span className="font-bold text-xs text-center leading-tight">{theme.name}</span>
                          {isComingSoon && <span className="text-xs text-gray-400">準備中</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
