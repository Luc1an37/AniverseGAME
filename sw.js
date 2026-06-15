const CACHE_NAME = 'aniverse-v3'; // Incremented to v3 to force browsers to fetch the fresh index.html from network!
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  'https://telegram.org/js/telegram-web-app.js',
  'https://sad.adsgram.ai/js/sad.min.js'
];

// 1. Install Event - pre-cache key assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate Event - clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch Event - network-first fallback to cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
            return new Response(`
              <!DOCTYPE html>
              <html lang="ru">
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Вы оффлайн — AniVerse</title>
                <style>
                  body { background: #0a0f1e; color: #fff; font-family: sans-serif; text-align: center; padding: 50px 20px; }
                  h1 { font-size: 32px; color: #a855f7; margin-bottom: 10px; }
                  p { color: #64748b; font-size: 14px; line-height: 1.5; }
                </style>
              </head>
              <body>
                <h1>🌀 Вы оффлайн</h1>
                <p>Пожалуйста, проверьте ваше интернет-соединение и попробуйте перезапустить приложение!</p>
              </body>
              </html>
            `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          }
        });
      })
  );
});
