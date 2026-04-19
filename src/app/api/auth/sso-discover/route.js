/* SSO Discovery — maps email domain → configured IdP provider.
   Org.ssoDomain / Org.ssoProvider drive the lookup. Respond 200 with
   { provider, domain } if federated, 204 otherwise. No auth required
   (we only reveal the presence of federation, not the organization). */
import { db } from "@/server/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const domain = (searchParams.get("domain") || "").toLowerCase().trim();
  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    return new Response(null, { status: 400 });
  }
  try {
    const orm = await db();
    const org = await orm.org.findUnique({ where: { ssoDomain: domain } });
    if (!org?.ssoProvider) return new Response(null, { status: 204 });
    return Response.json({ provider: org.ssoProvider, domain });
  } catch {
    return new Response(null, { status: 204 });
  }
}
