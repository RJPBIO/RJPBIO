/* LLM Coach — Anthropic Claude Sonnet 4.6 con prompt caching y streaming. */
import { auth } from "@/server/auth";
import { requireMembership } from "@/server/rbac";
import { requireCsrf } from "@/server/csrf";
import { check } from "@/server/ratelimit";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { buildSystemPrompt, sanitizeUserTurn } from "@/lib/coach-prompts";
import { resolveCoachModel } from "@/lib/coach-model";
import { enforceMfaIfPolicyDemands, mfaGateResponse } from "@/server/mfa-policy";
import { evaluateQuota, currentBillingPeriod, getCoachQuota } from "@/lib/coach-quota";

export const runtime = "nodejs";

// Sprint 92 — cap mensajes incoming. Antes solo había messages.length>0
// check, atacante podía enviar 10K mensajes de 4KB = 40MB upstream burn.
const MAX_MESSAGES = 50;

export async function POST(req) {
  // Sprint 92 — CSRF check (bug #4 round 2). Endpoint costoso (Anthropic
  // API $$$), defense-in-depth crítico. Auth cookie es SameSite=Lax por
  // lo que el browser ya bloquea cross-origin POST, pero CSRF protege
  // contra XSS o subdomain takeover.
  const csrf = requireCsrf(req);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  // Sprint S3.1 — MFA policy enforcement. Coach LLM expone contexto
  // sensible (mood trajectory, instruments scores) — gate igual que sync.
  const mfa = await enforceMfaIfPolicyDemands(session);
  const mfaResp = mfaGateResponse(mfa);
  if (mfaResp) return mfaResp;

  const body = await req.json().catch(() => ({}));
  const { messages = [], orgId, userContext } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response("empty_messages", { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return new Response("too_many_messages", { status: 413 });
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

  // Sprint S5.1 — quota mensual por plan. Pre-check: 429 si el user
  // alcanzó su cap. FREE 5/mes, PRO 100/mes, STARTER 500/mes,
  // GROWTH/ENTERPRISE unlimited. Reset implícito: nueva fila cada mes.
  const plan = (org?.plan || "FREE").toUpperCase();
  const period = currentBillingPeriod();
  const orm = await db();
  const usage = await orm.coachUsage.findUnique({
    where: { userId_year_month: { userId: session.user.id, year: period.year, month: period.month } },
  }).catch(() => null);
  const quota = evaluateQuota(usage, plan);
  if (!quota.ok) {
    return Response.json(
      { error: "quota_exceeded", plan, max: quota.max, used: quota.used, period },
      { status: 429, headers: { "X-Quota-Reason": "monthly_cap" } }
    );
  }

  const system = buildSystemPrompt({ org, locale: session.user.locale || "es" });
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const userMsg = sanitizeUserTurn(lastUser, userContext || {});
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: String(m.content || "").slice(0, 4000),
  }));

  // Sprint S1.6 — modelo decidido por plan + env override (`COACH_MODEL`).
  // FREE → Haiku, PRO+ → Sonnet, ENTERPRISE+opt → Opus. El gating por
  // mensajes/mes vive en CoachUsage (Sprint S5).
  const model = resolveCoachModel(org?.plan || "FREE", {
    envOverride: process.env.COACH_MODEL,
    opusEnterprise: process.env.COACH_OPUS_FOR_ENTERPRISE === "1",
  });

  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      temperature: 0.3,
      stream: true,
      // Sprint S4.4 — TTL 1h. El system prompt no cambia entre turns;
      // 1h evita re-cache de un prompt grande (~600 tokens base + glossary)
      // por cada mensaje. Costo del 25% extra al primer write se amortiza
      // en sesiones de coach >= 2 turns. Ahorro estimado: 60-80% sobre
      // ephemeral 5min default en uso típico.
      system: [
        { type: "text", text: system, cache_control: { type: "ephemeral", ttl: "1h" } },
      ],
      messages: [...history, { role: "user", content: userMsg }],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("upstream_error", { status: 502 });
  }

  // Sprint S5.1 — bump quota counter. Upsert por (userId, year, month).
  // Best-effort: si falla, no rompemos la stream del coach.
  const modelTier = getCoachQuota(plan).modelTier;
  await orm.coachUsage.upsert({
    where: { userId_year_month: { userId: session.user.id, year: period.year, month: period.month } },
    create: {
      userId: session.user.id,
      orgId: orgId || null,
      year: period.year,
      month: period.month,
      requests: 1,
      modelTier,
    },
    update: {
      requests: { increment: 1 },
      modelTier,
    },
  }).catch(() => {});

  await auditLog({ orgId, actorId: session.user.id, action: "coach.query", payload: { chars: lastUser.length, plan, used: quota.used + 1, max: quota.max } })
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
