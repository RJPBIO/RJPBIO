"use client";
/* WellbeingBanner — Phase 6F SP-F
   Banner condicional in-app cuando level ≥ warn.
   Decision A3: solo si totalSessions ≥ 1 (skip cold-start sin actividad).
   Decision B3: persistent + drawer on-demand (NO auto-mount).

   Marketing copy (D8): NO "burnout score" / "predicción". Eyebrow
   "WELLBEING · ATENCIÓN" + copy desde wellbeingCopy del backend. */

import { useState } from "react";
import { useWellbeingTrends } from "@/hooks/useWellbeingTrends";
import WellbeingAlertDrawer from "./WellbeingAlertDrawer";
import { colors, typography, spacing, radii, withAlpha } from "../tokens";

export default function WellbeingBanner({ totalSessions = 0 }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  // BUG FIX: el banner ya no se muestra con totalSessions < 1; gatear también
  // el fetch evita el 401 en cada carga de Home para usuarios nuevos/sin sesión.
  const { data, loading } = useWellbeingTrends({ days: 28, enabled: totalSessions >= 1 });

  // Decision A3 — gate por totalSessions (skip pre-baseline users).
  if (totalSessions < 1) return null;
  if (loading) return null;
  if (!data?.assessment) return null;

  const { level } = data.assessment;
  // Solo show para warn|alert. ok/watch silenciosos (UX no spam).
  if (level !== "warn" && level !== "alert") return null;

  const isAlert = level === "alert";
  const accent = isAlert
    ? colors.semantic.danger
    : colors.semantic.warning;
  const accentRgb = isAlert
    ? colors.semantic.dangerRgb
    : colors.semantic.warningRgb;

  return (
    <>
      <article
        data-v2-wellbeing-banner
        data-level={level}
        role="alert"
        aria-live="polite"
        style={{
          marginInline: spacing.s24,
          marginBlockStart: spacing.s16,
          marginBlockEnd: 0,
          padding: spacing.s16,
          background: withAlpha(accentRgb, 6),
          border: `0.5px solid ${withAlpha(accentRgb, 30)}`,
          borderRadius: radii.panel,
          display: "flex",
          flexDirection: "column",
          gap: spacing.s8,
        }}
      >
        <div
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: accent,
            fontWeight: typography.weight.medium,
          }}
        >
          Wellbeing · {isAlert ? "atención" : "patrón a observar"}
        </div>
        <h3
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
            lineHeight: 1.3,
          }}
        >
          {data.copy?.title}
        </h3>
        <p
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            color: colors.text.secondary,
            lineHeight: 1.5,
          }}
        >
          {data.copy?.subtitle}
        </p>

        <div
          style={{
            display: "flex",
            gap: spacing.s8,
            flexWrap: "wrap",
            marginBlockStart: 4,
          }}
        >
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            data-testid="wellbeing-banner-detail-cta"
            style={{
              appearance: "none",
              background: "transparent",
              border: `0.5px solid ${colors.accent.phosphorCyan}`,
              borderRadius: 8,
              color: colors.accent.phosphorCyan,
              cursor: "pointer",
              paddingBlock: 10,
              paddingInline: 16,
              minBlockSize: 40,
              fontFamily: typography.family,
              fontSize: 11,
              fontWeight: typography.weight.medium,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Ver detalle
          </button>
          {isAlert && (
            <a
              href="tel:8002900024"
              data-testid="wellbeing-banner-saptel-cta"
              style={{
                appearance: "none",
                background: colors.accent.phosphorCyan,
                color: colors.bg.base,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                paddingBlock: 10,
                paddingInline: 16,
                minBlockSize: 40,
                fontFamily: typography.familyMono,
                fontSize: 11,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              SAPTEL · 800 290 0024
            </a>
          )}
        </div>
      </article>

      {drawerOpen && (
        <WellbeingAlertDrawer
          assessment={data.assessment}
          copy={data.copy}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </>
  );
}
