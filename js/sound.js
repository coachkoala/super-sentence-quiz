// Short synthesized sound effects via the Web Audio API — bright, bell-like
// tones (think Duolingo-style chimes) generated on the fly, so there's no
// audio file to ship or load. Every public function is safe to call even if
// the browser has no AudioContext support or the user has muted sound.

import { loadSoundPref, saveSoundPref } from './storage.js';

let ctx = null;
let masterGain = null;
let enabled = loadSoundPref();

function ensureContext() {
  if (ctx) return ctx;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  ctx = new AudioContextCtor();
  masterGain = ctx.createGain();
  masterGain.gain.value = 0.4;
  masterGain.connect(ctx.destination);
  return ctx;
}

function resumeIfNeeded(c) {
  // Mobile browsers create the AudioContext suspended until a user gesture
  // resumes it; every call here happens inside a click handler, so it's safe.
  if (c.state === 'suspended') c.resume();
}

// A bell-like "chime": a triangle fundamental plus a quiet sine overtone one
// octave up, both with a fast attack and short exponential decay. Reads as a
// bright toy-piano ding rather than a flat beep.
function chime(freq, { duration = 0.14, gain = 0.6, delay = 0 } = {}) {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  resumeIfNeeded(c);

  const t0 = c.currentTime + delay;

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);

  const overtone = c.createOscillator();
  const og = c.createGain();
  overtone.type = 'sine';
  overtone.frequency.setValueAtTime(freq * 2, t0);
  og.gain.setValueAtTime(gain * 0.25, t0);
  og.gain.exponentialRampToValueAtTime(0.0001, t0 + duration * 0.7);
  overtone.connect(og);
  og.connect(masterGain);
  overtone.start(t0);
  overtone.stop(t0 + duration * 0.7 + 0.02);
}

// A plainer, softer tone without the bright overtone — used where a chime
// would feel too "ding"-y (button taps, the wrong-answer cue).
function soft(freq, { duration = 0.12, gain = 0.4, delay = 0, freqEnd, type = 'sine' } = {}) {
  if (!enabled) return;
  const c = ensureContext();
  if (!c) return;
  resumeIfNeeded(c);

  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + duration);
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Major-pentatonic-ish note set (C5..C6) — keeps every chime landing on a
// pleasant, unambiguously "happy" pitch regardless of how they're combined.
const NOTE = { C4: 261.63, G4: 392.0, C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5 };

export function playTilePlace() {
  chime(NOTE.A5, { duration: 0.09, gain: 0.45 });
}

export function playTileRemove() {
  chime(NOTE.D5, { duration: 0.08, gain: 0.32 });
}

export function playButtonClick() {
  soft(600, { duration: 0.05, gain: 0.28, type: 'triangle' });
}

export function playCorrect(comboLevel) {
  // Bright ascending arpeggio (C-E-G), transposed up a little with combo so
  // streaks feel increasingly rewarding — capped so it never gets shrill.
  const semitoneShift = Math.min(Math.max(comboLevel - 1, 0), 6);
  const factor = Math.pow(2, semitoneShift / 12);
  [NOTE.C5, NOTE.E5, NOTE.G5].forEach((freq, i) => {
    chime(freq * factor, { duration: 0.16, gain: 0.6, delay: i * 0.07 });
  });
  // Every 5th combo gets an extra octave sparkle on top — a little "streak!" moment.
  if (comboLevel > 0 && comboLevel % 5 === 0) {
    chime(NOTE.C6 * factor, { duration: 0.22, gain: 0.5, delay: 0.22 });
  }
}

export function playWrong() {
  // A single soft downward glide — signals "not quite" without a harsh buzzer.
  soft(NOTE.G4, { duration: 0.22, gain: 0.38, type: 'sine', freqEnd: NOTE.C4 });
}

export function playGameOver() {
  [NOTE.G5, NOTE.E5, NOTE.C5].forEach((freq, i) => {
    chime(freq, { duration: 0.22, gain: 0.45, delay: i * 0.15 });
  });
  // Gentle closing chord so it lands soft rather than sounding like a fail buzzer.
  chime(NOTE.C5, { duration: 0.5, gain: 0.3, delay: 0.5 });
  chime(NOTE.E5, { duration: 0.5, gain: 0.25, delay: 0.5 });
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = value;
  saveSoundPref(enabled);
}
