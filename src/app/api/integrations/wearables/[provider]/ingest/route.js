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

  const { kind, userExt } = normalize(provider, event);
  const orm = await db();

  await orm.wearableEvent.create({
    data: {
      provider,
      kind,
      payload: { ...event, _externalUserId: userExt },
    },
  });

  await auditLog({
    action: "wearable.ingest.ok",
    payload: { provider, kind, userExt },
  }).catch(() => {});

  return Response.json({ received: true });
}
