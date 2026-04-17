import { NextResponse } from "next/server";
import { verifyApiKey } from "@/server/apikey";
import { db } from "@/server/db";

export async function GET(req) {
  const ctx = await verifyApiKey(req, "read");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const orm = await db();
  const members = await orm.membership.findMany({ where: { orgId: ctx.orgId } });
  const enriched = await Promise.all(members.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return { id: m.id, role: m.role, email: u?.email, name: u?.name, joinedAt: m.createdAt };
  }));
  return NextResponse.json({ data: enriched });
}
