import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { db } from "@/server/db";
import ApiKeysClient from "./ApiKeysClient";
import { cssVar, space, font } from "@/components/ui/tokens";

export const dynamic = "force-dynamic";
export const metadata = { title: "API keys · Admin" };

export default async function ApiKeys() {
  const session = await auth();
  if (!session?.user) return null;
  const org = await resolveOrg();
  if (!org) return null;
  // BUG FIX (Sprint 5): db() es async — antes db().apiKey accedía a
  // .apiKey en la Promise, que es undefined. Lista de keys siempre vacía.
  // Mismo patrón que el bug de invitations en Sprint 3.
  const orm = await db();
  const keys = await orm.apiKey.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, prefix: true, scopes: true,
      createdAt: true, lastUsedAt: true, revokedAt: true,
      // Sprint 15
      expiresAt: true, lastUsedIp: true,
    },
  });
  const serialized = keys.map((k) => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
    expiresAt: k.expiresAt ? k.expiresAt.toISOString() : null,
  }));
  // Plan del org para mostrar quotas en UI.
  const orgFull = await orm.org.findUnique({ where: { id: org.id }, select: { plan: true } });
  const plan = orgFull?.plan || "FREE";
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
        API keys
      </h1>
      <p style={{
        color: cssVar.textMuted,
        marginTop: space[1],
        fontSize: font.size.sm,
      }}>
        Autentica integraciones server-to-server con Bearer tokens. Cada clave tiene scopes y un prefijo trazable.
      </p>
      <ApiKeysClient initial={serialized} plan={plan} />
    </article>
  );
}
