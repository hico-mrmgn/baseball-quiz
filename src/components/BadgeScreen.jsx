import { getBadgeStatus, BADGE_CATEGORIES } from '../utils/badges';

/**
 * バッジ一覧。
 *
 * 以前は20個近くを1つのグリッドに並べていたので、何をすれば取れるのかが
 * 読み取れなかった。「続ける／判断の質／守り切れ／判断の種類／基本練習」に
 * 分けて、どの練習がどのバッジにつながるのかを見えるようにしている。
 */
export default function BadgeScreen({ onBack }) {
  const badges = getBadgeStatus();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

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
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-gray-900">🏅 バッジ</h1>
            <p className="text-xs text-gray-400">{unlockedCount} / {badges.length} 個 獲得</p>
          </div>
          <div className="w-24 flex-shrink-0">
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 lg:px-6 py-4 space-y-5">
        {BADGE_CATEGORIES.map((cat) => {
          const inCat = badges.filter((b) => b.category === cat.id);
          if (inCat.length === 0) return null;
          const got = inCat.filter((b) => b.unlocked).length;
          return (
            <div key={cat.id}>
              <div className="flex items-baseline gap-1.5 mb-2">
                <span className="text-sm font-black text-gray-700">
                  {cat.emoji} {cat.name}
                </span>
                <span className="text-xs font-bold text-gray-400">{got} / {inCat.length}</span>
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-5 gap-2">
                {inCat.map((badge) => (
                  <div
                    key={badge.id}
                    className={`rounded-2xl p-3 text-center border transition-all ${
                      badge.unlocked
                        ? 'bg-white border-amber-200 shadow-sm'
                        : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className={`text-3xl mb-1 ${badge.unlocked ? '' : 'grayscale opacity-40'}`}>
                      {badge.unlocked ? badge.emoji : '🔒'}
                    </div>
                    <div className={`text-xs font-black leading-tight ${
                      badge.unlocked ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                      {badge.title}
                    </div>
                    {/* 未獲得でも条件は見せる。何をすれば取れるのか分からないと目標にならない */}
                    <div className="text-[10px] text-gray-400 mt-1 leading-tight">
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
