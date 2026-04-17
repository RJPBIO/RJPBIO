import { NextResponse } from "next/server";
import { verifyApiKey } from "@/server/apikey";
import { db } from "@/server/db";
import { anonymize } from "@/server/analytics";

export async function GET(req) {
  const ctx = await verifyApiKey(req, "read");
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");
  const from = new Date(url.searchParams.get("from") || Date.now() - 30 * 86400_000);
  const to = new Date(url.searchParams.get("to") || Date.now());
  const orm = await db();
  const rows = await orm.neuralSession.findMany({
    where: { orgId: ctx.orgId, ...(teamId ? { teamId } : {}), completedAt: { gte: from, lte: to } },
  });
  return NextResponse.json({ data: anonymize(rows, { k: 5 }) });
}
