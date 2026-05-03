"use client";
/* ═══════════════════════════════════════════════════════════════
   /dev/protocol-primitives — Storybook minimalista de primitivas
   SP2. Página dev-only: NO link visible en producción nav.
   ═══════════════════════════════════════════════════════════════ */

import dynamic from "next/dynamic";

const PrimitivePreview = dynamic(
  () => import("@/components/protocol/v2/PrimitivePreview"),
  { ssr: false }
);

export default function ProtocolPrimitivesDevPage() {
  return <PrimitivePreview />;
}
