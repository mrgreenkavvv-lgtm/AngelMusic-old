// Офлайн-режим: приложение работает без интернета после первого открытия.
const CACHE = 'angelmusic-v4';
const FILES = [
  './', 'index.html', 'manifest.json', 'style.css',
  'app.js', 'store.js', 'notes.js', 'theory.js', 'audio.js', 'games.js', 'tuner.js', 'shop.js',
  'icon.svg', 'icon-192.png', 'icon-512.png',
  'nunito-cyrillic-700-normal.woff2', 'nunito-cyrillic-800-normal.woff2', 'nunito-cyrillic-900-normal.woff2',
  'nunito-latin-700-normal.woff2', 'nunito-latin-800-normal.woff2', 'nunito-latin-900-normal.woff2',
  'noto-music-music-400-normal.woff2',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Сначала сеть с проверкой свежести (no-cache), без сети — сохранённая копия.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.url.includes('version.json')) return;   // версию всегда берём с сайта
  e.respondWith(
    fetch(req.mode === 'navigate' ? req.url : req, { cache: 'no-cache' }).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return r;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
