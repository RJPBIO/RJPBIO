/* ═══════════════════════════════════════════════════════════════
   Cron task runner — common scaffolding (Sprint S2)
   ═══════════════════════════════════════════════════════════════
   Vercel Cron invoca /api/cron/[task] con header
   `Authorization: Bearer ${CRON_SECRET}`. Este módulo:

   1. Verifica el secret (timing-safe).
   2. Registra el run en audit log con start/end timestamps + result.
   3. Captura excepciones y devuelve 200 (Vercel Cron no quiere 500s
      en runs idempotentes; el error queda en audit + log).
   4. Limita timeout: cada task corre con AbortSignal a 50s (Vercel
      Pro cap 60s) — evita que un task lento bloquee al runner.

   Cada task es una función `async () => {processed, errors, details?}`.
   El runner agrega timing + dispatcha audit + responde JSON.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import { auditLog } from "../audit";

const TIMEOUT_MS = 50_000;

function constantTimeEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/**
 * Verifica que la request venga de Vercel Cron (o un caller con secret).
 * Acepta:
 *  - Authorization: Bearer <CRON_SECRET>
 *  - x-vercel-cron-signature (header que Vercel inyecta — fallback presence check)
 *
 * Devuelve null si OK, Response 401 si falla.
 */
export function verifyCronAuth(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Sin secret configurado, permitimos solo header de Vercel (defensa parcial).
    if (request.headers.get("x-vercel-cron")) return null;
    return new Response("CRON_SECRET not configured and no x-vercel-cron header", { status: 401 });
  }
  const auth = request.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return new Response("Missing bearer token", { status: 401 });
  if (!constantTimeEq(match[1], secret)) return new Response("Invalid token", { status: 401 });
  return null;
}

/**
 * Ejecuta una task con timeout + audit logging + error capture.
 * Devuelve un Response JSON.
 *
 * @param {string} taskName
 * @param {() => Promise<object>} taskFn - debe devolver { processed, errors?, details? }
 */
export async function runTask(taskName, taskFn) {
  const startedAt = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  let result;
  let errorMsg = null;
  try {
    result = await Promise.race([
      taskFn({ signal: ctrl.signal }),
      new Promise((_, rej) => ctrl.signal.addEventListener("abort", () => rej(new Error("timeout")))),
    ]);
  } catch (e) {
    errorMsg = String(e?.message || e || "unknown");
    result = { processed: 0, errors: 1, errorMessage: errorMsg };
  } finally {
    clearTimeout(timer);
  }
  const durationMs = Date.now() - startedAt;

  await auditLog({
    action: `cron.${taskName}`,
    payload: {
      durationMs,
      ...(result || {}),
    },
  }).catch(() => {});

  return Response.json(
    {
      task: taskName,
      ok: errorMsg === null,
      durationMs,
      ...(result || {}),
    },
    { status: 200 }
  );
}

/**
 * Catálogo de tasks disponibles. Cada export devuelve la función a correr.
 * El handler /api/cron/[task] consulta este catálogo.
 */
export const TASK_REGISTRY = {
  "audit-prune":         () => import("./audit-prune.js").then((m) => m.runAuditPrune),
  "audit-verify":        () => import("./audit-verify.js").then((m) => m.runAuditVerify),
  "audit-export":        () => import("./audit-export.js").then((m) => m.runAuditExportSweep),
  "dsar-sweep":          () => import("./dsar-sweep.js").then((m) => m.runDsarSweep),
  "maintenance-notify":  () => import("./maintenance-notify.js").then((m) => m.runMaintenanceNotify),
  "incident-broadcast":  () => import("./incident-broadcast.js").then((m) => m.runIncidentBroadcast),
  "trial-end-reminder":  () => import("./trial-end-reminder.js").then((m) => m.runTrialEndReminder),
  "webhook-retry":       () => import("./webhook-retry.js").then((m) => m.runWebhookRetry),
  "dunning-check":       () => import("./dunning-check.js").then((m) => m.runDunningCheck),
  "push-deliver":        () => import("./push-deliver.js").then((m) => m.runPushDeliver),
  "weekly-summary":      () => import("./weekly-summary.js").then((m) => m.runWeeklySummary),
};
