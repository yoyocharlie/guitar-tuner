const VERSION = "guitar-tuner-v1";
const APP_ROOT = self.registration.scope;
const APP_SHELL = new URL("./index.html", APP_ROOT).toString();
const CORE_ASSETS = [
  APP_ROOT,
  APP_SHELL,
  new URL("./manifest.webmanifest", APP_ROOT).toString(),
  new URL("./favicon.svg", APP_ROOT).toString(),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(APP_SHELL)));
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          void caches.open(VERSION).then((cache) => cache.put(request, cloned));
        }

        return response;
      });
    }),
  );
});
