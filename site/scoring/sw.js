/* The companion owns only /scoring/ and its own cache. */
var CACHE = 'fencing-scoring-v5';
var CORE = ['./','index.html','styles.css','app.js','favicon.svg','data/cases.json','../search.js'];
self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) { return cache.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) { return Promise.all(keys.filter(function (key) { return key.startsWith('fencing-scoring-') && key !== CACHE; }).map(function (key) { return caches.delete(key); })); }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin || (!url.pathname.startsWith(new URL(self.registration.scope).pathname) && url.href !== new URL('../search.js', self.registration.scope).href)) return;
  event.respondWith(caches.open(CACHE).then(function (cache) { return cache.match(event.request).then(function (hit) { var net = fetch(event.request).then(function (response) { if (response.ok) { var copy=response.clone(); cache.put(event.request,copy); } return response; }).catch(function () { return hit || Response.error(); }); return hit || net; }); }));
});
