export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import IntegrationsClient from "./IntegrationsClient";

export const metadata = { title: "Integraciones · Admin" };

const CATALOG = [
  { id: "slack",   name: "Slack",           desc: "Recordatorios y resumen semanal en canal." },
  { id: "teams",   name: "Microsoft Teams", desc: "Tarjetas adaptativas con métricas de cohorte." },
  { id: "okta",    name: "Okta (SCIM)",     desc: "Provisioning y deprovisioning automático." },
  { id: "workday", name: "Workday",         desc: "Sincroniza equipos y managers desde HRIS." },
];

export default async function IntegrationsPage() {
  const session = await auth();
  const orgId = session?.memberships?.find((m) => ["OWNER", "ADMIN"].includes(m.role))?.orgId;
  if (!orgId) return null;
  const orm = await db();
  const installed = await orm.integration.findMany({ where: { orgId } });
  const byProvider = Object.fromEntries(installed.map((i) => [i.provider, {
    id: i.id, enabled: i.enabled, lastSyncAt: i.config?.lastSyncAt || null,
  }]));

  return (
    <>
      <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>Integraciones</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Conecta BIO-IGNICIÓN con el stack de tu organización. Cada integración corre con
        credenciales mínimas y revocables desde aquí.
      </p>
      <IntegrationsClient orgId={orgId} catalog={CATALOG} installed={byProvider} />
      <p style={{ marginTop: 24, fontSize: 12, color: "#6EE7B7" }}>
        ¿No ves tu herramienta? Usa <a href="/admin/webhooks" style={{ color: "#A7F3D0" }}>Webhooks</a> para
        conectar cualquier sistema con eventos <code>session.completed</code> y <code>status.incident</code>.
      </p>
    </>
  );
}
