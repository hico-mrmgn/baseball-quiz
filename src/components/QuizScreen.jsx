import { useState, useRef } from 'react';
import { themes } from '../data/questions';
import FieldDiagram from './FieldDiagram';
import Confetti from './Confetti';
import { playCorrect, playWrong, playCombo } from '../utils/sound';

export default function QuizScreen({ questions: quizQuestions, theme, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingAnswer, setPendingAnswer] = useState(null);   // 選択中（未確定）
  const [confirmedAnswer, setConfirmedAnswer] = useState(null); // 確定済み
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [comboBreak, setComboBreak] = useState(false);
  const [wrongIds] = useState([]);
  const [correctIds] = useState([]);
  const prevComboRef = useRef(0);

  const current = quizQuestions[currentIndex];
  const total = quizQuestions.length;
  const progress = (currentIndex / total) * 100;

  const themeInfo = theme === 'random'
    ? { name: 'ランダム', icon: '🎲' }
    : themes[theme];

  function handleSelect(index) {
    if (confirmedAnswer !== null) return;
    setPendingAnswer(index);
  }

  function handleConfirm() {
    if (pendingAnswer === null) return;
    setConfirmedAnswer(pendingAnswer);
    setComboBreak(false);

    if (pendingAnswer === current.correct) {
      setScore((s) => s + 1);
      correctIds.push(current.id);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
      setConfettiTrigger((t) => t + 1);
      playCorrect();
      if (newCombo >= 3) {
        playCombo();
      }
    } else {
      wrongIds.push(current.id);
      if (combo >= 2) {
        setComboBreak(true);
      }
      setCombo(0);
      playWrong();
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      onFinish(score, maxCombo, wrongIds, correctIds);
    } else {
      setCurrentIndex((i) => i + 1);
      setPendingAnswer(null);
      setConfirmedAnswer(null);

      setComboBreak(false);
    }
  }

  const difficultyLabel = {
    easy:   { text: '⭐ 初級',      color: 'bg-green-100 text-green-700' },
    normal: { text: '⭐⭐ 中級',    color: 'bg-blue-100 text-blue-700' },
    hard:   { text: '⭐⭐⭐ 上級',  color: 'bg-orange-100 text-orange-700' },
    expert: { text: '🔥 プロ級',    color: 'bg-red-100 text-red-700' },
  };
  const diff = difficultyLabel[current.difficulty];

  const comboMessage =
    combo >= 10 ? { text: `🔥🔥 ${combo}連続！神がかり！！`, bg: 'bg-red-500' } :
    combo >= 7  ? { text: `🔥 ${combo}連続！天才すぎる！`,   bg: 'bg-orange-500' } :
    combo >= 5  ? { text: `⚡ ${combo}連続！絶好調！`,        bg: 'bg-amber-500' } :
    combo >= 3  ? { text: `✨ ${combo}連続正解！コンボ継続中！`, bg: 'bg-yellow-500' } :
    null;

  const comboBreakMessages = [
    'おしい！でもここからまた連続正解をめざそう💪',
    'ドンマイ！切りかえていこう⚡',
    'まだまだこれから！次は正解だ🔥',
    'ナイスチャレンジ！次いってみよう✨',
  ];
  const comboBreakMsg = comboBreakMessages[currentIndex % comboBreakMessages.length];

  const isCorrect = confirmedAnswer === current.correct;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-3 lg:px-6 py-4">
      <Confetti trigger={confettiTrigger} />
      <div className="max-w-2xl lg:max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-lg md:text-xl">{themeInfo.icon}</span>
            <span className="font-bold text-green-800 text-sm md:text-base">{themeInfo.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {combo >= 2 && (
              <div className="text-orange-500 font-black text-sm md:text-base animate-pulse">
                🔥 {combo}連続
              </div>
            )}
            <div className="text-sm md:text-base font-bold text-green-700">
              {currentIndex + 1} / {total}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-green-200 rounded-full mb-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Difficulty + Field diagram + Situation+Question を横並び */}
        <div className="flex gap-3 mb-3">
          {/* 左: フィールド図 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-2 flex-shrink-0 w-36 md:w-44 lg:w-64">
            <FieldDiagram situation={current.situation} theme={current.theme} />
          </div>

          {/* 右: 難易度 + 状況 + 問題 */}
          <div className="flex-1 bg-white rounded-xl p-3 shadow-sm border border-green-200 flex flex-col justify-between">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${diff.color}`}>
              {diff.text}
            </span>
            <div>
              <div className="text-xs md:text-sm font-bold text-amber-600 mb-0.5">状況</div>
              <div className="text-xs md:text-sm text-amber-900 mb-2 leading-snug">
                {current.situation}
              </div>
              <div className="border-t border-gray-100 pt-2">
                <div className="text-base md:text-lg font-bold text-gray-800 leading-snug">
                  {current.question}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Choices */}
        <div className="grid lg:grid-cols-2 gap-2 mb-3">
          {current.choices.map((choice, index) => {
            let style;
            if (confirmedAnswer !== null) {
              if (index === current.correct) {
                style = 'bg-green-100 border-2 border-green-500 text-green-800';
              } else if (index === confirmedAnswer && index !== current.correct) {
                style = 'bg-red-100 border-2 border-red-400 text-red-800';
              } else {
                style = 'bg-gray-50 border-2 border-gray-200 text-gray-400';
              }
            } else if (pendingAnswer === index) {
              style = 'bg-blue-50 border-2 border-blue-400 text-blue-800 ring-2 ring-blue-300';
            } else {
              style = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-green-400 hover:bg-green-50';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={confirmedAnswer !== null}
                className={`w-full p-3 md:p-4 rounded-xl text-left font-bold text-sm md:text-base transition-all ${style} ${confirmedAnswer === null ? 'active:scale-[0.98] cursor-pointer' : ''}`}
              >
                <span className="mr-1.5 inline-block w-6 text-center">
                  {confirmedAnswer !== null && index === current.correct ? '⭕' :
                   confirmedAnswer === index && index !== current.correct ? '❌' :
                   `${String.fromCharCode(65 + index)}.`}
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* 解答するボタン（選択後・確定前） */}
        {confirmedAnswer === null && (
          <button
            onClick={handleConfirm}
            disabled={pendingAnswer === null}
            className={`w-full p-3 rounded-xl font-bold text-base transition-all mb-3 ${
              pendingAnswer !== null
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg active:scale-[0.98] cursor-pointer'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            解答する ✅
          </button>
        )}

        {/* コンボバナー */}
        {confirmedAnswer !== null && isCorrect && comboMessage && (
          <div className={`${comboMessage.bg} text-white rounded-xl p-2.5 mb-3 text-center font-black text-base`}>
            {comboMessage.text}
          </div>
        )}

        {/* コンボ途切れメッセージ */}
        {confirmedAnswer !== null && !isCorrect && comboBreak && (
          <div className="combo-break-msg text-center text-sm font-bold text-amber-600 mb-3 bg-amber-50 rounded-xl p-2.5 border border-amber-200">
            {comboBreakMsg}
          </div>
        )}

        {/* Explanation */}
        {confirmedAnswer !== null && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-3 mb-3">
            <div className="text-xs font-bold text-blue-600 mb-1">
              {isCorrect ? '🎉 正解！' : '💡 解説'}
            </div>
            <div className="text-sm text-blue-900 leading-relaxed">
              {current.explanation}
            </div>
          </div>
        )}

        {/* Next button */}
        {confirmedAnswer !== null && (
          <button
            onClick={handleNext}
            className="w-full p-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-base shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {currentIndex + 1 >= total ? '結果を見る 🏆' : '次の問題へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
}
