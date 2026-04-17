import { redirect } from "next/navigation";

export default async function QuickIgnition({ searchParams }) {
  const sp = (await searchParams) || {};
  const params = new URLSearchParams();
  params.set("t", "entrada");
  params.set("source", sp.source || "shortcut");
  params.set("quick", "1");
  if (sp.station) params.set("station", String(sp.station));
  if (sp.slot)    params.set("slot",    String(sp.slot));
  redirect(`/?${params.toString()}`);
}
