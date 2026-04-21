import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { headers } from "next/headers";
import StationsClient from "./StationsClient.jsx";

export const metadata = { title: "Estaciones · Admin" };
export const dynamic = "force-dynamic";

export default async function StationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/admin/stations");
  const adminOrgs = (session.memberships || []).filter((m) => ["OWNER", "ADMIN"].includes(m.role));
  if (!adminOrgs.length) redirect("/app");

  const orgId = adminOrgs[0].orgId;
  const orm = await db();
  const stations = await orm.station.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, location: true, policy: true, active: true, lastTapAt: true, createdAt: true },
  });

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") || "https"}://${h.get("host") || "localhost:3000"}`;

  return <StationsClient orgId={orgId} origin={origin} initial={stations.map(serialize)} />;
}

function serialize(s) {
  return { ...s, lastTapAt: s.lastTapAt?.toISOString() || null, createdAt: s.createdAt.toISOString() };
}
