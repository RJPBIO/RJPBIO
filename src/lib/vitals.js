/* Web Vitals RUM — ships CLS, LCP, INP, FCP, TTFB to /api/vitals. */
export function initVitals() {
  if (typeof window === "undefined") return;
  const post = (m) => {
    const body = JSON.stringify({ name: m.name, value: m.value, rating: m.rating, id: m.id, navigationType: m.navigationType });
    if (navigator.sendBeacon) navigator.sendBeacon("/api/vitals", body);
    else fetch("/api/vitals", { method: "POST", body, keepalive: true }).catch(() => {});
  };
  const observe = (type, handler) => {
    try { new PerformanceObserver((list) => list.getEntries().forEach(handler)).observe({ type, buffered: true }); } catch {}
  };
  observe("largest-contentful-paint", (e) => post({ name: "LCP", value: e.startTime, rating: e.startTime < 2500 ? "good" : e.startTime < 4000 ? "ni" : "poor", id: "lcp" }));
  observe("first-contentful-paint", (e) => post({ name: "FCP", value: e.startTime, rating: e.startTime < 1800 ? "good" : "ni", id: "fcp" }));
  observe("layout-shift", (e) => { if (!e.hadRecentInput) post({ name: "CLS", value: e.value, rating: e.value < 0.1 ? "good" : "poor", id: "cls" }); });
  observe("event", (e) => { if (e.interactionId) post({ name: "INP", value: e.duration, rating: e.duration < 200 ? "good" : "poor", id: "inp" }); });
}
