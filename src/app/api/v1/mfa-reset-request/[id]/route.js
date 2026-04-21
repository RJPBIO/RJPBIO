import { db } from "../../../../../server/db";
import { auth } from "../../../../../server/auth";
import { auditLog } from "../../../../../server/audit";
import { sendMfaResetResolved } from "../../../../../server/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_REASON_LEN = 500;
const ALLOWED = new Set(["approved", "rejected"]);

export async function POST(request, { params }) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const { id } = await params;
  if (!id) return new Response("invalid", { status: 400 });

  const body = await request.json().catch(() => ({}));
  const action = body?.action;
  const resolverNote = typeof body?.note === "string" ? body.note.slice(0, MAX_REASON_LEN).trim() : "";
  if (!ALLOWED.has(action)) return new Response("invalid_action", { status: 400 });

  const orm = await db();
  const reqRow = await orm.mfaResetRequest.findUnique({ where: { id } });
  if (!reqRow) return new Response("not_found", { status: 404 });
  if (reqRow.status !== "pending") return new Response("already_resolved", { status: 409 });

  const targetMemberships = await orm.membership.findMany({ where: { userId: reqRow.userId } });
  const targetOrgIds = new Set(targetMemberships.map((m) => m.orgId));

  const allowedOrgId = (session.memberships || []).find(
    (m) => ["OWNER", "ADMIN"].includes(m.role) && targetOrgIds.has(m.orgId),
  )?.orgId;
  if (!allowedOrgId) return new Response("forbidden", { status: 403 });

  const user = await orm.user.findUnique({ where: { id: reqRow.userId } });
  const org = await orm.org.findUnique({ where: { id: allowedOrgId } });

  if (action === "approved") {
    await orm.$transaction([
      orm.user.update({
        where: { id: reqRow.userId },
        data: {
          mfaEnabled: false,
          mfaSecret: null,
          mfaBackupCodes: [],
          mfaFailCount: 0,
          mfaLockedUntil: null,
          mfaVerifiedAt: null,
        },
      }),
      orm.trustedDevice.deleteMany({ where: { userId: reqRow.userId } }),
      orm.session.deleteMany({ where: { userId: reqRow.userId } }),
      orm.mfaResetRequest.update({
        where: { id },
        data: {
          status: "approved",
          resolvedAt: new Date(),
          resolverId: session.user.id,
        },
      }),
    ]);
  } else {
    await orm.mfaResetRequest.update({
      where: { id },
      data: {
        status: "rejected",
        resolvedAt: new Date(),
        resolverId: session.user.id,
      },
    });
  }

  await auditLog({
    orgId: allowedOrgId,
    actorId: session.user.id,
    actorEmail: session.user.email || null,
    action: action === "approved" ? "mfa.reset_approved" : "mfa.reset_rejected",
    target: reqRow.id,
    payload: { targetUserId: reqRow.userId, targetEmail: reqRow.email, hasNote: !!resolverNote },
  }).catch(() => {});

  if (user?.email) {
    const origin = new URL(request.url).origin;
    await sendMfaResetResolved({
      to: user.email,
      status: action,
      orgName: org?.name || "",
      reason: action === "rejected" ? resolverNote : null,
      signinUrl: `${origin}/signin`,
      locale: user.locale || "es",
    }).catch(() => {});
  }

  return Response.json({ ok: true, status: action });
}
