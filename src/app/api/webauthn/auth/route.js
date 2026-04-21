import "server-only";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import {
  beginAuthentication,
  beginDiscoverableAuthentication,
  finishAuthentication,
} from "@/server/webauthn";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SESSION_TTL_MS = 8 * 60 * 60_000;

function getIp(req) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0]?.trim()) || req.headers.get("x-real-ip") || "0.0.0.0";
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = (body?.email || "").trim().toLowerCase();
  const orm = await db();

  // Email given → directed authentication (allowCredentials constrained to that user).
  // Empty email → discoverable / resident-key flow for conditional UI.
  let options;
  let userId = null;
  if (email) {
    const user = await orm.user.findUnique({ where: { email } });
    if (!user) return new Response("not found", { status: 404 });
    options = await beginAuthentication(user);
    userId = user.id;
  } else {
    options = await beginDiscoverableAuthentication();
  }

  const jar = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const opts = { httpOnly: true, secure: isProd, sameSite: "strict", maxAge: 300, path: "/" };
  jar.set("webauthn-auth-challenge", options.challenge, opts);
  if (userId) jar.set("webauthn-user", userId, opts);
  else jar.delete("webauthn-user");
  return Response.json(options);
}

export async function PUT(request) {
  const jar = await cookies();
  const challenge = jar.get("webauthn-auth-challenge")?.value;
  if (!challenge) return new Response("challenge expired", { status: 400 });
  const body = await request.json();
  const orm = await db();

  // Resolve user: prefer the cookie (set when a specific email was used), fall
  // back to the userHandle the authenticator returned (conditional UI path).
  let userId = jar.get("webauthn-user")?.value || null;
  if (!userId && body?.response?.userHandle) {
    try { userId = Buffer.from(body.response.userHandle, "base64").toString("utf-8"); } catch {}
  }
  if (!userId) return new Response("unknown user", { status: 400 });

  const user = await orm.user.findUnique({ where: { id: userId } });
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

  const newCounter = Number(authenticationInfo.newCounter ?? 0);
  if (newCounter !== 0 && newCounter <= Number(cred.counter || 0)) {
    return new Response("passkey clone detected", { status: 401 });
  }
  cred.counter = newCounter;
  await orm.user.update({
    where: { id: user.id },
    data: { passkeyCredentials: user.passkeyCredentials, lastLoginAt: new Date() },
  });

  // Issue a database session — the client can now navigate to /app and
  // middleware will see a live Auth.js-compatible cookie.
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await orm.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires,
      ip: getIp(request),
      ua: request.headers.get("user-agent") || null,
    },
  });

  const isProd = process.env.NODE_ENV === "production";
  const cookieName = isProd ? "__Secure-authjs.session-token" : "authjs.session-token";
  jar.set(cookieName, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    expires,
  });
  jar.delete("webauthn-auth-challenge");
  jar.delete("webauthn-user");

  await auditLog({ action: "auth.passkey.verify", actorId: user.id }).catch(() => {});
  return Response.json({ ok: true, userId: user.id, redirect: "/app" });
}
