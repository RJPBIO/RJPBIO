import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { getServerLocale } from "@/lib/locale-server";
import LinkEmailClient from "./LinkEmailClient";

export const metadata = { title: "Vincula tu correo", alternates: { canonical: "/account/link-email" } };
export const dynamic = "force-dynamic";

export default async function LinkEmailPage({ searchParams }) {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/account/link-email");
  const locale = await getServerLocale();
  const sp = (await searchParams) || {};
  return <LinkEmailClient locale={locale} next={sp.next || "/app"} currentEmail={session.user.email} />;
}
