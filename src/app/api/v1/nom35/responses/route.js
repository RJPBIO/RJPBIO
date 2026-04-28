/* API v1 — NOM-035 responses
   POST /api/v1/nom35/responses   — crea/registra respuesta del user
   GET  /api/v1/nom35/responses   — la última respuesta del user autenticado

   Auth: session cookie (NextAuth). Requiere CSRF (double-submit).
   Scoring server-side es la fuente de verdad; lo recalculamos para evitar
   que un cliente mienta sobre su nivel. */
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { requireCsrf } from "@/server/csrf";
import { check } from "@/server/ratelimit";
import { auditLog } from "@/server/audit";
import { scoreAnswers } from "@/lib/nom35/scoring";
import { ITEMS } from "@/lib/nom35/items";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validAnswers(a) {
  if (!a || typeof a !== "object" || Array.isArray(a)) return false;
  // Validar que todas las llaves sean números 1..72 y valores 0..4
  for (const k of Object.keys(a)) {
    const id = Number(k);
    if (!Number.isInteger(id) || id < 1 || id > ITEMS.length) return false;
    const v = a[k];
    if (!Number.isInteger(v) || v < 0 || v > 4) return false;
  }
  return true;
}

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const memberships = session.memberships || [];
  // BUG FIX (Sprint 62): NOM-035-STPS-2018 es regulación workplace.
  // memberships[0] tomaba el primero indistintamente — si el user tenía
  // [personal-org, B2B-org], la respuesta se guardaba en personal-org y
  // el aggregate del B2B nunca la veía. Mismo patrón Sprint 57 (admin
  // prefiere B2B sobre personal).
  const target = memberships.find((m) => m.org && !m.org.personal) || memberships[0];
  const orgId = target?.orgId;
  if (!orgId) return NextResponse.json({ error: "no_membership" }, { status: 403 });

  // Rate: máx 3 envíos por hora por user (reevaluaciones razonables).
  const rl = await check(`nom35:user:${userId}`, { limit: 3, windowMs: 60 * 60_000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, {
      status: 429,
      headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) },
    });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  if (!validAnswers(body?.answers)) return NextResponse.json({ error: "invalid_answers" }, { status: 422 });

  const result = scoreAnswers(body.answers);
  if (result.completedCount < ITEMS.length) {
    return NextResponse.json({ error: "incomplete", missing: result.missingCount }, { status: 422 });
  }

  const orm = await db();
  const row = await orm.nom35Response.create({
    data: {
      orgId,
      userId,
      guia: "III",
      answers: body.answers,
      total: result.total,
      nivel: result.nivel,
      porDominio: result.porDominio,
      porCategoria: result.porCategoria,
    },
  });
  await auditLog({ orgId, actorId: userId, action: "nom35.response.created", target: row.id, payload: { nivel: result.nivel, total: result.total } }).catch(() => {});

  return NextResponse.json({
    id: row.id,
    nivel: row.nivel,
    total: row.total,
    porDominio: row.porDominio,
    completedAt: row.completedAt,
    recomendacion: result.recomendacion,
  }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orm = await db();
  const row = await orm.nom35Response.findFirst({
    where: { userId: session.user.id },
    orderBy: { completedAt: "desc" },
    select: { id: true, nivel: true, total: true, porDominio: true, completedAt: true, guia: true },
  });
  return NextResponse.json({ data: row });
}
