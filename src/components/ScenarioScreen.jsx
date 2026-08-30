import { useState, useMemo, useRef, useEffect } from 'react';
import ScenarioField from './ScenarioField';
import SituationPanel from './SituationPanel';
import Confetti from './Confetti';
import { SCENARIO_LEVELS } from '../data/scenarios';
import { prepareScenario, tierOf, timeLimitOf } from '../utils/scenario';
import { playCorrect, playWrong, playCombo } from '../utils/sound';

const TIER_BOX = {
  best:  'bg-green-50 border-green-300',
  ok:    'bg-sky-50 border-sky-300',
  poor:  'bg-amber-50 border-amber-300',
  fatal: 'bg-red-50 border-red-300',
};
const TIER_TEXT = {
  best: 'text-green-800', ok: 'text-sky-800', poor: 'text-amber-800', fatal: 'text-red-800',
};
const TIER_CHIP = {
  best:  'bg-green-500 text-white',
  ok:    'bg-sky-500 text-white',
  poor:  'bg-amber-500 text-white',
  fatal: 'bg-red-500 text-white',
};

const PHASE_BADGE = {
  pre:  { text: '⏱️ 投球前の判断', className: 'bg-indigo-100 text-indigo-700' },
  post: { text: '⚡ 打球への反応',  className: 'bg-rose-100 text-rose-700' },
};

export default function ScenarioScreen({ scenarios: list, trackName, onFinish, onQuit }) {
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const startedAt = useRef(null);

  const current = list[index];
  const total = list.length;

  // 選択肢は出題のたびに混ぜる。並び順のクセで解けないようにするため、
  // index が変わったときだけ作り直す。
  const prepared = useMemo(() => prepareScenario(current), [current]);
  const limit = timeLimitOf(current);

  // 判断タイムの計測開始。以降の場面では handleNext で開始時刻を打ち直す。
  useEffect(() => {
    if (startedAt.current === null) startedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (confirmed !== null) return undefined;
    const id = setInterval(
      () => setElapsed(Date.now() - (startedAt.current ?? Date.now())),
      100,
    );
    return () => clearInterval(id);
  }, [confirmed, index]);

  const remaining = Math.max(0, limit - elapsed);
  const timeUp = remaining === 0;
  const timeRatio = Math.max(0, Math.min(1, remaining / limit));

  const streak = useMemo(() => {
    let n = 0;
    for (let i = answers.length - 1; i >= 0; i--) {
      if (answers[i].choice.score === 3) n++;
      else break;
    }
    return n;
  }, [answers]);

  function handleConfirm() {
    if (pending === null || confirmed !== null) return;
    const choice = prepared.choices[pending];
    const ms = Date.now() - (startedAt.current ?? Date.now());
    setConfirmed(pending);
    setAnswers((prev) => [...prev, {
      scenario: current,
      choice,
      elapsedMs: ms,
      inTime: ms <= limit,
    }]);

    if (choice.score === 3) {
      setConfettiTrigger((t) => t + 1);
      playCorrect();
      if (streak + 1 >= 3) playCombo();
    } else if (choice.score < 0) {
      playWrong();
    } else {
      playWrong();
    }
  }

  function handleNext() {
    if (index + 1 >= total) {
      onFinish(answers);
    } else {
      setIndex((i) => i + 1);
      setPending(null);
      setConfirmed(null);
      startedAt.current = Date.now();
      setElapsed(0);
    }
  }

  const chosen = confirmed !== null ? prepared.choices[confirmed] : null;
  const tier = chosen ? tierOf(chosen.score) : null;
  const levelInfo = SCENARIO_LEVELS[current.level];
  const phase = PHASE_BADGE[current.phase] ?? PHASE_BADGE.post;
  const lastAnswer = answers[answers.length - 1];
  const wasInTime = confirmed !== null && lastAnswer?.inTime;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-4">
      <Confetti trigger={confettiTrigger} />
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🧠</span>
            <span className="font-bold text-gray-800 text-sm md:text-base">{trackName}</span>
          </div>
          <div className="flex items-center gap-2">
            {streak >= 2 && (
              <div className="text-orange-500 font-black text-sm animate-pulse">
                🎯 最善手{streak}連続
              </div>
            )}
            <div className="text-sm font-bold text-gray-500">{index + 1} / {total}</div>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none ml-1 cursor-pointer"
              aria-label="やめる"
            >
              ✕
            </button>
          </div>
        </div>

        {showQuitConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center">
              <div className="text-lg font-bold text-gray-800 mb-2">トレーニングをやめる？</div>
              <div className="text-sm text-gray-500 mb-4">
                ここまでの{answers.length}問の結果で終了します
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm cursor-pointer"
                >
                  続ける
                </button>
                <button
                  onClick={() => onQuit(answers)}
                  className="flex-1 p-2.5 rounded-xl bg-red-500 text-white font-bold text-sm cursor-pointer"
                >
                  やめる
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 進捗 */}
        <div className="w-full h-1.5 bg-gray-200 rounded-full mb-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${(index / total) * 100}%` }}
          />
        </div>

        {/* 判断タイム。時間切れでも答えられるが、速さは評価される */}
        {confirmed === null && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-black ${timeUp ? 'text-gray-400' : 'text-gray-600'}`}>
              {timeUp ? '判断タイム終了' : `残り ${Math.ceil(remaining / 1000)}秒`}
            </span>
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-100 ${
                  timeRatio > 0.5 ? 'bg-green-500' : timeRatio > 0.2 ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${timeRatio * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 双子問題の合図 */}
        {current.pairRole === 'b' && (
          <div className="mb-3 rounded-xl bg-indigo-600 text-white px-3 py-2 text-sm font-black flex items-center gap-2">
            <span className="text-lg">🔁</span>
            <span>さっきと同じ打球。ちがうのは状況だけ。答えは同じ？</span>
          </div>
        )}

        {/* 状況 */}
        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="bg-white border border-gray-200 rounded-xl p-2 flex-shrink-0 w-full md:w-56 lg:w-72">
            <ScenarioField sit={current.sit} theme={current.theme} />
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-green-200 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${phase.className}`}>
                {phase.text}
              </span>
              {levelInfo && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${levelInfo.color}`}>
                  {levelInfo.emoji} {levelInfo.label}
                </span>
              )}
            </div>
            <SituationPanel sit={current.sit} />
            <div className="border-t border-gray-100 pt-2">
              <div className="text-base md:text-lg font-black text-gray-800 leading-snug">
                {current.question}
              </div>
            </div>
          </div>
        </div>

        {/* 選択肢 */}
        <div className="grid lg:grid-cols-2 gap-2 mb-3">
          {prepared.choices.map((choice, i) => {
            const ct = tierOf(choice.score);
            let style, chipStyle, chipContent;
            if (confirmed !== null) {
              const picked = i === confirmed;
              style = `${TIER_BOX[ct.key]} border-2 ${picked ? 'ring-2 ring-offset-1 ring-gray-400 shadow-md' : 'opacity-90'}`;
              chipStyle = TIER_CHIP[ct.key];
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
                onClick={() => confirmed === null && setPending(i)}
                disabled={confirmed !== null}
                className={`w-full flex flex-col gap-1.5 p-3 rounded-2xl text-left transition-all ${style} ${
                  confirmed === null ? 'active:scale-[0.98] cursor-pointer' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className={`flex-shrink-0 w-9 h-8 rounded-full flex items-center justify-center text-xs font-black ${chipStyle}`}>
                    {chipContent}
                  </span>
                  <span className={`flex-1 font-bold text-sm md:text-base ${confirmed !== null ? TIER_TEXT[ct.key] : 'text-gray-800'}`}>
                    {choice.text}
                  </span>
                </div>
                {/* 選んだ選択肢だけでなく、全部の「なぜ」を出す。
                    正解を覚えるのではなく、他がなぜダメかまで持ち帰ってほしい。 */}
                {confirmed !== null && (
                  <div className={`text-xs leading-relaxed pl-11 ${TIER_TEXT[ct.key]}`}>
                    <span className="font-black mr-1">{ct.emoji}{ct.label}：</span>
                    {choice.fb}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {confirmed === null && (
          <button
            onClick={handleConfirm}
            disabled={pending === null}
            className={`w-full p-3 rounded-xl font-bold text-base transition-all mb-3 ${
              pending !== null
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg active:scale-[0.98] cursor-pointer'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            これで決める ✅
          </button>
        )}

        {/* 判定と解説 */}
        {confirmed !== null && tier && (
          <div className={`fade-slide-in rounded-2xl p-3.5 mb-3 border-2 ${TIER_BOX[tier.key]}`}>
            <div className={`flex items-center flex-wrap gap-2 text-sm font-black mb-2 ${TIER_TEXT[tier.key]}`}>
              <span className="text-lg">{tier.emoji}</span>
              <span>{tier.label}（{chosen.score > 0 ? `+${chosen.score}` : chosen.score}点）</span>
              <span className="font-bold">{tier.message}</span>
              <span className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
                wasInTime ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-700'
              }`}>
                {wasInTime ? '⚡ 速い判断' : '🐢 判断がおそい'}
              </span>
            </div>

            <div className={`text-sm leading-relaxed mb-2.5 ${TIER_TEXT[tier.key]}`}>
              {current.explain.why}
            </div>

            <div className="bg-white/70 rounded-xl p-2.5 mb-2 border border-white">
              <div className="text-xs font-black text-gray-500 mb-0.5">覚えること</div>
              <div className="text-sm font-bold text-gray-800 leading-snug">{current.explain.key}</div>
            </div>

            <div className="bg-white/70 rounded-xl p-2.5 border border-white">
              <div className="text-xs font-black text-gray-500 mb-0.5">練習メニュー</div>
              <div className="text-sm text-gray-700 leading-snug">{current.explain.drill}</div>
            </div>
          </div>
        )}

        {confirmed !== null && (
          <button
            onClick={handleNext}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {index + 1 >= total ? '結果を見る 🏆' : '次の場面へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
}
