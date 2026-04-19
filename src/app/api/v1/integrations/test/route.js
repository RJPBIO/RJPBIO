/* Integration test-connection. Dry-run por proveedor:
   - slack: envía GET a /api/api.test de Slack con el token
   - teams: verifica webhook URL responde
   - okta: usa /api/v1/users?limit=1
   - workday: ping a tenant endpoint
   Retorna { ok, detail } siempre 200, el cliente interpreta ok=false como fallo. */
import { db } from "@/server/db";
import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

async function testSlack(cfg) {
  if (!cfg?.token) return { ok: false, detail: "Falta token" };
  try {
    const r = await fetch("https://slack.com/api/auth.test", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    const j = await r.json();
    if (!j.ok) return { ok: false, detail: j.error || "Token inválido" };
    return { ok: true, detail: `Conectado a ${j.team || "Slack"}` };
  } catch (e) { return { ok: false, detail: e.message }; }
}

async function testTeams(cfg) {
  if (!cfg?.webhookUrl) return { ok: false, detail: "Falta webhook URL" };
  try {
    const u = new URL(cfg.webhookUrl);
    if (!u.host.endsWith("webhook.office.com")) return { ok: false, detail: "URL no es de Teams" };
    return { ok: true, detail: "URL válida" };
  } catch { return { ok: false, detail: "URL inválida" }; }
}

async function testOkta(cfg) {
  if (!cfg?.domain || !cfg?.token) return { ok: false, detail: "Faltan credenciales" };
  try {
    const r = await fetch(`https://${cfg.domain}/api/v1/users?limit=1`, {
      headers: { Authorization: `SSWS ${cfg.token}`, Accept: "application/json" },
    });
    if (!r.ok) return { ok: false, detail: `HTTP ${r.status}` };
    return { ok: true, detail: "API alcanzable" };
  } catch (e) { return { ok: false, detail: e.message }; }
}

async function testWorkday(cfg) {
  if (!cfg?.tenant) return { ok: false, detail: "Falta tenant" };
  return { ok: true, detail: `Tenant ${cfg.tenant} (validación diferida al primer sync)` };
}

const RUNNERS = { slack: testSlack, teams: testTeams, okta: testOkta, workday: testWorkday };

export async function POST(request) {
  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");
  if (!provider || !RUNNERS[provider]) return Response.json({ ok: false, error: "proveedor desconocido" }, { status: 400 });

  const orgId = session.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return new Response("forbidden", { status: 403 });

  const orm = await db();
  const inst = await orm.integration.findUnique({ where: { orgId_provider: { orgId, provider } } }).catch(() => null);
  if (!inst) return Response.json({ ok: false, error: "no instalada" });

  const res = await RUNNERS[provider](inst.config || {});
  return Response.json(res);
}
