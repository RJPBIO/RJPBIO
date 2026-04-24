/* ═══════════════════════════════════════════════════════════════
   AuroraMesh — the hero backdrop that Stripe/Linear pull off to
   signal "premium product". Four soft color fields (phosphor cyan,
   neural violet, emerald, ghost cyan) drift slowly on their own
   axes, blurred heavy enough that the motion reads as weather, not
   animation.

   SVG-based so it renders server-side without a hydration flash.
   Motion lives in CSS, so reduced-motion users get a static mesh
   automatically (no framer-motion, no JS gate required).

   Props:
     intensity   "subtle" | "normal" | "dramatic"  — opacity ceiling
     palette     optional override { a, b, c, d }  — 4 hex colors
   ═══════════════════════════════════════════════════════════════ */

import { bioSignal } from "@/components/ui/tokens";

export default function AuroraMesh({
  intensity = "normal",
  palette,
  className,
  style,
}) {
  const colors = palette || {
    a: bioSignal.phosphorCyan,  // top-left
    b: bioSignal.neuralViolet,  // bottom-right
    c: "#10B981",               // emerald accent — center
    d: bioSignal.ghostCyan,     // pale halo — drifts
  };

  const opacityCeiling =
    intensity === "subtle"   ? 0.22 :
    intensity === "dramatic" ? 0.55 :
                               0.38;

  return (
    <div
      aria-hidden="true"
      className={`bi-aurora-mesh${className ? ` ${className}` : ""}`}
      data-intensity={intensity}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        opacity: opacityCeiling,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 800 600"
        preserveAspectRatio="xMidYMid slice"
        style={{ inlineSize: "100%", blockSize: "100%", display: "block" }}
      >
        <defs>
          <radialGradient id="aurora-a" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={colors.a} stopOpacity="1"   />
            <stop offset="55%" stopColor={colors.a} stopOpacity="0.35"/>
            <stop offset="100%" stopColor={colors.a} stopOpacity="0"  />
          </radialGradient>
          <radialGradient id="aurora-b" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={colors.b} stopOpacity="0.9"  />
            <stop offset="55%" stopColor={colors.b} stopOpacity="0.3" />
            <stop offset="100%" stopColor={colors.b} stopOpacity="0"  />
          </radialGradient>
          <radialGradient id="aurora-c" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={colors.c} stopOpacity="0.8" />
            <stop offset="55%" stopColor={colors.c} stopOpacity="0.25"/>
            <stop offset="100%" stopColor={colors.c} stopOpacity="0"  />
          </radialGradient>
          <radialGradient id="aurora-d" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor={colors.d} stopOpacity="0.7" />
            <stop offset="55%" stopColor={colors.d} stopOpacity="0.2" />
            <stop offset="100%" stopColor={colors.d} stopOpacity="0"  />
          </radialGradient>
          <filter id="aurora-blur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="80" />
          </filter>
        </defs>

        <g filter="url(#aurora-blur)">
          {/* Each blob orbits its own anchor point on a long duration
              so the overall motion reads as weather — never a loop the
              eye can predict. Durations are prime-ish to defeat sync. */}
          <circle className="bi-aurora-blob bi-aurora-blob--a" cx="180" cy="160" r="280" fill="url(#aurora-a)" />
          <circle className="bi-aurora-blob bi-aurora-blob--b" cx="620" cy="460" r="280" fill="url(#aurora-b)" />
          <circle className="bi-aurora-blob bi-aurora-blob--c" cx="400" cy="320" r="220" fill="url(#aurora-c)" />
          <circle className="bi-aurora-blob bi-aurora-blob--d" cx="700" cy="120" r="200" fill="url(#aurora-d)" />
        </g>
      </svg>
    </div>
  );
}
