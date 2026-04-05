import { thirdQuestions } from './questions/third';
import { secondQuestions } from './questions/second';
import { shortQuestions } from './questions/short';
import { pitcherQuestions } from './questions/pitcher';
import { coachQuestions } from './questions/coach';

export const questions = [
  ...thirdQuestions,
  ...secondQuestions,
  ...shortQuestions,
  ...pitcherQuestions,
  ...coachQuestions,
];

export const themes = {
  third: { name: "サード編", icon: "🥉", description: "サードの守備判断", color: "from-amber-500 to-amber-600" },
  second: { name: "セカンド編", icon: "✌️", description: "セカンドの守備判断", color: "from-blue-500 to-blue-600" },
  short: { name: "ショート編", icon: "⚡", description: "ショートの守備判断", color: "from-purple-500 to-purple-600" },
  pitcher: { name: "ピッチャー編", icon: "🔥", description: "ピッチャーの野球脳", color: "from-red-500 to-red-600" },
  coach: { name: "コーチャー編", icon: "📣", description: "3塁コーチャーの判断", color: "from-green-600 to-green-700" },
};
