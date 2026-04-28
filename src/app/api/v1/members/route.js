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
  // Sprint 92 — fix N+1 (bug #9 round 2). Antes: 1 query findMany +
  // N queries findUnique en Promise.all. Org con 100 members = 101
  // queries → latencia O(n). Ahora: 1 query con include = O(1).
  const orm = await db();
  const members = await orm.membership.findMany({
    where: { orgId: r.key.orgId },
    include: { user: { select: { email: true, name: true } } },
  });
  const enriched = members.map((m) => ({
    id: m.id,
    role: m.role,
    email: m.user?.email,
    name: m.user?.name,
    joinedAt: m.createdAt,
  }));
  return NextResponse.json({ data: enriched }, { headers });
}
