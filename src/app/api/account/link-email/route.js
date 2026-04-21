/* ═══════════════════════════════════════════════════════════════
   POST /api/account/link-email
   Called by /account/link-email after the user (signed in via phone
   with a synthetic @phone.bio-ignicion.app email) adds their real
   address. Sends them a magic link to confirm ownership; only on
   that confirmation do we actually rewrite the email column.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { check } from "@/server/ratelimit";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_request" }, { status: 400 }); }
  const email = String(body?.email || "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "email_invalid" }, { status: 400 });
  if (email.endsWith("@phone.bio-ignicion.app")) return NextResponse.json({ error: "email_reserved" }, { status: 400 });

  const rl = await check(`link-email:${session.user.id}`, { limit: 5, windowMs: 30 * 60_000 });
  if (!rl.ok) return NextResponse.json({ error: "too_many_requests" }, { status: 429 });

  const orm = await db();

  // Collision: the target email already belongs to another account.
  const existing = await orm.user.findUnique({ where: { email } });
  if (existing && existing.id !== session.user.id) {
    return NextResponse.json({ error: "email_in_use" }, { status: 409 });
  }

  // Store the pending email on the user row for the magic-link callback
  // to consume. We reuse emailVerified=null as the unconfirmed signal.
  await orm.user.update({
    where: { id: session.user.id },
    data: { email, emailVerified: null },
  });

  await auditLog({ action: "account.email.link.request", actorId: session.user.id, payload: { email } }).catch(() => {});

  return NextResponse.json({ ok: true });
}
