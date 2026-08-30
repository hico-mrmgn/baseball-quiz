import { tierOf } from '../utils/scenario';
import { TIER_BOX, TIER_TEXT, TIER_CHIP } from './tierStyles';

/**
 * 配点制の選択肢リスト。実戦シナリオと守り切れで共通。
 *
 * 回答後は、選んだ選択肢だけでなく全部の「なぜその点数なのか」を出す。
 * 正解を覚えるのではなく、他がなぜダメかまで持ち帰ってほしいため。
 *
 * choices   … prepareScenario() でシャッフル済みの選択肢（originalIndex を持つ）
 * pending   … 選択中（未確定）のindex
 * confirmed … 確定したindex。null なら未回答
 */
export default function ChoiceList({ choices, pending, confirmed, onSelect }) {
  const answered = confirmed !== null;

  return (
    <div className="grid lg:grid-cols-2 gap-2 mb-3">
      {choices.map((choice, i) => {
        const tier = tierOf(choice.score);
        let style;
        let chipStyle;
        let chipContent;

        if (answered) {
          const picked = i === confirmed;
          style = `${TIER_BOX[tier.key]} border-2 ${
            picked ? 'ring-2 ring-offset-1 ring-gray-400 shadow-md' : 'opacity-90'
          }`;
          chipStyle = TIER_CHIP[tier.key];
          chipContent = choice.score > 0 ? `+${choice.score}` : `${choice.score}`;
        } else if (pending === i) {
          style = 'bg-blue-50 border-2 border-blue-500 ring-2 ring-blue-200 shadow-md';
          chipStyle = 'bg-blue-500 text-white';
          chipContent = String.fromCharCode(65 + i);
        } else {
          style = 'bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50';
          chipStyle = 'bg-gray-100 text-gray-500';
          chipContent = String.fromCharCode(65 + i);
        }

        return (
          <button
            key={choice.originalIndex}
            onClick={() => !answered && onSelect(i)}
            disabled={answered}
            className={`w-full flex flex-col gap-1.5 p-3 rounded-2xl text-left transition-all ${style} ${
              answered ? '' : 'active:scale-[0.98] cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className={`flex-shrink-0 w-9 h-8 rounded-full flex items-center justify-center text-xs font-black ${chipStyle}`}>
                {chipContent}
              </span>
              <span className={`flex-1 font-bold text-sm md:text-base ${
                answered ? TIER_TEXT[tier.key] : 'text-gray-800'
              }`}>
                {choice.text}
              </span>
            </div>
            {answered && (
              <div className={`text-xs leading-relaxed pl-11 ${TIER_TEXT[tier.key]}`}>
                <span className="font-black mr-1">{tier.emoji}{tier.label}：</span>
                {choice.fb}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
