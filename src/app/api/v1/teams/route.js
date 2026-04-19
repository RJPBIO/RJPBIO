/* API v1 — Equipos
   POST /api/v1/teams         crea equipo (admin)
   Acepta form-urlencoded (desde <form action>) y JSON. */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBody(req) {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await req.json().catch(() => ({}));
  if (ct.includes("form")) {
    const fd = await req.formData();
    const out = {};
    for (const [k, v] of fd) out[k] = v;
    return out;
  }
  return {};
}

export async function POST(req) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const body = await readBody(req);
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const orgId = session.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
    if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await requireMembership(session, orgId, "team.create");

    const name = String(body.name || "").trim();
    if (!name || name.length > 60) return NextResponse.json({ error: "nombre inválido" }, { status: 400 });

    const managerEmail = String(body.managerEmail || "").trim().toLowerCase();
    let managerId = null;
    if (managerEmail) {
      const orm = await db();
      const u = await orm.user.findUnique({ where: { email: managerEmail } });
      if (u) {
        const m = await orm.membership.findFirst({ where: { orgId, userId: u.id } });
        if (m) managerId = u.id;
      }
    }

    const orm = await db();
    try {
      const t = await orm.team.create({ data: { orgId, name, managerId } });
      await auditLog({ orgId, action: "team.create", target: t.id, payload: { name } });
      const accept = req.headers.get("accept") || "";
      if (accept.includes("json")) return NextResponse.json({ data: t }, { status: 201 });
      return NextResponse.redirect(new URL("/admin/teams", req.url), 303);
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
