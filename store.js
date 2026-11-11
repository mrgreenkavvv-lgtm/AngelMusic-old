// Хранение прогресса ученика в памяти браузера (localStorage).
const KEY = 'angelmusic.v1';

const DEFAULTS = () => ({
  name: '',
  points: 0,
  stars: 0,
  days: [],                 // даты занятий YYYY-MM-DD
  notes: { best: {}, stats: {} },   // best[levelId] = 0..3 звезды; stats[noteId] = {r, w}
  theory: { seen: {}, best: {} },   // seen[cardId] = true; best[topicId] = 0..3
  perfect: 0,               // тестов без ошибок
  settings: {
    pin: '1234',
    noteLevels: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    topics: {},             // topicId: false — тема скрыта учителем
    sound: true,
    questions: 10,
    exam: { open: false, id: '', count: 20, format: 'choice', minutes: 0 },
  },
  exams: [],                // результаты экзаменов
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const data = JSON.parse(raw);
    const d = DEFAULTS();
    return { ...d, ...data,
      notes: { ...d.notes, ...data.notes },
      theory: { ...d.theory, ...data.theory },
      settings: { ...d.settings, ...data.settings,
        exam: { ...d.settings.exam, ...(data.settings || {}).exam },
        noteLevels: { ...d.settings.noteLevels, ...(data.settings || {}).noteLevels } } };
  } catch { return DEFAULTS(); }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* приватный режим */ }
}

export const get = () => state;

export function update(fn) { fn(state); save(); }

export function resetProgress() {
  const keep = { name: state.name, settings: state.settings };
  state = { ...DEFAULTS(), ...keep };
  save();
}

/* ===== Уровни ученика ===== */
export const LEVELS = [
  { at: 0,    name: 'Новичок' },
  { at: 50,   name: 'Слушатель' },
  { at: 120,  name: 'Юный музыкант' },
  { at: 200,  name: 'Знаток нот' },
  { at: 320,  name: 'Гитарист' },
  { at: 480,  name: 'Солист' },
  { at: 700,  name: 'Мастер' },
  { at: 1000, name: 'Маэстро' },
];

export function levelInfo(points = state.points) {
  let i = 0;
  while (i + 1 < LEVELS.length && points >= LEVELS[i + 1].at) i++;
  const cur = LEVELS[i], next = LEVELS[i + 1];
  return {
    n: i + 1, name: cur.name,
    next: next ? next.at : null,
    pct: next ? Math.round((points - cur.at) / (next.at - cur.at) * 100) : 100,
  };
}

/* ===== Серия дней ===== */
export const today = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function markToday() {
  const t = today();
  if (!state.days.includes(t)) { state.days.push(t); state.days = state.days.slice(-400); save(); }
}

export function streak() {
  const set = new Set(state.days);
  const d = new Date();
  if (!set.has(today(d))) d.setDate(d.getDate() - 1); // серия не прерывается, пока сегодня ещё не занимались
  let n = 0;
  while (set.has(today(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

export function bestStreak() {
  const ds = [...state.days].sort();
  let best = 0, cur = 0, prev = null;
  for (const s of ds) {
    const d = new Date(s + 'T12:00:00');
    cur = prev && (d - prev) / 864e5 === 1 ? cur + 1 : 1;
    best = Math.max(best, cur); prev = d;
  }
  return best;
}

/** Текущая неделя Пн..Вс: [{label, on, today}] */
export function week() {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const set = new Set(state.days);
  return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return { label, on: set.has(today(d)), today: today(d) === today(now) };
  });
}
