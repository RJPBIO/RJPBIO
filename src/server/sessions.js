/* ═══════════════════════════════════════════════════════════════
   Server-side session tracking helpers.
   ═══════════════════════════════════════════════════════════════
   Persistencia de UserSession rows. Llamado desde:
   - jwt callback → createSession al signin
   - admin layout / API wrappers → assertSessionValid (lazy revoke check)
   - /api/v1/me/sessions → list / revoke
   - /api/auth/signout-all → revokeAllForUser + bumpEpoch

   Pure logic en lib/session-tracking.js para testing sin server-only.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { db } from "./db";
import {
  formatSessionLabel,
  calculateExpiresAt,
  generateJti,
} from "@/lib/session-tracking";

/**
 * Crea una UserSession row para un signin. Returns el jti generado
 * (caller debe persistirlo en el JWT token).
 *
 * @param {object} args
 * @param {string} args.userId
 * @param {string} [args.ip]
 * @param {string} [args.userAgent]
 * @param {number} [args.ttlHours] default 8
 */
export async function createSession({ userId, ip, userAgent, ttlHours }) {
  if (!userId) return null;
  const jti = generateJti();
  const label = formatSessionLabel({ userAgent, ip });
  const expiresAt = calculateExpiresAt(ttlHours);
  try {
    const orm = await db();
    await orm.userSession.create({
      data: { userId, jti, ip: ip || null, userAgent: userAgent || null, label, expiresAt },
    });
  } catch (e) {
    // DB error: devolvemos jti igual — el JWT seguirá funcionando, sólo
    // no aparece en /account. Mejor que bloquear signin.
    return jti;
  }
  return jti;
}

/**
 * ¿La sesión sigue activa? Lazy validation — chequea revokedAt y
 * compara epoch. Si stale → false (caller debe forzar signout).
 *
 * @param {object} args
 * @param {string} args.jti
 * @param {string} args.userId
 * @param {number} args.tokenEpoch
 * @returns {Promise<boolean>}
 */
export async function isSessionValid({ jti, userId, tokenEpoch }) {
  if (!jti || !userId) return false;
  try {
    const orm = await db();
    const [sess, user] = await Promise.all([
      orm.userSession.findUnique({
        where: { jti },
        select: { userId: true, revokedAt: true, expiresAt: true },
      }),
      orm.user.findUnique({
        where: { id: userId },
        select: { sessionEpoch: true },
      }),
    ]);
    if (!sess) return false;
    if (sess.userId !== userId) return false; // jti ↔ user mismatch
    if (sess.revokedAt) return false;
    if (sess.expiresAt.getTime() <= Date.now()) return false;
    if (typeof tokenEpoch === "number" && user && user.sessionEpoch !== tokenEpoch) return false;
    return true;
  } catch {
    // DB sin disponibilidad — fail-open: no podemos validar pero
    // tampoco bloqueamos. El usuario sigue con su JWT existente.
    return true;
  }
}

/**
 * Update lastSeenAt para tracking. Best-effort — falla silenciosa.
 */
export async function touchSession(jti) {
  if (!jti) return;
  try {
    const orm = await db();
    await orm.userSession.update({
      where: { jti },
      data: { lastSeenAt: new Date() },
    });
  } catch { /* no-op */ }
}

/**
 * Lista sesiones del usuario (ordenadas por lastSeenAt desc).
 * Incluye revoked y expired — UI puede filtrar.
 */
export async function listUserSessions(userId) {
  if (!userId) return [];
  try {
    const orm = await db();
    return await orm.userSession.findMany({
      where: { userId },
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true, jti: true, ip: true, userAgent: true, label: true,
        createdAt: true, lastSeenAt: true, expiresAt: true, revokedAt: true,
      },
      take: 50,
    });
  } catch {
    return [];
  }
}

/**
 * Revoca una sesión específica. Devuelve true si la sesión existía y
 * pertenecía al userId (defensa contra IDOR).
 */
export async function revokeSession({ sessionId, userId }) {
  if (!sessionId || !userId) return false;
  try {
    const orm = await db();
    const sess = await orm.userSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true },
    });
    if (!sess || sess.userId !== userId) return false;
    if (sess.revokedAt) return true; // idempotente
    await orm.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoca TODAS las sesiones del usuario + bumps sessionEpoch.
 * El epoch bump invalida cualquier JWT existente que el atacante haya
 * obtenido (defense-in-depth — el revokedAt cubre las que conocemos,
 * el epoch cubre las que no).
 */
export async function revokeAllForUser(userId) {
  if (!userId) return;
  try {
    const orm = await db();
    const now = new Date();
    await orm.$transaction([
      orm.userSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      }),
      orm.user.update({
        where: { id: userId },
        data: { sessionEpoch: { increment: 1 } },
      }),
    ]);
  } catch { /* no-op */ }
}

/**
 * Lee el epoch actual del usuario. Usado en jwt callback al signin
 * para embebar en el token.
 */
export async function getCurrentEpoch(userId) {
  if (!userId) return 0;
  try {
    const orm = await db();
    const u = await orm.user.findUnique({
      where: { id: userId },
      select: { sessionEpoch: true },
    });
    return u?.sessionEpoch ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Revoca la sesión actual (al signOut). Idempotente — best-effort.
 */
export async function revokeByJti(jti) {
  if (!jti) return;
  try {
    const orm = await db();
    await orm.userSession.update({
      where: { jti },
      data: { revokedAt: new Date() },
    });
  } catch { /* no-op (jti may not exist if DB hiccup at signin) */ }
}

/**
 * Hard-delete sessions cuyo expiresAt ya pasó hace >gracePeriodHours.
 * Llamar desde cron (Vercel Cron / external) para que la tabla no crezca.
 * Returns count.
 *
 * @param {number} gracePeriodHours default 24h — mantiene sessions
 *                                  recientemente expiradas para auditoría.
 */
export async function pruneExpiredSessions(gracePeriodHours = 24) {
  try {
    const cutoff = new Date(Date.now() - gracePeriodHours * 3600_000);
    const orm = await db();
    const r = await orm.userSession.deleteMany({
      where: { expiresAt: { lt: cutoff } },
    });
    return r?.count ?? 0;
  } catch {
    return 0;
  }
}
