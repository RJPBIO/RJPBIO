import Nom35Client from "./Nom35Client";

export const metadata = {
  title: "NOM-035 · Aplicador · BIO-IGNICIÓN",
  description: "Cuestionario oficial de factores de riesgo psicosocial (Guía III, STPS México). 72 ítems, 10–15 min, confidencial.",
  alternates: { canonical: "/nom35/aplicador" },
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default function Nom35AplicadorPage() {
  return <Nom35Client />;
}
