// Service worker enkel voor de app-shell van de PrevX app (app.html, manifest,
// logo) -- vereist voor de "installeren als app"-prompt van Chrome/Android.
// Bewust NIET van toepassing op de rest van prevx.be (de marketingsite) of op
// Supabase-aanroepen: alles buiten APP_SHELL loopt gewoon rechtstreeks over het
// netwerk, ongecached.
//
// De oude paden /pre-insp blijven in de lijst staan: reeds geïnstalleerde apps
// starten daar nog en worden door een doorverwijzing naar /app gestuurd. Ze
// mogen pas weg wanneer niemand nog een oude installatie heeft.

var CACHE_NAME = 'prevx-app-v3';
var APP_SHELL = ['/app', '/app.html', '/pre-insp', '/pre-insp.html', '/manifest.json', '/Logo-PrevX.png'];

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
  // Netwerk-eerst, cache enkel als offline-terugval -- anders blijft een
  // geïnstalleerde PWA na elke update van app.html de oude versie tonen
  // tot een tweede herlaad (precies de bug die dit moest oplossen).
  event.respondWith(
    fetch(event.request)
      .then(function (resp) {
        caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resp.clone()); });
        return resp;
      })
      .catch(function () { return caches.match(event.request); })
  );
});
