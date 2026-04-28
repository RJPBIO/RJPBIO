/* PWA Sync — POST /api/sync/outbox
   ═══════════════════════════════════════════════════════════════
   Drena el outbox local del PWA al backend Prisma. Recibe un batch
   de entries con shapes específicos por kind.

   Auth: NextAuth session cookie + CSRF double-submit.
   Idempotency: cada entry incluye `id` único; replays no duplican
   gracias a UPSERT por id+userId.

   Kinds soportados (mismo conjunto que outbox local en lib/storage):
     · session             → NeuralSession (estructurado)
     · mood, hrv,
       chronotype, nom035,
       instrument,
       program_start,
       program_complete,
       program_abandon     → mergeados en User.neuralState (JSON)
                            La data estructurada vive ahí hasta que
                            promote a tablas dedicadas en sprints
                            futuros (MoodLog, HrvLog, etc.)

   Response: { synced: [ids], failed: [{id, error}], lastSyncedAt }

   El cliente marca como removed sólo los `synced`. Los `failed`
   reintentaran con backoff exponencial.
   ═══════════════════════════════════════════════════════════════ */

import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import { requireCsrf } from "../../../../server/csrf";
import { check } from "../../../../server/ratelimit";
import { mergeNeuralState } from "../../../../server/sync-merge";
import {
  validateEntry, jsonSize,
  MAX_BATCH, MAX_PAYLOAD_BYTES, MAX_NEURAL_STATE_BYTES,
} from "../../../../lib/sync-validation";

export const dynamic = "force-dynamic";

const RATE_LIMIT = { limit: 60, windowMs: 60_000 }; // 60 req/min/user

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit por usuario — 60 req/min absorbe el debounce 800ms del
  // cliente (~75 max/min) y deja margen. Spam abuser cae en 429.
  const rl = await check(`sync:user:${userId}`, RATE_LIMIT);
  const rateHeaders = {
    "RateLimit-Remaining": String(rl.remaining),
    "RateLimit-Reset": String(rl.reset),
  };
  if (!rl.ok) {
    return Response.json(
      { error: "rate_limited" },
      { status: 429, headers: { ...rateHeaders, "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } }
    );
  }

  // Tamaño body — guard contra payload bombs antes de parsear
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_PAYLOAD_BYTES) {
    return Response.json({ error: "body_too_large", max: MAX_PAYLOAD_BYTES }, { status: 413, headers: rateHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400, headers: rateHeaders });
  }

  const entries = Array.isArray(body?.entries) ? body.entries : null;
  const neuralState = body?.neuralState ?? null;
  if (!entries && !neuralState) {
    return Response.json({ error: "no_payload" }, { status: 400, headers: rateHeaders });
  }
  if (entries && entries.length > MAX_BATCH) {
    return Response.json({ error: "batch_too_large", max: MAX_BATCH }, { status: 413, headers: rateHeaders });
  }
  if (neuralState && jsonSize(neuralState) > MAX_NEURAL_STATE_BYTES) {
    return Response.json(
      { error: "neural_state_too_large", max: MAX_NEURAL_STATE_BYTES },
      { status: 413, headers: rateHeaders }
    );
  }
  // clientVersion para debugging cross-device (qué versión escribió qué)
  const clientVersion = String(request.headers.get("x-client-version") || body?.clientVersion || "").slice(0, 32) || null;

  try {
    const orm = await db();

    // Resolver personal-org del usuario (creado en signIn). Si no existe
    // por algún razón, lo creamos lazily aquí — defensa en profundidad.
    //
    // Sprint 93 — fix race (bug #6 round 2). Antes: findUnique → if-null
    // → create. Patrón check-then-act NO atómico. 2 devices del mismo user
    // sincronizando simultáneamente post-signup pasaban findUnique con
    // null, ambos llamaban create, segundo fallaba con P2002 → 500.
    //
    // Ahora: org.upsert + membership.upsert. Idempotent. La única race
    // residual es si dos requests entran a upsert mismo slug AT THE SAME
    // INSTANT — Postgres serializa con unique constraint y uno gana
    // limpio (no error 500), el otro recibe el row recién creado.
    const slug = `personal-${userId}`;
    const personalOrg = await orm.org.upsert({
      where: { slug },
      create: {
        name: `Personal · ${userId.slice(0, 6)}`,
        slug,
        plan: "FREE",
        personal: true,
        seats: 1,
        seatsUsed: 1,
      },
      update: {}, // no-op si ya existe
    });
    // Membership puede existir o no — depende de si el flujo de signup
    // creó la org pero falló creando membership (Sprint 7). Idempotent.
    await orm.membership.upsert({
      where: { userId_orgId: { userId, orgId: personalOrg.id } },
      create: { userId, orgId: personalOrg.id, role: "OWNER" },
      update: {},
    });

    const synced = [];
    const failed = [];

    // Procesar entries — sólo "session" se promueve a NeuralSession.
    // El resto se acumula en neuralState payload (server-side merge).
    if (entries && entries.length) {
      for (const entry of entries) {
        const ve = validateEntry(entry);
        if (ve) {
          failed.push({ id: entry?.id || null, error: ve });
          continue;
        }
        try {
          if (entry.kind === "session") {
            const p = entry.payload || {};
            await orm.neuralSession.upsert({
              where: { id: entry.id },
              create: {
                id: entry.id,
                orgId: personalOrg.id,
                userId,
                protocolId: String(p.protocolId || p.pid || "unknown").slice(0, 64),
                durationSec: Math.max(0, Math.min(7200, Number(p.durationSec || p.totalDur || 0) | 0)),
                coherenciaDelta: typeof p.coherenciaDelta === "number" ? p.coherenciaDelta : null,
                moodPre: typeof p.moodPre === "number" ? p.moodPre : (typeof p.preMood === "number" ? p.preMood : null),
                moodPost: typeof p.moodPost === "number" ? p.moodPost : (typeof p.checkMood === "number" ? p.checkMood : null),
                completedAt: p.completedAt ? new Date(p.completedAt) : (p.ts ? new Date(p.ts) : new Date()),
                clientVersion: clientVersion || p.clientVersion || null,
              },
              update: {}, // idempotent: existing row no-op
            });
          }
          // Otros kinds (mood, hrv, etc.) se mergean implícitamente vía neuralState
          synced.push(entry.id);
        } catch (e) {
          failed.push({ id: entry.id, error: e?.code || "db_error" });
        }
      }
    }

    // Sprint 90 — fix bug #1 round 2: merge neuralState en lugar de
    // sobrescribir. Antes era last-writer-wins entre devices → user
    // en phone agregaba HRV #101, sync. Laptop con cache pre-#101
    // agregaba HRV #102, sync → server replaza → #101 desaparece.
    // Ahora: cargar neuralState existente, merge por ts/key, persistir.
    // mergeNeuralState() respeta caps históricos para no rebasar tamaño.
    if (neuralState && typeof neuralState === "object") {
      const existing = await orm.user.findUnique({
        where: { id: userId },
        select: { neuralState: true },
      });
      const merged = mergeNeuralState(existing?.neuralState || null, neuralState);
      await orm.user.update({
        where: { id: userId },
        data: {
          neuralState: merged,
          lastSyncedAt: new Date(),
        },
      });
    } else {
      // Marcar lastSyncedAt aunque solo procesemos entries
      await orm.user.update({
        where: { id: userId },
        data: { lastSyncedAt: new Date() },
      });
    }

    await auditLog({
      orgId: personalOrg.id,
      actorId: userId,
      action: "sync.outbox.drain",
      payload: { synced: synced.length, failed: failed.length, clientVersion },
    }).catch(() => {});

    return Response.json(
      { synced, failed, lastSyncedAt: new Date().toISOString() },
      { headers: rateHeaders }
    );
  } catch (e) {
    return Response.json(
      { error: "internal_error", message: "Sync drain failed" },
      { status: 500, headers: rateHeaders }
    );
  }
}
