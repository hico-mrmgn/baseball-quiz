import { useState, useMemo } from 'react';
import ScenarioField from './ScenarioField';
import SituationPanel from './SituationPanel';
import Confetti from './Confetti';
import { prepareScenario, tierOf } from '../utils/scenario';
import { playCorrect, playWrong } from '../utils/sound';

const TIER_BOX = {
  best: 'bg-green-50 border-green-300', ok: 'bg-sky-50 border-sky-300',
  poor: 'bg-amber-50 border-amber-300', fatal: 'bg-red-50 border-red-300',
};
const TIER_TEXT = {
  best: 'text-green-800', ok: 'text-sky-800', poor: 'text-amber-800', fatal: 'text-red-800',
};
const TIER_CHIP = {
  best: 'bg-green-500 text-white', ok: 'bg-sky-500 text-white',
  poor: 'bg-amber-500 text-white', fatal: 'bg-red-500 text-white',
};

/** イニング中ずっと出しているスコアボード。今が何点差かを見失わせない。 */
function Scoreboard({ inning, half, us, them, outs }) {
  const diff = us - them;
  const state = diff > 0 ? `${diff}点リード` : diff === 0 ? '同点' : `${-diff}点ビハインド`;
  const tone = diff > 0 ? 'text-blue-100' : diff === 0 ? 'text-amber-200' : 'text-red-200';
  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-lg">
      <div className="text-xs font-black text-amber-300 flex-shrink-0">
        {inning}回{half === 'top' ? '表' : '裏'}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-xs font-bold text-gray-400">自分</span>
        <span className="text-2xl font-black text-white leading-none">{us}</span>
        <span className="text-gray-500 font-black">-</span>
        <span className="text-2xl font-black text-white leading-none">{them}</span>
        <span className="text-xs font-bold text-gray-400">相手</span>
      </div>
      <div className={`text-xs font-black ${tone}`}>{state}</div>
      <div className="ml-auto flex items-center gap-1">
        <span className="text-[10px] font-bold text-gray-400 mr-0.5">OUT</span>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`w-3 h-3 rounded-full border ${
              i < outs ? 'bg-amber-400 border-amber-300' : 'bg-white/10 border-white/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default function InningScreen({ inning, onFinish, onQuit }) {
  const [playIndex, setPlayIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [runsAllowed, setRunsAllowed] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);

  const play = inning.plays[playIndex];
  // 打者ひとりにつき1アウト。判断が決めるのは「何点を与えるか」。
  const outs = inning.startOuts + playIndex;
  const them = inning.score.them + runsAllowed;
  const us = inning.score.us;

  const prepared = useMemo(() => prepareScenario(play), [play]);

  const sit = {
    inning: inning.inning,
    half: inning.half,
    score: { us, them },
    outs,
    runners: play.runners,
    count: play.count,
    batter: play.batter,
    defense: play.defense,
    play: play.play,
    ballArea: play.ballArea,
    note: play.note,
  };

  const chosen = confirmed !== null ? prepared.choices[confirmed] : null;
  const tier = chosen ? tierOf(chosen.score) : null;
  // 追いつかれた時点でイニングは失敗。以降のプレーには進まない。
  const caughtUp = chosen ? them + chosen.result.runs >= us : false;
  const isLastPlay = playIndex + 1 >= inning.plays.length;

  function handleConfirm() {
    if (pending === null || confirmed !== null) return;
    const choice = prepared.choices[pending];
    setConfirmed(pending);
    setAnswers((prev) => [...prev, { scenario: play, choice, elapsedMs: 0, inTime: true }]);
    if (choice.score === 3) {
      setConfettiTrigger((t) => t + 1);
      playCorrect();
    } else {
      playWrong();
    }
  }

  function handleNext() {
    const nextRuns = runsAllowed + chosen.result.runs;
    const finalThem = inning.score.them + nextRuns;
    if (caughtUp || isLastPlay) {
      onFinish({
        answers: [...answers],
        runsAllowed: nextRuns,
        cleared: finalThem < us,
        finalScore: { us, them: finalThem },
        outsRecorded: outs + 1,
      });
      return;
    }
    setRunsAllowed(nextRuns);
    setPlayIndex((i) => i + 1);
    setPending(null);
    setConfirmed(null);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-gray-50 to-gray-50 px-3 lg:px-6 py-4">
      <Confetti trigger={confettiTrigger} />
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🛡️</span>
            <span className="font-black text-gray-800 text-sm md:text-base">{inning.title}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-500">
              打者 {playIndex + 1} / {inning.plays.length}
            </span>
            <button
              onClick={() => setShowQuitConfirm(true)}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
              aria-label="やめる"
            >
              ✕
            </button>
          </div>
        </div>

        {showQuitConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-xl text-center">
              <div className="text-lg font-bold text-gray-800 mb-2">とちゅうでやめる？</div>
              <div className="text-sm text-gray-500 mb-4">このイニングは失敗あつかいになります</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowQuitConfirm(false)}
                  className="flex-1 p-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-sm cursor-pointer"
                >
                  つづける
                </button>
                <button
                  onClick={onQuit}
                  className="flex-1 p-2.5 rounded-xl bg-red-500 text-white font-bold text-sm cursor-pointer"
                >
                  やめる
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3">
          <Scoreboard inning={inning.inning} half={inning.half} us={us} them={them} outs={outs} />
        </div>

        {playIndex === 0 && confirmed === null && (
          <div className="mb-3 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-sm text-blue-900 leading-snug">
            {inning.intro}
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-3 mb-3">
          <div className="bg-white border border-gray-200 rounded-xl p-2 flex-shrink-0 w-full md:w-56 lg:w-72">
            <ScenarioField sit={sit} theme={null} />
          </div>
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-green-200 flex flex-col gap-2.5">
            <SituationPanel sit={sit} />
            <div className="border-t border-gray-100 pt-2">
              <div className="text-base md:text-lg font-black text-gray-800 leading-snug">
                {play.question}
              </div>
            </div>
          </div>
        </div>

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

        {/* プレーの結果 → 試合がどう動いたか */}
        {confirmed !== null && chosen && (
          <div className={`fade-slide-in rounded-2xl p-3.5 mb-3 border-2 ${TIER_BOX[tier.key]}`}>
            <div className={`flex items-center flex-wrap gap-2 text-sm font-black mb-2 ${TIER_TEXT[tier.key]}`}>
              <span className="text-lg">{tier.emoji}</span>
              <span>{tier.label}</span>
              {chosen.result.runs > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-xs">
                  失点 {chosen.result.runs}
                </span>
              )}
              {chosen.result.runs === 0 && (
                <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs">無失点</span>
              )}
            </div>
            <div className={`text-sm leading-relaxed mb-2 ${TIER_TEXT[tier.key]}`}>
              {chosen.result.text}
            </div>
            <div className="bg-white/70 rounded-xl p-2.5 border border-white">
              <div className="text-xs font-black text-gray-500 mb-0.5">おぼえること</div>
              <div className="text-sm font-bold text-gray-800 leading-snug">{play.explain.key}</div>
            </div>
          </div>
        )}

        {confirmed !== null && (
          <button
            onClick={handleNext}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {caughtUp || isLastPlay ? '結果を見る 🏆' : '次の打者へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
}
