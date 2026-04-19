import SignUpClient from "./SignUpClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Crear organización",
  alternates: { canonical: "/signup" },
};
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const locale = await getServerLocale();
  return <SignUpClient locale={locale} />;
}
