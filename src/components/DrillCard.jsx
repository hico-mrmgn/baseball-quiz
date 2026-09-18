import { useState } from 'react';

/**
 * ドリル記録の種目の行。ratio10 / count / done の3つの入力形式に対応する。
 *
 * カードではなく行にしてある。6種目が 390px 幅でおおむね1画面に収まり、
 * 練習直後の子どもがスクロールせずに6回タップして帰れるようにするため。
 *
 * 制約文はこのドリルの本体なので消さない。ただし出し方を時間で変える。
 *   まだ書いていない種目 … 全文（練習前に読むもの）
 *   書いた種目           … 1行にたたむ。押すと全文に開く
 * 同じ画面が、練習前は「メニュー」、練習後は「記録帳」として働く。
 *
 * −1 は値が入ってから出す。未入力の行は +1 だけにして、押す場所で迷わせない。
 *
 * 判定・色分け・目標値は出さない。数字はすべて同じ色。
 * 屋外で片手で使う前提なので、+1 と やった は 64px 以上にする。ソフトキーボードは出さない。
 */

const BIG_BUTTON =
  'min-h-16 rounded-2xl text-2xl font-black select-none touch-manipulation active:scale-95 transition-transform cursor-pointer';

export default function DrillCard({ def, value, onAdjust, onToggle }) {
  const hasValue = value !== undefined;
  const isDone = def.input === 'done';
  const [constraintOpen, setConstraintOpen] = useState(false);
  const showFullConstraint = !hasValue || constraintOpen;

  return (
    <section className="bg-white rounded-2xl border-2 border-gray-300 shadow-sm px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-black text-gray-900 leading-tight">{def.label}</h2>
          {def.unitLabel !== '' && (
            <p className="text-xs font-bold text-gray-700 leading-tight mt-0.5">{def.unitLabel}</p>
          )}
        </div>

        {/* done は ボタンの塗りが状態そのものなので、数字の欄は置かない */}
        {!isDone && (
          <div className="w-14 text-right text-4xl font-black text-gray-900 tabular-nums leading-none flex-shrink-0">
            {hasValue ? value : '—'}
          </div>
        )}

        {isDone ? (
          <button
            type="button"
            onClick={() => onToggle(def.id)}
            aria-pressed={Boolean(value)}
            className={`w-24 flex-shrink-0 ${BIG_BUTTON} ${
              value
                ? 'bg-gray-900 text-white'
                : 'bg-white border-2 border-gray-900 text-gray-900'
            }`}
          >
            やった
          </button>
        ) : (
          <div className="flex gap-1.5 flex-shrink-0">
            {value > 0 && (
              <button
                type="button"
                onClick={() => onAdjust(def.id, -1)}
                aria-label={`${def.label} を 1 へらす`}
                className={`w-12 bg-white border-2 border-gray-900 text-gray-900 ${BIG_BUTTON}`}
              >
                −1
              </button>
            )}
            <button
              type="button"
              onClick={() => onAdjust(def.id, 1)}
              aria-label={`${def.label} を 1 ふやす`}
              className={`w-24 bg-gray-900 text-white ${BIG_BUTTON}`}
            >
              +1
            </button>
          </div>
        )}
      </div>

      {def.constraint !== '' && (
        hasValue ? (
          <button
            type="button"
            onClick={() => setConstraintOpen((v) => !v)}
            aria-expanded={showFullConstraint}
            className={`mt-1.5 w-full text-left text-sm font-bold text-gray-700 leading-snug cursor-pointer ${
              showFullConstraint ? '' : 'truncate'
            }`}
          >
            {def.constraint}
          </button>
        ) : (
          <p className="mt-1.5 text-sm font-bold text-gray-700 leading-snug">{def.constraint}</p>
        )
      )}
    </section>
  );
}
