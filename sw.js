// Офлайн-режим: приложение работает без интернета после первого открытия.
const CACHE = 'angelmusic-v3';
const FILES = [
  './', 'index.html', 'manifest.json', 'style.css',
  'app.js', 'store.js', 'notes.js', 'theory.js', 'audio.js',
  'icon.svg', 'icon-192.png', 'icon-512.png',
  'nunito-cyrillic-700-normal.woff2', 'nunito-cyrillic-800-normal.woff2', 'nunito-cyrillic-900-normal.woff2',
  'nunito-latin-700-normal.woff2', 'nunito-latin-800-normal.woff2', 'nunito-latin-900-normal.woff2',
  'noto-music-music-400-normal.woff2',
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
// Сначала сеть (чтобы обновления с GitHub приходили сразу), без сети — кэш.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
