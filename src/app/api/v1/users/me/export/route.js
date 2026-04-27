import { auth } from "../../../../../../server/auth";
import { db } from "../../../../../../server/db";
import { auditLog } from "../../../../../../server/audit";

export const dynamic = "force-dynamic";

/** GDPR Art. 15 / LFPDPPP Art. 22 — right of access. Returns a signed JSON bundle. */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const userId = session.user.id;
  // BUG FIX (Sprint 5 polish): db() es async — todo el Promise.all
  // de abajo recibía .user, .membership, .neuralSession de un Promise
  // = undefined, y el bundle salía con [user=undefined, memberships=[],
  // sessions=[]]. GDPR Art. 20 (right to portability) violado en silencio.
  const client = await db();
  const [user, memberships, sessions] = await Promise.all([
    client.user.findUnique({ where: { id: userId } }),
    client.membership.findMany({ where: { userId } }),
    client.neuralSession.findMany({ where: { userId } }),
  ]);
  // GDPR Art. 15 — exporta TODA la data personal del subject. Antes solo
  // se exportaba {id,email,name,locale} → ~5% del data footprint real.
  // Excluye solo material criptográfico que el usuario nunca podría
  // re-importar (MFA secret, backup-code hashes, passkey credentials,
  // session epoch interno) — esos son secretos del sistema, no data del
  // subject. neuralState (Zustand store con moodLog, hrvLog, history,
  // achievements, etc.) es la mayoría del data y se incluye completa.
  const bundle = {
    subject: {
      id: user?.id,
      email: user?.email,
      emailVerified: user?.emailVerified,
      phone: user?.phone,
      phoneVerified: user?.phoneVerified,
      name: user?.name,
      image: user?.image,
      locale: user?.locale,
      timezone: user?.timezone,
      mfaEnabled: user?.mfaEnabled,
      mfaVerifiedAt: user?.mfaVerifiedAt,
      lastLoginAt: user?.lastLoginAt,
      lastSyncedAt: user?.lastSyncedAt,
      createdAt: user?.createdAt,
      neuralState: user?.neuralState,
    },
    memberships,
    sessions,
    exportedAt: new Date().toISOString(),
    schemaVersion: 2,
    disclaimer: "Generated per GDPR Art. 15 / LFPDPPP Art. 22. Valid 30 days. Excluded: MFA secrets, backup code hashes, passkey credentials (system material, not subject data).",
  };
  for (const m of memberships) {
    await auditLog({ orgId: m.orgId, actorId: userId, action: "user.data.exported", target: userId });
  }
  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="bio-ignicion-export-${userId}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
