/* API v1 — API key individual
   POST   /api/v1/api-keys/[id]?action=rotate  rota (revoca actual y emite nueva)
   DELETE /api/v1/api-keys/[id]                revoca */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { mintApiKey } from "@/server/apikey";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadAndAuthorize(id) {
  const session = await auth();
  if (!session?.user) { const e = new Error("unauthorized"); e.status = 401; throw e; }
  const orm = await db();
  const k = await orm.apiKey.findUnique({ where: { id } });
  if (!k) { const e = new Error("not found"); e.status = 404; throw e; }
  await requireMembership(session, k.orgId, "apikey.manage");
  return { orm, k };
}

export async function DELETE(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const { orm, k } = await loadAndAuthorize(id);
    if (k.revokedAt) return NextResponse.json({ ok: true });
    await orm.apiKey.update({ where: { id: k.id }, data: { revokedAt: new Date() } });
    await auditLog({ orgId: k.orgId, action: "apikey.revoke", target: k.id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const url = new URL(req.url);
    if (url.searchParams.get("action") !== "rotate") {
      return NextResponse.json({ error: "unknown action" }, { status: 400 });
    }
    const { orm, k } = await loadAndAuthorize(id);
    // Rotación = emitir nueva + revocar vieja. Nombre conserva linaje con sufijo ·rot.
    const rotatedName = k.name.endsWith("·rot") ? k.name : `${k.name}·rot`;
    const minted = await mintApiKey(k.orgId, rotatedName, k.scopes);
    await orm.apiKey.update({ where: { id: k.id }, data: { revokedAt: new Date() } });
    await auditLog({ orgId: k.orgId, action: "apikey.rotate", target: k.id, payload: { newId: minted.id } });
    return NextResponse.json({ id: minted.id, token: minted.token, prefix: minted.prefix, scopes: k.scopes });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
