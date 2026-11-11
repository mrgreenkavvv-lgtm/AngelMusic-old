// Звук: щипок гитарной струны (алгоритм Карплуса — Стронга) и короткие сигналы.
let ctx = null;
const cache = new Map();

function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function pluckBuffer(freq) {
  const key = Math.round(freq * 10);
  if (cache.has(key)) return cache.get(key);
  const c = ac(), sr = c.sampleRate, dur = 2.2;
  const buf = c.createBuffer(1, Math.floor(sr * dur), sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  const ring = new Float32Array(N);
  for (let i = 0; i < N; i++) ring[i] = Math.random() * 2 - 1;
  const decay = 0.996 - Math.min(0.006, freq / 200000);
  let idx = 0;
  for (let i = 0; i < out.length; i++) {
    const next = (idx + 1) % N;
    const v = decay * 0.5 * (ring[idx] + ring[next]);
    out[i] = ring[idx];
    ring[idx] = v;
    idx = next;
  }
  cache.set(key, buf);
  return buf;
}

/** Сыграть ноту. Гитара звучит на октаву ниже записи, поэтому midi - 12. */
export function playNote(midi, enabled = true) {
  if (!enabled) return;
  try {
    const c = ac();
    const freq = 440 * Math.pow(2, (midi - 12 - 69) / 12);
    const src = c.createBufferSource();
    src.buffer = pluckBuffer(freq);
    const g = c.createGain(); g.gain.value = 0.8;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200;
    src.connect(lp).connect(g).connect(c.destination);
    src.start();
  } catch { /* звук недоступен */ }
}

function beep(freqs, enabled, type = 'triangle', step = 0.09) {
  if (!enabled) return;
  try {
    const c = ac(), t0 = c.currentTime;
    freqs.forEach((f, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * step);
      g.gain.exponentialRampToValueAtTime(0.18, t0 + i * step + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + 0.22);
      o.connect(g).connect(c.destination);
      o.start(t0 + i * step); o.stop(t0 + i * step + 0.25);
    });
  } catch { /* ignore */ }
}
export const sfxRight = (on) => beep([660, 880], on);
export const sfxWrong = (on) => beep([260, 200], on, 'sine', 0.12);
export const sfxWin = (on) => beep([523, 659, 784, 1047], on, 'triangle', 0.11);
