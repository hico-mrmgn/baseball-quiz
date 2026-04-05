import { useState, useCallback } from 'react';
import TopScreen from './components/TopScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import BadgeScreen from './components/BadgeScreen';
import BadgeNotification from './components/BadgeNotification';
import LevelUpNotification from './components/LevelUpNotification';
import { questions } from './data/questions';
import { getCareerTier } from './utils/career';
import { saveResult, getHistory } from './utils/history';
import { checkAndUnlockBadges } from './utils/badges';
import { addXp } from './utils/level';
import { getDailyStreak, completeDailyChallenge, isDailyCompleted, getDailySeed } from './utils/daily';
import { saveWrongAnswer, removeWrongAnswer, getWrongAnswers } from './utils/weakness';
import { playLevelUp } from './utils/sound';

function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// シードベースのシャッフル（デイリーチャレンジ用）
function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
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
  const [quizMode, setQuizMode] = useState('normal'); // 'normal' | 'daily' | 'weakness'
  const [newBadges, setNewBadges] = useState([]);
  const [levelUpInfo, setLevelUpInfo] = useState(null);

  const startQuiz = useCallback((theme) => {
    let selected;
    if (theme === 'random') {
      selected = shuffle(questions).slice(0, 15);
    } else {
      selected = shuffle(questions.filter((q) => q.theme === theme)).slice(0, 15);
    }
    setCurrentTheme(theme);
    setQuizQuestions(selected);
    setQuizMode('normal');
    setScreen('quiz');
  }, []);

  const startDailyChallenge = useCallback(() => {
    const seed = getDailySeed();
    const selected = seededShuffle(questions, seed).slice(0, 5);
    setCurrentTheme('daily');
    setQuizQuestions(selected);
    setQuizMode('daily');
    setScreen('quiz');
  }, []);

  const startWeaknessQuiz = useCallback(() => {
    const wrongIds = getWrongAnswers();
    const wrongQuestions = questions.filter((q) => wrongIds.includes(q.id));
    if (wrongQuestions.length === 0) return;
    const selected = shuffle(wrongQuestions).slice(0, Math.min(15, wrongQuestions.length));
    setCurrentTheme('weakness');
    setQuizQuestions(selected);
    setQuizMode('weakness');
    setScreen('quiz');
  }, []);

  const handleFinish = useCallback((score, maxCombo, wrongAnswerIds, correctAnswerIds) => {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const tier = getCareerTier(percentage);

    // 間違えた問題を保存、正解した問題は苦手リストから除去
    if (wrongAnswerIds) {
      wrongAnswerIds.forEach((id) => saveWrongAnswer(id));
    }
    if (correctAnswerIds) {
      correctAnswerIds.forEach((id) => removeWrongAnswer(id));
    }

    // 履歴保存（デイリー・苦手モードも通常と同じ）
    const themeForSave = quizMode === 'daily' ? 'daily' : quizMode === 'weakness' ? 'weakness' : currentTheme;
    saveResult({
      theme: themeForSave,
      score,
      total: quizQuestions.length,
      maxCombo,
      careerTitle: tier.title,
      careerEmoji: tier.emoji,
    });

    // デイリーチャレンジ完了
    if (quizMode === 'daily') {
      completeDailyChallenge();
    }

    // レベルアップ
    const xpResult = addXp(score, quizQuestions.length, maxCombo);
    if (xpResult.levelUp) {
      setLevelUpInfo(xpResult.levelInfo);
    }

    // バッジチェック
    const history = getHistory();
    const stats = {
      totalGames: history.length,
      hasPerfect: history.some((h) => h.percentage === 100),
      bestScore: Math.max(...history.map((h) => h.percentage), 0),
      bestCombo: Math.max(...history.map((h) => h.maxCombo || 0), 0),
      uniqueThemes: new Set(history.map((h) => h.theme).filter((t) => t !== 'daily' && t !== 'weakness' && t !== 'random')).size,
      dailyStreak: getDailyStreak(),
    };
    const badges = checkAndUnlockBadges(stats);
    if (badges.length > 0) {
      setNewBadges(badges);
    }

    setFinalScore(score);
    setFinalMaxCombo(maxCombo);
    setScreen('result');
  }, [currentTheme, quizQuestions.length, quizMode]);

  const handleRetry = useCallback(() => {
    if (quizMode === 'daily') {
      startDailyChallenge();
    } else if (quizMode === 'weakness') {
      startWeaknessQuiz();
    } else {
      startQuiz(currentTheme);
    }
  }, [currentTheme, quizMode, startQuiz, startDailyChallenge, startWeaknessQuiz]);

  const handleHome = useCallback(() => {
    setScreen('top');
    setCurrentTheme(null);
    setQuizQuestions([]);
    setQuizMode('normal');
  }, []);

  if (screen === 'quiz') {
    return (
      <QuizScreen
        questions={quizQuestions}
        theme={quizMode === 'daily' ? 'random' : quizMode === 'weakness' ? 'random' : currentTheme}
        onFinish={handleFinish}
      />
    );
  }

  if (screen === 'result') {
    return (
      <>
        <ResultScreen
          score={finalScore}
          total={quizQuestions.length}
          maxCombo={finalMaxCombo}
          theme={quizMode === 'daily' ? 'daily' : quizMode === 'weakness' ? 'weakness' : currentTheme}
          onRetry={handleRetry}
          onHome={handleHome}
          onHistory={() => setScreen('history')}
        />
        {newBadges.length > 0 && (
          <BadgeNotification badges={newBadges} onDone={() => setNewBadges([])} />
        )}
        {levelUpInfo && (
          <LevelUpNotification
            levelInfo={levelUpInfo}
            onClose={() => {
              playLevelUp();
              setLevelUpInfo(null);
            }}
          />
        )}
      </>
    );
  }

  if (screen === 'history') {
    return <HistoryScreen onBack={() => setScreen(currentTheme ? 'result' : 'top')} />;
  }

  if (screen === 'badges') {
    return <BadgeScreen onBack={() => setScreen('top')} />;
  }

  return (
    <TopScreen
      onSelectTheme={startQuiz}
      onHistory={() => setScreen('history')}
      onBadges={() => setScreen('badges')}
      onDailyChallenge={startDailyChallenge}
      onWeaknessQuiz={startWeaknessQuiz}
    />
  );
}
