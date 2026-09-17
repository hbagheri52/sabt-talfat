// این فایل صفحه‌ی «ثبت مصرف آب» رو روی گوشی کش می‌کنه تا حتی بارِ اول هم اگه بعداً نت نبود، باز بشه.
// هر بار که نت هست، نسخه‌ی تازه از سرور میاد و کش هم آپدیت می‌شه؛ فقط وقتی نت نیست، از کش استفاده می‌کنه.
const CACHE_NAME = 'ab-app-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(self.registration.scope))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then((cached) => cached || caches.match(self.registration.scope))
      )
  );
});
