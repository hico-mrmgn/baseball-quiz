import { useState, useCallback } from 'react';
import TopScreen from './components/TopScreen';
import QuizScreen from './components/QuizScreen';
import ResultScreen from './components/ResultScreen';
import HistoryScreen from './components/HistoryScreen';
import BadgeScreen from './components/BadgeScreen';
import BadgeNotification from './components/BadgeNotification';
import LevelUpNotification from './components/LevelUpNotification';
import ScenarioScreen from './components/ScenarioScreen';
import ScenarioResultScreen from './components/ScenarioResultScreen';
import InningScreen from './components/InningScreen';
import InningResultScreen from './components/InningResultScreen';
import DailyResultScreen from './components/DailyResultScreen';
import DrillScreen from './components/DrillScreen';
import FormationScreen from './components/FormationScreen';
import { questions } from './data/questions';
import {
  buildScenarioSet, buildDailyTraining, buildTagSet, SCENARIO_TRACKS,
} from './data/scenarios';
import { inningScenarios } from './data/innings';
import { summarize } from './utils/scenario';
import {
  shuffleAllChoices, makeSeededRandom, filterByDifficulty,
} from './utils/questionPrep';
import { getCareerTier } from './utils/career';
import { saveResult, getHistory } from './utils/history';
import { checkAndUnlockBadges } from './utils/badges';
import { addXp } from './utils/level';
import { getDailyStreak, completeDailyChallenge, getDailySeed } from './utils/daily';
import { saveWrongAnswer, removeWrongAnswer, getWrongAnswers } from './utils/weakness';
import { recordScenarioAnswers, getWeakTags } from './utils/weakTags';
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
function seededShuffle(array, rand) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
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
  const [quizDifficulty, setQuizDifficulty] = useState('all');
  const [newBadges, setNewBadges] = useState([]);
  const [levelUpInfo, setLevelUpInfo] = useState(null);
  const [scenarioList, setScenarioList] = useState([]);
  const [scenarioTrack, setScenarioTrack] = useState(SCENARIO_TRACKS[0]);
  const [scenarioAnswers, setScenarioAnswers] = useState([]);
  const [currentInning, setCurrentInning] = useState(null);
  const [inningResult, setInningResult] = useState(null);
  // 今日のトレーニング（実戦5場面 → 守り切れ1回）を1セッションとして扱う
  const [sessionMode, setSessionMode] = useState('single'); // 'single' | 'daily'
  const [dailyScenarioAnswers, setDailyScenarioAnswers] = useState([]);

  const startQuiz = useCallback((theme, difficulty = 'all') => {
    const pool = theme === 'random'
      ? questions
      : questions.filter((q) => q.theme === theme);
    const selected = shuffle(filterByDifficulty(pool, difficulty)).slice(0, 15);
    setCurrentTheme(theme);
    // 選択肢は出題のたびに混ぜる（並び順のクセで解けないようにするため）
    setQuizQuestions(shuffleAllChoices(selected));
    setQuizDifficulty(difficulty);
    setQuizMode('normal');
    setScreen('quiz');
  }, []);

  const startDailyChallenge = useCallback(() => {
    // 全員が同じ問題・同じ選択肢の並びで解けるよう、日付シードから再現する
    const rand = makeSeededRandom(getDailySeed());
    const selected = seededShuffle(questions, rand).slice(0, 5);
    setCurrentTheme('daily');
    setQuizQuestions(shuffleAllChoices(selected, rand));
    setQuizDifficulty('all');
    setQuizMode('daily');
    setScreen('quiz');
  }, []);

  const startWeaknessQuiz = useCallback(() => {
    const wrongIds = getWrongAnswers();
    const wrongQuestions = questions.filter((q) => wrongIds.includes(q.id));
    if (wrongQuestions.length === 0) return;
    const selected = shuffle(wrongQuestions).slice(0, Math.min(15, wrongQuestions.length));
    setCurrentTheme('weakness');
    setQuizQuestions(shuffleAllChoices(selected));
    setQuizDifficulty('all');
    setQuizMode('weakness');
    setScreen('quiz');
  }, []);

  const handleFinish = useCallback((score, maxCombo, wrongAnswerIds, correctAnswerIds, totalOverride) => {
    const total = totalOverride || quizQuestions.length;
    const percentage = Math.round((score / total) * 100);
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
      total,
      maxCombo,
      careerTitle: tier.title,
      careerEmoji: tier.emoji,
    });

    // デイリーチャレンジ完了（途中終了の場合は完了扱いにしない）
    if (quizMode === 'daily' && !totalOverride) {
      completeDailyChallenge();
    }

    // レベルアップ
    const xpResult = addXp(score, total, maxCombo);
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
    setQuizQuestions((prev) => totalOverride ? prev.slice(0, totalOverride) : prev);
    setScreen('result');
  }, [currentTheme, quizQuestions.length, quizMode]);

  const handleQuit = useCallback((score, maxCombo, wrongAnswerIds, correctAnswerIds, answeredCount) => {
    if (answeredCount === 0) {
      setScreen('top');
      setCurrentTheme(null);
      setQuizQuestions([]);
      setQuizMode('normal');
      return;
    }
    // 途中退出時は元の問題数をtotalとして使う（未回答は不正解扱い）
    handleFinish(score, maxCombo, wrongAnswerIds, correctAnswerIds);
  }, [handleFinish]);

  /** 履歴から実績を集計してバッジを判定する。複数のモードから呼ぶ。 */
  const refreshBadges = useCallback(() => {
    const history = getHistory();
    const stats = {
      totalGames: history.length,
      hasPerfect: history.some((h) => h.percentage === 100),
      bestScore: Math.max(...history.map((h) => h.percentage), 0),
      bestCombo: Math.max(...history.map((h) => h.maxCombo || 0), 0),
      uniqueThemes: new Set(
        history.map((h) => h.theme)
          .filter((t) => !['daily', 'weakness', 'random', 'scenario', 'inning'].includes(t)),
      ).size,
      dailyStreak: getDailyStreak(),
    };
    const badges = checkAndUnlockBadges(stats);
    if (badges.length > 0) setNewBadges(badges);
  }, []);

  /* ── 実戦シナリオ ── */
  const startScenario = useCallback((trackId) => {
    const track = SCENARIO_TRACKS.find((t) => t.id === trackId) ?? SCENARIO_TRACKS[0];
    const set = buildScenarioSet(trackId, 10);
    if (set.length === 0) return;
    setScenarioTrack(track);
    setScenarioList(set);
    setScenarioAnswers([]);
    setSessionMode('single');
    setScreen('scenario');
  }, []);

  /* ── 今日のトレーニング（実戦5場面 → 守り切れ1回） ── */
  const startDailyTraining = useCallback(() => {
    // 日付シードなので同じ日に開き直しても中身は変わらない。
    // そのうえで、苦手なタグを含む場面を優先して出す。
    const rand = makeSeededRandom(getDailySeed());
    const set = buildDailyTraining(rand, getWeakTags(), 5);
    if (set.length === 0) return;
    const inning = inningScenarios[Math.floor(rand() * inningScenarios.length)];
    setScenarioTrack({ id: 'daily', name: '今日のトレーニング' });
    setScenarioList(set);
    setScenarioAnswers([]);
    setDailyScenarioAnswers([]);
    setCurrentInning(inning);
    setInningResult(null);
    setSessionMode('daily');
    setScreen('scenario');
  }, []);

  const finishScenario = useCallback((answers) => {
    // 判断の種類ごとの苦手を記録する。次の今日のトレーニングの出題に効く。
    recordScenarioAnswers(answers);

    if (sessionMode === 'daily') {
      // 実戦が終わったら、そのまま守り切れへ。結果はセッションの最後にまとめて出す。
      setDailyScenarioAnswers(answers);
      setScreen('inning');
      return;
    }

    setScenarioAnswers(answers);
    setScreen('scenarioResult');
    if (answers.length === 0) return;

    // 実戦シナリオは配点制なので、経験値・履歴には「最善手の数」を成績として渡す。
    const s = summarize(answers);
    const bestCount = s.counts.best;
    saveResult({
      theme: 'scenario',
      score: bestCount,
      total: answers.length,
      maxCombo: 0,
      careerTitle: getCareerTier(s.bestRate).title,
      careerEmoji: getCareerTier(s.bestRate).emoji,
    });
    const xpResult = addXp(bestCount, answers.length, 0);
    if (xpResult.levelUp) setLevelUpInfo(xpResult.levelInfo);
  }, [sessionMode]);

  /** 結果画面の「ここを練習」から、その判断だけを集めて出題する。 */
  const startTagPractice = useCallback((tag) => {
    const set = buildTagSet(tag, 8);
    if (set.length === 0) return;
    setScenarioTrack({ id: `tag:${tag}`, name: tag });
    setScenarioList(set);
    setScenarioAnswers([]);
    setSessionMode('single');
    setScreen('scenario');
  }, []);

  /* ── イニング制「守り切れ！」 ── */
  const startInning = useCallback((inningId) => {
    const target = inningScenarios.find((i) => i.id === inningId);
    if (!target) return;
    setCurrentInning(target);
    setInningResult(null);
    setSessionMode('single');
    setScreen('inning');
  }, []);

  const finishInning = useCallback((result) => {
    setInningResult(result);

    if (sessionMode === 'daily') {
      // セッション全体（実戦5場面 ＋ 守り切れ1回）をまとめて記録する
      const all = [...dailyScenarioAnswers, ...result.answers];
      recordScenarioAnswers(result.answers);
      setScreen('dailyResult');
      if (all.length === 0) return;

      const s = summarize(all);
      saveResult({
        theme: 'daily',
        score: s.counts.best,
        total: all.length,
        maxCombo: 0,
        careerTitle: getCareerTier(s.bestRate).title,
        careerEmoji: getCareerTier(s.bestRate).emoji,
      });
      completeDailyChallenge();
      const xpResult = addXp(s.counts.best, all.length, result.cleared ? 5 : 0);
      if (xpResult.levelUp) setLevelUpInfo(xpResult.levelInfo);
      refreshBadges();
      return;
    }

    setScreen('inningResult');
    if (result.answers.length === 0) return;

    const s = summarize(result.answers);
    saveResult({
      theme: 'inning',
      score: s.counts.best,
      total: result.answers.length,
      maxCombo: 0,
      careerTitle: result.cleared ? '守り切った' : '守り切れず',
      careerEmoji: result.cleared ? '🛡️' : '💧',
    });
    // 守り切れたイニングにはボーナス経験値
    const xpResult = addXp(s.counts.best, result.answers.length, result.cleared ? 5 : 0);
    if (xpResult.levelUp) setLevelUpInfo(xpResult.levelInfo);
  }, [sessionMode, dailyScenarioAnswers, refreshBadges]);

  const handleRetry = useCallback(() => {
    if (quizMode === 'daily') {
      startDailyChallenge();
    } else if (quizMode === 'weakness') {
      startWeaknessQuiz();
    } else {
      startQuiz(currentTheme, quizDifficulty);
    }
  }, [currentTheme, quizMode, quizDifficulty, startQuiz, startDailyChallenge, startWeaknessQuiz]);

  const handleHome = useCallback(() => {
    setScreen('top');
    setCurrentTheme(null);
    setQuizQuestions([]);
    setQuizMode('normal');
    setScenarioList([]);
    setScenarioAnswers([]);
    setCurrentInning(null);
    setInningResult(null);
    setSessionMode('single');
    setDailyScenarioAnswers([]);
  }, []);

  if (screen === 'scenario') {
    return (
      <ScenarioScreen
        scenarios={scenarioList}
        trackName={scenarioTrack.name}
        onFinish={finishScenario}
        onQuit={(answers) => {
          if (answers.length === 0) {
            setScreen('top');
            return;
          }
          finishScenario(answers);
        }}
      />
    );
  }

  if (screen === 'scenarioResult') {
    return (
      <>
        <ScenarioResultScreen
          answers={scenarioAnswers}
          onRetry={() => startScenario(scenarioTrack.id)}
          onPracticeTag={startTagPractice}
          onHome={handleHome}
        />
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

  if (screen === 'dailyResult') {
    return (
      <>
        <DailyResultScreen
          scenarioAnswers={dailyScenarioAnswers}
          inningResult={inningResult}
          streak={getDailyStreak()}
          onPracticeTag={startTagPractice}
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

  if (screen === 'inning' && currentInning) {
    return (
      <InningScreen
        inning={currentInning}
        onFinish={finishInning}
        onQuit={handleHome}
      />
    );
  }

  if (screen === 'inningResult' && currentInning && inningResult) {
    return (
      <>
        <InningResultScreen
          inning={currentInning}
          result={inningResult}
          onRetry={() => startInning(currentInning.id)}
          onHome={handleHome}
        />
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

  if (screen === 'quiz') {
    return (
      <QuizScreen
        questions={quizQuestions}
        theme={quizMode === 'daily' ? 'random' : quizMode === 'weakness' ? 'random' : currentTheme}
        onFinish={handleFinish}
        onQuit={handleQuit}
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
    return <HistoryScreen onBack={() => setScreen('top')} />;
  }

  if (screen === 'drill') {
    return (
      <DrillScreen
        onBack={handleHome}
        onSelectTheme={startQuiz}
        onRandom={(difficulty) => startQuiz('random', difficulty)}
        onWeaknessQuiz={startWeaknessQuiz}
      />
    );
  }

  if (screen === 'formations') {
    return <FormationScreen onBack={handleHome} />;
  }

  if (screen === 'badges') {
    return <BadgeScreen onBack={() => setScreen('top')} />;
  }

  return (
    <TopScreen
      onStartDailyTraining={startDailyTraining}
      onStartScenario={startScenario}
      onStartInning={startInning}
      onOpenDrill={() => setScreen('drill')}
      onOpenFormations={() => setScreen('formations')}
      onHistory={() => setScreen('history')}
      onBadges={() => setScreen('badges')}
    />
  );
}
