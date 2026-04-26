/* ═══════════════════════════════════════════════════════════════
   Webhook event catalog — Sprint 30.
   ═══════════════════════════════════════════════════════════════
   Catálogo declarativo de eventos disponibles para subscription en
   webhooks. Reemplaza el array hardcoded ALL_EVENTS en WebhooksClient.

   Cada evento expone:
     - id           ej. "session.completed"
     - group        ej. "session" (prefijo, para UI grouping)
     - description  copy ES de qué dispara el evento
     - since        marca de versión del producto en que apareció
     - samplePayload ejemplo del JSON `data` que recibirá el endpoint

   Helpers puros (sin server-only):
     - groupByCategory()        → Record<group, EventDef[]>
     - getEvent(id)             → EventDef | null
     - validateSubscription(id) → { ok, error? }
     - listGroups()             → string[]
     - groupLabel(group)        → ES label
     - serializeSample(event)   → string (JSON pretty)
   ═══════════════════════════════════════════════════════════════ */

const FROZEN = (x) => Object.freeze(x);

/**
 * Catálogo canónico de eventos. Mantener ordenado por (group, id).
 * No mutar en runtime — la API es read-only por diseño.
 */
export const WEBHOOK_EVENTS = FROZEN([
  // ── session ─────────────────────────────────────────────────────
  {
    id: "session.started",
    group: "session",
    description: "Una sesión neural inició para un miembro.",
    since: "v1",
    samplePayload: {
      sessionId: "sess_01HX9YZB",
      userId: "usr_01ABC",
      protocol: "focus.deep",
      startedAt: "2026-04-25T10:15:00.000Z",
    },
  },
  {
    id: "session.completed",
    group: "session",
    description: "Sesión finalizada con métricas (HRV/coherencia/score).",
    since: "v1",
    samplePayload: {
      sessionId: "sess_01HX9YZB",
      userId: "usr_01ABC",
      protocol: "focus.deep",
      durationSec: 420,
      score: 87,
      hrvDelta: 12.4,
      completedAt: "2026-04-25T10:22:00.000Z",
    },
  },
  {
    id: "session.failed",
    group: "session",
    description: "Sesión interrumpida o errores en captura.",
    since: "v1",
    samplePayload: {
      sessionId: "sess_01HX9YZB",
      userId: "usr_01ABC",
      reason: "device_disconnected",
      failedAt: "2026-04-25T10:18:00.000Z",
    },
  },

  // ── member ──────────────────────────────────────────────────────
  {
    id: "member.added",
    group: "member",
    description: "Nuevo miembro aceptó invitación o fue provisionado vía SCIM.",
    since: "v1",
    samplePayload: {
      userId: "usr_01ABC",
      email: "ana@example.com",
      role: "MEMBER",
      addedAt: "2026-04-25T09:00:00.000Z",
    },
  },
  {
    id: "member.removed",
    group: "member",
    description: "Miembro fue removido (offboarding manual o SCIM).",
    since: "v1",
    samplePayload: {
      userId: "usr_01ABC",
      removedBy: "usr_01OWNER",
      removedAt: "2026-04-25T09:10:00.000Z",
    },
  },
  {
    id: "member.role.changed",
    group: "member",
    description: "Rol de miembro modificado (ej. MEMBER → ADMIN).",
    since: "v1",
    samplePayload: {
      userId: "usr_01ABC",
      previousRole: "MEMBER",
      newRole: "ADMIN",
      changedBy: "usr_01OWNER",
      changedAt: "2026-04-25T09:15:00.000Z",
    },
  },

  // ── station ─────────────────────────────────────────────────────
  {
    id: "station.tap",
    group: "station",
    description: "Tap NFC/QR en estación física (kiosk modo).",
    since: "v1",
    samplePayload: {
      stationId: "stn_LOBBY",
      userId: "usr_01ABC",
      tappedAt: "2026-04-25T08:45:00.000Z",
    },
  },

  // ── billing ─────────────────────────────────────────────────────
  {
    id: "billing.overage",
    group: "billing",
    description: "Org excedió cuota del plan (sesiones/seats/api).",
    since: "v1",
    samplePayload: {
      metric: "sessions",
      limit: 1000,
      used: 1042,
      periodStart: "2026-04-01T00:00:00.000Z",
    },
  },
  {
    id: "billing.subscription.updated",
    group: "billing",
    description: "Cambio de plan, seats, o ciclo de facturación.",
    since: "v1",
    samplePayload: {
      previousPlan: "GROWTH",
      newPlan: "SCALE",
      seats: 50,
      effectiveAt: "2026-05-01T00:00:00.000Z",
    },
  },
  {
    id: "billing.invoice.paid",
    group: "billing",
    description: "Factura pagada exitosamente (incluye link al PDF).",
    since: "v1",
    samplePayload: {
      invoiceId: "in_1QABC",
      amountUsd: 499.0,
      currency: "USD",
      paidAt: "2026-04-25T07:00:00.000Z",
      pdfUrl: "https://bioig.invoices/in_1QABC.pdf",
    },
  },

  // ── webhook (meta) ──────────────────────────────────────────────
  {
    id: "webhook.failed",
    group: "webhook",
    description: "Endpoint propio devolvió fallo final tras retries (auto-notif).",
    since: "v1",
    samplePayload: {
      deliveryId: "del_01XYZ",
      reason: "HTTP 503",
      attempts: 5,
      lastAttemptAt: "2026-04-25T11:00:00.000Z",
    },
  },
  {
    id: "ping",
    group: "webhook",
    description: "Evento de prueba manual disparado desde el admin (debug).",
    since: "v1",
    samplePayload: {
      hookId: "wh_01ABC",
      note: "Test manual desde admin",
    },
  },

  // ── org ─────────────────────────────────────────────────────────
  {
    id: "org.updated",
    group: "org",
    description: "Configuración de organización modificada (branding/security/etc).",
    since: "v1",
    samplePayload: {
      orgId: "org_01ABC",
      changedFields: ["branding.primaryColor", "requireMfa"],
      updatedBy: "usr_01OWNER",
      updatedAt: "2026-04-25T12:00:00.000Z",
    },
  },

  // ── compliance ──────────────────────────────────────────────────
  {
    id: "compliance.export.completed",
    group: "compliance",
    description: "Export GDPR/SOC2 listo para descarga.",
    since: "v1",
    samplePayload: {
      exportId: "exp_01ABC",
      kind: "gdpr.dsar",
      sizeBytes: 184502,
      downloadUrl: "https://bioig.exports/exp_01ABC.zip",
      expiresAt: "2026-05-02T00:00:00.000Z",
    },
  },

  // ── audit ───────────────────────────────────────────────────────
  {
    id: "audit.retention.applied",
    group: "audit",
    description: "Retención de auditoría aplicada (purge de eventos antiguos).",
    since: "v1",
    samplePayload: {
      retentionDays: 365,
      removedCount: 1284,
      appliedAt: "2026-04-25T03:00:00.000Z",
    },
  },
]);

const GROUP_LABELS = FROZEN({
  session: "Sesiones",
  member: "Miembros",
  station: "Estaciones",
  billing: "Billing",
  webhook: "Webhook (meta)",
  org: "Organización",
  compliance: "Compliance",
  audit: "Auditoría",
});

const GROUP_ORDER = FROZEN([
  "session", "member", "station", "billing", "webhook", "org", "compliance", "audit",
]);

/**
 * Devuelve un objeto { group: EventDef[] } respetando GROUP_ORDER.
 */
export function groupByCategory(events = WEBHOOK_EVENTS) {
  const out = {};
  for (const g of GROUP_ORDER) out[g] = [];
  for (const ev of events) {
    if (!ev || !ev.group) continue;
    if (!out[ev.group]) out[ev.group] = [];
    out[ev.group].push(ev);
  }
  // limpia grupos vacíos
  for (const g of Object.keys(out)) {
    if (out[g].length === 0) delete out[g];
  }
  return out;
}

/**
 * Lookup por id. Retorna null si no existe.
 */
export function getEvent(id) {
  if (!id || typeof id !== "string") return null;
  return WEBHOOK_EVENTS.find((e) => e.id === id) || null;
}

/**
 * Valida una subscription a un event id. El wildcard "*" se acepta
 * (suscribe a todo). Cualquier otro id debe existir en el catálogo.
 *
 * @returns {{ ok: boolean, error?: string }}
 */
export function validateSubscription(id) {
  if (!id || typeof id !== "string") return { ok: false, error: "missing_id" };
  if (id === "*") return { ok: true };
  if (!getEvent(id)) return { ok: false, error: "unknown_event" };
  return { ok: true };
}

/**
 * Valida una lista de subscriptions, retornando los ids inválidos.
 */
export function validateSubscriptions(ids) {
  if (!Array.isArray(ids)) return { ok: false, invalid: [] };
  const invalid = [];
  for (const id of ids) {
    const r = validateSubscription(id);
    if (!r.ok) invalid.push(id);
  }
  return { ok: invalid.length === 0, invalid };
}

export function listGroups() {
  return [...GROUP_ORDER];
}

export function groupLabel(group) {
  return GROUP_LABELS[group] || group;
}

/**
 * Serializa el samplePayload a JSON pretty (2-space indent), seguro
 * para mostrar en <pre>. Devuelve "" si el evento no existe.
 */
export function serializeSample(eventOrId) {
  const ev = typeof eventOrId === "string" ? getEvent(eventOrId) : eventOrId;
  if (!ev || !ev.samplePayload) return "";
  try {
    return JSON.stringify(ev.samplePayload, null, 2);
  } catch {
    return "";
  }
}

/**
 * Para UI: devuelve solo los ids (útil para tests / migration legacy).
 */
export function listEventIds() {
  return WEBHOOK_EVENTS.map((e) => e.id);
}
