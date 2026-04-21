"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { BioGlyph } from "@/components/BioIgnicionMark";

export default function HomeHero({ T }) {
  return (
    <section
      aria-label={T.heroAria}
      style={{
        position: "relative",
        minBlockSize: "calc(100dvh - 88px)",
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Ambient bio-signal field */}
      <div
        aria-hidden
        style={{
          position: "absolute", inset: 0, zIndex: -2,
          backgroundImage: [
            `radial-gradient(60% 50% at 20% 20%, ${bioSignal.phosphorCyan}22, transparent 60%)`,
            `radial-gradient(55% 55% at 80% 10%, ${bioSignal.neuralViolet}22, transparent 60%)`,
            `radial-gradient(70% 70% at 50% 110%, ${bioSignal.plasmaPink}14, transparent 60%)`,
          ].join(","),
        }}
      />

      {/* Pulsing neural core */}
      <motion.div
        aria-hidden
        initial={{ scale: 0.94, opacity: 0.7 }}
        animate={{ scale: [0.94, 1.04, 0.94], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", zIndex: -1,
          top: "50%", insetInlineStart: "50%",
          translate: "-50% -50%",
          width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(closest-side, ${bioSignal.phosphorCyan}30, transparent 72%)`,
          filter: "blur(12px)",
          pointerEvents: "none",
        }}
      />

      {/* Concentric ripples */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1.8, opacity: [0, 0.35, 0] }}
          transition={{ duration: 4.2, repeat: Infinity, delay: i * 1.4, ease: "easeOut" }}
          style={{
            position: "absolute", zIndex: -1,
            top: "50%", insetInlineStart: "50%",
            translate: "-50% -50%",
            width: 260, height: 260, borderRadius: "50%",
            border: `1px solid ${bioSignal.phosphorCyan}`,
            pointerEvents: "none",
          }}
        />
      ))}

      <div
        style={{
          maxInlineSize: 880,
          paddingInline: space[5],
          paddingBlock: space[12],
          textAlign: "center",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: space[2],
            padding: `${space[2]}px ${space[3]}px`,
            borderRadius: radius.full,
            background: `color-mix(in srgb, ${bioSignal.phosphorCyan} 8%, transparent)`,
            border: `1px solid color-mix(in srgb, ${bioSignal.phosphorCyan} 30%, transparent)`,
            color: bioSignal.ghostCyan,
            fontSize: font.size.xs,
            textTransform: "uppercase",
            letterSpacing: font.tracking.caps,
            fontWeight: font.weight.bold,
            fontFamily: cssVar.fontMono,
            marginBlockEnd: space[6],
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: bioSignal.phosphorCyan,
            boxShadow: `0 0 12px ${bioSignal.phosphorCyan}`,
          }} />
          {T.eyebrow}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{
            margin: 0,
            fontSize: "clamp(44px, 7.5vw, 92px)",
            lineHeight: 1.02,
            letterSpacing: "-0.03em",
            fontWeight: font.weight.black,
            color: cssVar.text,
          }}
        >
          {T.h1a}{" "}
          <span style={{
            background: `linear-gradient(120deg, ${bioSignal.phosphorCyan}, ${bioSignal.neuralViolet} 45%, ${bioSignal.plasmaPink})`,
            WebkitBackgroundClip: "text", backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontStyle: "italic",
            fontFamily: "'Georgia', 'Times New Roman', serif",
            fontWeight: 500,
          }}>
            {T.h1b}
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{
            margin: `${space[6]}px auto 0`,
            maxInlineSize: 620,
            fontSize: font.size.xl,
            lineHeight: 1.55,
            color: cssVar.textDim,
            fontWeight: font.weight.normal,
          }}
        >
          {T.sub}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{
            marginBlockStart: space[8],
            display: "inline-flex",
            gap: space[3],
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link
            href="/demo"
            style={{
              padding: `${space[3]}px ${space[6]}px`,
              borderRadius: radius.full,
              background: cssVar.accent,
              color: cssVar.accentInk,
              textDecoration: "none",
              fontWeight: font.weight.bold,
              fontSize: font.size.lg,
              display: "inline-flex",
              alignItems: "center",
              gap: space[2],
              boxShadow: `0 12px 40px -12px ${bioSignal.phosphorCyan}80`,
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {T.ctaPrimary}
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/evidencia"
            style={{
              padding: `${space[3]}px ${space[5]}px`,
              borderRadius: radius.full,
              background: "transparent",
              color: cssVar.text,
              textDecoration: "none",
              fontWeight: font.weight.semibold,
              fontSize: font.size.lg,
              border: `1px solid ${cssVar.border}`,
            }}
          >
            {T.ctaSecondary}
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.8 }}
          style={{
            marginBlockStart: space[10],
            display: "flex",
            gap: space[6],
            flexWrap: "wrap",
            justifyContent: "center",
            color: cssVar.textMuted,
            fontSize: font.size.sm,
            fontFamily: cssVar.fontMono,
            letterSpacing: font.tracking.wide,
          }}
        >
          <TrustPill>{T.trust1}</TrustPill>
          <TrustPill>{T.trust2}</TrustPill>
          <TrustPill>{T.trust3}</TrustPill>
        </motion.div>
      </div>
    </section>
  );
}

function TrustPill({ children }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
      <span aria-hidden style={{
        width: 4, height: 4, borderRadius: "50%",
        background: bioSignal.phosphorCyan,
        boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
      }} />
      {children}
    </span>
  );
}
