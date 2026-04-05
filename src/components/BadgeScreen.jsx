import { getBadgeStatus } from '../utils/badges';

export default function BadgeScreen({ onBack }) {
  const badges = getBadgeStatus();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-3 lg:px-6 py-6">
      <div className="max-w-md lg:max-w-5xl w-full mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onBack}
            className="px-4 h-10 rounded-full bg-white shadow flex items-center justify-center text-green-700 font-bold text-base active:scale-95 transition-all cursor-pointer gap-1"
          >
            ← もどる
          </button>
          <h1 className="text-2xl font-black text-green-800">🏅 バッジ</h1>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow p-4 mb-4 text-center">
          <div className="text-3xl font-black text-green-600">
            {unlockedCount}<span className="text-lg text-gray-400">/{badges.length}</span>
          </div>
          <div className="text-base text-gray-500">バッジ獲得</div>
          <div className="w-full h-3 bg-green-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all"
              style={{ width: `${(unlockedCount / badges.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`rounded-2xl p-3 text-center transition-all ${
                badge.unlocked
                  ? 'bg-white shadow-lg'
                  : 'bg-gray-100 opacity-50'
              }`}
            >
              <div className="text-3xl mb-1">
                {badge.unlocked ? badge.emoji : '🔒'}
              </div>
              <div className={`text-xs font-bold ${badge.unlocked ? 'text-gray-800' : 'text-gray-400'}`}>
                {badge.title}
              </div>
              <div className="text-xs text-gray-400 mt-0.5 leading-tight">
                {badge.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
