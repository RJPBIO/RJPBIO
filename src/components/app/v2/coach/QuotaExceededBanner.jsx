"use client";
import { useEffect } from "react";
import { colors, typography, spacing, layout, radii } from "../tokens";

// Toast 4s arriba del input. Sutil, sin alarma.

export default function QuotaExceededBanner({ max = 0, onDismiss, autoDismissMs = 4000 }) {
  useEffect(() => {
    if (!autoDismissMs || autoDismissMs <= 0) return;
    const t = setTimeout(() => { onDismiss && onDismiss(); }, autoDismissMs);
    return () => clearTimeout(t);
  }, [autoDismissMs, onDismiss]);

  return (
    <div
      data-v2-quota-banner
      role="status"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: layout.bottomNavHeight + 60,
        zIndex: 51,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        paddingInline: spacing.s16,
      }}
    >
      <div
        style={{
          maxWidth: 360,
          width: "100%",
          background: "rgba(8,8,10,0.92)",
          border: `0.5px solid ${colors.separator}`,
          borderRadius: radii.panel,
          padding: "12px 16px",
          fontFamily: typography.family,
          fontSize: typography.size.caption,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.96)",
          letterSpacing: "-0.005em",
          lineHeight: 1.4,
          textAlign: "center",
          pointerEvents: "auto",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        Has alcanzado tu límite de {max === Infinity ? "" : max + " "}mensajes este mes.
      </div>
    </div>
  );
}
