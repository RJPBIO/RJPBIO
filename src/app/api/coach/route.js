/* LLM Coach — Anthropic Claude Sonnet 4.6 con prompt caching y streaming. */
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { check, limits } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { buildSystemPrompt, sanitizeUserTurn } from "@/lib/coach-prompts";

export const runtime = "nodejs";

export async function POST(req) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const body = await req.json();
  const { orgId, message, userContext } = body;
  const m = await requireMembership(session, orgId, "coach.query").catch((e) => ({ error: e }));
  if (m.error) return new Response("forbidden", { status: 403 });
  const orm = await db();
  const org = await orm.org.findUnique({ where: { id: orgId } });
  const rl = await check(`coach:${session.user.id}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return new Response("rate_limited", { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("coach_unavailable", { status: 503 });

  const system = buildSystemPrompt({ org, locale: session.user.locale || "es" });
  const userMsg = sanitizeUserTurn(message, userContext);

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      temperature: 0.3,
      stream: true,
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userMsg }],
    }),
  });

  await auditLog({ orgId, actorId: session.user.id, action: "coach.query", payload: { chars: message?.length } });

  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      "x-ratelimit-remaining": String(rl.remaining),
    },
  });
}
