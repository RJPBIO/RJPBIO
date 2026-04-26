/* ═══════════════════════════════════════════════════════════════
   Incident management — pure helpers para /status + admin CRUD.
   ═══════════════════════════════════════════════════════════════
   Schema status.io / Atlassian-style:

     status:    investigating → identified → monitoring → resolved
     severity:  minor | major | critical
     components: ["api", "auth", "webhooks", "neural-engine", ...]

   Pure module — testable sin DB. Server orquesta persistencia +
   notificaciones (subscribers via RSS feed.xml por ahora; webhook
   broadcast a customer endpoints en future sprint).
   ═══════════════════════════════════════════════════════════════ */

export const INCIDENT_STATUSES = ["investigating", "identified", "monitoring", "resolved"];
export const INCIDENT_SEVERITIES = ["minor", "major", "critical"];
export const INCIDENT_COMPONENTS = [
  "api", "auth", "webhooks", "neural-engine", "billing", "scim", "email", "dashboard",
];

export const TITLE_MAX = 120;
export const BODY_MAX = 2_000;

const STATUS_TRANSITIONS = {
  investigating: ["identified", "monitoring", "resolved"],
  identified:    ["monitoring", "resolved"],
  monitoring:    ["resolved"],
  resolved:      [],
};

export function isValidStatus(s) {
  return typeof s === "string" && INCIDENT_STATUSES.includes(s);
}
export function isValidSeverity(s) {
  return typeof s === "string" && INCIDENT_SEVERITIES.includes(s);
}
export function isValidComponent(c) {
  return typeof c === "string" && INCIDENT_COMPONENTS.includes(c);
}

/**
 * ¿Es legal pasar de status `from` a `to`?
 * Resolved es terminal — no se puede re-abrir.
 */
export function canTransitionStatus(from, to) {
  if (!isValidStatus(from) || !isValidStatus(to)) return false;
  return (STATUS_TRANSITIONS[from] || []).includes(to);
}

/**
 * Valida input de creación de incident.
 */
export function validateIncident(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};
  if (typeof input.title !== "string" || !input.title.trim()) {
    errors.push({ field: "title", error: "required" });
  } else if (input.title.length > TITLE_MAX) {
    errors.push({ field: "title", error: "too_long" });
  } else {
    out.title = input.title.trim();
  }
  if (input.body !== undefined && input.body !== null && input.body !== "") {
    if (typeof input.body !== "string") errors.push({ field: "body", error: "not_string" });
    else if (input.body.length > BODY_MAX) errors.push({ field: "body", error: "too_long" });
    else out.body = input.body.trim();
  }
  if (!isValidSeverity(input.severity)) {
    errors.push({ field: "severity", error: "invalid_severity" });
  } else {
    out.severity = input.severity;
  }
  if (input.status !== undefined) {
    if (!isValidStatus(input.status)) errors.push({ field: "status", error: "invalid_status" });
    else out.status = input.status;
  }
  if (input.components !== undefined) {
    if (!Array.isArray(input.components)) {
      errors.push({ field: "components", error: "not_array" });
    } else {
      const cleaned = input.components.filter(isValidComponent);
      out.components = Array.from(new Set(cleaned));
    }
  } else {
    out.components = [];
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * Valida un update (post-creación, agrega un step de progreso).
 */
export function validateIncidentUpdate(input) {
  if (!input || typeof input !== "object") {
    return { ok: false, errors: [{ field: "_root", error: "not_object" }] };
  }
  const errors = [];
  const out = {};
  if (!isValidStatus(input.status)) {
    errors.push({ field: "status", error: "invalid_status" });
  } else {
    out.status = input.status;
  }
  if (typeof input.body !== "string" || !input.body.trim()) {
    errors.push({ field: "body", error: "required" });
  } else if (input.body.length > BODY_MAX) {
    errors.push({ field: "body", error: "too_long" });
  } else {
    out.body = input.body.trim();
  }
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: out };
}

/**
 * Severity ordering — más alto = peor. Útil para sort en /status.
 */
export function severityRank(sev) {
  return { critical: 3, major: 2, minor: 1 }[sev] || 0;
}

/**
 * UI tone para Badge según status + severity.
 */
export function statusTone(status, severity) {
  if (status === "resolved") return "success";
  if (severity === "critical") return "danger";
  if (severity === "major") return "warn";
  return "soft";
}

/**
 * Label legible es/en.
 */
export function statusLabel(status, locale = "es") {
  const map = {
    es: {
      investigating: "Investigando", identified: "Identificado",
      monitoring: "Monitoreando", resolved: "Resuelto",
    },
    en: {
      investigating: "Investigating", identified: "Identified",
      monitoring: "Monitoring", resolved: "Resolved",
    },
  };
  return (map[locale] || map.es)[status] || status;
}

export function severityLabel(severity, locale = "es") {
  const map = {
    es: { minor: "Menor", major: "Mayor", critical: "Crítico" },
    en: { minor: "Minor", major: "Major", critical: "Critical" },
  };
  return (map[locale] || map.es)[severity] || severity;
}

/**
 * Construye un item RSS para el feed. Pure (no DOM/lib XML).
 *
 * @param {object} incident
 * @param {string} baseUrl  e.g. "https://bio-ignicion.app"
 * @returns {string} XML del <item>
 */
export function incidentToRssItem(incident, baseUrl) {
  if (!incident || !incident.id) return "";
  const title = escapeXml(`[${(incident.severity || "").toUpperCase()}] ${incident.title || "Untitled"}`);
  const link = `${baseUrl}/status#i-${incident.id}`;
  const guid = `bio-ignicion:incident:${incident.id}`;
  const pubDate = (incident.startedAt
    ? new Date(incident.startedAt)
    : new Date()).toUTCString();
  const desc = escapeXml(
    `${statusLabel(incident.status, "es")} — ${incident.body || ""}`.slice(0, 500)
  );
  return `<item>
  <title>${title}</title>
  <link>${link}</link>
  <guid isPermaLink="false">${guid}</guid>
  <pubDate>${pubDate}</pubDate>
  <description>${desc}</description>
</item>`;
}

function escapeXml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
export const _xml = { escapeXml };

/**
 * Filtra activos (no resolved) y ordena por severity desc + startedAt desc.
 */
export function activeIncidents(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((r) => r && r.status !== "resolved")
    .sort((a, b) => {
      const sd = severityRank(b.severity) - severityRank(a.severity);
      if (sd !== 0) return sd;
      return new Date(b.startedAt || 0).getTime() - new Date(a.startedAt || 0).getTime();
    });
}

/**
 * Filtra resueltos en últimos N días (default 14).
 */
export function recentResolvedIncidents(rows, { days = 14, now = new Date() } = {}) {
  if (!Array.isArray(rows)) return [];
  const cutoff = now.getTime() - days * 86400_000;
  return rows
    .filter((r) => r?.status === "resolved" && r.resolvedAt &&
      new Date(r.resolvedAt).getTime() >= cutoff)
    .sort((a, b) => new Date(b.resolvedAt).getTime() - new Date(a.resolvedAt).getTime());
}

/**
 * Resumen de status agregado para hero del /status.
 */
export function summarizeOverall(rows, now = new Date()) {
  const active = activeIncidents(rows);
  if (active.length === 0) {
    return { tone: "success", label: "Operativo", message: "Todos los componentes operativos." };
  }
  const worst = active[0]; // ya ordenado severity desc
  return {
    tone: statusTone(worst.status, worst.severity),
    label: statusLabel(worst.status),
    message: `${active.length} incidente${active.length !== 1 ? "s" : ""} activo${active.length !== 1 ? "s" : ""} (severidad máxima: ${severityLabel(worst.severity)})`,
    worst,
  };
}
