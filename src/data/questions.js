import { thirdQuestions } from './questions/third';
import { secondQuestions } from './questions/second';
import { shortQuestions } from './questions/short';
import { pitcherQuestions } from './questions/pitcher';
import { coachQuestions } from './questions/coach';
import { rulesQuestions } from './questions/rules';
import { baserunQuestions } from './questions/baserun';
import { firstQuestions } from './questions/first';
import { outfieldQuestions } from './questions/outfield';

export const questions = [
  ...thirdQuestions,
  ...secondQuestions,
  ...shortQuestions,
  ...pitcherQuestions,
  ...coachQuestions,
  ...rulesQuestions,
  ...baserunQuestions,
  ...firstQuestions,
  ...outfieldQuestions,
];

export const themes = {
  third:    { name: "サード編",     icon: "🥉", description: "サードの守備判断",      color: "from-amber-500 to-amber-600" },
  second:   { name: "セカンド編",   icon: "✌️", description: "セカンドの守備判断",    color: "from-blue-500 to-blue-600" },
  short:    { name: "ショート編",   icon: "⚡", description: "ショートの守備判断",    color: "from-purple-500 to-purple-600" },
  pitcher:  { name: "ピッチャー編", icon: "🔥", description: "ピッチャーの野球脳",    color: "from-red-500 to-red-600" },
  coach:    { name: "コーチャー編", icon: "📣", description: "3塁コーチャーの判断",   color: "from-green-600 to-green-700" },
  rules:    { name: "ルール編",     icon: "📖", description: "野球のルール知識",       color: "from-indigo-500 to-indigo-600" },
  baserun:  { name: "走塁編",       icon: "🏃", description: "走者としての状況判断",   color: "from-teal-500 to-teal-600" },
  first:    { name: "ファースト編", icon: "🧤", description: "ファーストの守備判断",   color: "from-orange-500 to-orange-600" },
  outfield: { name: "外野編",       icon: "🌿", description: "外野手の守備判断",       color: "from-lime-500 to-lime-600" },
};
