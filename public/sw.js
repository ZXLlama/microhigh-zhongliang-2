const CACHE_NAME = "microhigh-zhongliang-2-v2";
const STATIC_ASSETS = ["/icon.svg", "/manifest.webmanifest"];

function isAppCache(key) {
  return key.startsWith("microhigh-zhongliang-2-");
}

function isStaticAsset(requestUrl) {
  const url = new URL(requestUrl);

  if (url.origin !== self.location.origin) {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname === "/icon.svg" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => undefined),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter((key) => isAppCache(key) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );

      await self.clients.claim();
    }),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request);

          if (response && response.status === 200) {
            await cache.put("/", response.clone());
          }

          return response;
        } catch {
          const cached = await cache.match("/");
          return cached ?? Response.error();
        }
      }),
    );
    return;
  }

  if (!isStaticAsset(event.request.url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      const networkRequest = fetch(event.request)
        .then(async (response) => {
          if (response && response.status === 200) {
            await cache.put(event.request, response.clone());
          }

          return response;
        })
        .catch(() => undefined);

      if (cached) {
        void networkRequest;
        return cached;
      }

      const response = await networkRequest;
      return response ?? Response.error();
    }),
  );
});
