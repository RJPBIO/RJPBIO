/* Sprint 26: dual-check rate limit (per-key + per-org) + RFC 9239 headers. */
import { NextResponse } from "next/server";
import { verifyApiKeyAndRateLimit } from "@/server/apikey";
import { db } from "@/server/db";
import { buildRateLimitHeaders } from "@/lib/rate-limit-headers";

export async function GET(req) {
  const r = await verifyApiKeyAndRateLimit(req, "read:members");
  if (!r.ok) {
    const headers = buildRateLimitHeaders({
      policy: r.rateLimit?.policy,
      remaining: r.rateLimit?.remaining,
      reset: r.rateLimit?.reset,
      retryAfter: r.status === 429 ? r.rateLimit?.retryAfter : undefined,
    });
    return NextResponse.json(
      { error: r.error, blockedBy: r.blockedBy },
      { status: r.status, headers }
    );
  }
  const headers = buildRateLimitHeaders({
    policy: r.rateLimit?.policy,
    remaining: r.rateLimit?.remaining,
    reset: r.rateLimit?.reset,
  });
  const orm = await db();
  const members = await orm.membership.findMany({ where: { orgId: r.key.orgId } });
  const enriched = await Promise.all(members.map(async (m) => {
    const u = await orm.user.findUnique({ where: { id: m.userId } });
    return { id: m.id, role: m.role, email: u?.email, name: u?.name, joinedAt: m.createdAt };
  }));
  return NextResponse.json({ data: enriched }, { headers });
}
