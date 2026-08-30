/**
 * 弱かった判断の一覧。
 *
 * 結果を見て終わりにせず、その場から同じ判断だけを集めた練習に入れるための導線。
 * 実戦シナリオの結果と今日のトレーニングの結果で同じものを使う。
 *
 * onPracticeTag を渡さない場合は、押せない一覧として表示する。
 */
function Bar({ tag, percent }) {
  return (
    <>
      <span className="text-xs font-black text-gray-700 w-36 flex-shrink-0 truncate">{tag}</span>
      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            percent >= 67 ? 'bg-sky-500' : percent >= 34 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs font-black text-gray-600 w-10 text-right">{percent}%</span>
    </>
  );
}

export default function WeakTagList({ tags, title, onPracticeTag }) {
  if (tags.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-4">
      <div className="text-sm font-black text-gray-700 mb-1">{title}</div>
      {onPracticeTag && (
        <div className="text-xs text-gray-500 mb-2.5">
          タップすると、その判断だけを集めて練習できます
        </div>
      )}
      <div className="space-y-2">
        {tags.map((t) => (onPracticeTag ? (
          <button
            key={t.tag}
            onClick={() => onPracticeTag(t.tag)}
            className="w-full flex items-center gap-2 p-2 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 active:scale-[0.98] transition-all cursor-pointer text-left"
          >
            <Bar tag={t.tag} percent={t.percent} />
            <span className="text-blue-500 font-black text-sm">›</span>
          </button>
        ) : (
          <div key={t.tag} className="flex items-center gap-2 p-2">
            <Bar tag={t.tag} percent={t.percent} />
          </div>
        )))}
      </div>
    </div>
  );
}
