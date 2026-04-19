import MfaClient from "./MfaClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Verificación",
  alternates: { canonical: "/mfa" },
};
export const dynamic = "force-dynamic";

export default async function MfaPage() {
  const locale = await getServerLocale();
  return <MfaClient locale={locale} />;
}
