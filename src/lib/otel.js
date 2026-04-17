/* ═══════════════════════════════════════════════════════════════
   OpenTelemetry helpers — tracing + metrics for business spans
   Degrades to no-op when OTel is not configured.
   ═══════════════════════════════════════════════════════════════ */

let tracer = null;
let meter = null;
let counters = {};
let histograms = {};

async function init() {
  if (tracer) return;
  try {
    const api = await import("@opentelemetry/api");
    tracer = api.trace.getTracer("bio-ignicion");
    meter = api.metrics.getMeter("bio-ignicion");
    counters.sessions = meter.createCounter("bio.sessions.completed", { description: "Neural sessions completed" });
    counters.apiCalls = meter.createCounter("bio.api.calls", { description: "Public API calls" });
    counters.authEvents = meter.createCounter("bio.auth.events", { description: "Sign-in/sign-out events" });
    histograms.coachLatency = meter.createHistogram("bio.coach.latency", { description: "LLM coach turn latency (ms)" });
    histograms.dbQuery = meter.createHistogram("bio.db.query", { description: "DB query latency (ms)" });
  } catch {
    tracer = { startActiveSpan: (_, fn) => fn({ setAttribute: () => {}, setStatus: () => {}, end: () => {} }) };
  }
}

export async function withSpan(name, attrs, fn) {
  await init();
  if (!tracer?.startActiveSpan) return fn();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      for (const [k, v] of Object.entries(attrs || {})) span.setAttribute(k, v);
      const out = await fn(span);
      span.setStatus?.({ code: 1 });
      return out;
    } catch (err) {
      span.setStatus?.({ code: 2, message: err?.message });
      span.recordException?.(err);
      throw err;
    } finally {
      span.end?.();
    }
  });
}

export async function metric(name, value = 1, attrs = {}) {
  await init();
  const c = counters[name];
  if (c) c.add(value, attrs);
}

export async function observe(name, value, attrs = {}) {
  await init();
  const h = histograms[name];
  if (h) h.record(value, attrs);
}
