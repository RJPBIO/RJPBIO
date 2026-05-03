"use client";
import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing } from "../tokens";

// Hero composite: kicker + numero gigante + linea coach.
// Count-up 0->valor en 650ms ease-out solo en mount.

const EASE_OUT_CUBIC = (t) => 1 - Math.pow(1 - t, 3);

function useCountUp(target, duration = 650) {
  const [v, setV] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(0);
  useEffect(() => {
    const targetN = Math.max(0, Math.round(Number(target) || 0));
    setV(0);
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);
    const tick = (ts) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = EASE_OUT_CUBIC(t);
      setV(Math.round(targetN * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);
  return v;
}

export default function HeroComposite({ value, primaryLine, secondaryLine }) {
  const display = useCountUp(value, 650);
  return (
    <section
      data-v2-hero
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: 80,
        paddingBlockEnd: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 0,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: 12,
        }}
      >
        TU SISTEMA HOY
      </div>
      <div
        aria-label={`Tu sistema hoy: ${value} de 100`}
        style={{
          fontFamily: typography.family,
          fontSize: 128,
          fontWeight: typography.weight.light,
          letterSpacing: "-0.045em",
          color: "rgba(255,255,255,0.96)",
          lineHeight: 1,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {display}
      </div>
      <p
        style={{
          marginBlockStart: 24,
          marginBlockEnd: 0,
          textAlign: "center",
          maxWidth: 320,
          fontFamily: typography.family,
          fontSize: typography.size.subtitleMin,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.72)",
          lineHeight: 1.4,
        }}
      >
        {primaryLine}
        {secondaryLine ? " " : ""}
        {secondaryLine}
      </p>
    </section>
  );
}
