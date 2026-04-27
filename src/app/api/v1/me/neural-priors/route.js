/* GET /api/v1/me/neural-priors
   Sprint 48 — entrega el cohort prior del org del usuario para que el
   motor adaptativo client-side haga blend con la baseline literatura.

   Privacidad: agregado por celda (bucket × intent), k-anonymity ≥5.
   No expone datos individuales. Solo accesible al user autenticado de
   ese org.
*/
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getOrgCohortPrior } from "@/server/neural-org-stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const memberships = session.memberships || [];
  // Prioriza B2B org no-personal (donde cohort prior tiene sentido).
  const b2b = memberships.find((m) => m.org && !m.org.personal) || memberships[0];
  if (!b2b?.orgId) {
    return NextResponse.json({ cohortPrior: null, reason: "no-org" });
  }
  const prior = await getOrgCohortPrior(b2b.orgId);
  // Cache liviano: el prior cambia lentamente (compute-on-demand está bien)
  return NextResponse.json(
    { cohortPrior: prior, orgId: b2b.orgId },
    {
      headers: {
        "Cache-Control": "private, max-age=300", // 5 min de cache cliente
      },
    }
  );
}
