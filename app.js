import * as store from './store.js';
import { NOTE_LEVELS, NAMES, NOTES, OCTAVES, ALL_POSITIONS, staffSVG, makeQuiz, shuffle } from './notes.js';
import { TOPICS, ALL_CARDS } from './theory.js';
import { playNote, playChord, sfxRight, sfxWrong, sfxWin } from './audio.js';

const $app = document.getElementById('app');
const S = () => store.get();
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ===== Иконки ===== */
const I = {
  star: (c = '#FFC93D') => `<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" fill="${c}" stroke="${c}" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  back: `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  flame: `<svg viewBox="0 0 24 30" width="26" height="32"><path d="M12 1C14 8 21 11 21 19A9 9 0 0 1 3 19C3 14 6 12 7 8C9 11 10 12 11 12C11 8 10 5 12 1Z" fill="#FF7A3D"/><path d="M12 14C14 17 16 18 16 21A4 4 0 0 1 8 21C8 18 10 17 12 14Z" fill="#FFD25E"/></svg>`,
  lock: `<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3" fill="currentColor"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>`,
  sound: `<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z" fill="#FF7A3D"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#FF7A3D" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>`,
  medal: `<svg viewBox="0 0 24 24"><circle cx="12" cy="14" r="7" fill="#fff" opacity=".35"/><path d="M12 9.5l1.4 2.9 3.2.4-2.3 2.2.6 3.1L12 16.6l-2.9 1.5.6-3.1-2.3-2.2 3.2-.4z" fill="#fff"/><path d="M8 2h3l1 5-3 0zM16 2h-3l-1 5 3 0z" fill="#fff" opacity=".8"/></svg>`,
  exam: `<svg viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="3" fill="#fff" opacity=".9"/><path d="M8.5 9h7M8.5 13h7M8.5 17h4" stroke="#9B7BFF" stroke-width="2" stroke-linecap="round"/></svg>`,
};
const noteIcon = `<span class="music glyph" style="font-size:34px" data-g="\u{1D15F}"></span>`;
const sharpIcon = `<span class="music glyph" style="font-size:34px" data-g="♯"></span>`;

/* ===== Подсчёты ===== */
const enabledLevels = () => NOTE_LEVELS.filter(l => S().settings.noteLevels[l.id] !== false);
const enabledTopics = () => TOPICS.filter(t => S().settings.topics[t.id] !== false);
const sum = (a) => a.reduce((x, y) => x + y, 0);

function totalStars() {
  return sum(Object.values(S().notes.best)) + sum(Object.values(S().theory.best));
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
  { id: 'lvl5', title: 'Гитарист', color: 'pink', ok: () => store.levelInfo().n >= 5 },
  { id: 'maestro', title: 'Маэстро', color: 'yellow', ok: () => store.levelInfo().n >= 8 },
];
const awardsPct = () => Math.round(AWARDS.filter(a => a.ok()).length / AWARDS.length * 100);

/* ===== Общие куски разметки ===== */
const starsPill = () => `<span class="pill">${I.star()} ${totalStars()}</span>`;
const header = (title, back = '#/', right = starsPill()) =>
  `<div class="top"><a class="back" href="${back}" aria-label="Назад">${I.back}</a><div class="title">${title}</div>${right}</div>`;
const stars3 = (n) => `<span class="stars3">${[0, 1, 2].map(i => I.star(i < n ? '#FFC93D' : '#E8DFD0')).join('')}</span>`;

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
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

/* ===== Экзамен: доступность ===== */
const examCfg = () => S().settings.exam;
const examTaken = () => S().exams.find(e => e.id === examCfg().id);
const examAvailable = () => examCfg().open && !examTaken();
const FORMAT_NAME = { choice: '4 варианта', pro1: 'Профи 1', pro2: 'Профи 2' };
const gradeOf = (pct) => pct >= 0.9 ? 5 : pct >= 0.75 ? 4 : pct >= 0.5 ? 3 : 2;

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
    <div class="top"><b class="logo">AngelMusic</b>${starsPill()}</div>
    <h1 class="big">Привет, ${esc(s.name)}!</h1>
    <div class="card lvl">
      <span class="badge">${lv.n}</span>
      <div class="grow"><b style="font-size:15px;font-weight:900">Уровень ${lv.n} · ${lv.name}</b>
        <div class="pb"><i style="width:${lv.pct}%"></i></div>
        <small class="muted small">${lv.next ? `${s.points} из ${lv.next} очков до ${lv.n + 1} уровня` : `${s.points} очков — высший уровень!`}</small></div>
    </div>
    <div class="card">
      <div class="streak-head">${I.flame}<b>${streakText}</b>${st ? '<small>Не прерывай серию</small>' : ''}</div>
      <div class="week">${week}</div>
    </div>
    ${examAvailable() ? sec('#/exam', 'violet', `<span style="width:32px;height:32px;display:block">${I.exam}</span>`, 'Экзамен по нотам', `Учитель открыл экзамен: ${examCfg().count} вопросов`, null) : ''}
    ${sec('#/notes', 'orange', noteIcon, 'Угадай ноту', 'От «ми» малой до «ми» третьей октавы', notesPct())}
    ${sec('#/theory', 'blue', sharpIcon, 'Азбука музыки', 'Гитара, длительности, паузы, размеры, знаки', theoryPct())}
    ${sec('#/progress', 'green', `<span style="width:30px;height:30px;display:block">${I.star('#fff')}</span>`, 'Мои успехи', 'Звёзды, уровни и награды', awardsPct())}
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
      <span class="num bg-${l.color}">${open ? (l.mode ? 'П' + l.id % 6 : l.id) : `<span style="width:20px;height:20px;color:#fff;display:block">${I.lock}</span>`}</span>
      <div class="grow"><h3>${l.title}</h3><p>${l.desc}</p></div>
      ${stars3(S().notes.best[l.id] || 0)}
    </a>`;
  };
  const ls = enabledLevels();
  const basic = ls.filter(l => !l.mode).map(item).join('');
  const pro = ls.filter(l => l.mode).map(item).join('');
  render(`${header('Угадай ноту')}
    ${examAvailable() ? `<a class="menu bg-violet on-color" href="#/exam"><span class="ic"><span style="width:32px;height:32px;display:block">${I.exam}</span></span><div class="grow"><h2>Экзамен</h2><p>Учитель открыл экзамен</p></div><span class="chev">›</span></a>` : ''}
    <p class="muted">Выбери уровень. Чтобы открыть следующий, получи хотя бы одну звезду.</p>
    <div class="stack">${basic || ''}</div>
    ${pro ? `<h3 class="sec">Для профи — без подсказок-вариантов</h3><div class="stack">${pro}</div>` : ''}
    ${!ls.length ? '<p class="muted">Учитель пока не включил ни одного уровня.</p>' : ''}`);
  $app.querySelectorAll('[data-locked="1"]').forEach(a => a.onclick = (e) => { e.preventDefault(); toast('Сначала пройди предыдущий уровень'); });
}

/* ===== Общий движок теста =====
   Вопрос типа choice: { options, correct } — 4 варианта.
   Вопрос типа keys:   { note, needOctave } — 7 кнопок с нотами (+ октавы) и «Ввод».
   exam: без подсветки правильного ответа, без звука и подсказок; timerMin — таймер. */
let quizSeq = 0, activeTimer = null;

function runQuiz({ title, back, questions, onFinish, exam = false, timerMin = 0 }) {
  const my = ++quizSeq;
  let i = 0, right = 0, locked = false;
  const mistakes = [];
  const colors = ['orange', 'blue', 'green', 'pink'];
  const sound = S().settings.sound && !exam;
  const started = Date.now();
  const deadline = timerMin ? started + timerMin * 60000 : 0;
  store.markToday();

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
    const pill = deadline ? `<span class="pill timer" id="timer">${timerText()}</span>` : (exam ? '<span class="pill">Экзамен</span>' : starsPill());
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
    if (q.autoplay && q.onListen) setTimeout(() => alive() && q.onListen(), 300);
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
    else mistakes.push({ note: q.explain, answer: answerText });
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
      onFinish({ right, total, mistakes, grade, seconds: Math.round((Date.now() - started) / 1000), timeUp });
      render(`${header(title, '#/', '<span class="pill">Готово</span>')}
        <div class="result">
          <div class="grade g${grade}">${grade}</div>
          <h1 class="big">${timeUp ? 'Время вышло!' : 'Экзамен завершён!'}</h1>
          <p class="score">Правильно: <b style="color:var(--ink)">${right} из ${total}</b><br>Результат увидит учитель</p>
        </div>
        <a class="btn primary" href="#/">На главную</a>`);
      return;
    }
    const pct = right / total;
    const n = pct >= 0.9 ? 3 : pct >= 0.7 ? 2 : pct >= 0.5 ? 1 : 0;
    if (right === total) store.update(s => { s.points += 20; s.perfect++; });
    onFinish(n);
    if (n) sfxWin(S().settings.sound);
    const msg = ['Попробуй ещё раз — у тебя получится!', 'Неплохо! Можно лучше', 'Отлично!', 'Супер! Ни одной ошибки — так держать!'];
    render(`${header(title, back)}
      <div class="result">
        <div class="bigstars">${[0, 1, 2].map(j => I.star(j < n ? '#FFC93D' : '#E8DFD0')).join('')}</div>
        <h1 class="big">${right === total ? msg[3] : msg[n]}</h1>
        <p class="score">Правильно: <b style="color:var(--ink)">${right} из ${total}</b><br>+${right * 10 + (right === total ? 20 : 0)} очков</p>
      </div>
      <div class="row"><a class="btn ghost" href="${back}">К списку</a><button class="btn primary" id="again">Ещё раз</button></div>`);
    document.getElementById('again').onclick = () => route();
  };
  show();
}

/** Вопросы по нотам. format: choice | pro1 | pro2 */
function noteQuestions(positions, count, format, { exam = false } = {}) {
  const minPos = Math.min(...positions), maxPos = Math.max(...positions);
  const sound = S().settings.sound;
  return makeQuiz({ positions }, count).map(({ note, options }) => {
    const base = {
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
    title: level.title.length > 18 ? `Уровень ${level.id}` : level.title, back: '#/notes',
    questions: noteQuestions(level.positions, S().settings.questions, level.mode || 'choice'),
    onFinish: (n) => store.update(s => { s.notes.best[level.id] = Math.max(s.notes.best[level.id] || 0, n); }),
  });
}

/* ===== Экзамен ===== */
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
  render(`${header('Экзамен по нотам')}
    <div class="card stack" style="padding:18px">
      <h2 style="font-weight:900">Правила</h2>
      <p>• ${cfg.count} нот от «ми» малой до «ми» третьей октавы</p>
      <p>• Ответы: ${cfg.format === 'choice' ? '4 варианта' : cfg.format === 'pro1' ? '7 кнопок с нотами' : 'нота и октава'}</p>
      <p>• Без подсказок и звука</p>
      <p>• ${cfg.minutes ? `На всё ${cfg.minutes} минут` : 'Без ограничения времени'}</p>
      <p>• Одна попытка — не торопись!</p>
    </div>
    <button class="btn primary" id="start">Начать экзамен</button>`);
  document.getElementById('start').onclick = () => {
    runQuiz({
      title: 'Экзамен', back: '#/', exam: true, timerMin: cfg.minutes,
      questions: noteQuestions(ALL_POSITIONS, cfg.count, cfg.format, { exam: true }),
      onFinish: (r) => store.update(s => {
        s.exams.push({ id: cfg.id, date: new Date().toISOString(), count: r.total, right: r.right, grade: r.grade,
          format: cfg.format, minutes: cfg.minutes, seconds: r.seconds, timeUp: r.timeUp, mistakes: r.mistakes });
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
      ${stars3(S().theory.best[t.id] || 0)}
    </a>`;
  }).join('');
  render(`${header('Азбука музыки')}
    <p class="muted">Сначала посмотри карточки, а потом ответь на вопросы.</p>
    <div class="stack">${items || '<p class="muted">Учитель пока не включил ни одной темы.</p>'}</div>`);
}

const listenBig = (label = 'Послушать') => `<button class="listen-big">${I.sound}<span>${label}</span></button>`;

function theoryCards(topicId) {
  const t = TOPICS.find(x => x.id === topicId);
  if (!t) { location.hash = '#/theory'; return; }
  let i = 0;
  const show = () => {
    const c = t.cards[i];
    store.update(s => { s.theory.seen[c.id] = true; });
    const front = c.pic ? `<div class="pic">${c.pic}</div><h2>${['g6', 'g7', 'g8', 'g9'].includes(c.id) ? 'Что это?' : 'Что выделено?'}</h2>`
      : `<div class="sym">${c.sym}</div><h2>Что это?</h2>`;
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
      if (e.target.closest('.listen-big')) { playChord(c.play, true); return; }
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
  const qs = shuffle(t.questions).map(q => {
    const opts = shuffle(q.options);
    let visual = '';
    if (q.pic) visual = `<div class="staffcard pic">${q.pic}</div>`;
    else if (q.sym) visual = `<div class="staffcard" style="display:flex;justify-content:center;padding:14px"><div class="sym">${q.sym}</div></div>`;
    else if (q.play) visual = `<div style="display:flex;justify-content:center">${listenBig('Послушать ещё раз')}</div>`;
    return {
      type: 'choice', question: q.q, visual,
      options: opts, correct: opts.indexOf(q.options[0]), explain: q.options[0],
      onListen: q.play ? () => playChord(q.play, true) : null, autoplay: !!q.play,
    };
  });
  runQuiz({
    title: t.title, back: '#/theory', questions: qs,
    onFinish: (n) => store.update(s => { s.theory.best[t.id] = Math.max(s.theory.best[t.id] || 0, n); }),
  });
}

/* ===== Мои успехи ===== */
function progress() {
  const s = S(), lv = store.levelInfo();
  const cardsSeen = ALL_CARDS.filter(c => s.theory.seen[c.id]).length;
  const awards = AWARDS.map(a => `<div class="award ${a.ok() ? '' : 'off'}"><div class="medal bg-${a.color}">${I.medal}</div>${a.title}</div>`).join('');
  render(`${header('Мои успехи')}
    <div class="card lvl"><span class="badge">${lv.n}</span><div class="grow"><b style="font-weight:900">Уровень ${lv.n} · ${lv.name}</b>
      <div class="pb"><i style="width:${lv.pct}%"></i></div><small class="muted small">${s.points} очков</small></div></div>
    <div class="grid2">
      <div class="stat"><b>${totalStars()}</b><span>звёзд</span></div>
      <div class="stat"><b>${store.streak()}</b><span>дней подряд (рекорд ${store.bestStreak()})</span></div>
      <div class="stat"><b>${notesPct()}%</b><span>«Угадай ноту»</span></div>
      <div class="stat"><b>${cardsSeen}/${ALL_CARDS.length}</b><span>карточек изучено</span></div>
    </div>
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
      <h2 style="font-weight:900;margin-top:6px">Введите ПИН-код</h2><p class="muted small">По умолчанию 1234 — смените его в настройках</p></div>
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
        <div class="grow" style="flex:4"><b>${e.right} из ${e.count}</b> · ${FORMAT_NAME[e.format] || ''}<br>
        <small class="muted">${fmtDate(e.date)} · ${Math.floor(e.seconds / 60)} мин ${e.seconds % 60} с${e.timeUp ? ' · время вышло' : ''}</small></div></div>
      ${e.mistakes.length ? `<div class="hard">${e.mistakes.map(m => `<span>${m.note} → ${m.answer || 'нет ответа'}</span>`).join('')}</div>` : '<p class="muted small">Без ошибок</p>'}
    </div>`).join('');

  render(`${header('Режим учителя')}
    <h3 class="sec">Ученик</h3>
    <div class="field"><label for="tname">Имя</label><input id="tname" maxlength="20" value="${esc(s.name)}"></div>
    <div class="grid2">
      <div class="stat"><b>${s.points}</b><span>очков · уровень ${store.levelInfo().n}</span></div>
      <div class="stat"><b>${s.days.length}</b><span>дней занятий</span></div>
    </div>

    <h3 class="sec">Экзамен по нотам</h3>
    <div class="stack">
      ${tog('examOpen', '', ex.open ? (examTaken() ? 'Открыт · ученик уже сдал' : 'Открыт · ждёт ученика') : 'Открыть экзамен', ex.open)}
      <div class="field"><label>Вопросов</label>${tabs('count', [[10, '10'], [20, '20'], [30, '30']], ex.count)}</div>
      <div class="field"><label>Формат ответа</label>${tabs('format', [['choice', '4 варианта'], ['pro1', 'Профи 1'], ['pro2', 'Профи 2']], ex.format)}</div>
      <div class="field"><label>Таймер</label>${tabs('minutes', [[0, 'Нет'], [5, '5 мин'], [10, '10 мин'], [15, '15 мин']], ex.minutes)}</div>
      <p class="muted small">Оценка: 90% и больше — «5», от 75% — «4», от 50% — «3», меньше — «2». Чтобы ученик сдал ещё раз, выключите и снова включите экзамен.</p>
    </div>
    <h3 class="sec">Результаты экзаменов</h3>
    <div class="stack">${results || '<p class="muted small">Экзаменов пока не было</p>'}</div>

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

  const keepScroll = (fn) => { const y = window.scrollY; fn(); window.scrollTo(0, y); };
  document.getElementById('tname').onchange = (e) => { const v = e.target.value.trim(); if (v) { store.update(x => { x.name = v; }); toast('Имя сохранено'); } };
  $app.querySelectorAll('.toggle').forEach(b => b.onclick = () => {
    const { key, id } = b.dataset;
    store.update(x => {
      if (key === 'examOpen') {
        x.settings.exam.open = !x.settings.exam.open;
        if (x.settings.exam.open) x.settings.exam.id = Date.now().toString(36);
      } else if (key === 'unlockAll' || key === 'sound') x.settings[key] = !x.settings[key];
      else x.settings[key][id] = x.settings[key][id] === false;
    });
    if (key === 'examOpen') { toast(S().settings.exam.open ? 'Экзамен открыт' : 'Экзамен закрыт'); keepScroll(teacherPanel); }
    else b.classList.toggle('on');
  });
  $app.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
    const k = b.dataset.set, v = b.dataset.v;
    store.update(x => {
      if (k === 'questions') x.settings.questions = +v;
      else x.settings.exam[k] = k === 'format' ? v : +v;
    });
    keepScroll(teacherPanel);
  });
  document.getElementById('savepin').onclick = () => {
    const v = document.getElementById('tpin').value;
    if (!/^\d{4}$/.test(v)) { toast('ПИН-код — это 4 цифры'); return; }
    store.update(x => { x.settings.pin = v; }); toast('ПИН-код изменён');
    document.getElementById('tpin').value = '';
  };
  const reset = document.getElementById('reset');
  reset.onclick = () => {
    if (!reset.dataset.sure) { reset.dataset.sure = 1; reset.textContent = 'Нажмите ещё раз для сброса'; return; }
    store.resetProgress(); toast('Прогресс сброшен'); teacherPanel();
  };
  document.getElementById('exit').onclick = () => { teacherOk = false; location.hash = '#/'; };
}

/* ===== Маршруты ===== */
function route() {
  quizSeq++; clearInterval(activeTimer);
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b, c] = h.split('/');
  if (!S().name && a !== 'teacher') return welcome();
  if (a !== 'teacher') teacherOk = false;
  switch (a) {
    case 'notes': return b ? notesQuiz(b) : notesMenu();
    case 'exam': return examScreen();
    case 'theory': return !b ? theoryMenu() : c === 'quiz' ? theoryQuiz(b) : theoryCards(b);
    case 'progress': return progress();
    case 'teacher': return b === 'panel' ? teacherPanel() : teacherPin();
    default: return home();
  }
}
window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
