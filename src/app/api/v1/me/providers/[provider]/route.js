/* ═══════════════════════════════════════════════════════════════
   DELETE /api/v1/me/providers/[provider]
   ═══════════════════════════════════════════════════════════════
   Phase 6D SP4a — desvincular un provider OAuth (Account row de
   NextAuth) del usuario actual.

   Reglas de seguridad:
   - Auth requerido (session activa).
   - CSRF requerido (mutation que afecta el ownership de la cuenta).
   - Rate-limit defensivo (5 intentos / 30 min).
   - NO permitir desvincular el ÚLTIMO provider — el user quedaría sin
     forma de iniciar sesión. NextAuth en este repo es OAuth/magic-link
     only (User no tiene password field), así que el último provider es
     literalmente el único path de acceso.
   - Audit log de cualquier desvinculación exitosa o intento bloqueado.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { check } from "@/server/ratelimit";
import { requireCsrf } from "@/server/csrf";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lista de providers conocidos. Mantener sync con NextAuth providers
// configurados en src/server/auth.js. Cualquier provider no listado
// retorna 400 — defense contra path traversal o injection.
const KNOWN_PROVIDERS = new Set([
  "google",
  "apple",
  "github",
  "email",       // magic link
  "credentials", // si en algún momento se agrega (hoy NO está)
  "phone",       // SMS-OTP
]);

export async function DELETE(req, ctx) {
  const csrf = requireCsrf(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const params = await ctx.params;
  const provider = String(params?.provider || "").trim().toLowerCase();
  if (!provider || !KNOWN_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "provider_invalid" }, { status: 400 });
  }

  const rl = await check(`unlink-provider:${session.user.id}`, {
    limit: 5,
    windowMs: 30 * 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429 });
  }

  const orm = await db();

  // Listar todos los Account rows del user para validar count.
  const allAccounts = await orm.account.findMany({
    where: { userId: session.user.id },
    select: { id: true, provider: true },
  });

  const target = allAccounts.find((a) => a.provider === provider);
  if (!target) {
    // No existe vinculación con ese provider — idempotente desde el
    // punto de vista del client (404 sería confuso si user ya unlinked).
    return NextResponse.json({ error: "provider_not_linked" }, { status: 404 });
  }

  // Anti lock-out: si este es el último provider, rechazar.
  if (allAccounts.length <= 1) {
    await auditLog({
      action: "account.provider.unlink.blocked_last",
      actorId: session.user.id,
      payload: { provider },
    }).catch(() => {});
    return NextResponse.json(
      { error: "last_provider", message: "No puedes desvincular tu único método de acceso. Vincula otro proveedor primero." },
      { status: 409 },
    );
  }

  await orm.account.delete({ where: { id: target.id } });

  await auditLog({
    action: "account.provider.unlink",
    actorId: session.user.id,
    payload: { provider, remainingProviders: allAccounts.length - 1 },
  }).catch(() => {});

  return NextResponse.json({ ok: true, provider, remaining: allAccounts.length - 1 });
}

// La lista de providers vinculados vive en GET /api/v1/me/providers
// (sin segment dinámico). Este archivo maneja sólo DELETE específico
// por provider name.
