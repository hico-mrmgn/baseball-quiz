import { themes, questions } from '../data/questions';

export default function TopScreen({ onSelectTheme, onHistory }) {
  const themeKeys = Object.keys(themes);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black text-green-800 mb-2">
            ⚾ つぎ、どうする？
          </h1>
          <p className="text-lg text-green-700">
            野球の状況判断クイズ
          </p>
        </div>

        <div className="grid gap-4">
          {themeKeys.map((key) => {
            const theme = themes[key];
            const count = questions.filter((q) => q.theme === key).length;
            return (
              <button
                key={key}
                onClick={() => onSelectTheme(key)}
                className={`flex items-center gap-4 w-full p-5 rounded-2xl bg-gradient-to-r ${theme.color} text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer`}
              >
                <span className="text-4xl">{theme.icon}</span>
                <div className="text-left">
                  <div className="text-xl font-bold">{theme.name}</div>
                  <div className="text-sm opacity-90">
                    {theme.description} ・ {count}問
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => onSelectTheme('random')}
            className="flex items-center gap-4 w-full p-5 rounded-2xl bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer mt-2"
          >
            <span className="text-4xl">🎲</span>
            <div className="text-left">
              <div className="text-xl font-bold">全テーマランダム</div>
              <div className="text-sm opacity-90">
                すべての編からランダムに20問
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onHistory}
          className="w-full mt-4 p-3 rounded-xl border-2 border-amber-300 bg-amber-50 text-amber-700 font-bold text-sm active:scale-[0.98] transition-all cursor-pointer"
        >
          📊 戦績を見る
        </button>

        <p className="text-center text-sm text-green-600 mt-6">
          依知くん、がんばれ！ 💪
        </p>
      </div>
    </div>
  );
}
