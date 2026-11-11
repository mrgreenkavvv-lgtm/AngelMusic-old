import * as store from './store.js';
import { NOTE_LEVELS, NAMES, NOTES, OCTAVES, ALL_POSITIONS, staffSVG, makeQuiz, shuffle } from './notes.js';
import { TOPICS, ALL_CARDS, DOTTED_HALF } from './theory.js';
import { playNote, playKind, playPair, sfxRight, sfxWrong, sfxWin } from './audio.js';
import { OPEN, FRET_LEVELS, placesFor, fretTargets, fretboardSVG, METERS, DUR, BAR_LEVELS, makeBar, barSum, EAR_LEVELS, makeEar } from './games.js';
import { STRINGS, startTuner, stopTuner, nearest } from './tuner.js';
import { CATALOG, findItem, avatarSVG, itemPreview, applyLook } from './shop.js';

const APP_VERSION = '4';
const $app = document.getElementById('app');
const S = () => store.get();
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ===== Иконки ===== */
const I = {
  star: (c = '#FFC93D') => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  gem: `<svg viewBox="0 0 24 24"><path d="M6 3h12l4 6-10 12L2 9z" fill="#4DB8FF"/><path d="M2 9h20M8.5 3L12 9l3.5-6M12 9v12M6 3l2.5 6M18 3l-2.5 6" stroke="#fff" stroke-width="1.2" fill="none" opacity=".7"/></svg>`,
  back: `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  flame: `<svg viewBox="0 0 24 30" width="26" height="32"><path d="M12 1C14 8 21 11 21 19A9 9 0 0 1 3 19C3 14 6 12 7 8C9 11 10 12 11 12C11 8 10 5 12 1Z" fill="#FF7A3D"/><path d="M12 14C14 17 16 18 16 21A4 4 0 0 1 8 21C8 18 10 17 12 14Z" fill="#FFD25E"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
  sound: `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#FF7A3D"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#FF7A3D" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  medal: `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#fff" opacity=".35"/><path d="M12 9.5l1.4 2.9 3.2.4-2.3 2.2.6 3.1L12 16.6l-2.9 1.5.6-3.1-2.3-2.2 3.2-.4z" fill="#fff"/><path d="M8 2h3l1 5-3 0zM16 2h-3l-1 5 3 0z" fill="#fff" opacity=".8"/></svg>`,
  exam: `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3" fill="#fff" opacity=".9"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="#9B7BFF" stroke-width="2" stroke-linecap="round"/></svg>`,
  games: `<svg viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="11" rx="5.5" fill="#fff" opacity=".95"/><path d="M7 10.5v4M5 12.5h4" stroke="#FF6FA8" stroke-width="2" stroke-linecap="round"/><circle cx="15.5" cy="11.5" r="1.4" fill="#FF6FA8"/><circle cx="18" cy="14" r="1.4" fill="#FF6FA8"/></svg>`,
  shop: `<svg viewBox="0 0 24 24"><path d="M4 8h16l-1.5 12h-13z" fill="#fff" opacity=".95"/><path d="M8.5 8V6.5a3.5 3.5 0 0 1 7 0V8" stroke="#fff" stroke-width="2" fill="none"/><path d="M9 13l3 3 3-3" stroke="#E0A21E" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
  mic: `<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3" fill="#fff"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
};
const glyph = (g, size = 34) => g === 'dotted' ? `<span class="glyph" style="font-size:${size}px">${DOTTED_HALF.replace('<span class="glyph">', '').replace(/<\/span>$/, '')}</span>`
  : `<span class="music glyph" style="font-size:${size}px" data-g="${g}"></span>`;
const noteIcon = glyph('\u{1D15F}');
const sharpIcon = glyph('♯');
const iconBox = (svg, size = 32) => `<span style="width:${size}px;height:${size}px;display:block">${svg}</span>`;

/* ===== Подсчёты ===== */
const enabledLevels = () => NOTE_LEVELS.filter(l => S().settings.noteLevels[l.id] !== false);
const enabledTopics = () => TOPICS.filter(t => S().settings.topics[t.id] !== false);
const sum = (a) => a.reduce((x, y) => x + y, 0);

function totalStars() {
  return sum(Object.values(S().notes.best)) + sum(Object.values(S().theory.best)) + sum(Object.values(S().games.best));
}
function notesPct() {
  const ls = enabledLevels(); if (!ls.length) return 0;
  return Math.round(sum(ls.map(l => S().notes.best[l.id] || 0)) / (ls.length * 3) * 100);
}
function theoryPct() {
  const ts = enabledTopics(); if (!ts.length) return 0;
  const cards = ts.flatMap(t => t.cards);
  const seen = cards.filter(c => S().theory.seen[c.id]).length / cards.length;
  const quiz = sum(ts.map(t => S().theory.best[t.id] || 0)) / (ts.length * 3);
  return Math.round((seen * 0.4 + quiz * 0.6) * 100);
}
const GAME_KEYS = [...FRET_LEVELS.map(l => 'fret' + l.id), ...BAR_LEVELS.map(l => 'bar' + l.id), ...EAR_LEVELS.map(l => 'ear' + l.id)];
const gamesPct = () => Math.round(sum(GAME_KEYS.map(k => S().games.best[k] || 0)) / (GAME_KEYS.length * 3) * 100);

const AWARDS = [
  { id: 'first', title: 'Первый шаг', color: 'orange', ok: () => S().points > 0 },
  { id: 'perfect', title: 'Без ошибок', color: 'green', ok: () => S().perfect > 0 },
  { id: 'streak3', title: '3 дня подряд', color: 'pink', ok: () => store.bestStreak() >= 3 },
  { id: 'streak7', title: 'Неделя музыки', color: 'violet', ok: () => store.bestStreak() >= 7 },
  { id: 'p100', title: '100 очков', color: 'blue', ok: () => S().points >= 100 },
  { id: 'p500', title: '500 очков', color: 'yellow', ok: () => S().points >= 500 },
  { id: 'staff', title: 'Знаток стана', color: 'orange', ok: () => (S().notes.best[3] || 0) >= 2 },
  { id: 'guitar', title: 'Все ноты гитары', color: 'green', ok: () => (S().notes.best[6] || 0) >= 2 },
  { id: 'pro', title: 'Профи', color: 'violet', ok: () => (S().notes.best[8] || 0) >= 2 },
  { id: 'exam5', title: 'Экзамен на 5', color: 'pink', ok: () => S().exams.some(e => e.grade === 5) },
  { id: 'cards', title: 'Все карточки', color: 'blue', ok: () => ALL_CARDS.every(c => S().theory.seen[c.id]) },
  { id: 'theory', title: 'Знаток теории', color: 'violet', ok: () => TOPICS.every(t => (S().theory.best[t.id] || 0) >= 2) },
  { id: 'guitarT', title: 'Знаток гитары', color: 'yellow', ok: () => (S().theory.best.guitar || 0) >= 2 },
  { id: 'fret', title: 'Знаток грифа', color: 'orange', ok: () => (S().games.best.fret4 || 0) >= 2 },
  { id: 'bar', title: 'Чувство ритма', color: 'green', ok: () => (S().games.best.bar3 || 0) >= 2 },
  { id: 'ear', title: 'Музыкальный слух', color: 'blue', ok: () => (S().games.best.ear3 || 0) >= 2 },
  { id: 'lvl6', title: 'Гитарист', color: 'pink', ok: () => store.levelInfo().n >= 6 },
  { id: 'maestro', title: 'Маэстро', color: 'yellow', ok: () => store.levelInfo().n >= 14 },
];
const awardsPct = () => Math.round(AWARDS.filter(a => a.ok()).length / AWARDS.length * 100);

/* ===== Общие куски разметки ===== */
const starsPill = () => `<span class="pill">${I.star()} ${totalStars()}</span>`;
const gemsPill = () => `<a class="pill gem" href="#/shop">${I.gem} ${S().gems}</a>`;
const header = (title, back = '#/', right = gemsPill()) =>
  `<div class="top"><a class="back" href="${back}" aria-label="Назад">${I.back}</a><div class="title">${title}</div>${right}</div>`;
const stars3 = (n) => `<span class="stars3">${[0, 1, 2].map(i => I.star(i < n ? '#FFC93D' : '#E8DFD0')).join('')}</span>`;
const MEDAL_NAME = { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото' };
const medalDot = (key) => { const m = store.medal(key); return m ? `<span class="mdot ${m}" title="${MEDAL_NAME[m]}"></span>` : ''; };
const levelRight = (key, stars) => `<span class="lvr">${medalDot(key)}${stars3(stars)}</span>`;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2400);
}

function render(html) {
  $app.innerHTML = `<div class="stack screen-enter" style="flex:1;display:flex;flex-direction:column;gap:14px">${html}</div>`;
  window.scrollTo(0, 0);
  fitGlyphs($app);
}

/* Нотные символы шрифта Music сидят на «линейке», а не по центру —
   измеряем реальный контур знака и центрируем его в SVG. */
const meas = document.createElement('canvas').getContext('2d');
function fitGlyphs(root) {
  const run = () => root.querySelectorAll('.glyph[data-g]').forEach(el => {
    const t = el.dataset.g, fs = parseFloat(getComputedStyle(el).fontSize) || 40;
    meas.font = `${fs}px Music`;
    const mt = meas.measureText(t);
    const L = mt.actualBoundingBoxLeft, R = mt.actualBoundingBoxRight, A = mt.actualBoundingBoxAscent, D = mt.actualBoundingBoxDescent;
    const cx = (R - L) / 2, cy = (D - A) / 2;
    const w = Math.max(fs * 0.9, (L + R) * 1.08), h = Math.max(fs * 0.9, (A + D) * 1.08);
    el.innerHTML = `<svg viewBox="${cx - w / 2} ${cy - h / 2} ${w} ${h}" width="${w}" height="${h}" style="display:block;overflow:visible" aria-hidden="true"><text x="0" y="0" font-family="Music" font-size="${fs}" fill="currentColor">${t}</text></svg>`;
    el.removeAttribute('data-g');
  });
  document.fonts.load('40px Music').then(run, run);
}

function plural(n, one, few, many) {
  const a = n % 10, b = n % 100;
  if (a === 1 && b !== 11) return one;
  if (a >= 2 && a <= 4 && (b < 12 || b > 14)) return few;
  return many;
}

/* ===== Алмазики ===== */
function giveGems(n, why) {
  if (n <= 0) return;
  store.update(s => { s.gems += n; });
  toast(`+${n} 💎 ${why}`);
}
function streakBonus() {
  const st = store.streak(), t = store.today();
  for (const [len, gems] of [[3, 3], [7, 7], [14, 10], [30, 20]]) {
    const key = `s${len}-${t}`;
    if (st === len && !S().streakGems[key]) {
      store.update(s => { s.streakGems[key] = true; });
      setTimeout(() => giveGems(gems, `за ${len} ${plural(len, 'день', 'дня', 'дней')} подряд!`), 2600);
    }
  }
}
function startActivity() { store.markToday(); streakBonus(); }

/* ===== Экзамен: доступность ===== */
const examCfg = () => S().settings.exam;
const examTaken = () => S().exams.find(e => e.id === examCfg().id);
const examAvailable = () => examCfg().open && !examTaken();
const FORMAT_NAME = { choice: '4 варианта', pro1: 'Профи 1', pro2: 'Профи 2' };
const gradeOf = (pct) => pct >= 0.9 ? 5 : pct >= 0.75 ? 4 : pct >= 0.5 ? 3 : 2;
const SECTION_NAME = (k) => k === 'notes' ? 'Ноты на стане' : (TOPICS.find(t => t.id === k) || {}).title || k;
const starsFor = (right, total) => { const p = right / total; return p >= 0.9 ? 3 : p >= 0.7 ? 2 : p >= 0.5 ? 1 : 0; };

/* ===== Экраны ===== */
function welcome() {
  render(`
    <div class="welcome">
      <div class="hero"><span class="music glyph" data-g="\u{1D11E}"></span></div>
      <div class="logo-big">AngelMusic</div>
      <p class="muted" style="font-size:18px">Учим ноты и азбуку музыки<br>для гитары</p>
      <div class="field" style="text-align:left">
        <label for="name">Как тебя зовут?</label>
        <input id="name" maxlength="20" autocomplete="off" placeholder="Например, Маша">
      </div>
      <button class="btn primary" id="go">Начать!</button>
    </div>`);
  const inp = document.getElementById('name');
  const go = () => {
    const v = inp.value.trim();
    if (!v) { inp.focus(); toast('Напиши своё имя'); return; }
    store.update(s => { s.name = v; });
    location.hash = '#/';
  };
  document.getElementById('go').onclick = go;
  inp.onkeydown = (e) => { if (e.key === 'Enter') go(); };
}

function home() {
  const s = S(), lv = store.levelInfo(), st = store.streak();
  const week = store.week().map(d =>
    `<div class="day ${d.on ? 'on' : ''} ${d.today ? 'today' : ''}"><i>${d.on ? I.check : ''}</i><span>${d.label}</span></div>`).join('');
  const sec = (href, color, icon, title, sub, pct) => `
    <a class="menu bg-${color} on-color" href="${href}">
      <span class="ic">${icon}</span>
      <div class="grow"><h2>${title}</h2><p>${sub}</p>${pct === null ? '' : `<div class="pb"><i style="width:${pct}%"></i></div><p class="pct">Пройдено ${pct}%</p>`}</div>
      <span class="chev">›</span>
    </a>`;
  const streakText = st === 0 ? 'Начни серию сегодня!' : `${st} ${plural(st, 'день', 'дня', 'дней')} подряд!`;
  render(`
    <div class="top"><b class="logo">AngelMusic</b>${gemsPill()}${starsPill()}</div>
    <div class="hello-row"><a href="#/shop" class="ava-btn" aria-label="Моя аватарка">${avatarSVG(s.equip, 60)}</a><h1 class="big">Привет, ${esc(s.name)}!</h1></div>
    <div class="card lvl">
      <span class="badge">${lv.n}</span>
      <div class="grow"><b style="font-size:15px;font-weight:900">Уровень ${lv.n} из 15 · ${lv.name}</b>
        <div class="pb"><i style="width:${lv.pct}%"></i></div>
        <small class="muted small">${lv.next ? `${s.points} из ${lv.next} очков до ${lv.n + 1} уровня` : `${s.points} очков — высший уровень!`}</small></div>
    </div>
    <div class="card">
      <div class="streak-head">${I.flame}<b>${streakText}</b>${st ? '<small>Не прерывай серию</small>' : ''}</div>
      <div class="week">${week}</div>
    </div>
    ${examAvailable() ? sec('#/exam', 'violet', iconBox(I.exam), 'Экзамен', `Учитель открыл экзамен: ${examCfg().count} вопросов`, null) : ''}
    ${sec('#/notes', 'orange', noteIcon, 'Угадай ноту', 'От «ми» малой до «ми» третьей октавы', notesPct())}
    ${sec('#/theory', 'blue', sharpIcon, 'Азбука музыки', 'Гитара, длительности, паузы, размеры, лад', theoryPct())}
    ${sec('#/games', 'pink', iconBox(I.games), 'Тренажёры', 'Гриф, собери такт, слух, тюнер', gamesPct())}
    ${sec('#/shop', 'yellow', iconBox(I.shop), 'Магазин', `У тебя ${s.gems} 💎 — аватарки, аксессуары, призы`, null)}
    ${sec('#/progress', 'green', iconBox(I.star('#fff'), 30), 'Мои успехи', 'Звёзды, медали и награды', awardsPct())}
    <a class="teacher-link" href="#/teacher">${I.lock}<span>Режим учителя</span></a>
  `);
}

function isUnlocked(level) {
  if (S().settings.unlockAll) return true;
  const ls = enabledLevels();
  const i = ls.findIndex(l => l.id === level.id);
  return i <= 0 || (S().notes.best[ls[i - 1].id] || 0) >= 1;
}

function notesMenu() {
  const item = (l) => {
    const open = isUnlocked(l);
    return `<a class="level ${open ? '' : 'locked'}" href="${open ? `#/notes/${l.id}` : '#/notes'}" data-locked="${open ? '' : 1}">
      <span class="num bg-${l.color}">${open ? (l.mode ? 'П' + l.id % 6 : l.id) : iconBox(I.lock, 20).replace('display:block', 'display:block;color:#fff')}</span>
      <div class="grow"><h3>${l.title}</h3><p>${l.desc}</p></div>
      ${levelRight('n' + l.id, S().notes.best[l.id] || 0)}
    </a>`;
  };
  const ls = enabledLevels();
  const basic = ls.filter(l => !l.mode).map(item).join('');
  const pro = ls.filter(l => l.mode).map(item).join('');
  render(`${header('Угадай ноту')}
    ${examAvailable() ? `<a class="menu bg-violet on-color" href="#/exam"><span class="ic">${iconBox(I.exam)}</span><div class="grow"><h2>Экзамен</h2><p>Учитель открыл экзамен</p></div><span class="chev">›</span></a>` : ''}
    <p class="muted">Выбери уровень. Чтобы открыть следующий, получи хотя бы одну звезду.</p>
    <div class="stack">${basic || ''}</div>
    ${pro ? `<h3 class="sec">Для профи — без подсказок-вариантов</h3><div class="stack">${pro}</div>` : ''}
    ${!ls.length ? '<p class="muted">Учитель пока не включил ни одного уровня.</p>' : ''}`);
  $app.querySelectorAll('[data-locked="1"]').forEach(a => a.onclick = (e) => { e.preventDefault(); toast('Сначала пройди предыдущий уровень'); });
}

/* ===== Итог тренировки: звёзды, алмазики, медали, журнал ===== */
function finishPractice({ title, back, right, total, key, kind, onBest }) {
  const n = starsFor(right, total);
  const perfect = right === total;
  store.update(s => {
    if (perfect) { s.points += 20; s.perfect++; s.perfectBy[key] = (s.perfectBy[key] || 0) + 1; }
  });
  const before = store.medal(key);
  onBest(n);
  store.logAttempt(kind, key, title, right, total);
  const gems = n + (perfect ? 2 : 0);
  if (n) sfxWin(S().settings.sound);
  const m = store.medal(key);
  const msg = ['Попробуй ещё раз — у тебя получится!', 'Неплохо! Можно лучше', 'Отлично!', 'Супер! Ни одной ошибки — так держать!'];
  render(`${header(title, back)}
    <div class="result">
      <div class="bigstars">${[0, 1, 2].map(j => I.star(j < n ? '#FFC93D' : '#E8DFD0')).join('')}</div>
      <h1 class="big">${perfect ? msg[3] : msg[n]}</h1>
      <p class="score">Правильно: <b style="color:var(--ink)">${right} из ${total}</b><br>+${right * 10 + (perfect ? 20 : 0)} очков${gems ? ` · +${gems} 💎` : ''}</p>
      ${m && m !== before ? `<div class="newmedal"><span class="mdot big ${m}"></span><b>Новая медаль: ${MEDAL_NAME[m]}!</b></div>` : ''}
    </div>
    <div class="row"><a class="btn ghost" href="${back}">К списку</a><button class="btn primary" id="again">Ещё раз</button></div>`);
  if (gems) store.update(s => { s.gems += gems; });
  document.getElementById('again').onclick = () => route();
}

/* ===== Общий движок теста =====
   Вопрос типа choice: { options, correct } — варианты.
   Вопрос типа keys:   { note, needOctave } — 7 кнопок с нотами (+ октавы) и «Ввод».
   exam: без подсветки правильного ответа, без звука и подсказок; timerMin — таймер. */
let quizSeq = 0, activeTimer = null;

function runQuiz({ title, back, questions, onFinish, exam = false, timerMin = 0, key = '', kind = '' }) {
  const my = ++quizSeq;
  let i = 0, right = 0, locked = false;
  const mistakes = [], bySection = {};
  const colors = ['orange', 'blue', 'green', 'pink'];
  const sound = S().settings.sound && !exam;
  const started = Date.now();
  const deadline = timerMin ? started + timerMin * 60000 : 0;
  startActivity();

  const alive = () => my === quizSeq;
  const timerText = () => {
    const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
    return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
  };
  if (deadline) {
    clearInterval(activeTimer);
    activeTimer = setInterval(() => {
      if (!alive()) { clearInterval(activeTimer); return; }
      const el = document.getElementById('timer');
      if (el) el.textContent = timerText();
      if (Date.now() >= deadline) { clearInterval(activeTimer); finish(true); }
    }, 500);
  }

  const show = () => {
    const q = questions[i];
    const pill = deadline ? `<span class="pill timer" id="timer">${timerText()}</span>` : (exam ? '<span class="pill">Экзамен</span>' : gemsPill());
    let answers;
    if (q.type === 'keys') {
      answers = `
        <div class="keys">${NAMES.map((n, l) => `<button class="key" data-l="${l}">${n}</button>`).join('')}</div>
        ${q.needOctave ? `<p class="muted small" style="text-align:center">Октава</p><div class="octs">${OCTAVES.map(o => `<button class="key oct" data-o="${o.n}">${o.name}</button>`).join('')}</div>` : ''}
        <button class="btn primary" id="enter" disabled>Ввод</button>`;
    } else {
      const long = q.options.some(x => x.length > 6);
      answers = `<div class="opts ${q.options.length === 2 ? 'two' : ''}">${q.options.map((o, k) => `<button class="opt bg-${colors[k % 4]} ${long ? 'long' : ''}" data-k="${k}">${o}</button>`).join('')}</div>`;
    }
    render(`${header(title, back, pill)}
      <div class="pb" style="height:12px;margin:0"><i style="width:${i / questions.length * 100}%"></i></div>
      <div class="row" style="align-items:center"><h2 class="qtitle" style="flex:3">${q.question}</h2><span class="muted" style="flex:1;text-align:right">${i + 1} / ${questions.length}</span></div>
      ${q.visual || ''}
      ${answers}
      <div class="feedback" id="fb"></div>`);
    $app.querySelectorAll('.listen, .listen-big').forEach(b => b.onclick = () => q.onListen && q.onListen());
    if (q.autoplay && q.onListen) setTimeout(() => alive() && q.onListen(), 350);
    locked = false;
    if (q.type === 'keys') {
      const sel = { l: null, o: null };
      const enter = document.getElementById('enter');
      const upd = () => { enter.disabled = sel.l === null || (q.needOctave && sel.o === null); };
      $app.querySelectorAll('.key[data-l]').forEach(b => b.onclick = () => {
        if (locked) return;
        $app.querySelectorAll('.key[data-l]').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); sel.l = +b.dataset.l; upd();
      });
      $app.querySelectorAll('.key[data-o]').forEach(b => b.onclick = () => {
        if (locked) return;
        $app.querySelectorAll('.key[data-o]').forEach(x => x.classList.remove('sel'));
        b.classList.add('sel'); sel.o = +b.dataset.o; upd();
      });
      enter.onclick = () => answerKeys(sel);
    } else {
      $app.querySelectorAll('.opt').forEach(b => b.onclick = () => answerChoice(+b.dataset.k));
    }
  };

  const after = (ok, answerText) => {
    const q = questions[i];
    const fb = document.getElementById('fb');
    if (ok) right++;
    else mistakes.push({ note: (q.section && q.section !== 'notes' ? `${q.question} ` : '') + q.explain, answer: answerText });
    if (q.section) { const b = bySection[q.section] ||= { r: 0, t: 0 }; b.t++; if (ok) b.r++; }
    if (ok) store.update(s => { s.points += 10; });
    if (!exam) {
      if (ok) { fb.className = 'feedback ok'; fb.textContent = q.praise || 'Правильно!'; sfxRight(sound); }
      else { fb.className = 'feedback bad'; fb.textContent = q.explain ? `Правильно: ${q.explain}` : 'Ой! Запомни правильный ответ'; sfxWrong(sound); }
    }
    q.onAnswer && q.onAnswer(ok);
    setTimeout(() => { if (!alive()) return; i++; i < questions.length ? show() : finish(false); }, exam ? 350 : ok ? 900 : 1900);
  };

  const answerChoice = (k) => {
    if (locked) return; locked = true;
    const q = questions[i], ok = k === q.correct;
    $app.querySelectorAll('.opt').forEach((b, j) => {
      if (exam) { b.classList.add(j === k ? 'chosen' : 'dim'); return; }
      if (j === q.correct) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); else b.classList.add('dim');
    });
    after(ok, q.options[k]);
  };

  const answerKeys = (sel) => {
    if (locked) return; locked = true;
    const q = questions[i], n = q.note;
    const okL = sel.l === n.letter, okO = !q.needOctave || sel.o === n.octave, ok = okL && okO;
    if (!exam) {
      $app.querySelectorAll('.key[data-l]').forEach(b => {
        const l = +b.dataset.l;
        if (l === n.letter) b.classList.add('right'); else if (l === sel.l) b.classList.add('wrong'); else b.classList.add('dim');
      });
      $app.querySelectorAll('.key[data-o]').forEach(b => {
        const o = +b.dataset.o;
        if (o === n.octave) b.classList.add('right'); else if (o === sel.o) b.classList.add('wrong'); else b.classList.add('dim');
      });
    }
    document.getElementById('enter').disabled = true;
    const oct = OCTAVES.find(o => o.n === sel.o);
    after(ok, NAMES[sel.l] + (q.needOctave && oct ? ` ${oct.name.toLowerCase()}` : ''));
  };

  const finish = (timeUp) => {
    if (!alive()) return;
    quizSeq++; clearInterval(activeTimer);
    const total = questions.length;
    if (exam) {
      const grade = gradeOf(right / total);
      onFinish({ right, total, mistakes, grade, bySection, seconds: Math.round((Date.now() - started) / 1000), timeUp });
      store.logAttempt('exam', 'exam', 'Экзамен', right, total);
      const bonus = grade === 5 ? 10 : grade === 4 ? 5 : 0;
      if (bonus) store.update(s => { s.gems += bonus; });
      render(`${header(title, '#/', '<span class="pill">Готово</span>')}
        <div class="result">
          <div class="grade g${grade}">${grade}</div>
          <h1 class="big">${timeUp ? 'Время вышло!' : 'Экзамен завершён!'}</h1>
          <p class="score">Правильно: <b style="color:var(--ink)">${right} из ${total}</b>${bonus ? ` · +${bonus} 💎` : ''}<br>Результат увидит учитель</p>
        </div>
        <a class="btn primary" href="#/">На главную</a>`);
      return;
    }
    finishPractice({ title, back, right, total, key, kind, onBest: onFinish });
  };
  show();
}

/** Вопросы по нотам. format: choice | pro1 | pro2 */
function noteQuestions(positions, count, format, { exam = false } = {}) {
  const minPos = Math.min(...positions), maxPos = Math.max(...positions);
  const sound = S().settings.sound;
  return makeQuiz({ positions }, count).map(({ note, options }) => {
    const base = {
      section: 'notes',
      question: format === 'pro2' ? 'Какая это нота и октава?' : 'Какая это нота?',
      visual: `<div class="staffcard">${staffSVG(note.pos, { minPos, maxPos })}${exam ? '' : `<button class="listen" aria-label="Послушать">${I.sound}</button>`}</div>`,
      explain: note.full,
      praise: `Правильно! ${note.full}`,
      onListen: () => playNote(note.midi, true),
      onAnswer: (ok) => {
        if (!exam) playNote(note.midi, sound);
        store.update(s => { const st = s.notes.stats[note.id] ||= { r: 0, w: 0 }; ok ? st.r++ : st.w++; });
      },
    };
    if (format === 'choice') return { ...base, type: 'choice', options: options.map(l => NAMES[l]), correct: options.indexOf(note.letter) };
    return { ...base, type: 'keys', note, needOctave: format === 'pro2' };
  });
}

function notesQuiz(levelId) {
  const level = NOTE_LEVELS.find(l => l.id === +levelId);
  if (!level || !isUnlocked(level)) { location.hash = '#/notes'; return; }
  runQuiz({
    title: level.title.length > 18 ? `Уровень ${level.id}` : level.title, back: '#/notes', key: 'n' + level.id, kind: 'notes',
    questions: noteQuestions(level.positions, S().settings.questions, level.mode || 'choice'),
    onFinish: (n) => store.update(s => { s.notes.best[level.id] = Math.max(s.notes.best[level.id] || 0, n); }),
  });
}

/* ===== Вопросы азбуки (для тем и для экзамена) ===== */
const listenBig = (label = 'Послушать') => `<button class="listen-big">${I.sound}<span>${label}</span></button>`;
function theoryQuestion(q, section) {
  const opts = shuffle(q.options);
  let visual = '';
  if (q.pic) visual = `<div class="staffcard pic">${q.pic}</div>`;
  else if (q.sym) visual = `<div class="staffcard" style="display:flex;justify-content:center;padding:14px"><div class="sym">${q.sym}</div></div>`;
  else if (q.play) visual = `<div style="display:flex;justify-content:center">${listenBig('Послушать ещё раз')}</div>`;
  return {
    type: 'choice', question: q.q, visual, section,
    options: opts, correct: opts.indexOf(q.options[0]), explain: q.options[0],
    onListen: q.play ? () => playKind(q.play, true) : null, autoplay: !!q.play,
  };
}

/* ===== Экзамен ===== */
function examQuestions(cfg) {
  let secs = Object.keys(cfg.sections).filter(k => cfg.sections[k] && (k === 'notes' || TOPICS.some(t => t.id === k)));
  if (!secs.length) secs = ['notes'];
  const cap = (k) => k === 'notes' ? Infinity : TOPICS.find(t => t.id === k).questions.length;
  const n = Object.fromEntries(secs.map(k => [k, 0]));
  let left = cfg.count, moved = true;
  while (left > 0 && moved) {
    moved = false;
    for (const k of secs) if (left > 0 && n[k] < cap(k)) { n[k]++; left--; moved = true; }
  }
  let qs = [];
  for (const k of secs) {
    if (!n[k]) continue;
    if (k === 'notes') qs = qs.concat(noteQuestions(ALL_POSITIONS, n[k], cfg.format, { exam: true }));
    else qs = qs.concat(shuffle(TOPICS.find(t => t.id === k).questions).slice(0, n[k]).map(q => theoryQuestion(q, k)));
  }
  return shuffle(qs);
}

function examScreen() {
  const cfg = examCfg(), taken = examTaken();
  if (taken) {
    render(`${header('Экзамен')}
      <div class="result"><div class="grade g${taken.grade}">${taken.grade}</div>
      <h1 class="big">Ты уже сдал этот экзамен</h1>
      <p class="score">Правильно: <b style="color:var(--ink)">${taken.right} из ${taken.count}</b></p></div>
      <a class="btn primary" href="#/">На главную</a>`);
    return;
  }
  if (!cfg.open) {
    render(`${header('Экзамен')}<div class="result"><h1 class="big">Экзамен пока закрыт</h1><p class="score">Его откроет учитель на уроке</p></div>
      <a class="btn primary" href="#/">На главную</a>`);
    return;
  }
  const secs = Object.keys(cfg.sections).filter(k => cfg.sections[k]);
  const list = (secs.length ? secs : ['notes']).map(SECTION_NAME).join(', ');
  render(`${header('Экзамен')}
    <div class="card stack" style="padding:18px">
      <h2 style="font-weight:900">Правила</h2>
      <p>• ${cfg.count} вопросов: ${list}</p>
      ${secs.includes('notes') || !secs.length ? `<p>• Ноты: ${cfg.format === 'choice' ? '4 варианта' : cfg.format === 'pro1' ? '7 кнопок с нотами' : 'нота и октава'}</p>` : ''}
      <p>• Без подсказок</p>
      <p>• ${cfg.minutes ? `На всё ${cfg.minutes} минут` : 'Без ограничения времени'}</p>
      <p>• Одна попытка — не торопись!</p>
    </div>
    <div class="card"><b>Оценка</b>
      <div class="scale"><span class="grade xs g5">5</span>90% и больше<span class="grade xs g4">4</span>от 75%<span class="grade xs g3">3</span>от 50%<span class="grade xs g2">2</span>меньше 50%</div></div>
    <button class="btn primary" id="start">Начать экзамен</button>`);
  document.getElementById('start').onclick = () => {
    runQuiz({
      title: 'Экзамен', back: '#/', exam: true, timerMin: cfg.minutes,
      questions: examQuestions(cfg),
      onFinish: (r) => store.update(s => {
        s.exams.push({ id: cfg.id, date: new Date().toISOString(), count: r.total, right: r.right, grade: r.grade,
          format: cfg.format, minutes: cfg.minutes, seconds: r.seconds, timeUp: r.timeUp, mistakes: r.mistakes, bySection: r.bySection });
      }),
    });
  };
}

/* ===== Азбука музыки ===== */
function theoryMenu() {
  const items = enabledTopics().map(t => {
    const seen = t.cards.filter(c => S().theory.seen[c.id]).length;
    return `<a class="level" href="#/theory/${t.id}">
      <span class="num bg-${t.color}" style="font-size:28px">${t.icon}</span>
      <div class="grow"><h3>${t.title}</h3><p>Карточки ${seen} из ${t.cards.length}</p></div>
      ${levelRight('t' + t.id, S().theory.best[t.id] || 0)}
    </a>`;
  }).join('');
  render(`${header('Азбука музыки')}
    <p class="muted">Сначала посмотри карточки, а потом ответь на вопросы.</p>
    <div class="stack">${items || '<p class="muted">Учитель пока не включил ни одной темы.</p>'}</div>`);
}

function theoryCards(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) { location.hash = '#/theory'; return; }
  let i = 0;
  const show = () => {
    const c = t.cards[i];
    store.update(s => { s.theory.seen[c.id] = true; });
    if (!S().theory.done[t.id] && t.cards.every(x => S().theory.seen[x.id])) {
      store.update(s => { s.theory.done[t.id] = true; });
      setTimeout(() => giveGems(3, 'за все карточки темы!'), 400);
    }
    const front = c.pic ? `<div class="pic">${c.pic}</div><h2>${c.ask || 'Что это?'}</h2>` : `<div class="sym">${c.sym}</div><h2>Что это?</h2>`;
    const backTop = c.pic ? `<div class="pic sm">${c.pic}</div>` : `<div class="sym sm">${c.sym}</div>`;
    render(`${header(t.title, '#/theory')}
      <div class="tabs"><button class="active">Карточки</button><button id="toQuiz">Вопросы</button></div>
      <p class="muted small">Карточка ${i + 1} из ${t.cards.length}</p>
      <div class="flip" id="flip"><div class="flip-inner">
        <div class="face">${front}<p class="tap">Нажми на карточку, чтобы узнать</p></div>
        <div class="face face-back">${backTop}<h2>${c.title}</h2><p class="expl">${c.text}</p>${c.play ? listenBig() : ''}<div class="fact">${c.fact}</div></div>
      </div></div>
      <div class="row"><button class="btn ghost" id="prev" ${i === 0 ? 'disabled' : ''}>Назад</button>
        <button class="btn primary" id="next">${i === t.cards.length - 1 ? 'К вопросам →' : 'Дальше →'}</button></div>`);
    const flip = document.getElementById('flip');
    flip.onclick = (e) => {
      if (e.target.closest('.listen-big')) { playKind(c.play, true); return; }
      flip.classList.toggle('flipped');
    };
    document.getElementById('prev').onclick = () => { if (i > 0) { i--; show(); } };
    document.getElementById('next').onclick = () => { if (i < t.cards.length - 1) { i++; show(); } else location.hash = `#/theory/${t.id}/quiz`; };
    document.getElementById('toQuiz').onclick = () => location.hash = `#/theory/${t.id}/quiz`;
  };
  show();
}

function theoryQuiz(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) { location.hash = '#/theory'; return; }
  runQuiz({
    title: t.title, back: '#/theory', key: 't' + t.id, kind: 'theory',
    questions: shuffle(t.questions).map(q => theoryQuestion(q)),
    onFinish: (n) => store.update(s => { s.theory.best[t.id] = Math.max(s.theory.best[t.id] || 0, n); }),
  });
}

/* ===== Тренажёры ===== */
function gamesMenu() {
  const item = (href, color, icon, title, desc, pct) => `<a class="level" href="${href}"><span class="num bg-${color}">${icon}</span>
    <div class="grow"><h3>${title}</h3><p>${desc}</p></div>${pct === null ? '<span class="chev2">›</span>' : `<span class="muted small">${pct}%</span>`}</a>`;
  const pct = (prefix, levels) => Math.round(sum(levels.map(l => S().games.best[prefix + l.id] || 0)) / (levels.length * 3) * 100);
  render(`${header('Тренажёры')}
    <div class="stack">
      ${item('#/fret', 'orange', '🎸', 'Найди ноту на грифе', 'Нота на стане → струна и лад', pct('fret', FRET_LEVELS))}
      ${item('#/bar', 'blue', glyph('\u{1D15F}', 26), 'Собери такт', 'Добери длительности до полного такта', pct('bar', BAR_LEVELS))}
      ${item('#/ear', 'green', '👂', 'Слух', 'Мажор или минор, выше или ниже, какая нота', pct('ear', EAR_LEVELS))}
      ${item('#/tuner', 'violet', iconBox(I.mic, 26), 'Тюнер', 'Настрой гитару по микрофону', null)}
    </div>`);
}

function levelList(title, back, levels, prefix, href) {
  render(`${header(title, back)}
    <div class="stack">${levels.map(l => `<a class="level" href="${href}/${l.id}"><span class="num bg-${l.color}">${l.id}</span>
      <div class="grow"><h3>${l.title}</h3><p>${l.desc}</p></div>${levelRight(prefix + l.id, S().games.best[prefix + l.id] || 0)}</a>`).join('')}</div>`);
}
const setGameBest = (key) => (n) => store.update(s => { s.games.best[key] = Math.max(s.games.best[key] || 0, n); });

/* --- Найди ноту на грифе --- */
function fretGame(levelId) {
  const level = FRET_LEVELS.find(l => l.id === +levelId);
  if (!level) { location.hash = '#/fret'; return; }
  const my = ++quizSeq, alive = () => my === quizSeq;
  const targets = fretTargets(level), total = 10, key = 'fret' + level.id;
  const qs = Array.from({ length: total }, () => targets[Math.floor(Math.random() * targets.length)]);
  let i = 0, right = 0;
  startActivity();
  const show = () => {
    const n = qs[i]; let locked = false;
    render(`${header(level.title, '#/fret')}
      <div class="pb" style="height:12px;margin:0"><i style="width:${i / total * 100}%"></i></div>
      <div class="row" style="align-items:center"><h2 class="qtitle" style="flex:3">Найди эту ноту на грифе</h2><span class="muted" style="flex:1;text-align:right">${i + 1} / ${total}</span></div>
      <div class="staffcard">${staffSVG(n.pos, { minPos: -7, maxPos: 14 })}</div>
      <div class="board" id="board">${fretboardSVG()}</div>
      <p class="hint">Нажми на струну и лад. 0 — открытая струна. Сверху — 1-я струна (тонкая).</p>
      <div class="feedback" id="fb"></div>`);
    $app.querySelectorAll('#board .cell').forEach(c => c.onclick = () => {
      if (locked) return; locked = true;
      const s = +c.dataset.s, f = +c.dataset.f, midi = OPEN[s] + f, ok = midi === n.midi;
      playNote(midi, S().settings.sound);
      const marks = placesFor(n.midi).map(p => ({ ...p, cls: 'right' }));
      if (!ok) marks.push({ s, f, cls: 'wrong' });
      document.getElementById('board').innerHTML = fretboardSVG(marks);
      const fb = document.getElementById('fb');
      if (ok) { right++; store.update(x => { x.points += 10; }); fb.className = 'feedback ok'; fb.textContent = `Правильно! ${s + 1}-я струна, ${f === 0 ? 'открытая' : f + '-й лад'}`; sfxRight(S().settings.sound); }
      else { fb.className = 'feedback bad'; fb.textContent = `${n.full} — зелёные кружки`; sfxWrong(S().settings.sound); }
      setTimeout(() => { if (!alive()) return; i++; i < total ? show() : finishPractice({ title: level.title, back: '#/fret', right, total, key, kind: 'fret', onBest: setGameBest(key) }); }, ok ? 1300 : 2600);
    });
  };
  show();
}

/* --- Собери такт --- */
function barGame(levelId) {
  const level = BAR_LEVELS.find(l => l.id === +levelId);
  if (!level) { location.hash = '#/bar'; return; }
  const my = ++quizSeq, alive = () => my === quizSeq;
  const total = 6, key = 'bar' + level.id;
  let i = 0, right = 0;
  startActivity();
  const show = () => {
    const task = makeBar(level), cap = task.meter.cap;
    let added = [], locked = false;
    const item = (k, mine) => `<span class="bar-item ${mine ? 'mine' : ''} ${DUR[k].rest ? 'rest' : ''}">${glyph(DUR[k].g, 40)}</span>`;
    const draw = () => {
      const filled = barSum(task.pre) + barSum(added);
      document.getElementById('barbox').innerHTML = task.pre.map(k => item(k, false)).join('') + added.map(k => item(k, true)).join('') + (filled < cap ? '<span class="bar-gap">?</span>' : '');
      document.getElementById('cells').innerHTML = Array.from({ length: cap }, (_, j) => `<i class="${j < barSum(task.pre) ? 'pre' : j < filled ? 'mine' : ''}"></i>`).join('') + (filled > cap ? '<i class="over"></i>' : '');
      document.getElementById('enter').disabled = !added.length;
      fitGlyphs(document.getElementById('barbox'));
    };
    render(`${header(level.title, '#/bar')}
      <div class="pb" style="height:12px;margin:0"><i style="width:${i / total * 100}%"></i></div>
      <div class="row" style="align-items:center"><h2 class="qtitle" style="flex:3">Дополни такт до конца</h2><span class="muted" style="flex:1;text-align:right">${i + 1} / ${total}</span></div>
      <div class="staffcard barcard">
        <span class="timesig big"><span>${task.meter.top}</span><span>${task.meter.bottom}</span></span>
        <div class="barbox" id="barbox"></div><span class="barline"></span>
      </div>
      <div class="cells" id="cells"></div>
      <p class="hint">Считаем: <b>${task.meter.count}</b>. Одна клеточка — одна восьмая.</p>
      <div class="palette">${level.palette.map(k => `<button class="pal ${DUR[k].rest ? 'rest' : ''}" data-k="${k}" title="${DUR[k].name}">${glyph(DUR[k].g, 34)}<small>${DUR[k].name}</small></button>`).join('')}</div>
      <div class="row"><button class="btn ghost" id="undo">Стереть</button><button class="btn primary" id="enter" disabled>Ввод</button></div>
      <div class="feedback" id="fb"></div>`);
    draw();
    $app.querySelectorAll('.pal').forEach(b => b.onclick = () => { if (locked) return; added.push(b.dataset.k); playNote(72, false); draw(); });
    document.getElementById('undo').onclick = () => { if (locked) return; added.pop(); draw(); };
    document.getElementById('enter').onclick = () => {
      if (locked) return; locked = true;
      const total2 = barSum(task.pre) + barSum(added), ok = total2 === cap, fb = document.getElementById('fb');
      if (ok) { right++; store.update(x => { x.points += 10; }); fb.className = 'feedback ok'; fb.textContent = 'Правильно! Такт полный'; sfxRight(S().settings.sound); }
      else {
        const d = total2 - cap;
        fb.className = 'feedback bad';
        fb.textContent = d > 0 ? `Слишком много: лишние ${d} ${plural(d, 'восьмая', 'восьмых', 'восьмых')}` : `Не хватает ${-d} ${plural(-d, 'восьмой', 'восьмых', 'восьмых')}`;
        sfxWrong(S().settings.sound);
      }
      setTimeout(() => { if (!alive()) return; i++; i < total ? show() : finishPractice({ title: level.title, back: '#/bar', right, total, key, kind: 'bar', onBest: setGameBest(key) }); }, ok ? 1100 : 2300);
    };
  };
  show();
}

/* --- Слух --- */
function earGame(levelId) {
  const level = EAR_LEVELS.find(l => l.id === +levelId);
  if (!level) { location.hash = '#/ear'; return; }
  const play = (snd) => {
    if (snd.kind) playKind(snd.kind, true);
    else if (snd.pair) playPair(snd.pair[0], snd.pair[1]);
    else { playNote(snd.ref, true); setTimeout(() => playNote(snd.note, true), 1000); }
  };
  const qs = makeEar(level.id, 10).map(q => ({
    type: 'choice', question: q.question, options: q.options, correct: q.options.indexOf(q.answer), explain: q.answer,
    visual: `<div style="display:flex;justify-content:center;padding:18px 0">${listenBig('Послушать ещё раз')}</div>`,
    onListen: () => play(q.sound), autoplay: true,
  }));
  runQuiz({ title: level.title, back: '#/ear', questions: qs, key: 'ear' + level.id, kind: 'ear', onFinish: setGameBest('ear' + level.id) });
}

/* --- Тюнер --- */
function tunerScreen() {
  render(`${header('Тюнер', '#/games')}
    <div class="card tuner">
      <div class="t-note" id="tnote">—</div>
      <div class="t-sub" id="tsub">Нажми «Включить» и дёрни струну</div>
      <div class="gauge"><div class="scale-marks"><i></i><i></i><i class="mid"></i><i></i><i></i></div><div class="needle" id="needle"></div></div>
      <div class="t-hint" id="thint"></div>
      <button class="btn primary" id="tstart">${iconBox(I.mic, 22)} Включить микрофон</button>
    </div>
    <h3 class="sec">Послушать струну</h3>
    <div class="strings">${STRINGS.map((s, k) => `<button class="key" data-k="${k}"><b>${s.n}</b> ${s.name}</button>`).join('')}</div>
    <p class="muted small">Совет: дёргай одну струну и держи телефон рядом с гитарой. Если стрелка слева — подтяни колок, если справа — ослабь.</p>`);
  $app.querySelectorAll('.strings .key').forEach(b => b.onclick = () => playNote(OPEN[+b.dataset.k], true));
  let smooth = null, quiet = 0;
  const startBtn = document.getElementById('tstart');
  startBtn.onclick = async () => {
    try {
      startBtn.disabled = true;
      await startTuner((f) => {
        const note = document.getElementById('tnote'); if (!note) return;
        if (!f) { if (++quiet > 30) { smooth = null; document.getElementById('tsub').textContent = 'Дёрни струну'; } return; }
        quiet = 0;
        smooth = smooth ? smooth * 0.7 + f * 0.3 : f;
        const { string, cents } = nearest(smooth);
        const c = Math.max(-50, Math.min(50, cents));
        note.textContent = string.name;
        document.getElementById('tsub').textContent = `${string.n}-я струна · ${smooth.toFixed(1)} Гц`;
        const nd = document.getElementById('needle');
        nd.style.left = `${50 + c}%`;
        const ok = Math.abs(cents) <= 5;
        nd.classList.toggle('ok', ok);
        const h = document.getElementById('thint');
        h.className = 't-hint ' + (ok ? 'good' : 'bad');
        h.textContent = ok ? 'Отлично! Струна настроена' : cents < 0 ? 'Низко — подтяни струну' : 'Высоко — ослабь струну';
      });
      startBtn.textContent = 'Микрофон включён';
    } catch (e) {
      startBtn.disabled = false;
      toast('Нет доступа к микрофону. Разреши его в настройках браузера');
    }
  };
}

/* ===== Магазин ===== */
let shopTab = 'avatars';
function shopScreen() {
  const s = S();
  const tabs = [['avatars', 'Аватарки'], ['accessories', 'Аксессуары'], ['guitars', 'Гитара'], ['themes', 'Темы'], ['prizes', 'Призы']];
  let grid = '';
  if (shopTab === 'prizes') {
    const prizes = s.settings.prizes;
    const mine = [...s.prizeLog].reverse();
    grid = `<p class="muted small">Призы придумывает учитель. Купи приз и покажи учителю — он его выдаст.</p>
      <div class="stack">${prizes.length ? prizes.map(p => `<div class="prize card"><span class="prize-ic">🎁</span><div class="grow"><b>${esc(p.title)}</b><br><span class="muted small">${p.price} 💎</span></div>
        <button class="btn primary sm" data-prize="${p.id}" ${s.gems < p.price ? 'disabled' : ''}>Купить</button></div>`).join('') : '<p class="muted">Учитель пока не добавил призы.</p>'}</div>
      ${mine.length ? `<h3 class="sec">Мои призы</h3><div class="stack">${mine.slice(0, 10).map(p => `<div class="card row" style="align-items:center"><span style="flex:3"><b>${esc(p.title)}</b><br><small class="muted">${fmtDate(p.date)}</small></span><span class="tag ${p.given ? 'ok' : ''}" style="flex:none">${p.given ? 'Выдан' : 'Ждёт учителя'}</span></div>`).join('')}</div>` : ''}`;
  } else {
    const list = CATALOG[shopTab];
    grid = `<div class="shop-grid">${Object.keys(list).map(id => {
      const it = findItem(id), owned = s.owned[id];
      const slot = it.kind === 'avatars' ? 'avatar' : it.kind === 'accessories' ? it.slot : it.kind === 'guitars' ? 'guitar' : 'theme';
      const on = s.equip[slot] === id;
      const btn = !owned ? `<button class="btn primary sm" data-buy="${id}" ${s.gems < it.price ? 'disabled' : ''}>${it.price} 💎</button>`
        : on ? (it.kind === 'accessories' ? `<button class="btn ghost sm" data-off="${slot}">Снять</button>` : '<span class="tag ok">Выбрано</span>')
          : `<button class="btn ghost sm" data-wear="${id}">${it.kind === 'accessories' ? 'Надеть' : 'Выбрать'}</button>`;
      return `<div class="shop-item ${on ? 'on' : ''}">${itemPreview(id, s.equip)}<b>${it.title}</b>${btn}</div>`;
    }).join('')}</div>`;
  }
  render(`${header('Магазин', '#/', gemsPill())}
    <div class="card shop-me">${avatarSVG(s.equip, 96)}<div><b style="font-size:20px">${esc(s.name)}</b><p class="muted small">У тебя ${s.gems} 💎<br>Алмазики дают за звёзды, тесты без ошибок, серии дней и экзамен</p></div></div>
    <div class="tabs scroll">${tabs.map(([k, l]) => `<button data-tab="${k}" class="${shopTab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
    ${grid}`);
  $app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { shopTab = b.dataset.tab; shopScreen(); });
  const equipItem = (id) => {
    const it = findItem(id);
    const slot = it.kind === 'avatars' ? 'avatar' : it.kind === 'accessories' ? it.slot : it.kind === 'guitars' ? 'guitar' : 'theme';
    store.update(x => { x.equip[slot] = id; });
    applyLook(S().equip);
  };
  $app.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
    const id = b.dataset.buy, it = findItem(id);
    if (S().gems < it.price) { toast('Не хватает алмазиков'); return; }
    store.update(x => { x.gems -= it.price; x.owned[id] = true; });
    equipItem(id); toast(`Куплено: ${it.title}!`); shopScreen();
  });
  $app.querySelectorAll('[data-wear]').forEach(b => b.onclick = () => { equipItem(b.dataset.wear); shopScreen(); });
  $app.querySelectorAll('[data-off]').forEach(b => b.onclick = () => { store.update(x => { x.equip[b.dataset.off] = ''; }); shopScreen(); });
  $app.querySelectorAll('[data-prize]').forEach(b => b.onclick = () => {
    const p = S().settings.prizes.find(x => x.id === b.dataset.prize);
    if (!p || S().gems < p.price) { toast('Не хватает алмазиков'); return; }
    store.update(x => { x.gems -= p.price; x.prizeLog.push({ uid: Date.now().toString(36), id: p.id, title: p.title, price: p.price, date: new Date().toISOString(), given: false }); });
    toast('Приз куплен! Покажи учителю'); shopScreen();
  });
}

/* ===== Мои успехи ===== */
function progress() {
  const s = S(), lv = store.levelInfo();
  const cardsSeen = ALL_CARDS.filter(c => s.theory.seen[c.id]).length;
  const awards = AWARDS.map(a => `<div class="award ${a.ok() ? '' : 'off'}"><div class="medal bg-${a.color}">${I.medal}</div>${a.title}</div>`).join('');
  const entries = [
    ...NOTE_LEVELS.map(l => ['n' + l.id, `Ноты: ${l.title}`]),
    ...TOPICS.map(t => ['t' + t.id, t.title]),
    ...FRET_LEVELS.map(l => ['fret' + l.id, `Гриф: ${l.title}`]),
    ...BAR_LEVELS.map(l => ['bar' + l.id, `Такт: ${l.title}`]),
    ...EAR_LEVELS.map(l => ['ear' + l.id, `Слух: ${l.title}`]),
  ];
  const counts = { gold: 0, silver: 0, bronze: 0 };
  const withMedal = entries.filter(([k]) => { const m = store.medal(k); if (m) counts[m]++; return m; });
  render(`${header('Мои успехи')}
    <div class="card lvl"><span class="badge">${lv.n}</span><div class="grow"><b style="font-weight:900">Уровень ${lv.n} из 15 · ${lv.name}</b>
      <div class="pb"><i style="width:${lv.pct}%"></i></div><small class="muted small">${s.points} очков${lv.next ? ` · до следующего ${lv.next - s.points}` : ''}</small></div></div>
    <div class="grid2">
      <div class="stat"><b>${totalStars()}</b><span>звёзд</span></div>
      <div class="stat"><b>${s.gems} 💎</b><span>алмазиков</span></div>
      <div class="stat"><b>${store.streak()}</b><span>дней подряд (рекорд ${store.bestStreak()})</span></div>
      <div class="stat"><b>${cardsSeen}/${ALL_CARDS.length}</b><span>карточек изучено</span></div>
    </div>
    <h3 class="sec">Медали мастерства</h3>
    <div class="card"><div class="medals-sum"><span><i class="mdot big gold"></i>${counts.gold}</span><span><i class="mdot big silver"></i>${counts.silver}</span><span><i class="mdot big bronze"></i>${counts.bronze}</span></div>
      <p class="muted small">Пройди уровень или тему без ошибок: 1 раз — бронза, 3 раза — серебро, 5 раз — золото.</p>
      ${withMedal.length ? `<div class="stack" style="gap:6px;margin-top:8px">${withMedal.map(([k, t]) => `<div class="row" style="align-items:center"><span style="flex:4">${t}</span><span style="flex:none">${medalDot(k)}</span></div>`).join('')}</div>` : ''}</div>
    <h3 class="sec">Награды</h3>
    <div class="awards">${awards}</div>`);
}

/* ===== Режим учителя ===== */
let teacherOk = false;

function teacherPin() {
  if (teacherOk) { location.hash = '#/teacher/panel'; return; }
  let pin = '';
  const draw = () => {
    render(`${header('Режим учителя')}
      <div style="text-align:center;margin-top:10px"><span style="display:inline-block;width:44px;height:44px;color:var(--sub)">${I.lock}</span>
      <h2 style="font-weight:900;margin-top:6px">Введите ПИН-код</h2></div>
      <div class="pin-dots">${[0, 1, 2, 3].map(k => `<i class="${k < pin.length ? 'on' : ''}"></i>`).join('')}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map(k => k === '' ? '<span></span>' : `<button data-k="${k}">${k}</button>`).join('')}</div>`);
    $app.querySelectorAll('.keypad button').forEach(b => b.onclick = () => {
      const k = b.dataset.k;
      if (k === '⌫') pin = pin.slice(0, -1); else if (pin.length < 4) pin += k;
      if (pin.length === 4) {
        if (pin === S().settings.pin) { teacherOk = true; location.hash = '#/teacher/panel'; return; }
        toast('Неверный ПИН-код'); pin = '';
      }
      draw();
    });
  };
  draw();
}

function fmtDate(iso) {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
const KIND_NAME = { notes: 'Угадай ноту', theory: 'Азбука музыки', fret: 'Гриф', bar: 'Собери такт', ear: 'Слух', exam: 'Экзамен' };

function statsHtml() {
  const s = S(), now = Date.now(), day = 864e5;
  const period = (days) => {
    const from = now - days * day;
    const log = s.log.filter(x => x.t >= from);
    let sec = 0;
    for (let k = 0; k < days; k++) sec += s.time[store.today(new Date(now - k * day))] || 0;
    const r = sum(log.map(x => x.right)), t = sum(log.map(x => x.total));
    return { min: Math.round(sec / 60), tests: log.length, acc: t ? Math.round(r / t * 100) : null };
  };
  const p1 = period(1), p7 = period(7), p30 = period(30);
  const box = (lbl, p) => `<div class="stat"><span>${lbl}</span><b>${p.min} мин</b><span>${p.tests} ${plural(p.tests, 'тест', 'теста', 'тестов')}${p.acc !== null ? ` · ${p.acc}% верно` : ''}</span></div>`;
  // календарь за 4 недели (с понедельника)
  const start = new Date(); start.setHours(12, 0, 0, 0); start.setDate(start.getDate() - ((start.getDay() + 6) % 7) - 21);
  let cal = '';
  for (let k = 0; k < 28; k++) {
    const d = new Date(start); d.setDate(start.getDate() + k);
    const key = store.today(d), m = Math.round((s.time[key] || 0) / 60), future = key > store.today();
    const lvl = m === 0 ? (s.days.includes(key) ? 1 : 0) : m < 10 ? 1 : m < 20 ? 2 : 3;
    cal += `<i class="c${lvl} ${future ? 'fut' : ''}" title="${key}: ${m} мин">${d.getDate()}</i>`;
  }
  const kinds = Object.keys(KIND_NAME).map(k => {
    const log = s.log.filter(x => x.kind === k); if (!log.length) return '';
    const r = sum(log.map(x => x.right)), t = sum(log.map(x => x.total));
    return `<div class="row krow"><span style="flex:3">${KIND_NAME[k]}</span><span style="flex:2" class="muted small">${log.length} ${plural(log.length, 'раз', 'раза', 'раз')}</span><b style="flex:1;text-align:right">${Math.round(r / t * 100)}%</b></div>`;
  }).join('');
  const last = [...s.log].reverse().slice(0, 12).map(x => `<div class="row krow"><span style="flex:3">${esc(x.title)}<br><small class="muted">${fmtDate(new Date(x.t).toISOString())}</small></span><b style="flex:1;text-align:right">${x.right}/${x.total}</b></div>`).join('');
  return `
    <div class="grid3">${box('Сегодня', p1)}${box('7 дней', p7)}${box('30 дней', p30)}</div>
    <div class="card"><b>Календарь занятий (4 недели)</b>
      <div class="cal-head">${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => `<span>${d}</span>`).join('')}</div>
      <div class="cal">${cal}</div>
      <p class="muted small">Светлее — меньше 10 минут, темнее — 20 минут и больше.</p></div>
    <div class="card"><b>По разделам (точность)</b>${kinds || '<p class="muted small">Пока нет занятий</p>'}</div>
    <div class="card"><b>Последние занятия</b>${last || '<p class="muted small">Пока нет занятий</p>'}</div>`;
}

function teacherPanel() {
  if (!teacherOk) { location.hash = '#/teacher'; return; }
  const s = S(), ex = s.settings.exam;
  const tog = (key, id, label, on) => `<button class="toggle ${on ? 'on' : ''}" data-key="${key}" data-id="${id}"><span>${label}</span><span class="sw"></span></button>`;
  const tabs = (name, items, cur) => `<div class="tabs">${items.map(([v, l]) => `<button data-set="${name}" data-v="${v}" class="${String(cur) === String(v) ? 'active' : ''}">${l}</button>`).join('')}</div>`;
  const hard = NOTES.map(n => ({ n, st: s.notes.stats[n.id] })).filter(x => x.st && x.st.w >= 1)
    .sort((a, b) => (b.st.w / (b.st.w + b.st.r)) - (a.st.w / (a.st.w + a.st.r)) || b.st.w - a.st.w).slice(0, 8);
  const results = [...s.exams].reverse().map(e => `
    <div class="card stack" style="gap:8px">
      <div class="row" style="align-items:center;gap:10px"><span class="grade sm g${e.grade}">${e.grade}</span>
        <div class="grow" style="flex:4"><b>${e.right} из ${e.count}</b>${e.format ? ` · ${FORMAT_NAME[e.format] || ''}` : ''}<br>
        <small class="muted">${fmtDate(e.date)} · ${Math.floor(e.seconds / 60)} мин ${e.seconds % 60} с${e.timeUp ? ' · время вышло' : ''}</small></div></div>
      ${e.bySection ? `<div class="chips">${Object.entries(e.bySection).map(([k, v]) => `<span>${SECTION_NAME(k)}: ${v.r}/${v.t}</span>`).join('')}</div>` : ''}
      ${e.mistakes.length ? `<div class="hard">${e.mistakes.map(m => `<span>${esc(m.note)} → ${esc(m.answer || 'нет ответа')}</span>`).join('')}</div>` : '<p class="muted small">Без ошибок</p>'}
    </div>`).join('');
  const pending = s.prizeLog.filter(p => !p.given);

  render(`${header('Режим учителя')}
    <h3 class="sec">Ученик</h3>
    <div class="field"><label for="tname">Имя</label><input id="tname" maxlength="20" value="${esc(s.name)}"></div>
    <div class="grid2">
      <div class="stat"><b>${s.points}</b><span>очков · уровень ${store.levelInfo().n} из 15</span></div>
      <div class="stat"><b>${s.gems} 💎</b><span>алмазиков</span></div>
    </div>

    <h3 class="sec">Статистика занятий</h3>
    ${statsHtml()}

    <h3 class="sec">Экзамен</h3>
    <div class="stack">
      ${tog('examOpen', '', ex.open ? (examTaken() ? 'Открыт · ученик уже сдал' : 'Открыт · ждёт ученика') : 'Открыть экзамен', ex.open)}
      <div class="field"><label>Вопросов</label>${tabs('count', [[10, '10'], [20, '20'], [30, '30']], ex.count)}</div>
      <div class="field"><label>Что входит в экзамен</label>
        <div class="stack" style="gap:8px">${['notes', ...TOPICS.map(t => t.id)].map(k => tog('examSec', k, SECTION_NAME(k), !!ex.sections[k])).join('')}</div></div>
      <div class="field"><label>Формат ответа для нот</label>${tabs('format', [['choice', '4 варианта'], ['pro1', 'Профи 1'], ['pro2', 'Профи 2']], ex.format)}</div>
      <div class="field"><label>Таймер</label>${tabs('minutes', [[0, 'Нет'], [5, '5 мин'], [10, '10 мин'], [15, '15 мин']], ex.minutes)}</div>
      <p class="muted small">Оценка: 90% и больше — «5», от 75% — «4», от 50% — «3», меньше — «2». Вопросы делятся между выбранными разделами поровну. Чтобы ученик сдал ещё раз, выключите и снова включите экзамен.</p>
    </div>
    <h3 class="sec">Результаты экзаменов</h3>
    <div class="stack">${results || '<p class="muted small">Экзаменов пока не было</p>'}</div>

    <h3 class="sec">Призы за алмазики</h3>
    ${pending.length ? `<div class="card stack" style="gap:8px"><b>Ждут выдачи</b>${pending.map(p => `<div class="row" style="align-items:center"><span style="flex:3">${esc(p.title)}<br><small class="muted">${fmtDate(p.date)}</small></span><button class="btn primary sm" style="flex:none" data-give="${p.uid}">Выдано</button></div>`).join('')}</div>` : ''}
    <div class="stack">${s.settings.prizes.map(p => `<div class="card row" style="align-items:center"><span style="flex:3"><b>${esc(p.title)}</b> · ${p.price} 💎</span><button class="btn danger sm" style="flex:none" data-del="${p.id}">Убрать</button></div>`).join('') || '<p class="muted small">Призов пока нет. Например: «Наклейка» — 50 💎, «Выбрать песню на уроке» — 100 💎.</p>'}</div>
    <div class="row prize-add"><input id="ptitle" maxlength="40" placeholder="Название приза"><input id="pprice" inputmode="numeric" maxlength="4" placeholder="Цена"><button class="btn primary sm" id="padd">Добавить</button></div>

    <h3 class="sec">Трудные ноты</h3>
    <div class="hard">${hard.length ? hard.map(x => `<span>${x.n.full}: ${x.st.w} ош. из ${x.st.w + x.st.r}</span>`).join('') : '<p class="muted small">Ошибок пока нет</p>'}</div>
    <h3 class="sec">Уровни «Угадай ноту»</h3>
    <div class="stack">${NOTE_LEVELS.map(l => tog('noteLevels', l.id, `${l.mode ? l.title : `${l.id}. ${l.title}`} ${'★'.repeat(s.notes.best[l.id] || 0)}`, s.settings.noteLevels[l.id] !== false)).join('')}
      ${tog('unlockAll', '', 'Открыть все уровни сразу', !!s.settings.unlockAll)}</div>
    <h3 class="sec">Темы «Азбуки музыки»</h3>
    <div class="stack">${TOPICS.map(t => tog('topics', t.id, `${t.title} ${'★'.repeat(s.theory.best[t.id] || 0)}`, s.settings.topics[t.id] !== false)).join('')}</div>
    <h3 class="sec">Настройки</h3>
    <div class="stack">${tog('sound', '', 'Звук', s.settings.sound)}
      <div class="field"><label>Вопросов в обычном тесте</label>${tabs('questions', [[5, '5'], [10, '10'], [15, '15']], s.settings.questions)}</div>
      <div class="field"><label for="tpin">Новый ПИН-код (4 цифры)</label><input id="tpin" inputmode="numeric" maxlength="4" placeholder="••••"></div>
      <button class="btn ghost" id="savepin">Сменить ПИН-код</button>
      <button class="btn danger" id="reset">Сбросить прогресс ученика</button>
      <button class="btn primary" id="exit">Выйти из режима учителя</button>
    </div>`);

  const keep = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
  document.getElementById('tname').onchange = (e) => { const v = e.target.value.trim(); if (v) { store.update(x => { x.name = v; }); toast('Имя сохранено'); } };
  $app.querySelectorAll('.toggle').forEach(b => b.onclick = () => {
    const { key, id } = b.dataset;
    store.update(x => {
      if (key === 'examOpen') {
        x.settings.exam.open = !x.settings.exam.open;
        if (x.settings.exam.open) x.settings.exam.id = Date.now().toString(36);
      } else if (key === 'examSec') x.settings.exam.sections[id] = !x.settings.exam.sections[id];
      else if (key === 'unlockAll' || key === 'sound') x.settings[key] = !x.settings[key];
      else x.settings[key][id] = x.settings[key][id] === false;
    });
    if (key === 'examOpen') { toast(S().settings.exam.open ? 'Экзамен открыт' : 'Экзамен закрыт'); keep(teacherPanel); }
    else b.classList.toggle('on');
  });
  $app.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const k = b.dataset.set, v = b.dataset.v;
    store.update(x => { if (k === 'questions') x.settings.questions = +v; else x.settings.exam[k] = k === 'format' ? v : +v; });
    keep(teacherPanel);
  });
  $app.querySelectorAll('[data-give]').forEach(b => b.onclick = () => {
    store.update(x => { const p = x.prizeLog.find(q => q.uid === b.dataset.give); if (p) p.given = true; });
    toast('Отмечено: приз выдан'); keep(teacherPanel);
  });
  $app.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
    store.update(x => { x.settings.prizes = x.settings.prizes.filter(p => p.id !== b.dataset.del); }); keep(teacherPanel);
  });
  document.getElementById('padd').onclick = () => {
    const title = document.getElementById('ptitle').value.trim(), price = parseInt(document.getElementById('pprice').value, 10);
    if (!title || !(price > 0)) { toast('Впишите название и цену приза'); return; }
    store.update(x => { x.settings.prizes.push({ id: Date.now().toString(36), title, price }); });
    toast('Приз добавлен'); keep(teacherPanel);
  };
  document.getElementById('savepin').onclick = () => {
    const v = document.getElementById('tpin').value;
    if (!/^\d{4}$/.test(v)) { toast('ПИН-код — это 4 цифры'); return; }
    store.update(x => { x.settings.pin = v; x.settings.pinChanged = true; }); toast('ПИН-код изменён');
    document.getElementById('tpin').value = '';
  };
  const reset = document.getElementById('reset');
  reset.onclick = () => {
    if (!reset.dataset.sure) { reset.dataset.sure = 1; reset.textContent = 'Нажмите ещё раз для сброса'; return; }
    store.resetProgress(); applyLook(S().equip); toast('Прогресс сброшен'); teacherPanel();
  };
  document.getElementById('exit').onclick = () => { teacherOk = false; location.hash = '#/'; };
}

/* ===== Маршруты ===== */
function route() {
  quizSeq++; clearInterval(activeTimer); stopTuner();
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b, c] = h.split('/');
  if (!S().name && a !== 'teacher') return welcome();
  if (a !== 'teacher') teacherOk = false;
  switch (a) {
    case 'notes': return b ? notesQuiz(b) : notesMenu();
    case 'exam': return examScreen();
    case 'theory': return !b ? theoryMenu() : c === 'quiz' ? theoryQuiz(b) : theoryCards(b);
    case 'games': return gamesMenu();
    case 'fret': return b ? fretGame(b) : levelList('Найди ноту на грифе', '#/games', FRET_LEVELS, 'fret', '#/fret');
    case 'bar': return b ? barGame(b) : levelList('Собери такт', '#/games', BAR_LEVELS, 'bar', '#/bar');
    case 'ear': return b ? earGame(b) : levelList('Слух', '#/games', EAR_LEVELS, 'ear', '#/ear');
    case 'tuner': return tunerScreen();
    case 'shop': return shopScreen();
    case 'progress': return progress();
    case 'teacher': return b === 'panel' ? teacherPanel() : teacherPin();
    default: return home();
  }
}

/* ===== Время занятий: считаем, пока приложение открыто и видно ===== */
setInterval(() => {
  if (document.visibilityState === 'visible' && S().name && !location.hash.startsWith('#/teacher')) store.addTime(15);
}, 15000);

/* ===== Автообновление: сравниваем версию на сайте с текущей ===== */
async function checkUpdate() {
  if (!location.protocol.startsWith('http')) return;
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    const { v } = await r.json();
    if (String(v) !== APP_VERSION) showUpdate();
  } catch { /* нет сети */ }
}
function showUpdate() {
  if (document.getElementById('upd')) return;
  const el = document.createElement('div');
  el.id = 'upd'; el.className = 'update-bar';
  el.innerHTML = '<span>Доступна новая версия</span><button>Обновить</button>';
  el.querySelector('button').onclick = async () => {
    el.querySelector('button').textContent = 'Обновляю…';
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) await reg.update();
      for (const k of await caches.keys()) await caches.delete(k);
    } catch { /* ignore */ }
    location.reload();
  };
  document.body.appendChild(el);
}

applyLook(S().equip);
window.addEventListener('hashchange', route);
route();
checkUpdate();
setInterval(checkUpdate, 10 * 60000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') checkUpdate(); });

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
