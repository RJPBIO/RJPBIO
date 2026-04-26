/* API v1 — API keys
   POST /api/v1/api-keys   crea key; retorna token UNA vez */

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { mintApiKey } from "@/server/apikey";
import { auditLog } from "@/server/audit";
import { validateExpiryDays, computeExpiresAt } from "@/lib/api-quotas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_SCOPES = [
  "read:sessions", "write:sessions",
  "read:members",  "write:members",
  "read:analytics",
  "read:audit",
  // SCIM 2.0 — IT configura auto-provisioning del IdP (Azure AD /
  // Okta / Google Workspace). server/scim.js valida scopes.includes("scim").
  "scim",
];

export async function POST(req) {
  try {
    const csrf = requireCsrf(req);
    if (csrf) return csrf;
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const orgId = session.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
    if (!orgId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await requireMembership(session, orgId, "apikey.manage");

    const name = String(body.name || "").trim();
    if (!name || name.length > 80) return NextResponse.json({ error: "nombre inválido" }, { status: 400 });

    const scopes = Array.isArray(body.scopes) ? body.scopes.filter((s) => VALID_SCOPES.includes(s)) : ["read:sessions"];
    if (!scopes.length) return NextResponse.json({ error: "al menos un scope" }, { status: 400 });

    // Sprint 15 — expiresAtDays opcional (null = sin expiry).
    const expiryV = validateExpiryDays(body.expiresAtDays ?? null);
    if (!expiryV.ok) return NextResponse.json({ error: "expiresAtDays inválido", reason: expiryV.error }, { status: 400 });
    const expiresAt = computeExpiresAt(expiryV.value);

    const { id, token, prefix } = await mintApiKey(orgId, name, scopes, { expiresAt });
    await auditLog({
      orgId,
      action: "apikey.create",
      target: id,
      payload: { name, scopes, expiresAt: expiresAt ? expiresAt.toISOString() : null },
    });
    return NextResponse.json({
      id, token, prefix, scopes,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: e.status || 500 });
  }
}
