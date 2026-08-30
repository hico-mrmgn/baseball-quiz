/**
 * 結果画面の数値カード。実戦シナリオ・守り切れ・今日のトレーニングで共通。
 *
 * unit を渡すと数値として大きく、渡さないと「成功 🛡️」のような短い文として
 * 少し小さめに出す。
 */
const TONES = {
  good:    'bg-green-50 border-green-200 text-green-700',
  bad:     'bg-red-50 border-red-200 text-red-700',
  neutral: 'bg-gray-50 border-gray-200 text-gray-700',
};

export default function StatCard({ label, value, unit, tone = 'neutral' }) {
  return (
    <div className={`flex-1 rounded-2xl border-2 p-3 text-center ${TONES[tone] ?? TONES.neutral}`}>
      <div className="text-xs font-black opacity-80 mb-0.5">{label}</div>
      <div className={`font-black leading-none ${unit ? 'text-2xl' : 'text-lg mt-1'}`}>
        {value}
        {unit && <span className="text-sm font-bold ml-0.5">{unit}</span>}
      </div>
    </div>
  );
}
