const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export function playCorrect() {
  playTone(523, 0.1, 'sine', 0.25);   // C5
  setTimeout(() => playTone(659, 0.1, 'sine', 0.25), 80);  // E5
  setTimeout(() => playTone(784, 0.15, 'sine', 0.3), 160);  // G5
}

export function playWrong() {
  playTone(200, 0.15, 'square', 0.15);
  setTimeout(() => playTone(180, 0.25, 'square', 0.12), 120);
}

export function playCombo() {
  setTimeout(() => {
    playTone(880, 0.08, 'sine', 0.2);   // A5
    setTimeout(() => playTone(1047, 0.12, 'sine', 0.25), 60); // C6
  }, 250);
}

export function playResult() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), i * 150);
  });
}

export function playLevelUp() {
  const notes = [392, 523, 659, 784, 1047]; // G4 C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.15, 'sine', 0.25), i * 100);
  });
}
