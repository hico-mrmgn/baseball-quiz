export default function LevelUpNotification({ levelInfo, onClose }) {
  if (!levelInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center">
        <div className="text-sm font-bold text-white/80 mb-2">⬆️ レベルアップ！</div>
        <div className="text-6xl mb-2">{levelInfo.emoji}</div>
        <div className="text-5xl font-black text-white mb-1">Lv.{levelInfo.level}</div>
        <h3 className="text-2xl font-black text-white mb-4">{levelInfo.title}</h3>
        <button
          onClick={onClose}
          className="px-6 py-2 rounded-xl bg-white text-orange-600 font-bold text-lg shadow active:scale-95 transition-all cursor-pointer"
        >
          よっしゃ！
        </button>
      </div>
    </div>
  );
}
