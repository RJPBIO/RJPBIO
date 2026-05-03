"use client";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { colors, typography, spacing, icon } from "../tokens";
import { bucketLabelForHour } from "./copy";

// Header persistente Tab Hoy v2.
// Lado izq: dot cyan 6px pulso suave + label mono "BUCKET · HH:MM".
// Lado der: campana lucide stroke 1.5 size 20.
// Sin border-bottom — el saludo abajo provee el respiro.

export default function HeaderV2({ onBellClick }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hour = now.getHours();
  const hh = String(hour).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const bucket = bucketLabelForHour(hour);

  return (
    <header
      data-v2-header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s24,
        paddingBlockEnd: spacing.s24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: colors.accent.phosphorCyan,
            display: "inline-block",
            animation: "v2HeaderDotPulse 4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.55)",
            fontWeight: typography.weight.regular,
          }}
        >
          {bucket} · {hh}:{mm}
        </span>
      </div>

      <button
        type="button"
        aria-label="Notificaciones"
        onClick={onBellClick}
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: "rgba(255,255,255,0.55)",
          padding: spacing.s8,
          margin: -spacing.s8,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Bell size={icon.size} strokeWidth={icon.strokeWidth} />
      </button>

      <style jsx global>{`
        @keyframes v2HeaderDotPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </header>
  );
}
