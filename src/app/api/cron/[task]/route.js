/* /api/cron/[task] — Vercel Cron dispatcher (Sprint S2.1)
 *
 * Tasks registradas en src/server/cron/runner.js TASK_REGISTRY.
 * Auth: Bearer ${CRON_SECRET} O header `x-vercel-cron`.
 *
 * Vercel Cron expected setup en vercel.json — ver vercel.json en raíz.
 */

import { TASK_REGISTRY, runTask, verifyCronAuth } from "@/server/cron/runner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  return handle(request, params);
}

// Vercel Cron por defecto envía GET. Algunas integraciones usan POST.
// Aceptamos ambos para flexibilidad.
export async function POST(request, { params }) {
  return handle(request, params);
}

async function handle(request, paramsPromise) {
  const authError = verifyCronAuth(request);
  if (authError) return authError;

  const { task } = await paramsPromise;
  const loader = TASK_REGISTRY[task];
  if (!loader) {
    return Response.json(
      { error: "unknown_task", task, available: Object.keys(TASK_REGISTRY) },
      { status: 404 }
    );
  }

  let taskFn;
  try {
    taskFn = await loader();
  } catch (e) {
    return Response.json(
      { error: "task_load_failed", task, message: String(e?.message || e) },
      { status: 500 }
    );
  }

  return runTask(task, taskFn);
}
