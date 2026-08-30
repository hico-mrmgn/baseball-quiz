import { useState, useEffect } from 'react';
import { themes, questions } from '../data/questions';
import { formations, formationCategories } from '../data/formations';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWrongAnswers } from '../utils/weakness';
import { SCENARIO_TRACKS, scenarioCount } from '../data/scenarios';
import { inningScenarios } from '../data/innings';
import { DIFFICULTY_FILTERS, countByDifficulty } from '../utils/questionPrep';
import FormationDiagram from './FormationDiagram';

const themeGroups = [
  {
    label: '守備ポジション',
    emoji: '🧤',
    color: 'blue',
    keys: ['pitcher', 'catcher', 'first', 'second', 'short', 'third', 'outfield'],
  },
  {
    label: '攻撃',
    emoji: '🏏',
    color: 'rose',
    keys: ['batting', 'baserun', 'coach'],
  },
  {
    label: 'ルール知識',
    emoji: '📖',
    color: 'amber',
    keys: ['rules', 'umpire'],
  },
  {
    label: '特別編',
    emoji: '🌟',
    color: 'violet',
    keys: ['fighters', 'npb2025'],
  },
];

// Tailwindはクラス名を静的に検出するため、色ごとに完全なクラス文字列を持つ
const groupStyles = {
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    iconBg: 'bg-blue-50',
    hover: 'hover:border-blue-400 hover:bg-blue-50',
    dot: 'bg-blue-500',
  },
  rose: {
    badge: 'bg-rose-100 text-rose-700',
    iconBg: 'bg-rose-50',
    hover: 'hover:border-rose-400 hover:bg-rose-50',
    dot: 'bg-rose-500',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    iconBg: 'bg-amber-50',
    hover: 'hover:border-amber-400 hover:bg-amber-50',
    dot: 'bg-amber-500',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700',
    iconBg: 'bg-violet-50',
    hover: 'hover:border-violet-400 hover:bg-violet-50',
    dot: 'bg-violet-500',
  },
};

const PLAYER_LABEL = { pitcher:'P', catcher:'C', first:'1B', second:'2B', short:'SS', third:'3B', left:'LF', center:'CF', right:'RF' };

const catDescriptions = {
  'no-runner': 'ランナーがいない場面での基本的な守備。ゴロやフライの処理、送球先の確認など基礎を固めよう。',
  'runner-1': '1塁にランナーがいる場面。ゲッツー・バント・盗塁など多彩なプレーへの対応が求められる。',
  'runner-2': '2塁にランナーがいる「得点圏」の場面。ヒットや送りバントへの対応が重要になる。',
  'runner-3': '3塁にランナーがいる場面。スクイズや内野ゴロでの本塁送球など、1点を巡る攻防が繰り広げられる。',
  'runner-12': '1・2塁にランナーがいる場面。ゲッツー・バント・中継など判断が複雑になる。',
  'runner-13': '1・3塁にランナーがいる場面。ダブルスチール・バント・ゲッツーなど最も対応パターンが多い。',
  'runner-23': '2・3塁にランナーがいる場面。得点を防ぐための前進守備や中継プレーがカギになる。',
  'runner-123': '満塁の場面。フォースプレーが使えるため守備側に有利だが、四球や暴投に注意が必要。',
};

/* ── バッジ ── */
function RunnerBadge({ runners }) {
  const parts = [];
  if (runners.first)  parts.push('1塁');
  if (runners.second) parts.push('2塁');
  if (runners.third)  parts.push('3塁');
  return (
    <span className="text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">
      {parts.length === 0 ? 'ランナーなし' : `ランナー${parts.join('・')}`}
    </span>
  );
}

function OutsBadge({ outs }) {
  const label = outs === 0 ? 'ノーアウト' : outs === 1 ? '1アウト' : '2アウト';
  return (
    <span className="text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
      {label}
    </span>
  );
}

/* ── 詳細モーダル ── */
function FormationDetail({ formation, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const cat = formationCategories.find(c => c.id === formation.categoryId);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        className="relative w-full md:max-w-4xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl
                   flex flex-col
                   max-h-[94vh] md:h-[720px] md:max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white rounded-t-2xl md:rounded-t-2xl flex-shrink-0">
          <div>
            <div className="text-xs text-gray-400 font-bold">{cat?.icon} {cat?.name}</div>
            <h2 className="text-base font-black text-gray-900">{formation.title}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <OutsBadge outs={formation.outs} />
              <RunnerBadge runners={formation.runners} />
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >✕</button>
        </div>

        {/* 2カラム */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* 左: ダイアグラム */}
          <div className="md:w-[46%] flex flex-col bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200">
            <div className="flex items-start justify-center px-3 pt-3">
              <div className="w-full">
                <FormationDiagram formation={formation} animated />
              </div>
            </div>
            {formation.moves.length > 0 && (
              <div className="px-3 pt-2">
                <div className="text-xs font-bold text-gray-500 mb-1.5">🏃 選手の動き</div>
                <div className="grid grid-cols-2 gap-1">
                  {formation.moves.map(m => (
                    <div key={m.player} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white border border-gray-200">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-xs font-bold text-gray-700">{PLAYER_LABEL[m.player]}</span>
                      <span className="text-xs text-gray-400 truncate">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="px-3 py-2 mt-auto flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-400 border-t border-gray-200 mt-2">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />前進・処理</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />カバー</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />補助</span>
              <span className="flex items-center gap-1"><span className="w-4 border-t-2 border-dashed border-yellow-400 inline-block" />送球</span>
            </div>
          </div>

          {/* 右: 解説テキスト */}
          <div className="md:w-[54%] flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs font-bold text-blue-800 mb-1.5">📖 解説</div>
                <p className="text-sm text-blue-900 leading-relaxed">{formation.description}</p>
              </div>
              <div>
                <div className="text-xs font-bold text-gray-500 mb-2">✅ ポイント</div>
                <ul className="space-y-1.5">
                  {formation.keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2 bg-white md:rounded-br-2xl">
              <button
                onClick={onPrev}
                disabled={!hasPrev}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  hasPrev ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >← 前へ</button>
              <button
                onClick={onNext}
                disabled={!hasNext}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
                  hasNext ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer' : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                }`}
              >次へ →</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── フォーメーションカード ── */
function FormationCard({ formation, onClick }) {
  const cat = formationCategories.find(c => c.id === formation.categoryId);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
    >
      <div className="bg-gray-50">
        <FormationDiagram formation={formation} compact />
      </div>
      <div className="p-2.5">
        <div className="text-xs text-gray-400 font-bold mb-0.5">{cat?.icon} {cat?.name}</div>
        <div className="text-sm font-black text-gray-900 leading-tight">{formation.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{formation.subtitle}</div>
      </div>
    </button>
  );
}

/* ── メイン画面 ── */
export default function TopScreen({
  onSelectTheme, onHistory, onBadges, onDailyChallenge, onWeaknessQuiz,
  onStartScenario, onStartInning,
}) {
  const [activeTab, setActiveTab] = useState('quiz');
  const [difficulty, setDifficulty] = useState('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState('no-runner');
  const [selectedFormation, setSelectedFormation] = useState(null);

  const levelInfo = getLevelInfo(getLevelData().xp);
  const dailyDone = isDailyCompleted();
  const dailyStreak = getDailyStreak();
  const wrongCount = getWrongAnswers().length;

  const totalQuestions = questions.length;
  const totalFormations = formations.length;

  // フォーメーション前後ナビ
  const categoryFormations = formations.filter(f => f.categoryId === selectedCategoryId);
  const currentIndex = selectedFormation ? formations.findIndex(f => f.id === selectedFormation.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < formations.length - 1;

  const handlePrev = () => {
    if (hasPrev) {
      const prev = formations[currentIndex - 1];
      setSelectedCategoryId(prev.categoryId);
      setSelectedFormation(prev);
    }
  };
  const handleNext = () => {
    if (hasNext) {
      const next = formations[currentIndex + 1];
      setSelectedCategoryId(next.categoryId);
      setSelectedFormation(next);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-4 lg:py-6">
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        {/* ヒーローヘッダー */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-600 to-green-700 shadow-lg mb-4 p-4">
          {/* 背景の装飾（内野ダイヤモンド） */}
          <div className="absolute -right-8 -top-10 w-44 h-44 rotate-45 rounded-3xl border-[10px] border-white/10 pointer-events-none" />
          <div className="absolute -right-1 top-4 w-28 h-28 rotate-45 rounded-2xl border-[6px] border-white/10 pointer-events-none" />

          <div className="relative flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-black text-white drop-shadow-sm">⚾ つぎ、どうする？</h1>
              <p className="text-xs text-green-100 mt-0.5">野球の状況判断クイズ</p>
            </div>
            <button
              onClick={onHistory}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer w-14 h-14 flex-shrink-0 backdrop-blur-sm"
            >
              <span className="text-xl">📊</span>
              <span className="text-xs font-bold">戦績</span>
            </button>
            <button
              onClick={onBadges}
              className="flex flex-col items-center justify-center gap-0.5 p-2 rounded-xl bg-white/15 text-white hover:bg-white/25 active:scale-95 transition-all cursor-pointer w-14 h-14 flex-shrink-0 backdrop-blur-sm"
            >
              <span className="text-xl">🏅</span>
              <span className="text-xs font-bold">バッジ</span>
            </button>
          </div>

          {/* レベルバー */}
          <div className="relative mt-3 bg-white/15 rounded-xl p-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{levelInfo.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-black text-white truncate">Lv.{levelInfo.level} {levelInfo.title}</div>
                  <div className="text-xs font-bold text-green-100 flex-shrink-0">{levelInfo.progressPercent}%</div>
                </div>
                <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-gradient-to-r from-amber-300 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${levelInfo.progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ 実戦トレーニング ═══
            点差・イニング・カウントまで込みの場面で判断させる、このアプリの中心。 */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">🧠</span>
            <span className="text-sm font-black text-gray-700">実戦トレーニング</span>
            <span className="text-[10px] font-bold text-white bg-red-500 rounded-full px-2 py-0.5">
              ファイジュニ級
            </span>
          </div>

          {/* 守り切れ！（イニング制） */}
          <div className="grid gap-2 mb-2">
            {inningScenarios.map((inn) => (
              <button
                key={inn.id}
                onClick={() => onStartInning(inn.id)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-gray-800 to-gray-900 shadow-md hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer text-left"
              >
                <span className="text-3xl flex-shrink-0">🛡️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-white">{inn.title}</div>
                  <div className="text-xs font-bold text-gray-300 truncate">{inn.subtitle}</div>
                </div>
                <span className="text-xs font-black text-amber-300 flex-shrink-0">
                  打者{inn.plays.length}人
                </span>
              </button>
            ))}
          </div>

          {/* 判断の種類べつ（シナリオ演習） */}
          <div className="grid grid-cols-2 gap-2">
            {SCENARIO_TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => onStartScenario(track.id)}
                className="flex flex-col items-start gap-0.5 p-3 rounded-2xl bg-white border-2 border-blue-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer text-left"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">{track.emoji}</span>
                  <span className="text-sm font-black text-gray-800">{track.name}</span>
                </div>
                <div className="text-[11px] text-gray-500 font-bold leading-snug">
                  {track.description}
                </div>
                <div className="text-[10px] font-black text-blue-600 mt-0.5">
                  {scenarioCount(track.id)}場面
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 今日やること */}
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">☀️</span>
            <span className="text-sm font-black text-gray-700">今日やること</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onDailyChallenge}
              disabled={dailyDone}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl shadow-md active:scale-[0.97] transition-all cursor-pointer ${
                dailyDone
                  ? 'bg-gray-100 border border-gray-200 opacity-60 shadow-none'
                  : 'bg-gradient-to-br from-amber-400 to-orange-500 hover:shadow-lg'
              }`}
            >
              <span className="text-3xl drop-shadow-sm">{dailyDone ? '✅' : '📅'}</span>
              <div className={`text-xs font-black text-center ${dailyDone ? 'text-gray-400' : 'text-white'}`}>
                {dailyDone ? 'クリア済み' : 'きょうのチャレンジ'}
              </div>
              <div className={`text-xs font-bold ${dailyDone ? 'text-gray-400' : 'text-amber-50'}`}>
                {dailyStreak > 0 ? `${dailyStreak}日連続 🔥` : '毎日5もん！'}
              </div>
            </button>

            <button
              onClick={wrongCount > 0 ? onWeaknessQuiz : undefined}
              disabled={wrongCount === 0}
              className={`flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl transition-all ${
                wrongCount > 0
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-md hover:shadow-lg active:scale-[0.97] cursor-pointer'
                  : 'bg-gray-50 border border-gray-100 opacity-40 cursor-not-allowed'
              }`}
            >
              <span className="text-3xl drop-shadow-sm">📝</span>
              <div className={`text-xs font-black text-center ${wrongCount > 0 ? 'text-white' : 'text-gray-400'}`}>にがてこくふく</div>
              <div className={`text-xs font-bold ${wrongCount > 0 ? 'text-violet-100' : 'text-gray-400'}`}>{wrongCount > 0 ? `${wrongCount}問` : 'まだなし'}</div>
            </button>

            <button
              onClick={() => onSelectTheme('random')}
              className="flex-1 flex flex-col items-center justify-center gap-1 p-3 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md hover:shadow-lg active:scale-[0.97] transition-all cursor-pointer"
            >
              <span className="text-3xl drop-shadow-sm">🎲</span>
              <div className="text-xs font-black text-center text-white">全テーマランダム</div>
              <div className="text-xs font-bold text-sky-100">15問</div>
            </button>
          </div>
        </div>

        {/* ═══ タブ切り替え ═══ */}
        <div className="flex gap-1 bg-gray-200/80 rounded-2xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>✏️</span>
            <span>問題編</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'quiz' ? 'bg-white/25 text-white' : 'bg-gray-300 text-gray-500'
            }`}>{totalQuestions}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>📖</span>
            <span>解説編</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'guide' ? 'bg-white/25 text-white' : 'bg-gray-300 text-gray-500'
            }`}>{totalFormations}</span>
          </button>
        </div>

        {/* ═══ 問題編 ═══ */}
        {activeTab === 'quiz' && (
          <div className="mb-4">
            {/* むずかしさで絞り込む。difficulty はこれまで表示だけで、
                出題には使われていなかった。 */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
              <span className="text-xs font-black text-gray-500 flex-shrink-0">むずかしさ</span>
              {DIFFICULTY_FILTERS.map((d) => {
                const active = difficulty === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black border transition-all cursor-pointer ${
                      active ? d.color + ' ring-2 ring-offset-1 ring-gray-300' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {d.emoji} {d.label}
                  </button>
                );
              })}
            </div>
            <div className="grid gap-4">
              {themeGroups.map((group) => {
                const style = groupStyles[group.color];
                return (
                  <div key={group.label}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`w-1 h-4 rounded-full ${style.dot}`} />
                      <span className="text-sm font-black text-gray-700">{group.emoji} {group.label}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {group.keys.map((key) => {
                        const theme = themes[key];
                        if (!theme) return null;
                        const themeQuestions = questions.filter(q => q.theme === key);
                        const count = countByDifficulty(themeQuestions, difficulty);
                        // その難易度の問題が1問もないテーマは選べないようにする
                        // （0問と表示しておいて始まってしまうのは分かりにくいため）
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
        )}

        {/* ═══ 解説編（フォーメーション直埋め込み） ═══ */}
        {activeTab === 'guide' && (
          <div className="mb-4">
            {/* ランナー別カテゴリータブ */}
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-3">
              {formationCategories.map(cat => {
                const count = formations.filter(f => f.categoryId === cat.id).length;
                const isActive = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 cursor-pointer ${
                      isActive
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center font-black ${isActive ? 'bg-emerald-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* カテゴリー説明 */}
            {(() => {
              const cat = formationCategories.find(c => c.id === selectedCategoryId);
              return (
                <div className="mb-3 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="text-base font-black text-gray-800 mb-1">{cat?.icon} {cat?.name}</div>
                  <p className="text-sm text-gray-500">{catDescriptions[selectedCategoryId]}</p>
                </div>
              );
            })()}

            {/* フォーメーショングリッド */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {categoryFormations.map(f => (
                <FormationCard
                  key={f.id}
                  formation={f}
                  onClick={() => setSelectedFormation(f)}
                />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 詳細モーダル */}
      {selectedFormation && (
        <FormationDetail
          formation={selectedFormation}
          onClose={() => setSelectedFormation(null)}
          onPrev={handlePrev}
          onNext={handleNext}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}
    </div>
  );
}
