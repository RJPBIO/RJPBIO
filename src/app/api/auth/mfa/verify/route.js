import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { verifyTOTP } from "@/server/mfa";
import { auditLog } from "@/server/audit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  let code;
  try {
    const body = await request.json();
    code = String(body?.code || "").trim();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (!/^\d{6}$/.test(code)) return new Response("código inválido", { status: 400 });

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id: session.user.id } });
  if (!user?.mfaSecret) return new Response("MFA no configurado", { status: 409 });

  const ok = await verifyTOTP(user.mfaSecret, code);
  if (!ok) {
    await auditLog({ action: "auth.mfa.fail", actorId: user.id }).catch(() => {});
    return new Response("código incorrecto", { status: 401 });
  }

  await orm.user.update({
    where: { id: user.id },
    data: { mfaVerifiedAt: new Date(), mfaEnabled: true },
  }).catch(() => {});
  await auditLog({ action: "auth.mfa.ok", actorId: user.id }).catch(() => {});

  return Response.json({ ok: true });
}
