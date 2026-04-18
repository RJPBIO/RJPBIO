export const dynamic = "force-dynamic";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import IntegrationsClient from "./IntegrationsClient";
import { cssVar, space, font } from "@/components/ui/tokens";

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
      <h1 style={{
        margin: 0,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
        color: cssVar.text,
      }}>
        Integraciones
      </h1>
      <p style={{
        color: cssVar.textMuted,
        marginTop: space[1],
        fontSize: font.size.sm,
        lineHeight: 1.5,
      }}>
        Conecta BIO-IGNICIÓN con el stack de tu organización. Cada integración corre con
        credenciales mínimas y revocables desde aquí.
      </p>
      <IntegrationsClient orgId={orgId} catalog={CATALOG} installed={byProvider} />
      <p style={{
        marginTop: space[5],
        fontSize: font.size.xs,
        color: cssVar.textMuted,
      }}>
        ¿No ves tu herramienta? Usa{" "}
        <a href="/admin/webhooks" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>Webhooks</a>{" "}
        para conectar cualquier sistema con eventos{" "}
        <code style={{ fontFamily: cssVar.fontMono, color: cssVar.text }}>session.completed</code> y{" "}
        <code style={{ fontFamily: cssVar.fontMono, color: cssVar.text }}>status.incident</code>.
      </p>
    </>
  );
}
