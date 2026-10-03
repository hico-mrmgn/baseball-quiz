// 短い効果音。ファイルは持たず、その場で鳴らす。設定で消せる。

import { get } from './store.js';

let ctx = null;
function ac() {
  if (!get().settings.sound) return null;
  try {
    ctx = ctx ?? new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function tone(freq, dur, { type = 'sine', gain = 0.12, at = 0, slide = 0 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at;
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}

function noise(dur, { gain = 0.2, at = 0, freq = 1800 } = {}) {
  const c = ac(); if (!c) return;
  const t = c.currentTime + at;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination); src.start(t);
}

export const sfx = {
  tap:   () => tone(660, 0.06, { type: 'triangle', gain: 0.08 }),
  pick:  () => { tone(520, 0.07, { type: 'triangle' }); tone(780, 0.09, { type: 'triangle', at: 0.06 }); },
  bat:   () => { noise(0.07, { gain: 0.35, freq: 2600 }); tone(190, 0.09, { type: 'square', gain: 0.07 }); },
  catch: () => noise(0.06, { gain: 0.3, freq: 900 }),
  out:   () => { tone(523, 0.1, { type: 'square', gain: 0.07 }); tone(784, 0.18, { type: 'square', gain: 0.07, at: 0.1 }); },
  safe:  () => tone(300, 0.28, { type: 'sawtooth', gain: 0.06, slide: -120 }),
  run:   () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, { type: 'triangle', at: i * 0.09 })); },
  rank:  () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, { type: 'triangle', gain: 0.1, at: i * 0.11 })); },
};
