import { db } from "@/server/db";
import { auth } from "@/server/auth";

export const metadata = { title: "Integraciones · Admin" };

const CATALOG = [
  { id: "slack",   name: "Slack",        desc: "Recordatorios y resumen semanal en canal." },
  { id: "teams",   name: "Microsoft Teams", desc: "Tarjetas adaptativas con métricas de cohorte." },
  { id: "okta",    name: "Okta (SCIM)",  desc: "Provisioning y deprovisioning automático." },
  { id: "workday", name: "Workday",      desc: "Sincroniza equipos y managers desde HRIS." },
];

export default async function IntegrationsPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const installed = await orm.integration.findMany({ where: { orgId } });
  const byProvider = Object.fromEntries(installed.map((i) => [i.provider, i]));

  return (
    <>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Integraciones</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Conecta BIO-IGNICIÓN con el stack de tu organización. Cada integración corre con
        credenciales mínimas y revocables desde aquí.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12, marginTop: 20 }}>
        {CATALOG.map((p) => {
          const inst = byProvider[p.id];
          const enabled = inst?.enabled;
          return (
            <div key={p.id} style={{
              padding: 18,
              borderRadius: 14,
              border: `1px solid ${enabled ? "#10B981" : "#064E3B"}`,
              background: enabled ? "rgba(16,185,129,.08)" : "transparent",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: 16 }}>{p.name}</h2>
                {inst && (
                  <span style={{ fontSize: 11, color: enabled ? "#34D399" : "#F59E0B" }}>
                    {enabled ? "● Activa" : "● Pausada"}
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "#A7F3D0" }}>{p.desc}</p>
              <form
                action={inst ? `/api/v1/integrations/${inst.id}` : "/api/v1/integrations"}
                method="post"
                style={{ marginTop: "auto" }}
              >
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="provider" value={p.id} />
                {inst && <input type="hidden" name="_method" value={enabled ? "PAUSE" : "RESUME"} />}
                <button style={btn}>
                  {inst ? (enabled ? "Pausar" : "Reactivar") : "Conectar"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: "#6EE7B7" }}>
        ¿No ves tu herramienta? Usa <a href="/admin/webhooks" style={{ color: "#A7F3D0" }}>Webhooks</a> para
        conectar cualquier sistema con eventos <code>session.completed</code> y <code>status.incident</code>.
      </p>
    </>
  );
}

const btn = {
  padding: "8px 14px",
  borderRadius: 10,
  background: "linear-gradient(135deg,#059669,#10B981)",
  color: "#fff",
  border: 0,
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 13,
};
