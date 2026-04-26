import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { issueToken, verifyToken, CSRF } from "@/server/csrf";
import { effectivePolicy, ipPassesAllChecks, parseIpv4 } from "@/lib/org-security";

/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Edge Middleware
   CSP + nonce · rate-limit · auth guard · CORS · region routing
   ═══════════════════════════════════════════════════════════════ */

const RATE_LIMIT = { windowMs: 60_000, max: 120 };
const AUTH_RATE = { windowMs: 60_000, max: 10 };
const buckets = new Map();

function hitLocal(key, cfg) {
  const now = Date.now();
  const b = buckets.get(key) || { count: 0, reset: now + cfg.windowMs };
  if (now > b.reset) { b.count = 0; b.reset = now + cfg.windowMs; }
  b.count += 1;
  buckets.set(key, b);
  return { ok: b.count <= cfg.max, remaining: Math.max(0, cfg.max - b.count), reset: b.reset };
}

let _redisPromise;
async function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!_redisPromise) {
    _redisPromise = (async () => {
      try {
        const { Redis } = await import("@upstash/redis");
        return new Redis({ url: process.env.REDIS_URL, token: process.env.REDIS_TOKEN });
      } catch { return null; }
    })();
  }
  return _redisPromise;
}

async function hit(key, cfg) {
  const redis = await getRedis();
  if (!redis) return hitLocal(key, cfg);
  try {
    const nowSec = Math.floor(Date.now() / 1000);
    const slot = Math.floor(nowSec / (cfg.windowMs / 1000));
    const bucket = `mw:${key}:${slot}`;
    const count = await redis.incr(bucket);
    if (count === 1) await redis.expire(bucket, cfg.windowMs / 1000);
    const reset = (slot + 1) * cfg.windowMs;
    return { ok: count <= cfg.max, remaining: Math.max(0, cfg.max - count), reset };
  } catch {
    return hitLocal(key, cfg);
  }
}

function buildCSP(nonce) {
  const d = {
    "default-src": ["'self'"],
    "script-src": ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    "script-src-attr": ["'none'"],
    // `style-src-attr 'unsafe-hashes'` permite `style="..."` inline que
    // Framer Motion inyecta; mantenemos style-src sin unsafe-inline para
    // que no se puedan cargar <style> arbitrarios de atacantes.
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-hashes'", "'unsafe-inline'"],
    "img-src": ["'self'", "data:", "blob:", "https:"],
    "font-src": ["'self'", "data:"],
    "connect-src": ["'self'", "https://api.anthropic.com", "https://api.stripe.com", process.env.OTEL_EXPORTER_OTLP_ENDPOINT, process.env.NEXT_PUBLIC_LOG_ENDPOINT].filter(Boolean),
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

const CORS_ALLOW = (process.env.CORS_ALLOWED_ORIGINS || "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// Con credenciales NO se puede usar wildcard: cada origin debe ser explícito.
// Si la env contiene "*", lo tratamos como "nadie" para evitar downgrade.
const HAS_WILDCARD = CORS_ALLOW.includes("*");

function corsHeaders(origin) {
  if (!origin || HAS_WILDCARD) return {};
  if (!CORS_ALLOW.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type, Idempotency-Key, X-CSRF-Token, webhook-id, webhook-signature, webhook-timestamp",
    "Access-Control-Expose-Headers": "RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const PROTECTED = [/^\/admin(\/|$)/, /^\/org(\/|$)/, /^\/api\/v1\//, /^\/api\/scim\//, /^\/coach(\/|$)/, /^\/settings(\/|$)/];
const PUBLIC_API = [/^\/api\/health$/, /^\/api\/ready$/, /^\/api\/csp-report$/, /^\/api\/vitals$/, /^\/api\/openapi$/, /^\/api\/auth\//, /^\/api\/billing\/webhook$/, /^\/api\/v1\/leads$/, /^\/q$/];
// Rutas /api/v1/* que aceptan Bearer API key (validación real en el handler).
// Fuera de esta lista, el middleware rechaza con 401 si solo hay Bearer sin cookie.
const BEARER_ALLOWED = [/^\/api\/v1\/sessions(\/|$)/, /^\/api\/v1\/analytics(\/|$)/, /^\/api\/v1\/members(\/|$)/, /^\/api\/scim\//];

export async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";

  const cfg = path.startsWith("/api/auth") || path === "/signin" ? AUTH_RATE : RATE_LIMIT;
  const r = await hit(`${ip}:${cfg === AUTH_RATE ? "auth" : "gen"}`, cfg);
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

  if (request.method === "OPTIONS" && path.startsWith("/api/")) {
    const origin = request.headers.get("origin") || "";
    return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
  }

  const isProtected = PROTECTED.some((rx) => rx.test(path));
  const isPublicApi = PUBLIC_API.some((rx) => rx.test(path));
  if (isProtected && !isPublicApi) {
    const hasSession = request.cookies.get("authjs.session-token") || request.cookies.get("__Secure-authjs.session-token");
    const hasBearer = request.headers.get("authorization")?.startsWith("Bearer ");
    const bearerAllowed = hasBearer && BEARER_ALLOWED.some((rx) => rx.test(path));
    if (!hasSession && !bearerAllowed) {
      if (path.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
      return NextResponse.redirect(new URL(`/signin?next=${encodeURIComponent(path)}`, request.url));
    }

    // Enforce IP allowlist — si el JWT trae securityPolicies con allowlists
    // activas, la IP del request debe pasar TODAS (most-restrictive-wins).
    // Bearer/API keys: skip — los handlers validan API keys con su propio
    // contexto y no traen JWT con policies. Si quieres allowlist sobre
    // API keys, se hace en el handler con auth() del actor.
    // IPv6: pass-through — la allowlist es IPv4-only por ahora; bloquear
    // a clientes v6 sería sorprendente (muchas redes corp ahora son v6-default).
    if (hasSession && process.env.AUTH_SECRET && parseIpv4(ip) !== null) {
      try {
        const token = await getToken({
          req: request,
          secret: process.env.AUTH_SECRET,
          // NextAuth v5 usa "authjs.session-token" / "__Secure-authjs.session-token";
          // getToken auto-detecta secure prefix.
        });
        const policies = Array.isArray(token?.securityPolicies) ? token.securityPolicies : [];
        if (policies.length) {
          const eff = effectivePolicy(policies);
          if (eff.ipChecks.length && !ipPassesAllChecks(ip, eff.ipChecks)) {
            if (path.startsWith("/api/")) {
              return Response.json({ error: "ip_not_allowed", ip }, { status: 403 });
            }
            return new NextResponse(
              "Tu dirección IP no está autorizada para acceder a este organización.\n" +
              "Contacta al OWNER para añadir tu IP al allowlist.",
              { status: 403, headers: { "content-type": "text/plain; charset=utf-8" } }
            );
          }
        }
      } catch {
        // Token decode falla → tratamos como sin policies (fail-open en
        // este path; la auth real se valida en el handler vía auth()).
      }
    }
  }

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = buildCSP(nonce);
  const reqHeaders = new Headers(request.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("x-csp", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });

  // Emisión de token CSRF (double-submit): cookie legible por JS + header echo.
  if (request.method === "GET" && !path.startsWith("/api/")) {
    const existing = request.cookies.get(CSRF.COOKIE)?.value;
    if (!existing || !verifyToken(existing)) {
      const tok = issueToken();
      res.cookies.set(CSRF.COOKIE, tok, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 8 * 3600,
      });
    }
  }

  res.headers.set("Content-Security-Policy", csp);
  res.headers.set("x-nonce", nonce);
  res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-XSS-Protection", "0");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(self), interest-cohort=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "credentialless");
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
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|offline.html|icon.*|apple-touch-icon.*|screenshots/|robots.txt|sitemap.xml|humans.txt|\\.well-known/).*)",
  ],
};
