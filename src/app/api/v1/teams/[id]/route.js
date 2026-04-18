/* API v1 — Equipo individual
   PATCH  /api/v1/teams/[id]   rename / reassign manager
   DELETE /api/v1/teams/[id]   elimina; deja miembros sin equipo */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadAndAuthorize(id) {
  const session = await auth();
  if (!session?.user) { const e = new Error("unauthorized"); e.status = 401; throw e; }
  const orm = await db();
  const t = await orm.team.findUnique({ where: { id } });
  if (!t) { const e = new Error("not found"); e.status = 404; throw e; }
  await requireMembership(session, t.orgId, "team.create");
  return { orm, t };
}

export async function PATCH(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const { orm, t } = await loadAndAuthorize(id);
    const body = await req.json().catch(() => ({}));
    const data = {};
    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name || name.length > 60) return NextResponse.json({ error: "nombre inválido" }, { status: 400 });
      data.name = name;
    }
    if (typeof body.managerEmail === "string") {
      const email = body.managerEmail.trim().toLowerCase();
      if (!email) { data.managerId = null; }
      else {
        const u = await orm.user.findUnique({ where: { email } });
        if (!u) return NextResponse.json({ error: "manager no encontrado" }, { status: 404 });
        const m = await orm.membership.findFirst({ where: { orgId: t.orgId, userId: u.id } });
        if (!m) return NextResponse.json({ error: "manager no pertenece al org" }, { status: 400 });
        data.managerId = u.id;
      }
    }
    try {
      const updated = await orm.team.update({ where: { id: t.id }, data });
      await auditLog({ orgId: t.orgId, action: "team.update", target: t.id, payload: data });
      return NextResponse.json({ data: updated });
    } catch (e) {
      if (String(e.message || "").includes("Unique")) {
        return NextResponse.json({ error: "Ya existe un equipo con ese nombre" }, { status: 409 });
      }
      throw e;
    }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const { id } = await params;
    const { orm, t } = await loadAndAuthorize(id);
    await orm.membership.updateMany({ where: { orgId: t.orgId, teamId: t.id }, data: { teamId: null } });
    await orm.team.delete({ where: { id: t.id } });
    await auditLog({ orgId: t.orgId, action: "team.delete", target: t.id, payload: { name: t.name } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
