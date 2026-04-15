/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — SERVICE WORKER v5
   Offline-first PWA con estrategia stale-while-revalidate,
   precaching inteligente y gestión de caché por tipo
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 5;
const STATIC_CACHE = `bio-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `bio-dynamic-v${CACHE_VERSION}`;
const OFFLINE_URL = "/";

// Assets críticos que se precachean en install
const PRECACHE_ASSETS = [
  "/",
  "/manifest.json",
];

// Máximo de entradas en caché dinámica
const MAX_DYNAMIC_ENTRIES = 80;

// TTL por tipo de recurso (ms)
const TTL = {
  page: 60 * 60 * 1000,        // 1 hora
  asset: 7 * 24 * 60 * 60 * 1000, // 7 días
  api: 5 * 60 * 1000,           // 5 minutos
};

// ─── Install ─────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: limpiar cachés antiguos ───────────────────
self.addEventListener("activate", (event) => {
  const validCaches = [STATIC_CACHE, DYNAMIC_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !validCaches.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Helpers ─────────────────────────────────────────────
function isAsset(url) {
  return /\.(js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf)(\?.*)?$/.test(url);
}

function isNextData(url) {
  return url.includes("/_next/data/") || url.includes("/_next/static/");
}

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await Promise.all(keys.slice(0, keys.length - maxItems).map((k) => cache.delete(k)));
  }
}

// Stale-while-revalidate: sirve caché inmediato, actualiza en background
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
      trimCache(cacheName, MAX_DYNAMIC_ENTRIES);
    }
    return response;
  }).catch(() => null);

  return cached || await fetchPromise;
}

// Network-first con fallback a caché
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

// Cache-first con revalidación en background
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Revalidar en background (no bloquea)
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response));
      }
    }).catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// ─── Fetch Handler ───────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Skip non-GET y extensiones del navegador
  if (request.method !== "GET") return;
  if (request.url.startsWith("chrome-extension")) return;
  if (request.url.includes("/api/")) return; // No cachear APIs externas

  // Navegación: network-first con fallback offline
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Next.js build assets (_next/static): cache-first (inmutables)
  if (isNextData(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Assets estáticos: cache-first con revalidación
  if (isAsset(request.url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Todo lo demás: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ─── Background Sync (futuro) ────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") {
    self.skipWaiting();
  }
  if (event.data === "clearCache") {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
