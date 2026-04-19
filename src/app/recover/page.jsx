import RecoverClient from "./RecoverClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Recuperar acceso",
  alternates: { canonical: "/recover" },
};
export const dynamic = "force-dynamic";

export default async function RecoverPage() {
  const locale = await getServerLocale();
  return <RecoverClient locale={locale} />;
}
