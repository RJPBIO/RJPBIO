import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Edge Middleware
   CSP con nonce por request · rate-limit memoria · deep-link guard
   ═══════════════════════════════════════════════════════════════ */

const RATE_LIMIT = { windowMs: 60_000, max: 120 };
const buckets = new Map();

function hit(ip) {
  const now = Date.now();
  const b = buckets.get(ip) || { count: 0, reset: now + RATE_LIMIT.windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + RATE_LIMIT.windowMs; }
  b.count += 1;
  buckets.set(ip, b);
  return b.count <= RATE_LIMIT.max;
}

function buildCSP(nonce) {
  const directives = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'"],
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(directives)
    .map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k))
    .join("; ");
}

export function middleware(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  if (!hit(ip)) {
    return new NextResponse("Rate limit exceeded", { status: 429, headers: { "Retry-After": "60" } });
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCSP(nonce);

  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("x-csp", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  return res;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|icon.*|apple-touch-icon.*|screenshots/).*)",
  ],
};
