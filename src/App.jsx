import { useState, useCallback } from 'react';
import TopScreen from './components/TopScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import { questions } from './data/questions';
import { getCareerTier } from './utils/career';
import { saveResult } from './utils/history';

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
  const [finalMaxCombo, setFinalMaxCombo] = useState(0);

  const startQuiz = useCallback((theme) => {
    let selected;
    if (theme === 'random') {
      selected = shuffle(questions).slice(0, 15);
    } else {
      selected = shuffle(questions.filter((q) => q.theme === theme)).slice(0, 15);
    }
    setCurrentTheme(theme);
    setQuizQuestions(selected);
    setScreen('quiz');
  }, []);

  const handleFinish = useCallback((score, maxCombo) => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const tier = getCareerTier(percentage);
    saveResult({
      theme: currentTheme,
      score,
      total: quizQuestions.length,
      maxCombo,
      careerTitle: tier.title,
      careerEmoji: tier.emoji,
    });
    setFinalScore(score);
    setFinalMaxCombo(maxCombo);
    setScreen('result');
  }, [currentTheme, quizQuestions.length]);

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
        maxCombo={finalMaxCombo}
        theme={currentTheme}
        onRetry={handleRetry}
        onHome={handleHome}
        onHistory={() => setScreen('history')}
      />
    );
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen(currentTheme ? 'result' : 'top')} />;
  }

  return <TopScreen onSelectTheme={startQuiz} onHistory={() => setScreen('history')} />;
}
