/* ═══════════════════════════════════════════════════════════════
   Rate limit response headers — RFC draft-ietf-httpapi-ratelimit-headers
   (Standard "RateLimit Header Fields for HTTP", a.k.a. RFC 9239 work).
   ═══════════════════════════════════════════════════════════════
   Tres header fields que clientes inteligentes (curl, axios, Stripe SDK)
   leen automáticamente para hacer back-off correcto:

     RateLimit-Policy: <limit>;w=<window-seconds>;burst=<capacity>
     RateLimit:        limit=<limit>, remaining=<n>, reset=<seconds>
     Retry-After:      <seconds>   (solo en 429)

   Plus Retry-After legacy del HTTP/1.1 RFC 7231.

   Uso:
     setRateLimitHeaders(headersObject, {
       policy: { limit: 60, window: 60, burst: 60 },
       remaining: 23,
       reset: 17,
       retryAfter: 17,        // sólo si bloqueado
     });
   ═══════════════════════════════════════════════════════════════ */

/**
 * Construye un mapa de headers (puro). Caller hace `for ... res.setHeader`
 * o `new Headers({...})`. Si pasan undefined skip silencioso.
 *
 * @param {object} info
 * @param {{limit, window, burst?}} [info.policy]
 * @param {number} [info.remaining]
 * @param {number} [info.reset]      segundos hasta refill suficiente
 * @param {number} [info.retryAfter] segundos hasta retry (sólo en 429)
 */
export function buildRateLimitHeaders({ policy, remaining, reset, retryAfter } = {}) {
  const headers = {};
  if (policy && Number.isFinite(policy.limit) && Number.isFinite(policy.window)) {
    const burst = Number.isFinite(policy.burst) ? `;burst=${policy.burst}` : "";
    headers["RateLimit-Policy"] = `${policy.limit};w=${policy.window}${burst}`;
  }
  if (Number.isFinite(remaining) && Number.isFinite(reset) && policy?.limit) {
    headers["RateLimit"] = `limit=${policy.limit}, remaining=${Math.max(0, Math.floor(remaining))}, reset=${Math.max(0, Math.ceil(reset))}`;
  }
  if (Number.isFinite(retryAfter)) {
    headers["Retry-After"] = String(Math.max(0, Math.ceil(retryAfter)));
  }
  return headers;
}

/**
 * Aplica los headers a una Response existente. Devuelve la misma response.
 * Si `res` es un objeto Headers o NextResponse, se usa setHeader.
 */
export function applyRateLimitHeaders(target, info) {
  const headers = buildRateLimitHeaders(info);
  if (!target) return null;
  for (const [k, v] of Object.entries(headers)) {
    if (typeof target.set === "function") {
      target.set(k, v); // Headers / NextResponse.headers
    } else if (typeof target.setHeader === "function") {
      target.setHeader(k, v); // Node res
    }
  }
  return target;
}

/**
 * Para Response.json() o new Response constructors, construye un objeto
 * `{ headers: { ... } }` que puede pasarse al constructor directamente.
 */
export function rateLimitHeadersInit(info) {
  return { headers: buildRateLimitHeaders(info) };
}
