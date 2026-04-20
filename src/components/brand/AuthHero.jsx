"use client";
/* ═══════════════════════════════════════════════════════════════
   AuthHero — shared full-bleed brand panel for auth surfaces.
   Layers: deep gradient bed → drifting neural lattice → vignette
   → scanline tint → BioGlyph mark (top-left, scale-reveal) →
   editorial display statement + tagline + trust chips row.
   One asset, every auth page: signin · signup · recover · verify · mfa.
   ═══════════════════════════════════════════════════════════════ */
import { motion } from "framer-motion";
import { BioGlyph } from "@/components/BioIgnicionMark";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

export default function AuthHero({ kicker, statement, tagline, trust, chips }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        padding: "clamp(32px, 4vw, 64px)",
        background: `
          radial-gradient(ellipse 80% 60% at 50% 120%, color-mix(in srgb, ${bioSignal.phosphorCyan} 22%, transparent), transparent 60%),
          radial-gradient(ellipse 70% 50% at 12% -10%, color-mix(in srgb, ${bioSignal.neuralViolet} 18%, transparent), transparent 65%),
          linear-gradient(160deg, color-mix(in srgb, var(--bi-surface) 92%, #000) 0%, color-mix(in srgb, var(--bi-bg) 98%, #000) 100%)
        `,
        color: cssVar.text,
        overflow: "hidden",
      }}
    >
      {/* Layer 1 — neural lattice drifting slowly. The brand asset. */}
      <div
        aria-hidden
        className="bi-hero-lattice"
        style={{
          position: "absolute",
          inset: "-8%",
          opacity: 0.55,
          filter: "saturate(115%) blur(0.2px)",
          zIndex: 0,
        }}
      >
        <BioglyphLattice variant="neural" animated height="100%" />
      </div>

      {/* Layer 2 — vignette that darkens edges, lifts center-left. */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          background: `
            radial-gradient(ellipse 70% 80% at 30% 55%, transparent 0%, transparent 35%, color-mix(in srgb, #000 50%, transparent) 100%)
          `,
        }}
      />

      {/* Layer 3 — scanline tint for subtle depth (one line-pair per 3px). */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none",
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0, transparent 2px, color-mix(in srgb, #000 8%, transparent) 2px, color-mix(in srgb, #000 8%, transparent) 3px)`,
          mixBlendMode: "overlay",
          opacity: 0.5,
        }}
      />

      {/* Top-left brand mark with scale-reveal + wordmark fade-in. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: "relative", zIndex: 2, display: "inline-flex", alignItems: "center", gap: space[3] }}
      >
        <BioGlyph size={48} />
        <span style={{ fontWeight: font.weight.black, letterSpacing: "0.22em", fontSize: font.size.lg }}>
          BIO-IGNICIÓN
        </span>
      </motion.div>

      {/* Spacer */}
      <div style={{ position: "relative", zIndex: 2 }} />

      {/* Bottom-left statement */}
      <div style={{ position: "relative", zIndex: 2, maxWidth: 560 }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        >
          {kicker && (
            <div style={{
              fontFamily: cssVar.fontMono,
              fontSize: font.size.xs,
              color: bioSignal.phosphorCyan,
              textTransform: "uppercase",
              letterSpacing: "0.28em",
              fontWeight: font.weight.bold,
              marginBlockEnd: space[5],
            }}>
              {kicker}
            </div>
          )}
          {statement && (
            <h2 style={{
              margin: 0,
              fontSize: "clamp(36px, 4.2vw, 56px)",
              fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.02,
              color: cssVar.text,
            }}>
              {statement}
            </h2>
          )}
          {tagline && (
            <p style={{
              margin: `${space[5]}px 0 0`,
              fontSize: "clamp(16px, 1.25vw, 19px)",
              lineHeight: 1.5,
              color: cssVar.textDim,
              maxWidth: 440,
            }}>
              {tagline}
            </p>
          )}
        </motion.div>

        {(trust || (chips && chips.length > 0)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.7 }}
            style={{
              marginBlockStart: space[8],
              paddingBlockStart: space[5],
              borderBlockStart: `1px solid color-mix(in srgb, ${cssVar.border} 60%, transparent)`,
              color: cssVar.textMuted,
              fontSize: font.size.sm,
              letterSpacing: "0.02em",
              maxWidth: 440,
            }}
          >
            {trust && <div>{trust}</div>}
            {chips && chips.length > 0 && (
              <ul className="bi-authhero-chips" role="list" aria-label="Compliance">
                {chips.map((c) => (
                  <li key={c}>
                    <span className="dot" aria-hidden />
                    {c}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
