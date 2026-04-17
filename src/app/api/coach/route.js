/* LLM Coach — Anthropic Claude Sonnet 4.6 con prompt caching y streaming. */
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { check } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { buildSystemPrompt, sanitizeUserTurn } from "@/lib/coach-prompts";

export const runtime = "nodejs";

export async function POST(req) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { messages = [], orgId, userContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("empty_messages", { status: 400 });
  }

  let org = null;
  if (orgId) {
    const m = await requireMembership(session, orgId, "coach.query").catch((e) => ({ error: e }));
    if (m.error) return new Response("forbidden", { status: 403 });
    const orm = await db();
    org = await orm.org.findUnique({ where: { id: orgId } }).catch(() => null);
  }

  const rl = await check(`coach:${session.user.id}`, { limit: 60, windowMs: 60_000 });
  if (!rl.ok) return new Response("rate_limited", { status: 429 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return new Response("coach_unavailable", { status: 503 });

  const system = buildSystemPrompt({ org, locale: session.user.locale || "es" });
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const userMsg = sanitizeUserTurn(lastUser, userContext || {});
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content || "").slice(0, 4000),
  }));

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
      messages: [...history, { role: "user", content: userMsg }],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream_error", { status: 502 });
  }

  await auditLog({ orgId, actorId: session.user.id, action: "coach.query", payload: { chars: lastUser.length } })
    .catch(() => {});

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body.getReader();
      let buf = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let idx;
          while ((idx = buf.indexOf("\n\n")) !== -1) {
            const evt = buf.slice(0, idx);
            buf = buf.slice(idx + 2);
            const dataLine = evt.split("\n").find((l) => l.startsWith("data:"));
            if (!dataLine) continue;
            const payload = dataLine.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            try {
              const p = JSON.parse(payload);
              if (p.type === "content_block_delta" && p.delta?.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: p.delta.text })}\n\n`));
              } else if (p.type === "message_stop") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
              }
            } catch {}
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(e?.message || e) })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-store",
      "x-ratelimit-remaining": String(rl.remaining),
    },
  });
}
