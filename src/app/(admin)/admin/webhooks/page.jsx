import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { db } from "@/server/db";
import WebhooksClient from "./WebhooksClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Webhooks · Admin" };

export default async function Webhooks() {
  const session = await auth();
  if (!session?.user) return null;
  const org = await resolveOrg();
  if (!org) return null;
  const hooks = await db().webhook.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, url: true, events: true, active: true, secret: true, createdAt: true },
  });
  const initial = hooks.map((h) => ({
    id: h.id, url: h.url, events: h.events, active: h.active,
    secretTail: (h.secret || "").slice(-4),
    createdAt: h.createdAt.toISOString(),
  }));
  return (
    <article style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0 }}>Webhooks</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Recibe eventos firmados (HMAC-SHA256, Standard Webhooks). Hasta 8 reintentos con backoff exponencial.
      </p>
      <WebhooksClient initial={initial} />
    </article>
  );
}
