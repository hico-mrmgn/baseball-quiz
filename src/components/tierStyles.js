/**
 * 配点（最善手3／まあOK1／もったいない0／試合が壊れる-1）ごとの見た目。
 *
 * 実戦シナリオと守り切れの2画面で同じものを使うので、片方だけ色が変わって
 * しまわないよう1か所にまとめている。
 */
export const TIER_BOX = {
  best:  'bg-green-50 border-green-300',
  ok:    'bg-sky-50 border-sky-300',
  poor:  'bg-amber-50 border-amber-300',
  fatal: 'bg-red-50 border-red-300',
};

export const TIER_TEXT = {
  best:  'text-green-800',
  ok:    'text-sky-800',
  poor:  'text-amber-800',
  fatal: 'text-red-800',
};

export const TIER_CHIP = {
  best:  'bg-green-500 text-white',
  ok:    'bg-sky-500 text-white',
  poor:  'bg-amber-500 text-white',
  fatal: 'bg-red-500 text-white',
};
