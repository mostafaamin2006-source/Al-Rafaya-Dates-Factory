/* Service Worker — سجل طلبات مصنع تمور مزرعة الرفايع
   الهدف: يسمح بتثبيت الصفحة كتطبيق (PWA) ويفتح حتى لو الإنترنت ضعيف لحظة الفتح.
   ملاحظة: بيانات الطلبات نفسها بتتجاب من Supabase أونلاين، فلازم يكون فيه إنترنت
   عشان تشتغل فعليًا وتتحدث بياناتك — الكاش هنا بس لتسريع فتح واجهة التطبيق. */

const CACHE_NAME = 'sajjal-shell-v1';
const SHELL_FILES = [
  './sajjal_11.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* شبكة أولاً لملف الصفحة نفسها (عشان أي تحديث تعمله يوصل فورًا)، وكاش fallback لو مفيش نت.
   أي طلب تاني (خطوط، CDN، Supabase) يفضل زي ما هو من غير تدخل من الـ service worker. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // سيب أي دومين خارجي (Supabase, CDN..) للمتصفح العادي

  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(()=>{});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || caches.match('./sajjal_11.html')))
  );
});
