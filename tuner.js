// Тюнер: слушает микрофон и находит частоту звука (автокорреляция).
export const STRINGS = [
  { n: 1, name: 'Ми', note: 'E4', f: 329.63 },
  { n: 2, name: 'Си', note: 'B3', f: 246.94 },
  { n: 3, name: 'Соль', note: 'G3', f: 196.00 },
  { n: 4, name: 'Ре', note: 'D3', f: 146.83 },
  { n: 5, name: 'Ля', note: 'A2', f: 110.00 },
  { n: 6, name: 'Ми', note: 'E2', f: 82.41 },
];

let ctx = null, stream = null, raf = 0;

/** Запустить тюнер. onPitch(freq|null) вызывается ~20 раз в секунду. */
export async function startTuner(onPitch) {
  stopTuner();
  stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  const src = ctx.createMediaStreamSource(stream);
  const an = ctx.createAnalyser();
  an.fftSize = 2048;
  src.connect(an);
  const buf = new Float32Array(an.fftSize);
  const myCtx = ctx;
  const loop = () => {
    if (ctx !== myCtx) return;   // тюнер уже выключен
    an.getFloatTimeDomainData(buf);
    onPitch(detect(buf, ctx.sampleRate));
    raf = setTimeout(loop, 50);   // ~20 раз в секунду — бережём батарею
  };
  loop();
}

export function stopTuner() {
  clearTimeout(raf);
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (ctx) ctx.close().catch(() => {});
  stream = null; ctx = null;
}
export const tunerRunning = () => !!stream;

function detect(buf, sr) {
  const n = buf.length;
  let rms = 0;
  for (let i = 0; i < n; i++) rms += buf[i] * buf[i];
  if (Math.sqrt(rms / n) < 0.01) return null;          // тишина
  const minLag = Math.floor(sr / 1000), maxLag = Math.floor(sr / 70);
  let best = -1, bestCorr = 0;
  const corr = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let c = 0;
    for (let i = 0; i < n - lag; i++) c += buf[i] * buf[i + lag];
    corr[lag] = c;
  }
  // первый заметный пик (чтобы не перепрыгнуть на октаву ниже)
  let max = 0;
  for (let lag = minLag; lag <= maxLag; lag++) if (corr[lag] > max) max = corr[lag];
  for (let lag = minLag + 1; lag <= maxLag; lag++) {
    if (corr[lag] > corr[lag - 1] && corr[lag] >= corr[lag + 1] && corr[lag] > 0.85 * max) { best = lag; bestCorr = corr[lag]; break; }
  }
  if (best < 0 || bestCorr <= 0) return null;
  const a = corr[best - 1], b = corr[best], c = corr[best + 1];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return sr / (best + shift);
}

/** Ближайшая струна и отклонение в центах. */
export function nearest(freq) {
  let s = STRINGS[0], d = Infinity;
  for (const x of STRINGS) { const c = Math.abs(1200 * Math.log2(freq / x.f)); if (c < d) { d = c; s = x; } }
  return { string: s, cents: 1200 * Math.log2(freq / s.f) };
}
