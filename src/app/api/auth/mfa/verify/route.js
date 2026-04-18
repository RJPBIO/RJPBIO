import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { verifyTOTP } from "@/server/mfa";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { decryptIfEncrypted } from "@/server/kms";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

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

  const secret = decryptIfEncrypted(user.mfaSecret);
  const ok = await verifyTOTP(secret, code);
  if (!ok) {
    await auditLog({ action: "auth.mfa.fail", actorId: user.id }).catch(() => {});
    return new Response("código incorrecto", { status: 401 });
  }

  await orm.user.update({
    where: { id: user.id },
    data: { mfaVerifiedAt: new Date(), mfaEnabled: true },
  }).catch(() => {});
  // Session rotation: invalida sesiones previas del usuario excepto la actual
  // para cerrar ventana post-MFA. El cliente reusará su session-token ya vivo.
  await orm.session.deleteMany({
    where: { userId: user.id, NOT: { sessionToken: session.sessionToken || undefined } },
  }).catch(() => {});
  await auditLog({ action: "auth.mfa.ok", actorId: user.id }).catch(() => {});

  return Response.json({ ok: true });
}
