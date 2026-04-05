export function parseSituation(situation) {
  let outs = 0;
  if (situation.includes('ノーアウト')) outs = 0;
  else if (situation.includes('1アウト')) outs = 1;
  else if (situation.includes('2アウト')) outs = 2;

  const runners = { first: false, second: false, third: false };

  if (!situation.includes('ランナーなし')) {
    const match = situation.match(/ランナー([^。]+)/);
    if (match) {
      const part = match[1];
      if (part.includes('1')) runners.first = true;
      if (part.includes('2')) runners.second = true;
      if (part.includes('3')) runners.third = true;
    }
  }

  return { outs, runners };
}
