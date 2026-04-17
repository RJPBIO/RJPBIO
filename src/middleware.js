import { NextResponse } from "next/server";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Edge Middleware
   CSP + nonce · rate-limit · auth guard · CORS · region routing
   ═══════════════════════════════════════════════════════════════ */

const RATE_LIMIT = { windowMs: 60_000, max: 120 };
const AUTH_RATE = { windowMs: 60_000, max: 10 };
const buckets = new Map();

function hit(key, cfg) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + cfg.windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + cfg.windowMs; }
  b.count += 1;
  buckets.set(key, b);
  return { ok: b.count <= cfg.max, remaining: Math.max(0, cfg.max - b.count), reset: b.reset };
}

function buildCSP(nonce) {
  const d = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://api.anthropic.com", "https://api.stripe.com", process.env.OTEL_EXPORTER_OTLP_ENDPOINT].filter(Boolean),
    "media-src": ["'self'", "blob:"],
    "worker-src": ["'self'", "blob:"],
    "manifest-src": ["'self'"],
    "frame-ancestors": ["'none'"],
    "frame-src": ["https://challenges.cloudflare.com", "https://js.stripe.com"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "report-uri": ["/api/csp-report"],
    "report-to": ["csp-endpoint"],
    "upgrade-insecure-requests": [],
  };
  return Object.entries(d).map(([k, v]) => (v.length ? `${k} ${v.join(" ")}` : k)).join("; ");
}

const CORS_ALLOW = (process.env.CORS_ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin) {
  if (!origin) return {};
  const allowed = CORS_ALLOW.includes("*") || CORS_ALLOW.includes(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, webhook-id, webhook-signature, webhook-timestamp",
    "Access-Control-Expose-Headers": "RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const PROTECTED = [/^\/admin(\/|$)/, /^\/org(\/|$)/, /^\/api\/v1\//, /^\/api\/scim\//, /^\/coach(\/|$)/, /^\/settings(\/|$)/];
const PUBLIC_API = [/^\/api\/health$/, /^\/api\/ready$/, /^\/api\/csp-report$/, /^\/api\/vitals$/, /^\/api\/openapi$/, /^\/api\/auth\//, /^\/api\/billing\/webhook$/];

export function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";

  // Stricter limit for auth
  const cfg = path.startsWith("/api/auth") || path === "/signin" ? AUTH_RATE : RATE_LIMIT;
  const r = hit(`${ip}:${cfg === AUTH_RATE ? "auth" : "gen"}`, cfg);
  if (!r.ok) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: {
        "Retry-After": String(Math.ceil((r.reset - Date.now()) / 1000)),
        "RateLimit-Limit": String(cfg.max),
        "RateLimit-Remaining": "0",
        "RateLimit-Reset": String(Math.ceil(r.reset / 1000)),
      },
    });
  }

  // CORS preflight
  if (request.method === "OPTIONS" && path.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  // Auth guard for protected routes (presence of session cookie is the lightweight signal;
  // real verification happens in route handlers via `auth()`).
  const isProtected = PROTECTED.some((rx) => rx.test(path));
  const isPublicApi = PUBLIC_API.some((rx) => rx.test(path));
  if (isProtected && !isPublicApi) {
    const hasSession = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token");
    const hasApiKey = request.headers.get("authorization")?.startsWith("Bearer ");
    if (!hasSession && !hasApiKey) {
      if (path.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
      return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(path)}`, request.url));
    }
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCSP(nonce);
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("x-csp", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self)");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("RateLimit-Limit", String(cfg.max));
  res.headers.set("RateLimit-Remaining", String(r.remaining));
  res.headers.set("RateLimit-Reset", String(Math.ceil(r.reset / 1000)));
  const origin = request.headers.get("origin");
  if (origin && path.startsWith("/api/")) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v);
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|icon.*|apple-touch-icon.*|screenshots/|robots.txt|sitemap.xml).*)",
  ],
};
