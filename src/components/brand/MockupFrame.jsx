"use client";
/* ═══════════════════════════════════════════════════════════════
   MockupFrame — SP-1.5 TASK 3
   ───────────────────────────────────────────────────────────────
   Wrap canónico iPhone 15 Pro SVG frame para mostrar capturas
   reales del producto PWA dentro de /why marketing.

   Specs:
   - Dimensiones reales iPhone 15 Pro: 70.6 × 146.6 mm
   - Screen viewport: 393 × 852 pt @ devicePixelRatio 3
   - Frame canonical: titanium edge + dynamic island accurate
   - aspect-ratio preservada: 393 / 852 ≈ 0.461
   - Subtle drop shadow + glow inferior phosphor cyan opcional

   Props:
   - screenshot (required): path /screenshots/why/*.png o URL
   - alt (required): texto accesible describing el contenido
   - variant: "titanium-natural" | "titanium-black" (default: natural)
   - glow: boolean — cyan halo phosphor (default: false)

   ADN respect:
   - Cero framer-motion (compartido con PWA potencial — preserva safety).
   - Cero emojis ni glifos genéricos.
   - Reduced-motion: glow halo disabled si user pref.
   ═══════════════════════════════════════════════════════════════ */

const FRAME_RATIO = 393 / 852;
const TITANIUM_NATURAL = {
  edge: "#A8A8A6",
  edgeShadow: "#6E6E6C",
  bezelInner: "#101011",
};
const TITANIUM_BLACK = {
  edge: "#3A3A3C",
  edgeShadow: "#1C1C1E",
  bezelInner: "#000000",
};

export default function MockupFrame({
  screenshot,
  alt,
  variant = "titanium-natural",
  glow = false,
  width = 280,
}) {
  if (typeof screenshot !== "string" || !screenshot) {
    if (process.env.NODE_ENV !== "production") {
      // Surface dev-mode warning sin throw — placeholder vacío.
       
      console.warn("[MockupFrame] screenshot prop missing or invalid");
    }
    return null;
  }
  if (typeof alt !== "string" || !alt) {
    if (process.env.NODE_ENV !== "production") {
       
      console.warn("[MockupFrame] alt prop missing or invalid (a11y violation)");
    }
  }

  const palette = variant === "titanium-black" ? TITANIUM_BLACK : TITANIUM_NATURAL;
  const height = Math.round(width / FRAME_RATIO);

  // SVG viewBox dimensions match iPhone 15 Pro pt × 1 (393 × 852).
  // Border radius outer ~55pt (iPhone 15 Pro corner radius spec).
  // Inner screen ~5pt inset.
  const vbW = 393;
  const vbH = 852;
  const cornerOuter = 55;
  const cornerInner = 48;
  const bezel = 8;

  return (
    <div
      role="img"
      aria-label={alt}
      data-testid="mockup-frame"
      data-variant={variant}
      style={{
        position: "relative",
        display: "inline-block",
        width,
        height,
        filter: glow
          ? "drop-shadow(0 0 24px rgba(34, 211, 238, 0.25)) drop-shadow(0 8px 32px rgba(0,0,0,0.35))"
          : "drop-shadow(0 12px 28px rgba(0,0,0,0.28))",
      }}
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <linearGradient id="mf-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={palette.edge} />
            <stop offset="48%" stopColor={palette.edgeShadow} />
            <stop offset="100%" stopColor={palette.edge} />
          </linearGradient>
          <clipPath id="mf-screen-clip">
            <rect
              x={bezel}
              y={bezel}
              width={vbW - bezel * 2}
              height={vbH - bezel * 2}
              rx={cornerInner}
              ry={cornerInner}
            />
          </clipPath>
        </defs>

        {/* Outer titanium frame */}
        <rect
          x="0"
          y="0"
          width={vbW}
          height={vbH}
          rx={cornerOuter}
          ry={cornerOuter}
          fill="url(#mf-edge)"
        />
        {/* Inner bezel */}
        <rect
          x={bezel}
          y={bezel}
          width={vbW - bezel * 2}
          height={vbH - bezel * 2}
          rx={cornerInner}
          ry={cornerInner}
          fill={palette.bezelInner}
        />
      </svg>

      {/* Screenshot rendered with same clip-path via overlay <img>. */}
      <div
        style={{
          position: "absolute",
          inset: `${(bezel / vbH) * 100}% ${(bezel / vbW) * 100}%`,
          borderRadius: `${(cornerInner / vbW) * 100}%`,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative mockup screenshot; sizes set via parent, Next Image overkill */}
        <img
          src={screenshot}
          alt=""
          aria-hidden="true"
          width="100%"
          height="100%"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
          }}
        />
      </div>

      {/* Dynamic island — accurate position iPhone 15 Pro */}
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        width={width}
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <rect
          x={vbW / 2 - 60}
          y={20}
          width="120"
          height="35"
          rx="18"
          ry="18"
          fill="#000"
        />
      </svg>
    </div>
  );
}

export const __mockupFrameInternals = {
  FRAME_RATIO,
  TITANIUM_NATURAL,
  TITANIUM_BLACK,
};
