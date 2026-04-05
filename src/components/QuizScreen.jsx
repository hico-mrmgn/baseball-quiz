import { useState } from 'react';
import { themes } from '../data/questions';
import FieldDiagram from './FieldDiagram';

export default function QuizScreen({ questions: quizQuestions, theme, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [pendingAnswer, setPendingAnswer] = useState(null);   // 選択中（未確定）
  const [confirmedAnswer, setConfirmedAnswer] = useState(null); // 確定済み
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);

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
    if (pendingAnswer === current.correct) {
      setScore((s) => s + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      setMaxCombo((m) => Math.max(m, newCombo));
    } else {
      setCombo(0);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      onFinish(score, maxCombo);
    } else {
      setCurrentIndex((i) => i + 1);
      setPendingAnswer(null);
      setConfirmedAnswer(null);
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

  const isCorrect = confirmedAnswer === current.correct;

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-6">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{themeInfo.icon}</span>
            <span className="font-bold text-green-800">{themeInfo.name}</span>
          </div>
          <div className="flex items-center gap-3">
            {combo >= 2 && (
              <div className="text-orange-500 font-black text-sm animate-pulse">
                🔥 {combo}連続
              </div>
            )}
            <div className="text-sm font-bold text-green-700">
              {currentIndex + 1} / {total}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-green-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Difficulty */}
        <div className="mb-3">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${diff.color}`}>
            {diff.text}
          </span>
        </div>

        {/* Field diagram */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-3 mb-3">
          <FieldDiagram situation={current.situation} theme={current.theme} />
        </div>

        {/* Situation + Question combined */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-green-200">
          <div className="text-xs font-bold text-amber-600 mb-1">🎯 状況</div>
          <div className="text-sm font-bold text-amber-900 mb-3">
            {current.situation}
          </div>
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs font-bold text-green-600 mb-1">❓ 問題</div>
            <div className="text-lg font-bold text-gray-800">
              {current.question}
            </div>
          </div>
        </div>

        {/* Choices */}
        <div className="grid gap-3 mb-4">
          {current.choices.map((choice, index) => {
            let style;
            if (confirmedAnswer !== null) {
              // 確定後
              if (index === current.correct) {
                style = 'bg-green-100 border-2 border-green-500 text-green-800';
              } else if (index === confirmedAnswer && index !== current.correct) {
                style = 'bg-red-100 border-2 border-red-400 text-red-800';
              } else {
                style = 'bg-gray-50 border-2 border-gray-200 text-gray-400';
              }
            } else if (pendingAnswer === index) {
              // 選択中（未確定）
              style = 'bg-blue-50 border-2 border-blue-400 text-blue-800 ring-2 ring-blue-300';
            } else {
              // 未選択
              style = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-green-400 hover:bg-green-50';
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={confirmedAnswer !== null}
                className={`w-full min-h-[56px] p-4 rounded-xl text-left font-bold transition-all ${style} ${confirmedAnswer === null ? 'active:scale-[0.98] cursor-pointer' : ''}`}
              >
                <span className="mr-2 inline-block w-7 text-center">
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
        {pendingAnswer !== null && confirmedAnswer === null && (
          <button
            onClick={handleConfirm}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all cursor-pointer mb-4"
          >
            解答する ✅
          </button>
        )}

        {/* 選択前のヒント */}
        {pendingAnswer === null && confirmedAnswer === null && (
          <div className="text-center text-sm text-gray-400 mb-4">
            答えを選んでから「解答する」を押してね
          </div>
        )}

        {/* コンボバナー */}
        {confirmedAnswer !== null && isCorrect && comboMessage && (
          <div className={`${comboMessage.bg} text-white rounded-xl p-3 mb-4 text-center font-black text-lg`}>
            {comboMessage.text}
          </div>
        )}

        {/* Explanation */}
        {confirmedAnswer !== null && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-blue-600 mb-1">
              {isCorrect ? '🎉 正解！' : '💡 解説'}
            </div>
            <div className="text-base text-blue-900">
              {current.explanation}
            </div>
          </div>
        )}

        {/* Next button */}
        {confirmedAnswer !== null && (
          <button
            onClick={handleNext}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg active:scale-[0.98] transition-all cursor-pointer"
          >
            {currentIndex + 1 >= total ? '結果を見る 🏆' : '次の問題へ ➡️'}
          </button>
        )}
      </div>
    </div>
  );
}
