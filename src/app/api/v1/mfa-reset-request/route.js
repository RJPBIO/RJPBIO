import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import { check } from "../../../../server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_REASON_LEN = 500;

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const ua = request.headers.get("user-agent") || null;

  const rl = await check(`mfa-reset:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return new Response("rate_limited", {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const reason = typeof body.reason === "string" ? body.reason.slice(0, MAX_REASON_LEN).trim() : "";

  if (!EMAIL_RE.test(email)) return new Response("invalid_email", { status: 422 });

  const client = await db();

  const user = await client.user.findUnique({
    where: { email },
    include: { memberships: { take: 1 } },
  }).catch(() => null);

  // Always return success to avoid user enumeration.
  if (!user) return Response.json({ ok: true });

  const existing = await client.mfaResetRequest.findFirst({
    where: { userId: user.id, status: "pending" },
    orderBy: { createdAt: "desc" },
  }).catch(() => null);

  if (existing) {
    return Response.json({ ok: true, already: true });
  }

  const created = await client.mfaResetRequest.create({
    data: {
      userId: user.id,
      email,
      reason: reason || null,
      ip,
      userAgent: ua,
      status: "pending",
    },
  });

  const orgId = user.memberships?.[0]?.orgId || null;
  await auditLog({
    orgId,
    actorId: user.id,
    actorEmail: email,
    action: "mfa.reset_requested",
    target: created.id,
    payload: { reasonLen: reason.length, hasReason: !!reason },
  }).catch(() => {});

  return Response.json({ ok: true });
}
