/* ═══════════════════════════════════════════════════════════════
   NOM-035 — Reporte personal del trabajador (ruta imprimible)

   Server route. Lee el último Nom35Response del usuario autenticado
   (más cualquier evaluación previa para construir la trayectoria) y
   renderiza el reporte profesional. El usuario imprime con Ctrl+P.

   Privacidad: solo el dueño de los datos puede ver su reporte. La
   query es por userId derivado de la sesión, no por orgId. Si el
   user no tiene evaluación, lo regresa al aplicador.
   ═══════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import Nom35PersonalReport from "@/components/Nom35PersonalReport";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata = {
  title: "Reporte personal NOM-035 · BIO-IGNICIÓN",
  description: "Tu reporte personal del cuestionario NOM-035-STPS-2018 (Guía III). Listo para imprimir.",
  alternates: { canonical: "/nom35/aplicador/reporte" },
  robots: { index: false, follow: false },
};

export default async function ReporteNom35Page({ searchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin?next=/nom35/aplicador/reporte");

  const userId = session.user.id;
  const sp = (await searchParams) || {};
  const requestedId = typeof sp.id === "string" ? sp.id : null;

  const orm = await db();

  // Recientes del usuario (incluye la actual + previas para trayectoria)
  const all = await orm.nom35Response.findMany({
    where: { userId },
    orderBy: { completedAt: "desc" },
    take: 10,
    select: {
      id: true,
      total: true,
      nivel: true,
      porDominio: true,
      porCategoria: true,
      completedAt: true,
    },
  });

  if (all.length === 0) {
    return <NoReportYet />;
  }

  // Si vino ?id=, mostrar esa específica; si no, la más reciente
  const current = requestedId
    ? all.find((r) => r.id === requestedId) || all[0]
    : all[0];
  const history = all.filter((r) => r.id !== current.id);

  return (
    <>
      <PrintBar />
      <div className="nom35-report-root">
        <Nom35PersonalReport response={current} history={history} />
      </div>
    </>
  );
}

// Barra superior con CTA de imprimir — oculta al imprimir
function PrintBar() {
  return (
    <>
      <style>{`
        .print-bar {
          position: sticky; top: 0; z-index: 100;
          background: #0B1320; color: #fff;
          padding: 10px 18px;
          display: flex; justify-content: space-between; align-items: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
          font-size: 13px;
          border-bottom: 1px solid #22D3EE33;
        }
        .print-bar a, .print-bar button {
          color: #22D3EE; background: transparent; border: 1px solid #22D3EE55;
          padding: 6px 12px; border-radius: 6px; font-weight: 700;
          cursor: pointer; text-decoration: none; font-size: 12px;
          letter-spacing: 0.04em;
        }
        .print-bar button { background: #22D3EE; color: #0B1320; }
        .print-bar .group { display: flex; gap: 8px; align-items: center; }
        .print-bar small { color: #94A3B8; font-size: 11px; letter-spacing: 0.02em; }
        @media print { .print-bar { display: none !important; } }
      `}</style>
      <div className="print-bar">
        <div className="group">
          <Link href="/nom35/aplicador">← Volver al aplicador</Link>
          <small>Tu reporte personal está listo. Pulsa "Imprimir" o usa Ctrl+P → Guardar como PDF.</small>
        </div>
        <div className="group">
          <PrintButton />
        </div>
      </div>
    </>
  );
}

// Componente cliente mínimo para el botón imprimir (solo necesita window.print)
function PrintButton() {
  return (
    <form action="javascript:window.print()" style={{ display: "inline" }}>
      <button type="submit">Imprimir / Guardar PDF</button>
    </form>
  );
}

function NoReportYet() {
  return (
    <main style={{
      minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px", textAlign: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      color: "#0B1320",
    }}>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
          Aún no has completado la evaluación
        </h1>
        <p style={{ color: "#475569", marginBottom: 20, lineHeight: 1.5 }}>
          Tu reporte personal NOM-035 aparece aquí cuando completes el cuestionario de la Guía III. Es voluntario y toma 10–15 minutos.
        </p>
        <Link
          href="/nom35/aplicador"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#22D3EE",
            color: "#0B1320",
            borderRadius: 8,
            textDecoration: "none",
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          Ir al aplicador →
        </Link>
      </div>
    </main>
  );
}
