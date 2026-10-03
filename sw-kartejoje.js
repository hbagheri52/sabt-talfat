// سرویس‌ورکر «کارت جوجه» — نسخه‌ی اصلاح‌شده
// فقط خودِ صفحه‌ی برنامه (و فونت‌ها) رو برای کارِ آفلاین کش می‌کنه.
// ❗ هیچ درخواستی به سرور داده (Supabase / Cloudflare Worker / Firebase / تلگرام) رو دست نمی‌زنه.
//   نسخه‌ی قبلی «همه‌ی» درخواست‌های GET رو کش می‌کرد و وقتی اینترنت/فیلترشکن قطع و وصل می‌شد، جوابِ قدیمیِ سرور رو
//   به‌جای خطا تحویلِ برنامه می‌داد (یعنی ثبت‌های تازه دیده نمی‌شدن و قفل‌ها اشتباه کار می‌کردن) و کشِ گوشی هم پر می‌شد.
const CACHE_NAME = 'kartejoje-app-v2';
const OWN_PREFIXES = ['kartejoje-app-'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add(self.registration.scope)).catch(() => {})
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // کشِ نسخه‌های قبلیِ «همین برنامه» (که پر از جوابِ قدیمیِ سرور بود) پاک می‌شه — کشِ برنامه‌ی دیگه (آب/کارت جوجه)
    // روی همین دامنه است و دست نمی‌خوره
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => OWN_PREFIXES.some((p) => k.startsWith(p)) && k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});

// وقتی کاربر روی نوتیفیکیشن کلیک می‌کند، پنجره‌ی اپ را باز/فوکوس کن
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(self.registration.scope);
      }
    })
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  // هر چیزی غیر از خودِ برنامه و فونت‌ها (یعنی همه‌ی API ها) → اصلاً دخالت نکن، مستقیم از اینترنت
  if (!sameOrigin && !FONT_HOSTS.includes(url.host)) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) =>
          cached ||
          (req.mode === 'navigate' ? caches.match(self.registration.scope) : undefined) ||
          Response.error()
        )
      )
  );
});
