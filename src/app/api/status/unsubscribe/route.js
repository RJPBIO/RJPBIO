/* GET /api/status/unsubscribe?token=... — one-click unsubscribe sin auth.
   El unsubscribeToken es secreto-pero-no-PII; legitimate use case
   permite click directo desde footer del email. */

import { unsubscribeByToken } from "@/server/incident-subscribers";
import { isValidToken } from "@/lib/incident-subscribers";

export const dynamic = "force-dynamic";

function html(title, message, color) {
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
a { color: #10B981; }
</style></head><body>
<div class="card">
  <div class="bar"></div>
  <h1>${title}</h1>
  <p>${message}</p>
  <p style="font-size:13px"><a href="/status">Volver al status page</a></p>
</div>
</body></html>`;
}

export async function GET(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!isValidToken(token)) {
    return new Response(html("Link inválido", "Este link de unsubscribe es inválido. Si quieres cancelar, ignora futuros emails — eventualmente paramos.", "#EF4444"), {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  const r = await unsubscribeByToken(token);
  if (!r.ok && r.error === "not_found") {
    return new Response(html("Ya cancelada", "No hay suscripción activa con este token. Quizás ya cancelaste antes.", "#6B7280"), {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  if (!r.ok) {
    return new Response(html("Error", "No pudimos procesar la cancelación. Intenta de nuevo en unos minutos.", "#EF4444"), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
  return new Response(html("Suscripción cancelada", "Ya no recibirás notificaciones del status page. Puedes volver a suscribirte cuando quieras.", "#10B981"), {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}
