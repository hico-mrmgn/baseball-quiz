import { useState } from 'react';
import { themes } from '../data/questions';

export default function QuizScreen({ questions: quizQuestions, theme, onFinish }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const current = quizQuestions[currentIndex];
  const total = quizQuestions.length;
  const progress = ((currentIndex) / total) * 100;

  const themeInfo = theme === 'random'
    ? { name: 'ランダム', icon: '🎲' }
    : themes[theme];

  function handleSelect(index) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    setShowExplanation(true);
    if (index === current.correct) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      const finalScore = selectedAnswer === current.correct ? score : score;
      onFinish(finalScore);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  }

  const difficultyLabel = {
    easy: { text: 'かんたん', color: 'bg-green-100 text-green-700' },
    normal: { text: 'ふつう', color: 'bg-yellow-100 text-yellow-700' },
    hard: { text: 'むずかしい', color: 'bg-red-100 text-red-700' },
  };

  const diff = difficultyLabel[current.difficulty];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{themeInfo.icon}</span>
            <span className="font-bold text-green-800">{themeInfo.name}</span>
          </div>
          <div className="text-sm font-bold text-green-700">
            {currentIndex + 1} / {total}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-green-200 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Difficulty */}
        <div className="mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${diff.color}`}>
            {diff.text}
          </span>
        </div>

        {/* Situation */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 mb-4">
          <div className="text-xs font-bold text-amber-600 mb-1">&#127919; 状況</div>
          <div className="text-base font-bold text-amber-900">
            {current.situation}
          </div>
        </div>

        {/* Question */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-green-200">
          <div className="text-xs font-bold text-green-600 mb-1">&#10067; 問題</div>
          <div className="text-lg font-bold text-gray-800">
            {current.question}
          </div>
        </div>

        {/* Choices */}
        <div className="grid gap-3 mb-6">
          {current.choices.map((choice, index) => {
            let style = 'bg-white border-2 border-gray-200 text-gray-800 hover:border-green-400 hover:bg-green-50';

            if (selectedAnswer !== null) {
              if (index === current.correct) {
                style = 'bg-green-100 border-2 border-green-500 text-green-800';
              } else if (index === selectedAnswer && index !== current.correct) {
                style = 'bg-red-100 border-2 border-red-400 text-red-800';
              } else {
                style = 'bg-gray-50 border-2 border-gray-200 text-gray-400';
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleSelect(index)}
                disabled={selectedAnswer !== null}
                className={`w-full min-h-[56px] p-4 rounded-xl text-left font-bold transition-all ${style} ${selectedAnswer === null ? 'active:scale-[0.98] cursor-pointer' : ''}`}
              >
                <span className="mr-2 inline-block w-7 text-center">
                  {selectedAnswer !== null && index === current.correct ? '⭕' :
                   selectedAnswer === index && index !== current.correct ? '❌' :
                   `${String.fromCharCode(65 + index)}.`}
                </span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showExplanation && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <div className="text-xs font-bold text-blue-600 mb-1">
              {selectedAnswer === current.correct ? '&#127881; 正解！' : '&#128161; 解説'}
            </div>
            <div className="text-base text-blue-900">
              {current.explanation}
            </div>
          </div>
        )}

        {/* Next button */}
        {showExplanation && (
          <button
            onClick={handleNext}
            className="w-full p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg shadow-lg hover:shadow-xl active:scale-[0.98] transition-all cursor-pointer"
          >
            {currentIndex + 1 >= total ? '結果を見る &#127942;' : '次の問題へ &#10145;&#65039;'}
          </button>
        )}
      </div>
    </div>
  );
}
