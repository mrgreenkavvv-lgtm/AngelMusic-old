// Ноты гитарного диапазона в скрипичном ключе: от «ми» малой до «ми» третьей октавы.
export const NAMES = ['До', 'Ре', 'Ми', 'Фа', 'Соль', 'Ля', 'Си'];
const SEMI = [0, 2, 4, 5, 7, 9, 11];
const OCT_NAME = { 3: 'малой', 4: 'первой', 5: 'второй', 6: 'третьей' };
const E4 = 4 * 7 + 2;

/** Все ноты: id, буква (0..6), октава, позиция на стане (0 — нижняя линейка, ми первой октавы). */
export const NOTES = [];
for (let i = 3 * 7 + 2; i <= 6 * 7 + 2; i++) {
  const letter = i % 7, octave = Math.floor(i / 7);
  NOTES.push({
    id: `${letter}${octave}`, letter, octave, pos: i - E4,
    name: NAMES[letter],
    full: `${NAMES[letter]} ${OCT_NAME[octave]} октавы`,
    midi: 12 * (octave + 1) + SEMI[letter],
  });
}
export const byPos = (p) => NOTES.find(n => n.pos === p);

export const NOTE_LEVELS = [
  { id: 1, title: 'Ноты на линейках', desc: 'Ми, соль, си, ре, фа', positions: [0, 2, 4, 6, 8], color: 'orange' },
  { id: 2, title: 'Ноты между линейками', desc: 'Фа, ля, до, ми и соседи', positions: [-1, 1, 3, 5, 7, 9], color: 'blue' },
  { id: 3, title: 'Весь нотный стан', desc: 'От ре до соль второй октавы', positions: range(-1, 9), color: 'green' },
  { id: 4, title: 'Добавочные линейки внизу', desc: 'До ми малой октавы', positions: range(-7, 1), color: 'pink' },
  { id: 5, title: 'Добавочные линейки вверху', desc: 'До ми третьей октавы', positions: range(8, 14), color: 'violet' },
  { id: 6, title: 'Все ноты гитары', desc: 'От ми малой до ми третьей', positions: range(-7, 14), color: 'yellow' },
  { id: 7, title: 'Профи 1', desc: 'Все ноты, 7 кнопок: выбери ноту', positions: range(-7, 14), color: 'orange', mode: 'pro1' },
  { id: 8, title: 'Профи 2', desc: 'Нота и октава: «соль первой октавы»', positions: range(-7, 14), color: 'violet', mode: 'pro2' },
];
export const ALL_POSITIONS = range(-7, 14);
export const OCTAVES = [{ n: 3, name: 'Малая' }, { n: 4, name: 'Первая' }, { n: 5, name: 'Вторая' }, { n: 6, name: 'Третья' }];
function range(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

/** SVG нотного стана с одной нотой. */
export function staffSVG(pos, { minPos = -1, maxPos = 9, color = '#2B2350', noteColor = '#FF7A3D' } = {}) {
  const gap = 14, half = gap / 2, W = 320;
  const lo = Math.min(minPos, -1) - 3, hi = Math.max(maxPos, 9) + 4;
  const H = (hi - lo) * half;
  const y = (p) => (hi - p) * half;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Нота на нотном стане">`;
  for (let i = 0; i < 5; i++) {
    s += `<line x1="8" x2="${W - 8}" y1="${y(i * 2)}" y2="${y(i * 2)}" stroke="${color}" stroke-width="2"/>`;
  }
  // скрипичный ключ (завиток на 2-й линейке — «соль»)
  s += `<text x="14" y="${y(2) + gap * 0.875}" font-family="Music" font-size="${gap * 5}" fill="${color}">\u{1D11E}</text>`;
  if (pos !== null && pos !== undefined) {
    const x = W * 0.6, rx = gap * 0.7, ry = gap * 0.52, ny = y(pos);
    // добавочные линейки
    for (let p = -2; p >= pos; p -= 2) s += ledger(x, y(p), rx, color);
    for (let p = 10; p <= pos; p += 2) s += ledger(x, y(p), rx, color);
    s += `<ellipse cx="${x}" cy="${ny}" rx="${rx}" ry="${ry}" transform="rotate(-20 ${x} ${ny})" fill="${noteColor}"/>`;
    const up = pos < 4, len = gap * 3.5;
    const sx = up ? x + rx - 1.5 : x - rx + 1.5;
    s += `<line x1="${sx}" x2="${sx}" y1="${ny}" y2="${up ? ny - len : ny + len}" stroke="${noteColor}" stroke-width="2.6" stroke-linecap="round"/>`;
  }
  return s + '</svg>';
}
function ledger(x, y, rx, color) {
  return `<line x1="${x - rx - 7}" x2="${x + rx + 7}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="2"/>`;
}

/** Набор вопросов для уровня: случайные ноты без повторов подряд, 4 варианта ответа. */
export function makeQuiz(level, count = 10) {
  const qs = []; let prev = null;
  for (let i = 0; i < count; i++) {
    let p;
    do { p = level.positions[Math.floor(Math.random() * level.positions.length)]; }
    while (level.positions.length > 1 && p === prev);
    prev = p;
    const note = byPos(p);
    const others = shuffle([0, 1, 2, 3, 4, 5, 6].filter(l => l !== note.letter)).slice(0, 3);
    qs.push({ note, options: shuffle([note.letter, ...others]) });
  }
  return qs;
}

export function shuffle(a) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
