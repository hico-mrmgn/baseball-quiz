import { useState } from 'react';
import { formations, formationCategories } from '../data/formations';
import FormationDiagram from './FormationDiagram';

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
  return (
    <div
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center"
      onClick={onClose}
    >
      {/* オーバーレイ */}
      <div className="absolute inset-0 bg-black/50" />

      {/* パネル */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl overflow-y-auto max-h-[92vh] lg:max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-gray-400 font-bold">
              {formationCategories.find(c => c.id === formation.categoryId)?.icon}{' '}
              {formationCategories.find(c => c.id === formation.categoryId)?.name}
            </div>
            <h2 className="text-base font-black text-gray-900">{formation.title}</h2>
            <p className="text-sm text-gray-500">{formation.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="px-4 pb-6 pt-3">
          {/* バッジ行 */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <OutsBadge outs={formation.outs} />
            <RunnerBadge runners={formation.runners} />
          </div>

          {/* ダイアグラム */}
          <FormationDiagram formation={formation} />

          {/* 凡例説明 */}
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
              前進・処理する選手
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              ベースカバー
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-400 inline-block" />
              補助・バックアップ
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-2 border-dashed border-yellow-400 inline-block" />
              送球ライン
            </span>
          </div>

          {/* 解説 */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="text-xs font-bold text-blue-800 mb-1.5">📖 解説</div>
            <p className="text-sm text-blue-900 leading-relaxed">{formation.description}</p>
          </div>

          {/* ポイント */}
          <div className="mt-3">
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

          {/* 選手の動き一覧 */}
          {formation.moves.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-bold text-gray-500 mb-2">🏃 選手の動き</div>
              <div className="grid grid-cols-2 gap-1.5">
                {formation.moves.map(m => (
                  <div key={m.player} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span className="text-xs font-bold text-gray-700">
                      {({ pitcher:'P', catcher:'C', first:'1B', second:'2B', short:'SS', third:'3B', left:'LF', center:'CF', right:'RF' })[m.player]}
                    </span>
                    <span className="text-xs text-gray-500">{m.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 前後ナビ */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2">
          <button
            onClick={onPrev}
            disabled={!hasPrev}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              hasPrev
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-pointer'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            ← 前へ
          </button>
          <button
            onClick={onNext}
            disabled={!hasNext}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 ${
              hasNext
                ? 'bg-blue-500 text-white hover:bg-blue-600 cursor-pointer'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
          >
            次へ →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── カードコンポーネント ── */
function FormationCard({ formation, onClick }) {
  const cat = formationCategories.find(c => c.id === formation.categoryId);
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-blue-300 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
    >
      {/* ミニダイアグラム */}
      <div className="bg-gray-50">
        <FormationDiagram formation={formation} compact />
      </div>
      {/* 情報 */}
      <div className="p-2.5">
        <div className="text-xs text-gray-400 font-bold mb-0.5">{cat?.icon} {cat?.name}</div>
        <div className="text-sm font-black text-gray-900 leading-tight">{formation.title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{formation.subtitle}</div>
      </div>
    </button>
  );
}

/* ── メイン画面 ── */
export default function FormationScreen({ onBack }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('bunt');
  const [selectedFormation, setSelectedFormation] = useState(null);

  const categoryFormations = formations.filter(f => f.categoryId === selectedCategoryId);

  // 現在表示中フォーメーションのインデックス（全体から）
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
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95 transition-all cursor-pointer text-sm font-bold flex-shrink-0"
          >
            ← 戻る
          </button>
          <div>
            <h1 className="text-base font-black text-gray-900">⚾ 守備フォーメーション解説</h1>
            <p className="text-xs text-gray-400">状況別の動き方を覚えよう</p>
          </div>
        </div>

        {/* カテゴリータブ */}
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 pb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
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
        </div>
      </div>

      {/* コンテンツ */}
      <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 py-4">
        {/* カテゴリー説明 */}
        {(() => {
          const cat = formationCategories.find(c => c.id === selectedCategoryId);
          const catDescriptions = {
            bunt: 'バントされた場面での守備の動き。状況によって誰がどこへ動くかが変わる。',
            dp: '1塁にランナーがいる場面でダブルプレー（ゲッツー）を狙う守備。打球方向によって対応が違う。',
            infield: '3塁走者がホームを狙う場面で、内野が前に出る守備隊形。点差や状況で使い分ける。',
            relay: '外野からの打球をカットマンを通してホームや他の塁へ送球する中継プレー。',
            steal: '走者が盗塁を試みた場合の内野手のカバーリングと送球対応。',
            fly: '外野フライで走者がタッチアップしてくる場面での対応と送球。',
          };
          return (
            <div className="mb-4 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
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
