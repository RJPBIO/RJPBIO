"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — /app entry point.
   Phase 6 SP5 cleanup: el bloque legacy v1 (2500+ LoC) fue eliminado
   tras validación e2e completa del shell v2 con onboarding mountado,
   crisis quick access funcional, ProtocolCatalog browseable, bandit
   recording activo y programs avance.

   El feature flag PROTOTYPE_V2 también fue retirado — todos los users
   reciben AppV2Root incondicionalmente. Histórico del legacy en
   git history (commits anteriores a Phase 6 SP5).
   ═══════════════════════════════════════════════════════════════ */

import dynamic from "next/dynamic";

const AppV2Root = dynamic(() => import("@/components/app/v2/AppV2Root"), { ssr: false });

export default function BioIgnicion() {
  return <AppV2Root />;
}
