/* ═══════════════════════════════════════════════════════════════
   Audit categories — quickfilter mapping para admin UI.
   ═══════════════════════════════════════════════════════════════
   Mapea acciones individuales (auth.signin, billing.checkout.start,
   org.sso.configured, etc.) a categorías browseables. Cada categoría
   tiene una lista de prefijos que matchean.

   Usado en /admin/audit chips de quickfilter — admin/auditor STPS
   puede en un click filtrar todos los eventos de billing, sso, etc.

   Nuevos eventos audit-logged automáticamente se categorizan via
   matchActionCategory si su prefijo coincide con uno conocido.
   Si no coincide → categoría "other".
   ═══════════════════════════════════════════════════════════════ */

export const AUDIT_CATEGORIES = [
  {
    id: "auth",
    label: "Auth",
    prefixes: ["auth."],
    description: "Sign in / sign out / SSO redirect",
  },
  {
    id: "billing",
    label: "Billing",
    prefixes: ["billing."],
    description: "Stripe lifecycle, checkout, dunning",
  },
  {
    id: "members",
    label: "Miembros",
    prefixes: ["member.", "invitation.", "user.deletion."],
    description: "Invitaciones, joins, leaves, deletion requests",
  },
  {
    id: "sso",
    label: "SSO",
    prefixes: ["org.sso."],
    description: "Federation config / disable",
  },
  {
    id: "data",
    label: "Datos",
    prefixes: [
      "user.data.exported",
      "org.data.exported",
      "nom35.aggregate.exported",
      "sync.outbox.drain",
      "sync.state.read",
    ],
    description: "Exports, sync, GDPR portability",
  },
  {
    id: "session",
    label: "Sesiones",
    prefixes: ["session.", "api.session."],
    description: "Sesiones neurales completadas",
  },
  {
    id: "webhook",
    label: "Webhooks",
    prefixes: ["webhook.", "api.webhook."],
    description: "Delivery, fallos, retries",
  },
  {
    id: "org",
    label: "Org",
    prefixes: ["org.created", "org.personal.created", "org.updated"],
    description: "Lifecycle del org (excl. SSO/data ya cubiertos)",
  },
];

/**
 * Retorna el id de categoría que matchea el action (primer match wins).
 * Si ninguno matchea, retorna null (UI muestra "other" o no chip).
 *
 * Uso defensivo: action puede ser null/undefined (audit logs viejos).
 */
export function matchActionCategory(action) {
  if (!action || typeof action !== "string") return null;
  for (const cat of AUDIT_CATEGORIES) {
    for (const p of cat.prefixes) {
      // Prefix match — soporta prefijo terminado en "." (todos los
      // sub-actions) o exact action (e.g., "user.data.exported").
      if (p.endsWith(".") ? action.startsWith(p) : action === p) {
        return cat.id;
      }
    }
  }
  return null;
}

/**
 * ¿El action pertenece a la categoría dada?
 * False también si action o categoryId no son válidos.
 */
export function isInCategory(action, categoryId) {
  if (!categoryId) return true; // "all" → todo pasa
  return matchActionCategory(action) === categoryId;
}

/**
 * Conteo de actions por categoría — útil para UI badges con count.
 * @param {Array<{action: string}>} rows
 * @returns {Object<string, number>} { categoryId: count, ... }
 */
export function countByCategory(rows) {
  const counts = {};
  for (const cat of AUDIT_CATEGORIES) counts[cat.id] = 0;
  counts.other = 0;
  for (const r of rows || []) {
    const cat = matchActionCategory(r?.action) || "other";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}
