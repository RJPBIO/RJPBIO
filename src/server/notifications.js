/* ═══════════════════════════════════════════════════════════════
   Notifications — servidor → admin-bell. No polling; se persisten
   como AuditLog con prefijo `notify.*` y la UI las sincroniza al
   abrir la campana (ver NotificationsBell + /api/notifications/recent).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { auditLog } from "./audit";

export const NOTIFY_PREFIX = "notify.";

const LEVELS = new Set(["info", "warn", "error", "success"]);

export async function notifyOrgAdmins(orgId, { title, body = null, level = "info", href = null, kind = "general" }) {
  if (!orgId || !title) return null;
  const safeLevel = LEVELS.has(level) ? level : "info";
  return auditLog({
    orgId,
    action: `${NOTIFY_PREFIX}${kind}`,
    payload: {
      title: String(title).slice(0, 160),
      body: body ? String(body).slice(0, 400) : null,
      level: safeLevel,
      href: href ? String(href).slice(0, 400) : null,
    },
  }).catch(() => null);
}
