import SignInClient from "./SignInClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = {
  title: "Entrar",
  alternates: { canonical: "/signin" },
};
export const dynamic = "force-dynamic";

export default async function SignInPage() {
  const locale = await getServerLocale();
  return <SignInClient locale={locale} />;
}
