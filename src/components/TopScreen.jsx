import { useState, useEffect } from 'react';
import { themes, questions } from '../data/questions';
import { formations, formationCategories } from '../data/formations';
import { getLevelData, getLevelInfo } from '../utils/level';
import { isDailyCompleted, getDailyStreak } from '../utils/daily';
import { getWrongAnswers } from '../utils/weakness';
import FormationDiagram from './FormationDiagram';

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
                <FormationDiagram formation={formation} />
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
export default function TopScreen({ onSelectTheme, onHistory, onBadges, onDailyChallenge, onWeaknessQuiz }) {
  const [activeTab, setActiveTab] = useState('quiz');
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

        {/* ═══ タブ切り替え ═══ */}
        <div className="flex gap-0 bg-gray-200 rounded-xl p-1 mb-4">
          <button
            onClick={() => setActiveTab('quiz')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>✏️</span>
            <span>問題編</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'quiz' ? 'bg-blue-100 text-blue-600' : 'bg-gray-300 text-gray-500'
            }`}>{totalQuestions}</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-black transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>📖</span>
            <span>解説編</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              activeTab === 'guide' ? 'bg-green-100 text-green-600' : 'bg-gray-300 text-gray-500'
            }`}>{totalFormations}</span>
          </button>
        </div>

        {/* ═══ 問題編 ═══ */}
        {activeTab === 'quiz' && (
          <div className="mb-4">
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
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                    <span className={`text-xs rounded-full w-4 h-4 flex items-center justify-center font-black ${isActive ? 'bg-blue-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
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
