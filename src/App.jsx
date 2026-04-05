import { useState, useCallback } from 'react';
import TopScreen from './components/TopScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import { questions } from './data/questions';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function App() {
  const [screen, setScreen] = useState('top');
  const [currentTheme, setCurrentTheme] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [finalScore, setFinalScore] = useState(0);

  const startQuiz = useCallback((theme) => {
    let selected;
    if (theme === 'random') {
      selected = shuffle(questions).slice(0, 20);
    } else {
      selected = shuffle(questions.filter((q) => q.theme === theme));
    }
    setCurrentTheme(theme);
    setQuizQuestions(selected);
    setScreen('quiz');
  }, []);

  const handleFinish = useCallback((score) => {
    setFinalScore(score);
    setScreen('result');
  }, []);

  const handleRetry = useCallback(() => {
    startQuiz(currentTheme);
  }, [currentTheme, startQuiz]);

  const handleHome = useCallback(() => {
    setScreen('top');
    setCurrentTheme(null);
    setQuizQuestions([]);
  }, []);

  if (screen === 'quiz') {
    return (
      <QuizScreen
        questions={quizQuestions}
        theme={currentTheme}
        onFinish={handleFinish}
      />
    );
  }

  if (screen === 'result') {
    return (
      <ResultScreen
        score={finalScore}
        total={quizQuestions.length}
        theme={currentTheme}
        onRetry={handleRetry}
        onHome={handleHome}
      />
    );
  }

  return <TopScreen onSelectTheme={startQuiz} />;
}
