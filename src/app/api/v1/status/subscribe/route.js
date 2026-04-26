/* POST /api/v1/status/subscribe — público (rate-limit del middleware
   cubre abuso); body: { email? | webhookUrl?, components?: string[] }.
   Email channel: envía verify magic-link. Webhook channel: verified=true.
*/

import { subscribe } from "@/server/incident-subscribers";
import { validateSubscribeInput } from "@/lib/incident-subscribers";

export const dynamic = "force-dynamic";

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "bad_json" }, { status: 400 }); }

  const v = validateSubscribeInput(body);
  if (!v.ok) {
    return Response.json({ error: "invalid_input", details: v.errors }, { status: 422 });
  }

  const r = await subscribe(v.value);
  if (!r.ok) return Response.json({ error: r.error }, { status: 500 });

  return Response.json({
    ok: true,
    alreadyExists: !!r.alreadyExists,
    pendingVerification: !!r.subscriber.email && !r.subscriber.verified,
    channel: r.subscriber.email ? "email" : "webhook",
  }, { status: 201 });
}
