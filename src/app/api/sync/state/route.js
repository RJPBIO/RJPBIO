/* PWA Sync — GET /api/sync/state
   ═══════════════════════════════════════════════════════════════
   Devuelve el estado neural del usuario autenticado para hidratar
   IndexedDB local. Llamado al login + multi-device login.

   Auth: NextAuth session cookie (no API key). Solo accesible para
   el usuario dueño del state — nunca otro user puede leer.

   Devuelve:
     - neuralState (JSON blob: el Zustand store completo del PWA)
     - recentSessions (últimas 90 días de NeuralSession del personal-org)
     - personalOrgId (referencia para futuros writes)
     - lastSyncedAt (timestamp del último sync exitoso)

   El cliente debe mergear server-state con local-state usando
   last-write-wins por timestamp para evitar perder cambios offline.
   ═══════════════════════════════════════════════════════════════ */

import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import { enforceMfaIfPolicyDemands, mfaGateResponse } from "../../../../server/mfa-policy";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Sprint S3.1 — MFA policy enforcement (mismo gate que sync/outbox).
  const mfa = await enforceMfaIfPolicyDemands(session);
  const mfaResp = mfaGateResponse(mfa);
  if (mfaResp) return mfaResp;

  try {
    const orm = await db();
    const user = await orm.user.findUnique({
      where: { id: userId },
      select: { neuralState: true, lastSyncedAt: true, locale: true, timezone: true },
    });
    if (!user) return Response.json({ error: "not_found" }, { status: 404 });

    // Personal org del usuario — fuente de las sesiones individuales +
    // estado de billing (plan, trial, dunning) para que el cliente pueda
    // gating + trial banner sin endpoint extra.
    const personalOrg = await orm.org.findUnique({
      where: { slug: `personal-${userId}` },
      select: { id: true, plan: true, trialEndsAt: true, dunningState: true, stripeCustomer: true },
    });

    // Últimas 90 días de sesiones del usuario en su org personal
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const recentSessions = personalOrg
      ? await orm.neuralSession.findMany({
          where: {
            userId,
            orgId: personalOrg.id,
            completedAt: { gte: ninetyDaysAgo },
          },
          orderBy: { completedAt: "desc" },
          take: 200,
          select: {
            id: true,
            protocolId: true,
            durationSec: true,
            coherenciaDelta: true,
            moodPre: true,
            moodPost: true,
            completedAt: true,
            clientVersion: true,
          },
        })
      : [];

    await auditLog({
      orgId: personalOrg?.id,
      actorId: userId,
      action: "sync.state.read",
      payload: { sessionsCount: recentSessions.length },
    }).catch(() => {});

    return Response.json({
      neuralState: user.neuralState || null,
      recentSessions,
      personalOrgId: personalOrg?.id || null,
      // Billing summary — usado por trial banner + feature gating en cliente
      billing: personalOrg
        ? {
            plan: personalOrg.plan || "FREE",
            trialEndsAt: personalOrg.trialEndsAt?.toISOString() || null,
            dunningState: personalOrg.dunningState || null,
            hasStripeCustomer: !!personalOrg.stripeCustomer,
          }
        : { plan: "FREE", trialEndsAt: null, dunningState: null, hasStripeCustomer: false },
      lastSyncedAt: user.lastSyncedAt?.toISOString() || null,
      locale: user.locale,
      timezone: user.timezone,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { error: "internal_error", message: "Sync state unavailable" },
      { status: 500 }
    );
  }
}
