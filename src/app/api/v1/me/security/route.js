/* GET /api/v1/me/security — agregado MFA + sesiones + dispositivos
   confiables. Phase 6D SP4b. Endpoint single-shot que SecurityView
   consume al mount para evitar 3 llamadas separadas (1 RTT vs 3).

   Auth: cualquier sesión válida. Solo devuelve datos del user actual.
   NO incluye secrets ni token hashes — solo lo necesario para render. */

import "server-only";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { listUserSessions } from "@/server/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const orm = await db();
  const userId = session.user.id;

  const [user, sessionsRaw, trustedDevicesRaw] = await Promise.all([
    orm.user.findUnique({
      where: { id: userId },
      select: {
        mfaEnabled: true,
        mfaVerifiedAt: true,
        mfaBackupCodes: true,
        mfaLockedUntil: true,
      },
    }),
    listUserSessions(userId),
    orm.trustedDevice.findMany({
      where: { userId },
      select: {
        id: true, label: true, ip: true,
        createdAt: true, expiresAt: true, lastUsedAt: true,
      },
      orderBy: { lastUsedAt: "desc" },
    }),
  ]);

  if (!user) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const now = Date.now();
  const currentJti = session.jti || null;
  const sessions = sessionsRaw.map((s) => ({
    id: s.id,
    label: s.label,
    ip: s.ip,
    userAgent: s.userAgent,
    createdAt: s.createdAt.toISOString(),
    lastSeenAt: s.lastSeenAt.toISOString(),
    expiresAt: s.expiresAt.toISOString(),
    revokedAt: s.revokedAt ? s.revokedAt.toISOString() : null,
    current: !!currentJti && s.jti === currentJti,
  }));
  const activeTrustedDevices = trustedDevicesRaw
    .filter((d) => d.expiresAt.getTime() > now)
    .map((d) => ({
      id: d.id,
      label: d.label || "Dispositivo sin nombre",
      ip: d.ip,
      createdAt: d.createdAt.toISOString(),
      expiresAt: d.expiresAt.toISOString(),
      lastUsedAt: d.lastUsedAt.toISOString(),
    }));

  // mfaVerifiedAt window: el cliente lo usa para mostrar "step-up needed"
  // antes de tap "Desactivar" / "Regenerar" — si stale, mostrar input TOTP
  // primero. El server vuelve a validar con FRESH_WINDOW_MS=10min.
  const verifiedAtMs = user.mfaVerifiedAt?.getTime() || 0;
  const stepUpFreshSeconds = Math.max(
    0,
    Math.floor((verifiedAtMs + 10 * 60 * 1000 - now) / 1000),
  );
  const lockedSecondsRemaining = user.mfaLockedUntil
    ? Math.max(0, Math.ceil((user.mfaLockedUntil.getTime() - now) / 1000))
    : 0;

  return Response.json({
    mfa: {
      enabled: !!user.mfaEnabled,
      verifiedAt: user.mfaVerifiedAt?.toISOString() || null,
      stepUpFreshSeconds,
      backupCodesRemaining: Array.isArray(user.mfaBackupCodes)
        ? user.mfaBackupCodes.length
        : 0,
      lockedSecondsRemaining,
    },
    sessions: { items: sessions, count: sessions.length },
    trustedDevices: { items: activeTrustedDevices, count: activeTrustedDevices.length },
  });
}
