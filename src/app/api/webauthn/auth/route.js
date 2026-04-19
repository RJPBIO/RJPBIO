import { beginAuthentication, finishAuthentication } from "../../../../server/webauthn";
import { db } from "../../../../server/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { email } = await request.json();
  const user = await db().user.findUnique({ where: { email } });
  if (!user) return new Response("not found", { status: 404 });
  const options = await beginAuthentication(user);
  (await cookies()).set("webauthn-auth-challenge", options.challenge, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300 });
  (await cookies()).set("webauthn-user", user.id, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300 });
  return Response.json(options);
}

export async function PUT(request) {
  const jar = await cookies();
  const challenge = jar.get("webauthn-auth-challenge")?.value;
  const userId = jar.get("webauthn-user")?.value;
  if (!challenge || !userId) return new Response("challenge expired", { status: 400 });
  const body = await request.json();
  const client = await db();
  const user = await client.user.findUnique({ where: { id: userId } });
  if (!user) return new Response("unknown user", { status: 400 });
  const cred = (user.passkeyCredentials || []).find((c) => c.id === body.id);
  if (!cred) return new Response("unknown credential", { status: 400 });
  const { verified, authenticationInfo } = await finishAuthentication(body, challenge, {
    id: cred.id,
    publicKey: Buffer.from(cred.publicKey, "base64"),
    counter: cred.counter,
    transports: cred.transports,
  });
  if (!verified) return new Response("verification failed", { status: 400 });

  // Anti-replay: counter nuevo DEBE superar el almacenado (salvo authenticators
  // que reportan siempre 0, e.g. TouchID en macOS — detectables porque tanto el
  // viejo como el nuevo son 0). Si vemos regresión, indica clonación del authenticator.
  const newCounter = Number(authenticationInfo.newCounter ?? 0);
  if (newCounter !== 0 && newCounter <= Number(cred.counter || 0)) {
    return new Response("passkey clone detected", { status: 401 });
  }
  cred.counter = newCounter;
  await client.user.update({
    where: { id: user.id }, data: { passkeyCredentials: user.passkeyCredentials },
  });
  jar.delete("webauthn-auth-challenge");
  jar.delete("webauthn-user");
  return Response.json({ ok: true, userId: user.id });
}
