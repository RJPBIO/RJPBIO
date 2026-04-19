/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — SERVICE WORKER v6
   Offline-first · Push · Background Sync · Periodic Sync
   ═══════════════════════════════════════════════════════════════ */

const CACHE_VERSION = 12;
const STATIC_CACHE = `bio-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `bio-dynamic-v${CACHE_VERSION}`;
const OFFLINE_URL = "/offline.html";
const MAX_DYNAMIC = 100;

const PRECACHE = [
  "/",
  "/offline.html",
  "/icon.svg",
  "/icon-maskable.svg",
  "/apple-touch-icon.svg",
];

// ─── Install ─────────────────────────────────────────────
// NOTE: no auto-skipWaiting aquí. Dejamos el nuevo SW en estado `waiting`
// para que la UI pueda mostrar un toast "nueva versión — recargar" y el
// usuario decida cuándo tomar control. El mensaje SKIP_WAITING lo activa.
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

// ─── Activate ────────────────────────────────────────────
self.addEventListener("activate", (e) => {
  const valid = [STATIC_CACHE, DYNAMIC_CACHE];
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !valid.includes(k)).map((k) => caches.delete(k)));
    if ("navigationPreload" in self.registration) {
      try { await self.registration.navigationPreload.enable(); } catch {}
    }
    await self.clients.claim();
  })());
});

// ─── Helpers ─────────────────────────────────────────────
const isAsset = (u) => /\.(js|css|png|jpg|jpeg|webp|avif|svg|ico|woff2?|ttf)(\?.*)?$/.test(u);
const isNextStatic = (u) => u.includes("/_next/static/");
const isSameOrigin = (u) => { try { return new URL(u).origin === self.location.origin; } catch { return false; } };

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

async function networkFirst(req, preload) {
  try {
    const fresh = (await preload) || await fetch(req);
    if (fresh && fresh.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(req, fresh.clone());
      trim(DYNAMIC_CACHE, MAX_DYNAMIC);
    }
    return fresh;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    return caches.match(OFFLINE_URL);
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) {
    fetch(req).then((r) => { if (r.ok) caches.open(cacheName).then((c) => c.put(req, r)); }).catch(() => {});
    return cached;
  }
  try {
    const r = await fetch(req);
    if (r.ok) {
      const c = await caches.open(cacheName);
      c.put(req, r.clone());
    }
    return r;
  } catch {
    return caches.match(OFFLINE_URL);
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(req);
  const fetchP = fetch(req).then((r) => {
    if (r && r.ok) { cache.put(req, r.clone()); trim(DYNAMIC_CACHE, MAX_DYNAMIC); }
    return r;
  }).catch(() => null);
  return cached || (await fetchP) || caches.match(OFFLINE_URL);
}

// ─── Fetch ───────────────────────────────────────────────
// Nunca cacheamos /api/* — las respuestas son específicas por usuario/sesión
// (auth, v1, coach, csrf) y servir de cache cruzaría identidades entre
// usuarios en el mismo navegador. Solo assets y navegación (pública) van a cache.
const isApi = (u) => { try { return new URL(u).pathname.startsWith("/api/"); } catch { return false; } };

// Paths que retornan HTML específico por usuario: NO cachear navegación ni sub-recursos.
const PRIVATE_PATHS = [/^\/admin(\/|$)/, /^\/org(\/|$)/, /^\/settings(\/|$)/, /^\/coach(\/|$)/, /^\/team(\/|$)/, /^\/mfa(\/|$)/];
function isPrivatePath(url) {
  try {
    const p = new URL(url).pathname;
    return PRIVATE_PATHS.some((rx) => rx.test(p));
  } catch { return false; }
}

async function networkOnly(req) {
  try { return await fetch(req); }
  catch { return caches.match(OFFLINE_URL); }
}

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (!isSameOrigin(request.url)) return;
  if (isApi(request.url)) return; // network-only para /api/*

  // Rutas privadas: network-only. Nunca tocar cache (ni servir desde, ni escribir a).
  if (isPrivatePath(request.url)) {
    e.respondWith(networkOnly(request));
    return;
  }

  if (request.mode === "navigate") {
    e.respondWith(networkFirst(request, e.preloadResponse));
    return;
  }
  if (isNextStatic(request.url) || isAsset(request.url)) {
    e.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  e.respondWith(staleWhileRevalidate(request));
});

// ─── Push Notifications ─────────────────────────────────
self.addEventListener("push", (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch { data = { body: e.data && e.data.text() }; }
  const title = data.title || "BIO-IGNICIÓN";
  const opts = {
    body: data.body || "Tu sistema está listo para una sesión.",
    icon: "/icon.svg",
    badge: "/icon-monochrome.svg",
    vibrate: [80, 40, 80],
    tag: data.tag || "bio-reminder",
    renotify: true,
    data: { url: data.url || "/?source=push" },
    actions: [
      { action: "start", title: "Iniciar 2 min" },
      { action: "later", title: "Recordar luego" },
    ],
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.action === "start" ? "/?t=entrada&source=push" : e.notification.data?.url) || "/";
  e.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of clients) {
      if (c.url.includes(self.location.origin)) { c.focus(); c.navigate(url); return; }
    }
    await self.clients.openWindow(url);
    try { if ("clearAppBadge" in self.navigator) self.navigator.clearAppBadge(); } catch {}
  })());
});

self.addEventListener("pushsubscriptionchange", (e) => {
  e.waitUntil((async () => {
    try {
      const sub = await self.registration.pushManager.subscribe({ userVisibleOnly: true });
      await fetch("/api/push/resubscribe", { method: "POST", body: JSON.stringify(sub), headers: { "Content-Type": "application/json" } });
    } catch {}
  })());
});

// ─── Background Sync (flush outbox) ─────────────────────
self.addEventListener("sync", (e) => {
  if (e.tag === "bio-sync-outbox") {
    e.waitUntil(flushOutbox());
  }
});

self.addEventListener("periodicsync", (e) => {
  if (e.tag === "bio-daily-reminder") {
    e.waitUntil(self.registration.showNotification("BIO-IGNICIÓN", {
      body: "120 segundos pueden cambiar las próximas 4 horas.",
      icon: "/icon.svg", badge: "/icon-monochrome.svg", tag: "daily",
    }));
  }
  if (e.tag === "bio-sync-outbox") {
    e.waitUntil(flushOutbox());
  }
});

async function flushOutbox() {
  try {
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    clients.forEach((c) => c.postMessage({ type: "SYNC_FLUSH" }));
  } catch {}
}

// ─── Message Channel ────────────────────────────────────
self.addEventListener("message", (e) => {
  const data = e.data || {};
  if (data === "skipWaiting" || data.type === "SKIP_WAITING") self.skipWaiting();
  if (data === "clearCache" || data.type === "CLEAR_CACHE") {
    caches.keys().then((k) => Promise.all(k.map((n) => caches.delete(n))));
  }
});
