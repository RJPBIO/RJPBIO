/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Logger
   Estructurado, respetuoso de privacidad (sin PII)
   Transporte a endpoint opcional con sampling
   ═══════════════════════════════════════════════════════════════ */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
const MIN = process.env.NEXT_PUBLIC_LOG_LEVEL
  ? LEVELS[process.env.NEXT_PUBLIC_LOG_LEVEL] || 20
  : process.env.NODE_ENV === "production" ? 30 : 10;
const ENDPOINT = process.env.NEXT_PUBLIC_LOG_ENDPOINT;
const SAMPLE = Number(process.env.NEXT_PUBLIC_LOG_SAMPLE || 1);

function sanitize(obj) {
  if (!obj) return obj;
  if (obj instanceof Error) return { name: obj.name, message: obj.message, stack: obj.stack };
  if (typeof obj !== "object") return obj;
  try { return JSON.parse(JSON.stringify(obj)); } catch { return String(obj); }
}

function emit(level, event, data) {
  if (LEVELS[level] < MIN) return;
  const entry = {
    level, event, ts: new Date().toISOString(),
    data: sanitize(data),
  };
  if (typeof console !== "undefined" && console[level]) {
    console[level](`[bio:${event}]`, entry.data ?? "");
  }
  if (ENDPOINT && typeof fetch !== "undefined" && Math.random() < SAMPLE) {
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(entry),
        keepalive: true,
      }).catch(() => {});
    } catch {}
  }
}

export const logger = {
  debug: (e, d) => emit("debug", e, d),
  info: (e, d) => emit("info", e, d),
  warn: (e, d) => emit("warn", e, d),
  error: (e, d) => emit("error", e, d),
};
