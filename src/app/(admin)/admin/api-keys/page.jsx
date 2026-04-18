import { auth } from "@/server/auth";
import { resolveOrg } from "@/server/tenancy";
import { db } from "@/server/db";
import ApiKeysClient from "./ApiKeysClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "API keys · Admin" };

export default async function ApiKeys() {
  const session = await auth();
  if (!session?.user) return null;
  const org = await resolveOrg();
  if (!org) return null;
  const keys = await db().apiKey.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, prefix: true, scopes: true, createdAt: true, lastUsedAt: true, revokedAt: true },
  });
  const serialized = keys.map((k) => ({
    ...k,
    createdAt: k.createdAt.toISOString(),
    lastUsedAt: k.lastUsedAt ? k.lastUsedAt.toISOString() : null,
    revokedAt: k.revokedAt ? k.revokedAt.toISOString() : null,
  }));
  return (
    <article style={{ maxWidth: 960, margin: "0 auto", padding: "36px 24px", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0 }}>API keys</h1>
      <p style={{ color: "#A7F3D0", marginTop: 4, fontSize: 13 }}>
        Autentica integraciones server-to-server con Bearer tokens. Cada clave tiene scopes y un prefijo trazable.
      </p>
      <ApiKeysClient initial={serialized} />
    </article>
  );
}
