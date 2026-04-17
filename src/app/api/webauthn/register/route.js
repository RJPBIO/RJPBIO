import { auth } from "../../../../server/auth";
import { beginRegistration, finishRegistration } from "../../../../server/webauthn";
import { db } from "../../../../server/db";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const user = await db().user.findUnique({ where: { id: session.user.id } });
  const options = await beginRegistration(user);
  (await cookies()).set("webauthn-challenge", options.challenge, { httpOnly: true, secure: true, sameSite: "strict", maxAge: 300 });
  return Response.json(options);
}

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });
  const jar = await cookies();
  const expectedChallenge = jar.get("webauthn-challenge")?.value;
  const body = await request.json();
  const { verified, registrationInfo } = await finishRegistration(body, expectedChallenge);
  if (!verified) return new Response("verification failed", { status: 400 });
  const client = db();
  const user = await client.user.findUnique({ where: { id: session.user.id } });
  const creds = Array.isArray(user.passkeyCredentials) ? user.passkeyCredentials : [];
  creds.push({
    id: registrationInfo.credential.id,
    publicKey: Buffer.from(registrationInfo.credential.publicKey).toString("base64"),
    counter: registrationInfo.credential.counter,
    transports: registrationInfo.credential.transports,
    createdAt: new Date().toISOString(),
  });
  await client.user.update({ where: { id: user.id }, data: { passkeyCredentials: creds } });
  jar.delete("webauthn-challenge");
  return Response.json({ ok: true });
}
