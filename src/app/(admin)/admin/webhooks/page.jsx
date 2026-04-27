import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { db } from "@/server/db";
import WebhooksClient from "./WebhooksClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { cssVar, space, font } from "@/components/ui/tokens";

export const dynamic = "force-dynamic";
export const metadata = { title: "Webhooks · Admin" };

export default async function Webhooks() {
  const session = await auth();
  if (!session?.user) return null;
  const org = await resolveOrg();
  if (!org) return null;

  // BUG FIX — db() es async; antes db().webhook era undefined → page rompía
  // silenciosamente. Mismo patrón que se ha visto en otras pages a lo largo
  // de los sprints (api-keys Sprint 5, etc).
  const orm = await db();
  const hooks = await orm.webhook.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, url: true, events: true, active: true,
      secret: true, createdAt: true,
      // Sprint 17 — campos de rotation
      prevSecret: true, prevSecretExpiresAt: true, secretRotatedAt: true,
    },
  });
  const initial = hooks.map((h) => ({
    id: h.id, url: h.url, events: h.events, active: h.active,
    secretTail: (h.secret || "").slice(-4),
    createdAt: h.createdAt.toISOString(),
    // Boolean flag — no exponemos prevSecret en el client (sólo si existe).
    hasPrevSecret: !!h.prevSecret,
    prevSecretExpiresAt: h.prevSecretExpiresAt ? h.prevSecretExpiresAt.toISOString() : null,
    secretRotatedAt: h.secretRotatedAt ? h.secretRotatedAt.toISOString() : null,
  }));
  return (
    <article style={{ color: cssVar.text, fontFamily: cssVar.fontSans }}>
      <PageHeader
        eyebrow="Producto · integraciones"
        italic="Eventos"
        title="firmados, en tiempo real."
        subtitle="HMAC-SHA256 con Standard Webhooks. 8 reintentos con backoff exponencial. Rotación de secrets con overlap (zero-downtime)."
      />
      <WebhooksClient initial={initial} />
    </article>
  );
}
