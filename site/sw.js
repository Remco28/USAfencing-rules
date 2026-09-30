/* Offline support: cache the app shell + data + figures on first visit. */
var CACHE = "fencing-penalties-v13";
var CORE = [
  "./",
  "index.html",
  "favicon.svg",
  "styles.css",
  "app.js",
  "search.js",
  "data/offenses.json",
  "data/articles.json",
  "data/figures.json",
  "data/legend.json",
  "data/updates.json",
  "figures/fig-1.png",
  "figures/fig-2.png",
  "figures/fig-3a.png",
  "figures/fig-3b.png",
  "figures/fig-3c.png",
  "figures/fig-4.png",
  "figures/fig-5.png",
  "figures/fig-6.png"
];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return (k.indexOf("stripside-") === 0 || k.indexOf("fencing-penalties-") === 0) && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var requestURL = new URL(e.request.url);
  if (e.request.method !== "GET" || requestURL.origin !== location.origin || requestURL.pathname.startsWith(new URL("scoring/", self.registration.scope).pathname)) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      var net = fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
