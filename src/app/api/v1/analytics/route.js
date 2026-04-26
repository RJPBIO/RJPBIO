/* Sprint 26: dual-check rate limit (per-key + per-org) + RFC 9239 headers. */
import { NextResponse } from "next/server";
import { verifyApiKeyAndRateLimit } from "@/server/apikey";
import { db } from "@/server/db";
import { anonymize } from "@/server/analytics";
import { buildRateLimitHeaders } from "@/lib/rate-limit-headers";

export async function GET(req) {
  const r = await verifyApiKeyAndRateLimit(req, "read");
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
  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");
  const from = new Date(url.searchParams.get("from") || Date.now() - 30 * 86400_000);
  const to = new Date(url.searchParams.get("to") || Date.now());
  const orm = await db();
  const rows = await orm.neuralSession.findMany({
    where: { orgId: r.key.orgId, ...(teamId ? { teamId } : {}), completedAt: { gte: from, lte: to } },
  });
  return NextResponse.json({ data: anonymize(rows, { k: 5 }) }, { headers });
}
