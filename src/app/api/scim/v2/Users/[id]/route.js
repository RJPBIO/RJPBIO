/* SCIM 2.0 Users/{id} — GET, PATCH, PUT, DELETE.
   Sprint 12:
   - PATCH usa parsePatchBody + isDeactivateOp/isActivateOp (lib pura)
   - PATCH/DELETE soft-deactivate (no hard delete) → audit trail + reactivable
   - PUT replaces top-level (limited subset) */

import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { requireScimAuth, scimError, toScimUser } from "@/server/scim";
import { auditLog } from "@/server/audit";
import { parsePatchBody, isDeactivateOp, isActivateOp, applyPatchOps } from "@/lib/scim-patch";
import { revokeUserAccess } from "@/server/membership-revoke";

export async function GET(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const orm = await db();
  const user = await orm.user.findUnique({ where: { id } });
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  if (!user || !membership) return scimError(404, "not found");
  return NextResponse.json(toScimUser({ ...user, membership }));
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const body = await req.json();

  const parsed = parsePatchBody(body);
  if (!parsed.ok) {
    return scimError(400, `invalid patch: ${parsed.error}${parsed.index !== undefined ? ` (op ${parsed.index})` : ""}`);
  }

  const orm = await db();
  const user = await orm.user.findUnique({ where: { id } });
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  if (!user || !membership) return scimError(404, "not found");

  // Active/Deactivate: branch para audit semántico claro.
  if (isDeactivateOp(parsed.ops) && !membership.deactivatedAt) {
    const updated = await orm.membership.update({
      where: { id: membership.id },
      data: { deactivatedAt: new Date() },
    });
    // Sprint S3.3 — cascade revoke. Antes: user mantenía sesiones JWT
    // hasta 8h después de la deactivation = compliance gap. Ahora:
    // sessions revoked + sessionEpoch++ → JWT invalida en ≤60s.
    await revokeUserAccess(id, {
      orgId: ctx.orgId,
      reason: "scim.deactivate",
      actorId: null,
    }).catch(() => {});
    await auditLog({
      orgId: ctx.orgId, action: "scim.user.deactivate", target: id,
    }).catch(() => {});
    return NextResponse.json(toScimUser({ ...user, membership: updated }));
  }
  if (isActivateOp(parsed.ops) && membership.deactivatedAt) {
    const updated = await orm.membership.update({
      where: { id: membership.id },
      data: { deactivatedAt: null },
    });
    await auditLog({
      orgId: ctx.orgId, action: "scim.user.reactivate", target: id,
    }).catch(() => {});
    return NextResponse.json(toScimUser({ ...user, membership: updated }));
  }

  // Otras ops (replace name/displayName) — actualizamos User si afectan name.
  const current = toScimUser({ ...user, membership });
  const next = applyPatchOps(current, parsed.ops);
  const newName = next.displayName || next.name?.formatted;
  if (newName && newName !== user.name) {
    await orm.user.update({ where: { id: user.id }, data: { name: newName } });
  }

  const fresh = await orm.user.findUnique({ where: { id: user.id } });
  await auditLog({
    orgId: ctx.orgId, action: "scim.user.update", target: id,
    payload: { ops: parsed.ops.length },
  }).catch(() => {});
  return NextResponse.json(toScimUser({ ...fresh, membership }));
}

export async function PUT(req, { params }) {
  /* PUT replaces el resource. Subset: displayName, active, externalId. */
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const body = await req.json();
  const orm = await db();
  const user = await orm.user.findUnique({ where: { id } });
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  if (!user || !membership) return scimError(404, "not found");

  const updates = {};
  if (typeof body.displayName === "string" && body.displayName !== user.name) {
    updates.name = body.displayName;
  }
  let nextMembership = membership;
  if (typeof body.active === "boolean") {
    const wantDeactivated = !body.active;
    const isDeactivated = !!membership.deactivatedAt;
    if (wantDeactivated && !isDeactivated) {
      nextMembership = await orm.membership.update({
        where: { id: membership.id },
        data: { deactivatedAt: new Date() },
      });
      // Sprint S3.3 — cascade revoke en PUT path también.
      await revokeUserAccess(id, {
        orgId: ctx.orgId,
        reason: "scim.put.deactivate",
      }).catch(() => {});
    } else if (!wantDeactivated && isDeactivated) {
      nextMembership = await orm.membership.update({
        where: { id: membership.id },
        data: { deactivatedAt: null },
      });
    }
  }
  if (typeof body.externalId === "string" && body.externalId !== membership.scimId) {
    nextMembership = await orm.membership.update({
      where: { id: membership.id },
      data: { scimId: body.externalId },
    });
  }
  if (Object.keys(updates).length) {
    await orm.user.update({ where: { id: user.id }, data: updates });
  }

  const fresh = await orm.user.findUnique({ where: { id: user.id } });
  await auditLog({
    orgId: ctx.orgId, action: "scim.user.update", target: id, payload: { method: "PUT" },
  }).catch(() => {});
  return NextResponse.json(toScimUser({ ...fresh, membership: nextMembership }));
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const ctx = await requireScimAuth(req); if (ctx.error) return ctx.error;
  const orm = await db();
  const membership = await orm.membership.findFirst({ where: { userId: id, orgId: ctx.orgId } });
  if (!membership) return new NextResponse(null, { status: 204 });

  // Sprint 12 — soft-deactivate vs hard-delete (mantiene audit trail).
  if (!membership.deactivatedAt) {
    await orm.membership.update({
      where: { id: membership.id },
      data: { deactivatedAt: new Date() },
    });
    // Sprint S3.3 — cascade revoke en DELETE path también.
    await revokeUserAccess(id, {
      orgId: ctx.orgId,
      reason: "scim.delete",
    }).catch(() => {});
  }
  await auditLog({
    orgId: ctx.orgId, action: "scim.user.deactivate", target: id, payload: { via: "DELETE" },
  }).catch(() => {});
  return new NextResponse(null, { status: 204 });
}
