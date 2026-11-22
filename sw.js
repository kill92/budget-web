// Service worker של גרסת האינטרנט: "קודם הרשת, ואם אין רשת – העותק השמור". כך תמיד נטענת הגרסה האחרונה, והאפליקציה נפתחת גם בלי אינטרנט.
const CACHE = 'budget-web-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  // רק קבצים של האתר עצמו. גוגל, ה-Worker ו-Drive עוברים ישר לרשת. דף ההתחברות לא נשמר
  if (req.method !== 'GET' || url.origin !== self.location.origin || url.pathname.endsWith('/auth-callback.html')) return;
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res && res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const idx = await caches.match('./') || await caches.match('index.html'); if (idx) return idx; }
      throw err;
    }
  })());
});
