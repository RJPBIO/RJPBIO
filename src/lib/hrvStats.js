/* ═══════════════════════════════════════════════════════════════
   hrvStats — pure logic for HRVHistoryPanel

   Sprint 75: extraído del componente para que sea testable.
   Antes vivía inline en JSX y la tendencia se reportaba con n=1
   en cada bucket (ruido). Ahora con threshold mínimo n=3 y vínculo
   HRV ↔ sesión.

   Sin React. Solo funciones puras + helpers de fecha.
   ═══════════════════════════════════════════════════════════════ */

const MS_PER_DAY = 86_400_000;
const MS_PER_HOUR = 3_600_000;
const MS_PER_MIN = 60_000;

// Promedio aritmético; null si vacío.
export function average(values) {
  const xs = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (xs.length === 0) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// Desviación estándar muestral; null si n<2.
export function stddev(values) {
  const xs = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (xs.length < 2) return null;
  const m = xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

// Bucketing temporal seguro: dado un ts, devuelve "YYYY-MM-DD" en zona local.
export function dayKey(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Etiqueta humana para un dayKey relativa a `now`.
//   Hoy / Ayer / "Lun 27 abr" / "27 abr 2026" si distinto año
export function dayLabel(dayKeyStr, now = Date.now()) {
  const [y, m, d] = dayKeyStr.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const todayKey = dayKey(now);
  if (dayKeyStr === todayKey) return "Hoy";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKeyStr === dayKey(yesterday.getTime())) return "Ayer";
  const targetDate = new Date(target);
  const nowYear = new Date(now).getFullYear();
  if (targetDate.getFullYear() === nowYear) {
    return targetDate.toLocaleDateString("es-MX", {
      weekday: "short", day: "2-digit", month: "short",
    });
  }
  return targetDate.toLocaleDateString("es-MX", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

// Tiempo relativo legible ("ahora", "hace 5 min", "hace 2 h", etc.)
export function relativeTime(ts, now = Date.now()) {
  const ms = now - ts;
  if (ms < MS_PER_MIN) return "ahora";
  if (ms < MS_PER_HOUR) return `hace ${Math.round(ms / MS_PER_MIN)} min`;
  if (ms < MS_PER_DAY) return `hace ${Math.round(ms / MS_PER_HOUR)} h`;
  if (ms < 7 * MS_PER_DAY) return `hace ${Math.round(ms / MS_PER_DAY)} d`;
  return new Date(ts).toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

// Agrupa entries por día calendario local. Devuelve [{ key, label, entries }]
// ordenado descendente (día más reciente primero, entries dentro también desc).
export function groupByDay(entries, now = Date.now()) {
  const map = new Map();
  for (const e of Array.isArray(entries) ? entries : []) {
    if (!e || typeof e.ts !== "number") continue;
    const k = dayKey(e.ts);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(e);
  }
  const groups = [];
  for (const [k, list] of map) {
    list.sort((a, b) => b.ts - a.ts);
    groups.push({ key: k, label: dayLabel(k, now), entries: list });
  }
  groups.sort((a, b) => b.key.localeCompare(a.key));
  return groups;
}

// Vincula una HRV entry con una sesión cercana en `history`.
//   Ventana: [session.ts - 60s, session.ts + (session.dur || 120) * 1000 + 300s]
//   Si HRV ts dentro: "post-{protocol}"
//   Ventana pre: [session.ts - 300s, session.ts] → "pre-{protocol}"
//   Si más cercano post que pre, gana post (más común tras protocolo).
//   Devuelve { phase: "pre"|"post"|null, protocol, sessionTs, deltaSec }
export function findSessionContext(hrvEntry, history, opts = {}) {
  if (!hrvEntry || typeof hrvEntry.ts !== "number") {
    return { phase: null, protocol: null, sessionTs: null, deltaSec: null };
  }
  const preWindowSec = opts.preWindowSec ?? 300;
  const postBufferSec = opts.postBufferSec ?? 300;
  const preBufferSec = opts.preBufferSec ?? 60;
  const sessions = Array.isArray(history) ? history : [];
  let bestMatch = null;
  let bestPhase = null;
  let bestDistance = Infinity;
  for (const s of sessions) {
    if (!s || typeof s.ts !== "number") continue;
    const dur = typeof s.dur === "number" ? s.dur : 120;
    const sessionStart = s.ts;
    const sessionEnd = s.ts + dur * 1000;
    // Post: HRV en [sessionStart - preBufferSec, sessionEnd + postBufferSec]
    if (
      hrvEntry.ts >= sessionStart - preBufferSec * 1000 &&
      hrvEntry.ts <= sessionEnd + postBufferSec * 1000
    ) {
      const dist = Math.min(
        Math.abs(hrvEntry.ts - sessionStart),
        Math.abs(hrvEntry.ts - sessionEnd),
      );
      // post si HRV es DESPUÉS del inicio, pre si es ANTES
      const phase = hrvEntry.ts >= sessionStart ? "post" : "pre";
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = s;
        bestPhase = phase;
      }
      continue;
    }
    // Pre puro: HRV en [sessionStart - preWindowSec, sessionStart - preBufferSec]
    if (
      hrvEntry.ts >= sessionStart - preWindowSec * 1000 &&
      hrvEntry.ts < sessionStart - preBufferSec * 1000
    ) {
      const dist = sessionStart - hrvEntry.ts;
      if (dist < bestDistance) {
        bestDistance = dist;
        bestMatch = s;
        bestPhase = "pre";
      }
    }
  }
  if (!bestMatch) {
    return { phase: null, protocol: null, sessionTs: null, deltaSec: null };
  }
  return {
    phase: bestPhase,
    protocol: bestMatch.p || null,
    sessionTs: bestMatch.ts,
    deltaSec: Math.round((hrvEntry.ts - bestMatch.ts) / 1000),
  };
}

// Calcula baseline personal: mean ± SD de los últimos `days` días.
// Devuelve null si no hay datos suficientes (n < 5).
export function buildBaseline(entries, opts = {}) {
  const days = opts.days ?? 30;
  const minN = opts.minN ?? 5;
  const now = opts.now ?? Date.now();
  const log = Array.isArray(entries) ? entries : [];
  const cutoff = now - days * MS_PER_DAY;
  const recent = log.filter((e) => e && typeof e.ts === "number" && e.ts >= cutoff);
  const rmssds = recent.map((e) => e.rmssd).filter((v) => typeof v === "number");
  if (rmssds.length < minN) return null;
  const mean = average(rmssds);
  const sd = stddev(rmssds);
  return {
    mean,
    sd,
    n: rmssds.length,
    days,
  };
}

// Cálculo central: stats globales para HRVHistoryPanel.
// minN = 3 — el bucket de 7d debe tener ≥3 mediciones para reportar tendencia.
// Antes (Sprint 74) reportaba tendencia con n=1 en cada bucket → ruido.
export function computeHrvStats(hrvLog, opts = {}) {
  const minN = opts.minN ?? 3;
  const trendDeltaThreshold = opts.trendDeltaThreshold ?? 1.5;
  const now = opts.now ?? Date.now();
  const log = (Array.isArray(hrvLog) ? hrvLog : []).filter(
    (e) => e && typeof e.ts === "number"
  );
  const sorted = [...log].sort((a, b) => a.ts - b.ts);

  const last7d = sorted.filter((e) => now - e.ts < 7 * MS_PER_DAY);
  const prev7d = sorted.filter((e) => {
    const age = now - e.ts;
    return age >= 7 * MS_PER_DAY && age < 14 * MS_PER_DAY;
  });

  const avg7 = average(last7d.map((e) => e.rmssd));
  const avgPrev7 = average(prev7d.map((e) => e.rmssd));

  // Tendencia con threshold de N. Sin esto, n=1 vs n=1 reportaba ruido.
  let trendDelta = null;
  let trendDir = null;
  let trendReason = null;
  if (last7d.length < minN) {
    trendReason = "insufficient_recent";
  } else if (prev7d.length < minN) {
    trendReason = "insufficient_baseline";
  } else if (avg7 != null && avgPrev7 != null) {
    trendDelta = avg7 - avgPrev7;
    if (Math.abs(trendDelta) < trendDeltaThreshold) trendDir = "estable";
    else if (trendDelta > 0) trendDir = "mejora";
    else trendDir = "baja";
  }

  return {
    total: log.length,
    last: sorted[sorted.length - 1] || null,
    avg7,
    avg7Count: last7d.length,
    avgPrev7,
    avgPrev7Count: prev7d.length,
    trendDelta,
    trendDir,
    trendReason,
    sortedAsc: sorted,
  };
}

// Genera CSV con header + filas. Compatible con Excel/Sheets español.
export function toCSV(entries) {
  const header = ["fecha", "hora", "rmssd_ms", "rhr_bpm", "sdnn_ms", "pnn50_pct", "calidad", "fuente", "duracion_seg"];
  const rows = (Array.isArray(entries) ? entries : []).map((e) => {
    const d = new Date(e.ts);
    const fecha = d.toISOString().split("T")[0];
    const hora = d.toTimeString().slice(0, 5);
    const rhr = e.rhr ?? (typeof e.meanHR === "number" ? Math.round(e.meanHR) : "");
    return [
      fecha, hora,
      e.rmssd ?? "",
      rhr,
      e.sdnn ?? "",
      e.pnn50 ?? "",
      e.sqiBand || "",
      e.source || "",
      e.durationSec ?? "",
    ].map(csvCell).join(",");
  });
  return [header.join(","), ...rows].join("\n");
}

function csvCell(v) {
  if (v == null || v === "") return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Z-score de una medición vs baseline. null si no hay baseline o sd<=0.
export function zScore(value, baseline) {
  if (!baseline || typeof baseline.mean !== "number" || !baseline.sd || baseline.sd <= 0) return null;
  if (typeof value !== "number") return null;
  return (value - baseline.mean) / baseline.sd;
}
