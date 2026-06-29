/* Sprint 26: dual-check rate limit (per-key + per-org) + RFC 9239 headers. */
import { NextResponse } from "next/server";
import { verifyApiKeyAndRateLimit } from "@/server/apikey";
import { anonymize } from "@/server/analytics";
import { findSessionsForOrgMembers } from "@/server/org-neural-sessions";
import { buildRateLimitHeaders } from "@/lib/rate-limit-headers";

export async function GET(req) {
  const r = await verifyApiKeyAndRateLimit(req, "read:analytics");
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
  // BUG FIX: NeuralSession.orgId es la personal-org del user, no la B2B-org;
  // filtrar por orgId devolvía 0 filas (feature pagada vacía). Resolver por
  // userId∈members (teamId scopea por membership). Ver org-neural-sessions.js.
  const rows = await findSessionsForOrgMembers(r.key.orgId, {
    teamId: teamId || undefined,
    where: { completedAt: { gte: from, lte: to } },
  });
  return NextResponse.json({ data: anonymize(rows, { k: 5 }) }, { headers });
}
