/**
 * ドリル記録の種目カード。ratio10 / count / done の3つの入力形式に対応する。
 *
 * 判定・色分け・目標値は出さない。数字はすべて同じ色。
 * 屋外で片手で使う前提なので、主要なタップ領域は 64px 四方以上にし、
 * +1 はカード幅の大部分を占める大きさにする。ソフトキーボードは出さない。
 */

const BIG_BUTTON =
  'min-h-16 rounded-2xl text-2xl font-black select-none touch-manipulation active:scale-95 transition-transform cursor-pointer';

export default function DrillCard({ def, value, onAdjust, onToggle }) {
  const hasValue = value !== undefined;
  const isDone = def.input === 'done';

  return (
    <section className="bg-white rounded-3xl border-2 border-gray-300 shadow-sm p-4">
      <h2 className="text-lg font-black text-gray-900">{def.label}</h2>
      {def.constraint !== '' && (
        <p className="mt-1 text-sm font-bold text-gray-700 leading-snug">{def.constraint}</p>
      )}

      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="text-sm font-bold text-gray-700">{def.unitLabel}</div>
        <div className="text-5xl font-black text-gray-900 tabular-nums leading-none">
          {isDone ? (value ? 'やった' : 'まだ') : (hasValue ? value : '—')}
        </div>
      </div>

      {isDone ? (
        <button
          type="button"
          onClick={() => onToggle(def.id)}
          aria-pressed={Boolean(value)}
          className={`mt-3 w-full ${BIG_BUTTON} ${
            value
              ? 'bg-gray-900 text-white'
              : 'bg-white border-2 border-gray-900 text-gray-900'
          }`}
        >
          やった
        </button>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onAdjust(def.id, -1)}
            aria-label={`${def.label} を 1 へらす`}
            className={`w-16 flex-shrink-0 bg-white border-2 border-gray-900 text-gray-900 ${BIG_BUTTON}`}
          >
            −1
          </button>
          <button
            type="button"
            onClick={() => onAdjust(def.id, 1)}
            aria-label={`${def.label} を 1 ふやす`}
            className={`flex-1 bg-gray-900 text-white ${BIG_BUTTON}`}
          >
            +1
          </button>
        </div>
      )}
    </section>
  );
}
