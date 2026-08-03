// Service worker enkel voor de PrevX-inspectie-app-shell (pre-insp.html,
// manifest, logo) -- vereist voor de "installeren als app"-prompt van
// Chrome/Android. Bewust NIET van toepassing op de rest van prevx.be (de
// marketingsite) of op Supabase-aanroepen: alles buiten APP_SHELL loopt
// gewoon rechtstreeks over het netwerk, ongecached.

var CACHE_NAME = 'prevx-inspectie-v1';
var APP_SHELL = ['/pre-insp', '/pre-insp.html', '/manifest.json', '/Logo-PrevX.png'];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || APP_SHELL.indexOf(url.pathname) === -1) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var netwerk = fetch(event.request)
        .then(function (resp) {
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resp.clone()); });
          return resp;
        })
        .catch(function () { return cached; });
      return cached || netwerk;
    })
  );
});
