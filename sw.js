// להעלות את הגרסה בכל שינוי בנכסים, אחרת משתמשים יראו גרסה ישנה
const CACHE = 'milim-v32';
const FILES = ['./', './index.html', './manifest.json', './icon.svg'];

self.addEventListener('install', e => {
  // cache:'reload' – לא להשתמש בעותק ישן מהמטמון של הדפדפן (GitHub Pages שולח max-age=600)
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// קודם הרשת (עדכונים מופיעים מיד), ואם אין רשת או שהיא איטית – מהמטמון
self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  const fromCache = () => caches.match(request, { ignoreSearch: true });
  // no-cache = לבדוק מול השרת בכל פעם (304 זול), במקום להסתפק בעותק בן עד 10 דקות
  const fromNetwork = fetch(request, { cache: 'no-cache' }).then(res => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(request, copy));
    }
    return res;
  });
  const timeout = new Promise((_, reject) => setTimeout(reject, 3000));
  e.respondWith(
    Promise.race([fromNetwork, timeout]).catch(() => fromCache().then(hit => hit || fromNetwork))
  );
});
