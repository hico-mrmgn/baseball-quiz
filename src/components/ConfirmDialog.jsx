/**
 * 「やめますか？」の確認ダイアログ。
 * 実戦シナリオ・守り切れ・基本練習の3画面で使う。
 */
export default function ConfirmDialog({ title, message, confirmLabel = 'やめる', onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center">
        <div className="text-lg font-bold text-gray-800 mb-2">{title}</div>
        {message && <div className="text-sm text-gray-500 mb-4">{message}</div>}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm cursor-pointer"
          >
            続ける
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 p-2.5 rounded-xl bg-red-500 text-white font-bold text-sm cursor-pointer"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
