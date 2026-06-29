/* Wearable provider → BIO ingress webhook.
   POST /api/integrations/wearables/{whoop|oura|garmin|apple|fitbit}/ingest
   - Verifies provider-specific HMAC signature.
   - Persists raw event to WearableEvent (for reprocessing).
   - Does NOT join to our User model yet — that happens in a separate
     reconciliation job (requires external-id mapping). */

import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { getProvider, verify, normalize } from "@/server/wearables";
import { headers } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
  const { provider } = await params;
  const cfg = getProvider(provider);
  if (!cfg) return new Response("unknown provider", { status: 404 });

  const raw = await request.text();
  const h = await headers();
  const sig = h.get(cfg.sigHeader);

  const v = verify(provider, raw, sig);
  if (!v.ok) {
    await auditLog({
      action: "wearable.ingest.rejected",
      payload: { provider, reason: v.reason || "invalid_signature" },
    }).catch(() => {});
    return new Response("invalid signature", { status: 401 });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }

  // BUG FIX: normalize() podía lanzar con un payload firmado-pero-inesperado y
  // wearableEvent.create no estaba guardado. Un throw devolvía 500, y los
  // providers tratan 5xx como "reintentar" → redelivery infinito + evento crudo
  // perdido. Ahora: persistir SIEMPRE el evento crudo (kind="unknown" si no se
  // pudo normalizar) y reservar 5xx sólo para errores reales de DB (reintento
  // legítimo). Un payload no-normalizable se acepta (200) para no loopear.
  let kind = "unknown";
  let userExt = null;
  try {
    const norm = normalize(provider, event);
    kind = norm.kind;
    userExt = norm.userExt;
  } catch (e) {
    await auditLog({
      action: "wearable.ingest.normalize_failed",
      payload: { provider, error: String(e?.message || e).slice(0, 200) },
    }).catch(() => {});
  }

  const orm = await db();
  try {
    await orm.wearableEvent.create({
      data: {
        provider,
        kind,
        payload: { ...event, _externalUserId: userExt },
      },
    });
  } catch (e) {
    await auditLog({
      action: "wearable.ingest.error",
      payload: { provider, error: String(e?.message || e).slice(0, 200) },
    }).catch(() => {});
    return new Response("ingest_failed", { status: 500 });
  }

  await auditLog({
    action: "wearable.ingest.ok",
    payload: { provider, kind, userExt },
  }).catch(() => {});

  return Response.json({ received: true });
}
