import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { db } from "@/server/db";
import WebhooksClient from "./WebhooksClient";
import { cssVar, space, font } from "@/components/ui/tokens";

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
    <article style={{
      maxWidth: 960,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <h1 style={{
        margin: 0,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
      }}>
        Webhooks
      </h1>
      <p style={{
        color: cssVar.textMuted,
        marginTop: space[1],
        fontSize: font.size.sm,
      }}>
        Recibe eventos firmados (HMAC-SHA256, Standard Webhooks). Hasta 8 reintentos con backoff exponencial.
      </p>
      <WebhooksClient initial={initial} />
    </article>
  );
}
