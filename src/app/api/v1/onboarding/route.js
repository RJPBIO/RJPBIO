import { db } from "../../../../server/db";
import { randomUUID } from "node:crypto";
import { auditLog } from "../../../../server/audit";
import { sendWelcome } from "../../../../server/email";
import { newTenantKey } from "../../../../server/kms";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { email, name, orgName, plan = "STARTER", region = "US" } = await request.json();
  if (!email || !orgName) return new Response("invalid", { status: 422 });
  const client = db();
  const orgId = randomUUID();
  const userId = randomUUID();
  const { wrapped } = await newTenantKey();
  await client.org.create({ data: { id: orgId, name: orgName, slug: slugify(orgName) + "-" + orgId.slice(0, 6), plan, region, seats: 5, brandingJson: { encryption: { wrapped } } } });
  await client.user.create({ data: { id: userId, email, name, locale: "es" } });
  await client.membership.create({ data: { id: randomUUID(), userId, orgId, role: "OWNER" } });
  await auditLog({ orgId, actorId: userId, action: "org.created", payload: { plan, region } });
  await sendWelcome({ to: email, name }).catch(() => {});
  return Response.json({ orgId, userId }, { status: 201 });
}

function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}
