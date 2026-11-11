// Тренажёры: «Найди ноту на грифе», «Собери такт», «Слух». Здесь данные и рисунки, экраны — в app.js.
import { NOTES, NAMES, shuffle } from './notes.js';

/* ===================== Найди ноту на грифе ===================== */
// Открытые струны в записи (гитара звучит на октаву ниже): 1-я — ми второй октавы … 6-я — ми малой.
export const OPEN = [76, 71, 67, 62, 57, 52];
export const STRING_NAMES = ['ми', 'си', 'соль', 'ре', 'ля', 'ми'];
export const FRET_LEVELS = [
  { id: 1, title: 'Открытые струны', desc: 'Ничего не зажимаем — лад 0', maxFret: 0, color: 'orange' },
  { id: 2, title: 'Первые лады', desc: 'Лады 0–3', maxFret: 3, color: 'blue' },
  { id: 3, title: 'До 5-го лада', desc: 'Лады 0–5', maxFret: 5, color: 'green' },
  { id: 4, title: 'Весь гриф', desc: 'Лады 0–12', maxFret: 12, color: 'violet' },
];
const MAXF = 12;

/** Все места (струна, лад), где звучит нота с этим midi (в записи). */
export function placesFor(midi, maxFret = MAXF) {
  const res = [];
  OPEN.forEach((o, s) => { const f = midi - o; if (f >= 0 && f <= maxFret) res.push({ s, f }); });
  return res;
}
/** Ноты (без диезов) для уровня: те, что можно сыграть в пределах maxFret. */
export function fretTargets(level) {
  return NOTES.filter(n => placesFor(n.midi, level.maxFret).length);
}

const FX0 = 44, FXW = 296, W = 350;
const fx = (n) => n === 0 ? FX0 : FX0 + FXW * (1 - Math.pow(2, -n / 12)) / (1 - Math.pow(2, -MAXF / 12));
const sy = (s) => 22 + s * 22;
/** Гриф: слева верхний порожек, сверху 1-я (тонкая) струна. marks: [{s, f, cls}] */
export function fretboardSVG(marks = [], maxShow = MAXF) {
  let g = `<svg class="fretboard" viewBox="0 0 ${W} 166" aria-label="Гриф гитары">`;
  g += `<rect x="${FX0}" y="10" width="${fx(maxShow) - FX0}" height="134" rx="4" fill="#8B5A2B"/>`;
  for (const n of [3, 5, 7, 9]) if (n <= maxShow) g += `<circle cx="${(fx(n) + fx(n - 1)) / 2}" cy="77" r="4" fill="#F4EBDC" opacity=".8"/>`;
  if (maxShow >= 12) { const x = (fx(12) + fx(11)) / 2; g += `<circle cx="${x}" cy="55" r="4" fill="#F4EBDC" opacity=".8"/><circle cx="${x}" cy="99" r="4" fill="#F4EBDC" opacity=".8"/>`; }
  for (let n = 1; n <= maxShow; n++) g += `<line x1="${fx(n)}" x2="${fx(n)}" y1="10" y2="144" stroke="#D8D8D8" stroke-width="2.4"/>`;
  g += `<rect x="${FX0 - 4}" y="8" width="6" height="138" rx="2" fill="#F4EBDC"/>`;
  for (let s = 0; s < 6; s++) g += `<line x1="6" x2="${fx(maxShow) + 4}" y1="${sy(s)}" y2="${sy(s)}" stroke="#EFE7D8" stroke-width="${1.2 + s * 0.35}"/>
    <text x="4" y="${sy(s) + 4}" font-family="Nunito" font-weight="900" font-size="10" fill="#6E6790">${s + 1}</text>`;
  for (let n = 0; n <= maxShow; n++) g += `<text x="${n === 0 ? FX0 / 2 + 6 : (fx(n) + fx(n - 1)) / 2}" y="160" text-anchor="middle" font-family="Nunito" font-weight="800" font-size="10" fill="#6E6790">${n}</text>`;
  // клетки для нажатия
  for (let s = 0; s < 6; s++) for (let n = 0; n <= maxShow; n++) {
    const x0 = n === 0 ? 14 : fx(n - 1), x1 = n === 0 ? FX0 - 4 : fx(n);
    g += `<rect class="cell" data-s="${s}" data-f="${n}" x="${x0}" y="${sy(s) - 11}" width="${x1 - x0}" height="22" fill="transparent"/>`;
  }
  for (const m of marks) {
    const cx = m.f === 0 ? FX0 / 2 + 6 : (fx(m.f) + fx(m.f - 1)) / 2;
    g += `<circle class="mark ${m.cls || ''}" cx="${cx}" cy="${sy(m.s)}" r="8.5"/>`;
  }
  return g + '</svg>';
}

/* ===================== Собери такт ===================== */
// Длительности в восьмых: 8 — целая, 6 — половинная с точкой, 4 — половинная, 2 — четвертная, 1 — восьмая.
export const METERS = [
  { id: '2/4', top: 2, bottom: 4, cap: 4, count: 'раз-и, два-и' },
  { id: '3/4', top: 3, bottom: 4, cap: 6, count: 'раз-и, два-и, три-и' },
  { id: '4/4', top: 4, bottom: 4, cap: 8, count: 'раз-и, два-и, три-и, четыре-и' },
  { id: '6/8', top: 6, bottom: 8, cap: 6, count: 'раз-два-три-четыре-пять-шесть' },
];
export const DUR = {
  n8: { v: 8, g: '\u{1D15D}', name: 'Целая' },
  n6: { v: 6, g: 'dotted', name: 'Половинная с точкой' },
  n4: { v: 4, g: '\u{1D15E}', name: 'Половинная' },
  n2: { v: 2, g: '\u{1D15F}', name: 'Четвертная' },
  n1: { v: 1, g: '\u{1D160}', name: 'Восьмая' },
  r4: { v: 4, g: '\u{1D13C}', name: 'Половинная пауза', rest: true },
  r2: { v: 2, g: '\u{1D13D}', name: 'Четвертная пауза', rest: true },
  r1: { v: 1, g: '\u{1D13E}', name: 'Восьмая пауза', rest: true },
};
export const BAR_LEVELS = [
  { id: 1, title: 'Ноты', desc: 'Размеры 2/4, 3/4, 4/4 · целая, половинная, четвертная', meters: ['2/4', '3/4', '4/4'], palette: ['n8', 'n4', 'n2'], color: 'orange' },
  { id: 2, title: 'Ноты и восьмые', desc: '+ восьмые и половинная с точкой', meters: ['2/4', '3/4', '4/4'], palette: ['n8', 'n6', 'n4', 'n2', 'n1'], color: 'blue' },
  { id: 3, title: 'Ноты и паузы', desc: '+ паузы и размер 6/8', meters: ['2/4', '3/4', '4/4', '6/8'], palette: ['n6', 'n4', 'n2', 'n1', 'r4', 'r2', 'r1'], color: 'green' },
];

/** Задание: размер и уже стоящие в такте длительности; ребёнок должен добрать остаток. */
export function makeBar(level) {
  const pick = shuffle(level.meters)[0];
  const meter = METERS.find(m => m.id === pick);
  const vals = level.palette.map(k => DUR[k].v).filter(v => v < meter.cap);
  const pre = []; let sum = 0;
  const want = Math.max(1, Math.floor(meter.cap * (0.25 + Math.random() * 0.5)));
  while (sum < want) {
    const ok = level.palette.filter(k => DUR[k].v <= meter.cap - sum - 1 && DUR[k].v <= want - sum + 1);
    if (!ok.length) break;
    const k = shuffle(ok)[0]; pre.push(k); sum += DUR[k].v;
  }
  if (!vals.length || sum >= meter.cap) return makeBar(level);
  return { meter, pre, need: meter.cap - sum };
}
export const barSum = (keys) => keys.reduce((a, k) => a + DUR[k].v, 0);

/* ===================== Слух ===================== */
export const EAR_LEVELS = [
  { id: 1, title: 'Мажор или минор', desc: 'Весёлый или грустный аккорд', color: 'orange' },
  { id: 2, title: 'Выше или ниже', desc: 'Второй звук выше или ниже первого?', color: 'blue' },
  { id: 3, title: 'Какая нота?', desc: 'Сначала звучит «до», потом загадка', color: 'violet' },
];
/** Вопросы для слуха: возвращает [{ question, options, answer, sound: {kind, ...} }] */
export function makeEar(levelId, count) {
  const qs = [];
  for (let i = 0; i < count; i++) {
    if (levelId === 1) {
      const kind = Math.random() < 0.5 ? 'major' : 'minor';
      qs.push({ question: 'Послушай аккорд. Это мажор или минор?', options: ['Мажор', 'Минор'], answer: kind === 'major' ? 'Мажор' : 'Минор', sound: { kind } });
    } else if (levelId === 2) {
      const a = 55 + Math.floor(Math.random() * 14), step = 2 + Math.floor(Math.random() * 6), up = Math.random() < 0.5;
      qs.push({ question: 'Второй звук выше или ниже первого?', options: ['Выше', 'Ниже'], answer: up ? 'Выше' : 'Ниже', sound: { pair: [a, up ? a + step : a - step] } });
    } else {
      const first = NOTES.filter(n => n.octave === 4);   // до…си первой октавы
      const n = first[Math.floor(Math.random() * first.length)];
      const others = shuffle(NAMES.filter(x => x !== n.name)).slice(0, 3);
      qs.push({ question: 'Сначала «до», потом загадка. Какая нота?', options: shuffle([n.name, ...others]), answer: n.name, sound: { ref: 60, note: n.midi } });
    }
  }
  return qs;
}
