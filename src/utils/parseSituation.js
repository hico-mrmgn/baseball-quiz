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

  const ball = parseBallPosition(situation);

  return { outs, runners, ball };
}

function parseBallPosition(situation) {
  // Outfield hits
  if (situation.includes('センターとレフトの間') || situation.includes('レフトとセンターの間'))
    return { x: 62, y: 22, area: 'センター左' };
  if (situation.includes('センターとライトの間') || situation.includes('ライトとセンターの間'))
    return { x: 158, y: 22, area: 'センター右' };
  if (situation.includes('レフトへ') || situation.includes('レフト前') || situation.includes('レフト方向'))
    return { x: 28, y: 36, area: 'レフト' };
  if (situation.includes('センターへ') || situation.includes('センター方向') || situation.includes('フェンス直撃') || situation.includes('センターへの'))
    return { x: 100, y: 14, area: 'センター' };
  if (situation.includes('ライトへ') || situation.includes('ライト方向') || situation.includes('ライト前'))
    return { x: 172, y: 36, area: 'ライト' };

  // Infield grounders  (ボールはポジションから少しホーム寄りにずらす)
  if (situation.includes('サードゴロ') || situation.includes('サードへのゴロ') || situation.includes('サードに強いゴロ') || situation.includes('サードに飛んで') || situation.includes('内野ゴロがサード'))
    return { x: 58, y: 130, area: 'サード' };
  if (situation.includes('ショートゴロ') || situation.includes('ショートへのゴロ'))
    return { x: 72, y: 114, area: 'ショート' };
  if (situation.includes('セカンドゴロ') || situation.includes('セカンドへのゴロ'))
    return { x: 128, y: 102, area: 'セカンド' };
  if (situation.includes('ファーストゴロ') || situation.includes('ファーストへのゴロ') || situation.includes('ファーストへの強いゴロ'))
    return { x: 162, y: 130, area: 'ファースト' };
  if (situation.includes('ファースト方向へのゴロ') || situation.includes('ファースト方向'))
    return { x: 148, y: 116, area: 'ファースト方向' };
  if (situation.includes('ピッチャーゴロ') || situation.includes('ピッチャーへのバント'))
    return { x: 110, y: 148, area: 'ピッチャー' };

  // Bunts
  if (situation.includes('スクイズ') || situation.includes('バント'))
    return { x: 100, y: 155, area: 'バント' };

  // Catcher / passball
  if (situation.includes('パスボール') || situation.includes('ワイルドピッチ'))
    return { x: 100, y: 188, area: 'キャッチャー後' };
  if (situation.includes('キャッチャーへ'))
    return { x: 100, y: 172, area: 'キャッチャー' };

  // Generic flys
  if (situation.includes('内野フライ'))
    return { x: 100, y: 102, area: '内野' };

  return null;
}
