import { thirdQuestions } from './questions/third';
import { secondQuestions } from './questions/second';
import { shortQuestions } from './questions/short';
import { pitcherQuestions } from './questions/pitcher';
import { coachQuestions } from './questions/coach';
import { rulesQuestions } from './questions/rules';
import { baserunQuestions } from './questions/baserun';
import { firstQuestions } from './questions/first';
import { outfieldQuestions } from './questions/outfield';
import { fightersQuestions } from './questions/fighters';
import { npb2025Questions } from './questions/npb2025';

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
  ...fightersQuestions,
  ...npb2025Questions,
];

export const themes = {
  third:    { name: "サード編",     icon: "🥉", description: "サードの守備判断",      color: "from-blue-600 to-blue-700" },
  second:   { name: "セカンド編",   icon: "✌️", description: "セカンドの守備判断",    color: "from-sky-500 to-blue-600" },
  short:    { name: "ショート編",   icon: "⚡", description: "ショートの守備判断",    color: "from-blue-700 to-blue-800" },
  pitcher:  { name: "ピッチャー編", icon: "🔥", description: "ピッチャーの野球脳",    color: "from-blue-500 to-blue-600" },
  coach:    { name: "コーチャー編", icon: "📣", description: "3塁コーチャーの判断",   color: "from-blue-700 to-blue-800" },
  rules:    { name: "ルール編",     icon: "📖", description: "野球のルール知識",       color: "from-blue-800 to-blue-900" },
  baserun:  { name: "走塁編",       icon: "🏃", description: "走者としての状況判断",   color: "from-sky-600 to-blue-700" },
  first:    { name: "ファースト編", icon: "🧤", description: "ファーストの守備判断",   color: "from-blue-600 to-blue-700" },
  outfield:  { name: "外野編",         icon: "🌿", description: "外野手の守備判断",         color: "from-sky-500 to-sky-600" },
  catcher:   { name: "キャッチャー編", icon: "🎯", description: "捕手の状況判断",           color: "from-blue-600 to-blue-700", comingSoon: true },
  batting:   { name: "バッティング編", icon: "🏏", description: "打者の状況判断",           color: "from-blue-600 to-blue-700", comingSoon: true },
  fighters:  { name: "ファイターズ編", icon: "💎", description: "日ハムの知識クイズ",       color: "from-blue-600 to-blue-700" },
  npb2025:   { name: "プロ野球編",     icon: "⚾", description: "プロ野球の知識クイズ",     color: "from-sky-600 to-blue-700" },
};
