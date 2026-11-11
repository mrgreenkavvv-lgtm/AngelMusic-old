// Хранение прогресса ученика в памяти браузера (localStorage).
const KEY = 'angelmusic.v1';

const DEFAULTS = () => ({
  name: '',
  points: 0,
  gems: 0,                  // алмазики
  days: [],                 // даты занятий YYYY-MM-DD
  time: {},                 // секунды занятий по дням: { 'YYYY-MM-DD': 600 }
  log: [],                  // попытки: { t, kind, id, title, right, total }
  notes: { best: {}, stats: {} },   // best[levelId] = 0..3 звезды; stats[noteId] = {r, w}
  theory: { seen: {}, best: {}, done: {} },   // done[topicId] — алмазики за все карточки уже выданы
  games: { best: {} },      // best['fret1'|'bar1'|'ear1'...] = 0..3
  perfect: 0,               // тестов без ошибок
  perfectBy: {},            // тестов без ошибок по каждому уровню/теме — для медалей
  streakGems: {},           // за какие серии уже выданы алмазики
  owned: { 'av-note': true, 'g-classic': true, 'th-sun': true },
  equip: { avatar: 'av-note', head: '', face: '', neck: '', guitar: 'g-classic', theme: 'th-sun' },
  prizeLog: [],             // покупки призов: { uid, id, title, price, date, given }
  settings: {
    pin: '1122',
    pinChanged: false,
    noteLevels: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true },
    topics: {},             // topicId: false — тема скрыта учителем
    sound: true,
    questions: 10,
    exam: { open: false, id: '', count: 20, format: 'choice', minutes: 0, sections: { notes: true } },
    prizes: [],             // призы от учителя: { id, title, price }
  },
  exams: [],                // результаты экзаменов
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const data = JSON.parse(raw);
    const d = DEFAULTS(), ds = data.settings || {};
    const st = { ...d, ...data,
      notes: { ...d.notes, ...data.notes },
      theory: { ...d.theory, ...data.theory },
      games: { ...d.games, ...data.games },
      owned: { ...d.owned, ...data.owned },
      equip: { ...d.equip, ...data.equip },
      settings: { ...d.settings, ...ds,
        exam: { ...d.settings.exam, ...ds.exam, sections: { ...d.settings.exam.sections, ...(ds.exam || {}).sections } },
        noteLevels: { ...d.settings.noteLevels, ...ds.noteLevels } } };
    // старый ПИН по умолчанию 1234 → новый 1122 (если учитель его не менял)
    if (!st.settings.pinChanged && st.settings.pin === '1234') st.settings.pin = '1122';
    return st;
  } catch { return DEFAULTS(); }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* приватный режим */ }
}

export const get = () => state;

export function update(fn) { fn(state); save(); }

export function resetProgress() {
  const keep = { name: state.name, settings: state.settings };  // прогресс, алмазики и покупки сбрасываются
  state = { ...DEFAULTS(), ...keep };
  save();
}

/* ===== Уровни ученика ===== */
export const LEVELS = [
  { at: 0,    name: 'Новичок' },
  { at: 50,   name: 'Слушатель' },
  { at: 120,  name: 'Ученик' },
  { at: 200,  name: 'Юный музыкант' },
  { at: 320,  name: 'Знаток нот' },
  { at: 480,  name: 'Гитарист' },
  { at: 700,  name: 'Исполнитель' },
  { at: 1000, name: 'Солист' },
  { at: 1350, name: 'Звезда класса' },
  { at: 1750, name: 'Мастер' },
  { at: 2200, name: 'Виртуоз' },
  { at: 2700, name: 'Композитор' },
  { at: 3300, name: 'Дирижёр' },
  { at: 4000, name: 'Маэстро' },
  { at: 5000, name: 'Легенда' },
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

/* ===== Журнал занятий ===== */
export function logAttempt(kind, id, title, right, total) {
  state.log.push({ t: Date.now(), kind, id, title, right, total });
  if (state.log.length > 600) state.log = state.log.slice(-600);
  save();
}
export function addTime(sec) {
  const t = today();
  state.time[t] = (state.time[t] || 0) + sec;
  save();
}

/* ===== Медали мастерства: бронза — 1, серебро — 3, золото — 5 прохождений без ошибок ===== */
export function medal(key) {
  const n = state.perfectBy[key] || 0;
  return n >= 5 ? 'gold' : n >= 3 ? 'silver' : n >= 1 ? 'bronze' : '';
}
