/* GET /api/status/verify?token=... — confirma email subscription.
   Sin auth (token == bearer). Renderiza HTML simple. */

import { verifyEmailSubscription } from "@/server/incident-subscribers";
import { isValidToken } from "@/lib/incident-subscribers";

export const dynamic = "force-dynamic";

function html(title, message, color = "#10B981") {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/>
<title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
body { font-family: system-ui, -apple-system, sans-serif; background: #F8FAFC;
       color: #0F172A; padding: 48px 16px; max-width: 480px; margin: 0 auto; }
.card { background: white; border-radius: 12px; padding: 32px;
       box-shadow: 0 1px 3px rgba(0,0,0,0.05); text-align: center; }
.bar { height: 4px; background: ${color}; border-radius: 2px;
       margin: -32px -32px 24px; }
h1 { margin: 0 0 8px; font-size: 24px; }
p { color: #64748B; margin: 0 0 24px; line-height: 1.6; }
a.btn { display: inline-block; padding: 12px 24px; background: ${color};
       color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }
</style></head><body>
<div class="card">
  <div class="bar"></div>
  <h1>${title}</h1>
  <p>${message}</p>
  <a class="btn" href="/status">Ir al status page</a>
</div>
</body></html>`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!isValidToken(token)) {
    return new Response(html("Token inválido", "El link de verificación es inválido o ya fue usado.", "#EF4444"), {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  const r = await verifyEmailSubscription(token);
  if (!r.ok) {
    return new Response(html("Token expirado", "Este link de verificación ya fue usado o expiró. Suscríbete de nuevo desde /status.", "#F59E0B"), {
      status: 410,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return new Response(html("¡Suscripción confirmada!", "Te avisaremos por email cuando haya incidents en BIO-IGNICIÓN."), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
