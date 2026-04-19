import Nom35Client from "./Nom35Client";

export const metadata = {
  title: "NOM-035 · BIO-IGNICIÓN",
  description: "Cuestionario oficial de factores de riesgo psicosocial (Guía III, STPS México).",
};
export const dynamic = "force-dynamic";

export default function Nom35Page() {
  return <Nom35Client />;
}
