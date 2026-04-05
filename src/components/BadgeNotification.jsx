import { useState, useEffect } from 'react';

export default function BadgeNotification({ badges, onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!badges || badges.length === 0) return;
    setVisible(true);
    setCurrentIndex(0);
  }, [badges]);

  if (!badges || badges.length === 0 || !visible) return null;

  const badge = badges[currentIndex];

  function handleNext() {
    if (currentIndex + 1 < badges.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setVisible(false);
      onDone?.();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleNext}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4 max-w-sm w-full text-center badge-popup">
        <div className="text-sm font-bold text-amber-500 mb-2">🎊 バッジ獲得！</div>
        <div className="text-6xl mb-3">{badge.emoji}</div>
        <h3 className="text-2xl font-black text-gray-800 mb-2">{badge.title}</h3>
        <p className="text-base text-gray-500 mb-4">{badge.description}</p>
        <button
          onClick={handleNext}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold text-lg shadow active:scale-95 transition-all cursor-pointer"
        >
          {currentIndex + 1 < badges.length ? 'つぎのバッジ →' : 'やったね！'}
        </button>
      </div>
    </div>
  );
}
