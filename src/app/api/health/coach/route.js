/* GET /api/health/coach — diagnostic endpoint para el Coach LLM en prod.
   Reporta cada pre-requisito en orden de chequeo del handler real
   (CSRF cookie, session, MFA, quota, ANTHROPIC_API_KEY, modelo).
   Sin gastar Anthropic credits (NO hace call real al LLM).
   Acceso libre intencional — no expone secretos (solo presencia/longitud).
*/

import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { resolveCoachModel } from "@/lib/coach-model";
import { evaluateQuota, currentBillingPeriod, getCoachQuota } from "@/lib/coach-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const out = {
    time: new Date().toISOString(),
    checks: {},
    issues: [],
  };

  // 1) ANTHROPIC_API_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY;
  out.checks.anthropic_key = {
    set: !!apiKey,
    length: apiKey ? apiKey.length : 0,
    prefix_ok: apiKey ? apiKey.startsWith("sk-ant-") : false,
  };
  if (!apiKey) out.issues.push("ANTHROPIC_API_KEY ausente en env");
  else if (!apiKey.startsWith("sk-ant-")) out.issues.push("ANTHROPIC_API_KEY tiene prefijo raro (no empieza con sk-ant-)");

  // 2) CSRF cookie (lo que el client mandaría como x-csrf-token)
  const csrfCookie = req.cookies?.get?.("bio-csrf")?.value || null;
  out.checks.csrf_cookie = {
    present: !!csrfCookie,
    length: csrfCookie ? csrfCookie.length : 0,
  };
  if (!csrfCookie) out.issues.push("Cookie bio-csrf ausente — el browser no la tiene. Middleware no la emitió o el browser no la mandó. CoachV2 fetch fallará 403.");

  // 3) Session (auth)
  let session = null;
  try {
    session = await auth();
    out.checks.session = {
      present: !!session?.user,
      userId: session?.user?.id ? session.user.id.slice(0, 8) + "..." : null,
      email_present: !!session?.user?.email,
      hasSecurityPolicies: Array.isArray(session?.securityPolicies),
      policiesRequireMfa: Array.isArray(session?.securityPolicies)
        ? session.securityPolicies.filter((p) => p?.requireMfa).length
        : 0,
    };
  } catch (e) {
    out.checks.session = { present: false, error: e?.message || String(e) };
  }
  if (!session?.user) out.issues.push("No hay sesión — el endpoint Coach devolverá 401");

  // 4) MFA policy gate (mismo cálculo que enforceMfaIfPolicyDemands)
  if (session?.user) {
    const demanding = (session.securityPolicies || []).filter((p) => p?.requireMfa);
    out.checks.mfa_gate = {
      orgs_demanding_mfa: demanding.length,
      user_mfa_enabled: !!session.user.mfaEnabled,
    };
    if (demanding.length > 0 && !session.user.mfaEnabled) {
      out.issues.push("Algún org demanda MFA pero el user no tiene MFA setup → 403");
    }
  }

  // 5) Plan resolution + quota
  if (session?.user) {
    try {
      const orm = await db();
      const slug = `personal-${session.user.id}`;
      const personalOrg = await orm.org.findUnique({ where: { slug } }).catch(() => null);
      const plan = (personalOrg?.plan || "FREE").toUpperCase();
      const period = currentBillingPeriod();
      const usage = await orm.coachUsage.findUnique({
        where: { userId_year_month: { userId: session.user.id, year: period.year, month: period.month } },
      }).catch(() => null);
      const quota = evaluateQuota(usage, plan);
      const cap = getCoachQuota(plan);
      const model = resolveCoachModel(plan, {
        envOverride: process.env.COACH_MODEL,
        opusEnterprise: process.env.COACH_OPUS_FOR_ENTERPRISE === "1",
      });

      out.checks.plan_and_quota = {
        plan,
        modelTier: cap.modelTier,
        model_id: model,
        period,
        used: quota.used,
        max: quota.max === Infinity ? "unlimited" : quota.max,
        ok: quota.ok,
        personalOrg_exists: !!personalOrg,
      };
      if (!quota.ok) out.issues.push(`Quota agotada: ${quota.used}/${quota.max} en ${period.year}-${period.month}`);
      if (!personalOrg) out.issues.push("Personal-org no existe — debería crearse en signin. Plan default = FREE (Haiku).");
    } catch (e) {
      out.checks.plan_and_quota = { error: e?.message || String(e) };
      out.issues.push(`DB error en quota lookup: ${e?.message || e}`);
    }
  }

  // 6) Env overrides interesantes
  out.checks.env_overrides = {
    COACH_MODEL: process.env.COACH_MODEL || null,
    COACH_OPUS_FOR_ENTERPRISE: process.env.COACH_OPUS_FOR_ENTERPRISE === "1",
  };

  // 7) Anthropic API connectivity (sin spend de tokens — count_tokens es gratis)
  if (apiKey) {
    try {
      const pingResp = await fetch("https://api.anthropic.com/v1/messages/count_tokens", {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          messages: [{ role: "user", content: "ping" }],
        }),
      });
      let body = null;
      try { body = await pingResp.json(); } catch {}
      out.checks.anthropic_connectivity = {
        status: pingResp.status,
        ok: pingResp.ok,
        body_summary: pingResp.ok
          ? { input_tokens: body?.input_tokens }
          : { error_type: body?.error?.type, error_message: (body?.error?.message || "").slice(0, 200) },
      };
      if (!pingResp.ok) {
        out.issues.push(`Anthropic API rechazó: ${pingResp.status} ${body?.error?.type || "unknown"} - ${(body?.error?.message || "").slice(0, 120)}`);
      }
    } catch (e) {
      out.checks.anthropic_connectivity = { error: e?.message || String(e) };
      out.issues.push(`Anthropic API unreachable: ${e?.message || e}`);
    }
  }

  out.status = out.issues.length === 0 ? "healthy" : "unhealthy";
  return NextResponse.json(out, { headers: { "Cache-Control": "no-store" } });
}
