import { db } from "../../../../server/db";
import { randomUUID } from "node:crypto";
import { auditLog } from "../../../../server/audit";
import { sendWelcome } from "../../../../server/email";
import { newTenantKey } from "../../../../server/kms";
import { check } from "../../../../server/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const rl = await check(`onboarding:${ip}`, { limit: 5, windowMs: 60 * 60_000 });
  if (!rl.ok) return new Response("rate_limited", { status: 429, headers: { "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)) } });

  const body = await request.json().catch(() => ({}));
  const { email, name, orgName, plan = "STARTER", region = "US", dpaAccepted, teamSize } = body;
  if (!email || !orgName) return new Response("invalid", { status: 422 });
  if (!dpaAccepted) return new Response("dpa_required", { status: 422 });
  const TEAM_SIZES = ["solo", "2-25", "26-100", "101-500", "500+"];
  const teamSizeClean = TEAM_SIZES.includes(teamSize) ? teamSize : null;
  // Locale del body > cookie > Accept-Language > "es"
  const cookieLocale = request.cookies?.get?.("bio-locale")?.value;
  const acceptLocale = (request.headers.get("accept-language") || "").split(",")[0]?.split("-")[0]?.toLowerCase() || "";
  const supported = ["es", "en", "pt", "fr", "de", "it", "nl", "ja", "ko", "zh", "ar", "he"];
  const locale = [body.locale, cookieLocale, acceptLocale, "es"].find((l) => supported.includes(l)) || "es";

  const client = await db();
  const orgId = randomUUID();
  const userId = randomUUID();
  const { wrapped } = await newTenantKey();
  await client.org.create({
    data: {
      id: orgId,
      name: orgName,
      slug: slugify(orgName) + "-" + orgId.slice(0, 6),
      plan, region, seats: 5,
      dpaAccepted: new Date(dpaAccepted),
      branding: { encryption: { wrapped } },
    },
  });
  await client.user.create({ data: { id: userId, email, name, locale } });
  await client.membership.create({ data: { id: randomUUID(), userId, orgId, role: "OWNER" } });
  await auditLog({ orgId, actorId: userId, action: "org.created", payload: { plan, region, dpaAccepted, teamSize: teamSizeClean } });
  await sendWelcome({ to: email, name, locale }).catch(() => {});
  return Response.json({ orgId, userId }, { status: 201 });
}

function slugify(s) {
  return String(s).toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
}
