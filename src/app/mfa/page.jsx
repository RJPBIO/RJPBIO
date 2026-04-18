import MfaClient from "./MfaClient";

export const metadata = { title: "Verificación" };
export const dynamic = "force-dynamic";

export default function MfaPage() {
  return <MfaClient />;
}
