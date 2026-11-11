// Магазин за алмазики: аватарки, аксессуары, цвет гитары, темы оформления.
// Все картинки нарисованы здесь же (свои персонажи), без внешних файлов.

const FACE = (skin, extra = '') => `
  <circle cx="50" cy="56" r="30" fill="${skin}"/>${extra}
  <circle cx="40" cy="54" r="4" fill="#2B2350"/><circle cx="60" cy="54" r="4" fill="#2B2350"/>
  <circle cx="41.3" cy="52.6" r="1.3" fill="#fff"/><circle cx="61.3" cy="52.6" r="1.3" fill="#fff"/>
  <path d="M43 66 Q50 72 57 66" stroke="#2B2350" stroke-width="3" fill="none" stroke-linecap="round"/>
  <circle cx="33" cy="63" r="4" fill="#FF8FA3" opacity=".55"/><circle cx="67" cy="63" r="4" fill="#FF8FA3" opacity=".55"/>`;

const AVATARS = {
  'av-note': { title: 'Нотка', price: 0, svg: () => `<path d="M68 12 V40" stroke="#2B2350" stroke-width="5" stroke-linecap="round"/><path d="M68 12 Q84 16 82 30" stroke="#2B2350" stroke-width="5" fill="none" stroke-linecap="round"/>${FACE('#FFB86B')}` },
  'av-cat': { title: 'Котик', price: 15, svg: () => `<path d="M24 40 L28 14 L46 30Z M76 40 L72 14 L54 30Z" fill="#B9B0C9"/><path d="M29 34 L31 20 L41 30Z M71 34 L69 20 L59 30Z" fill="#FFB3C1"/>${FACE('#C9C1D8', '<path d="M47 61 L53 61 L50 64Z" fill="#FF7A9A"/><path d="M28 62 H16 M28 66 H17 M72 62 H84 M72 66 H83" stroke="#8C84A0" stroke-width="1.6"/>')}` },
  'av-bear': { title: 'Мишка', price: 15, svg: () => `<circle cx="26" cy="30" r="11" fill="#B07A4F"/><circle cx="74" cy="30" r="11" fill="#B07A4F"/><circle cx="26" cy="30" r="5" fill="#E7B98F"/><circle cx="74" cy="30" r="5" fill="#E7B98F"/>${FACE('#C48A5C', '<ellipse cx="50" cy="65" rx="10" ry="7" fill="#E7B98F"/><ellipse cx="50" cy="61.5" rx="3.5" ry="2.5" fill="#2B2350"/>')}` },
  'av-fox': { title: 'Лисёнок', price: 20, svg: () => `<path d="M22 44 L26 12 L46 32Z M78 44 L74 12 L54 32Z" fill="#FF8A3D"/><path d="M28 36 L29 22 L38 32Z M72 36 L71 22 L62 32Z" fill="#fff"/>${FACE('#FF9A52', '<path d="M24 62 Q50 92 76 62 Q64 72 50 72 Q36 72 24 62Z" fill="#fff"/><circle cx="50" cy="63" r="2.8" fill="#2B2350"/>')}` },
  'av-bunny': { title: 'Зайка', price: 20, svg: () => `<ellipse cx="38" cy="18" rx="7" ry="20" fill="#EEE8F5"/><ellipse cx="62" cy="18" rx="7" ry="20" fill="#EEE8F5"/><ellipse cx="38" cy="19" rx="3.5" ry="14" fill="#FFB3C1"/><ellipse cx="62" cy="19" rx="3.5" ry="14" fill="#FFB3C1"/>${FACE('#F6F1FB', '<path d="M47 61 L53 61 L50 64Z" fill="#FF7A9A"/><rect x="47" y="67" width="6" height="5" rx="1" fill="#fff" stroke="#ddd"/>')}` },
  'av-frog': { title: 'Лягушонок', price: 25, svg: () => `<circle cx="34" cy="32" r="11" fill="#5CC98A"/><circle cx="66" cy="32" r="11" fill="#5CC98A"/><circle cx="50" cy="56" r="30" fill="#6FD89A"/>
    <circle cx="34" cy="31" r="6" fill="#fff"/><circle cx="66" cy="31" r="6" fill="#fff"/><circle cx="35" cy="32" r="3.4" fill="#2B2350"/><circle cx="67" cy="32" r="3.4" fill="#2B2350"/>
    <path d="M36 64 Q50 76 64 64" stroke="#2B2350" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="31" cy="60" r="4" fill="#FF8FA3" opacity=".5"/><circle cx="69" cy="60" r="4" fill="#FF8FA3" opacity=".5"/>` },
  'av-owl': { title: 'Совёнок', price: 25, svg: () => `<path d="M24 36 L30 20 L40 32Z M76 36 L70 20 L60 32Z" fill="#8C6A4F"/>${FACE('#A57E5E', '<circle cx="40" cy="54" r="9" fill="#F7E7C9"/><circle cx="60" cy="54" r="9" fill="#F7E7C9"/><path d="M46 60 L54 60 L50 66Z" fill="#FFB23D"/>')}` },
  'av-panda': { title: 'Панда', price: 30, svg: () => `<circle cx="27" cy="31" r="10" fill="#2E2B3A"/><circle cx="73" cy="31" r="10" fill="#2E2B3A"/><circle cx="50" cy="56" r="30" fill="#FAFAFC"/>
    <ellipse cx="40" cy="54" rx="8" ry="10" fill="#2E2B3A" transform="rotate(-20 40 54)"/><ellipse cx="60" cy="54" rx="8" ry="10" fill="#2E2B3A" transform="rotate(20 60 54)"/>
    <circle cx="40" cy="54" r="3.6" fill="#fff"/><circle cx="60" cy="54" r="3.6" fill="#fff"/><ellipse cx="50" cy="63" rx="4" ry="3" fill="#2E2B3A"/>
    <path d="M45 68 Q50 72 55 68" stroke="#2E2B3A" stroke-width="2.5" fill="none" stroke-linecap="round"/>` },
  'av-dragon': { title: 'Дракончик', price: 40, svg: () => `<path d="M30 30 L34 10 L42 28Z M70 30 L66 10 L58 28Z" fill="#FFD25E"/><path d="M50 22 L54 30 L46 30Z" fill="#FF6FA8"/>${FACE('#9B7BFF', '<circle cx="45" cy="64" r="1.8" fill="#2B2350"/><circle cx="55" cy="64" r="1.8" fill="#2B2350"/>')}` },
};

// Аксессуары: у каждого своё место — голова, лицо или шея.
const ACCESSORIES = {
  'ac-party': { title: 'Колпак', slot: 'head', price: 10, svg: `<path d="M38 30 L50 2 L62 30Z" fill="#4DA8FF"/><path d="M42 21 L58 21 M45 13 L55 13" stroke="#FFD25E" stroke-width="3"/><circle cx="50" cy="3" r="4" fill="#FF6FA8"/>` },
  'ac-crown': { title: 'Корона', slot: 'head', price: 30, svg: `<path d="M30 30 L32 10 L41 22 L50 6 L59 22 L68 10 L70 30Z" fill="#FFC93D" stroke="#E0A21E" stroke-width="2"/><circle cx="50" cy="20" r="3" fill="#FF5A5F"/><circle cx="38" cy="25" r="2.4" fill="#4DA8FF"/><circle cx="62" cy="25" r="2.4" fill="#3CC48B"/>` },
  'ac-cap': { title: 'Кепка', slot: 'head', price: 15, svg: `<path d="M22 36 Q24 12 50 12 Q76 12 78 36Z" fill="#FF5A5F"/><path d="M60 34 Q86 32 92 40 L64 40Z" fill="#D83F45"/><circle cx="50" cy="12" r="3" fill="#D83F45"/>` },
  'ac-bow': { title: 'Бантик', slot: 'head', price: 10, svg: `<path d="M50 22 L34 12 L34 32Z M50 22 L66 12 L66 32Z" fill="#FF6FA8"/><circle cx="50" cy="22" r="5" fill="#E04E8A"/>` },
  'ac-phones': { title: 'Наушники', slot: 'head', price: 25, svg: `<path d="M20 56 Q20 18 50 18 Q80 18 80 56" stroke="#2B2350" stroke-width="6" fill="none"/><rect x="12" y="48" width="14" height="22" rx="6" fill="#FF7A3D"/><rect x="74" y="48" width="14" height="22" rx="6" fill="#FF7A3D"/>` },
  'ac-glasses': { title: 'Очки', slot: 'face', price: 10, svg: `<circle cx="40" cy="54" r="9" fill="none" stroke="#2B2350" stroke-width="3"/><circle cx="60" cy="54" r="9" fill="none" stroke="#2B2350" stroke-width="3"/><path d="M49 54 H51" stroke="#2B2350" stroke-width="3"/>` },
  'ac-sun': { title: 'Тёмные очки', slot: 'face', price: 20, svg: `<rect x="29" y="47" width="19" height="13" rx="5" fill="#2B2350"/><rect x="52" y="47" width="19" height="13" rx="5" fill="#2B2350"/><path d="M48 52 H52" stroke="#2B2350" stroke-width="3"/><path d="M32 50 L37 50" stroke="#fff" stroke-width="2" opacity=".6"/>` },
  'ac-stars': { title: 'Очки-звёзды', slot: 'face', price: 25, svg: `<path d="M40 44l3 6 6.5 1-4.8 4.5 1.2 6.5L40 59l-5.9 3 1.2-6.5L30.5 51l6.5-1z" fill="#FFC93D" stroke="#E0A21E" stroke-width="1.5"/><path d="M60 44l3 6 6.5 1-4.8 4.5 1.2 6.5L60 59l-5.9 3 1.2-6.5L50.5 51l6.5-1z" fill="#FFC93D" stroke="#E0A21E" stroke-width="1.5"/>` },
  'ac-scarf': { title: 'Шарфик', slot: 'neck', price: 15, svg: `<path d="M24 80 Q50 92 76 80 L76 88 Q50 100 24 88Z" fill="#3CC48B"/><rect x="60" y="86" width="9" height="14" rx="3" fill="#2EA673"/>` },
  'ac-tie': { title: 'Бабочка', slot: 'neck', price: 15, svg: `<path d="M50 88 L36 80 L36 96Z M50 88 L64 80 L64 96Z" fill="#9B7BFF"/><circle cx="50" cy="88" r="4" fill="#7A5BE0"/>` },
  'ac-medal': { title: 'Медаль', slot: 'neck', price: 35, svg: `<path d="M42 78 L50 90 L58 78" stroke="#4DA8FF" stroke-width="5" fill="none"/><circle cx="50" cy="93" r="7" fill="#FFC93D" stroke="#E0A21E" stroke-width="2"/>` },
};

const GUITARS = {
  'g-classic': { title: 'Классика', price: 0, body: '#F6C48E', edge: '#C98A4B' },
  'g-red': { title: 'Красная', price: 20, body: '#F26B5B', edge: '#B8423A' },
  'g-blue': { title: 'Синяя', price: 20, body: '#6FB7FF', edge: '#3C7FC7' },
  'g-pink': { title: 'Розовая', price: 20, body: '#FF9CC8', edge: '#D0628F' },
  'g-green': { title: 'Зелёная', price: 20, body: '#7ED9A2', edge: '#3E9E68' },
  'g-black': { title: 'Чёрная', price: 25, body: '#4A4A5A', edge: '#22222C' },
  'g-gold': { title: 'Золотая', price: 40, body: '#FFD25E', edge: '#C99A1E' },
};

const THEMES = {
  'th-sun': { title: 'Солнечная', price: 0, colors: ['#FFF4E0', '#FF7A3D'] },
  'th-sea': { title: 'Морская', price: 30, colors: ['#E9F5FF', '#2F8CFF'] },
  'th-forest': { title: 'Лесная', price: 30, colors: ['#EEF8EE', '#2DB36B'] },
  'th-violet': { title: 'Фиалковая', price: 30, colors: ['#F4F0FF', '#8A63F2'] },
  'th-night': { title: 'Ночная', price: 50, colors: ['#1E1B33', '#FF8A4C'] },
};

export const CATALOG = { avatars: AVATARS, accessories: ACCESSORIES, guitars: GUITARS, themes: THEMES };

export function findItem(id) {
  for (const [kind, list] of Object.entries(CATALOG)) if (list[id]) return { kind, ...list[id], id };
  return null;
}

/** Аватарка с надетыми аксессуарами. */
export function avatarSVG(equip, size = 56) {
  const av = AVATARS[equip.avatar] || AVATARS['av-note'];
  const acc = ['neck', 'face', 'head'].map(slot => equip[slot] && ACCESSORIES[equip[slot]] ? ACCESSORIES[equip[slot]].svg : '').join('');
  return `<svg class="avatar" viewBox="0 0 100 100" width="${size}" height="${size}" aria-hidden="true">${av.svg()}${acc}</svg>`;
}
export function itemPreview(id, equip) {
  const it = findItem(id);
  if (!it) return '';
  if (it.kind === 'avatars') return avatarSVG({ ...equip, avatar: id, head: '', face: '', neck: '' }, 64);
  if (it.kind === 'accessories') return avatarSVG({ avatar: equip.avatar, head: '', face: '', neck: '', [it.slot]: id }, 64);
  if (it.kind === 'guitars') return `<svg viewBox="0 0 64 64" width="64" height="64"><path d="M40 6 L46 12 L30 30" stroke="#6B4423" stroke-width="6" stroke-linecap="round"/><circle cx="24" cy="38" r="15" fill="${it.body}" stroke="${it.edge}" stroke-width="3"/><circle cx="17" cy="48" r="10" fill="${it.body}" stroke="${it.edge}" stroke-width="3"/><circle cx="24" cy="38" r="15" fill="${it.body}"/><circle cx="25" cy="37" r="4.5" fill="#3B2A1E"/></svg>`;
  if (it.kind === 'themes') return `<svg viewBox="0 0 64 64" width="64" height="64"><rect x="4" y="8" width="56" height="48" rx="12" fill="${it.colors[0]}" stroke="#ddd"/><rect x="12" y="34" width="40" height="12" rx="6" fill="${it.colors[1]}"/><rect x="12" y="18" width="26" height="6" rx="3" fill="${it.colors[1]}" opacity=".5"/></svg>`;
  return '';
}

/** Применить цвет гитары и тему ко всей странице. */
export function applyLook(equip) {
  const g = GUITARS[equip.guitar] || GUITARS['g-classic'];
  const root = document.documentElement;
  root.style.setProperty('--gb', g.body);
  root.style.setProperty('--ge', g.edge);
  root.dataset.theme = (equip.theme || 'th-sun').replace('th-', '');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = (THEMES[equip.theme] || THEMES['th-sun']).colors[0];
}
