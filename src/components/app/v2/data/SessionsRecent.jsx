"use client";
import { colors, typography, spacing } from "../tokens";
import { P as PROTOCOLS } from "@/lib/protocols";

// Lista de las 10 sesiones recientes. Dot solo cyan para "energia"
// (cap de 4 cyan respetado: en datos hay 0 cyan persistentes salvo
// nav DATOS activo + energia dots eventuales).

const NEUTRAL_DOT = "rgba(255,255,255,0.32)";

export default function SessionsRecent({ sessions = [], onSeeAll }) {
  const list = sessions.slice(0, 10);

  // Para no exceder el cap de cyan (4), limitamos dots cyan a primeros
  // 2 sesiones de intent "energia". Si hay mas, caen a neutral.
  let cyanLeft = 2;

  return (
    <section
      data-v2-sessions-recent
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <div
        style={{
          fontFamily: typography.familyMono,
          fontSize: typography.size.microCaps,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.55)",
          fontWeight: typography.weight.medium,
          marginBlockEnd: spacing.s16,
        }}
      >
        SESIONES · ÚLTIMAS 10
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {list.map((s, idx) => {
          const proto = PROTOCOLS.find((p) => p.id === s.p) || {};
          const name = proto.n || "Sesión";
          const intent = s.int || proto.int || "";
          const dotColor = intent === "energia" && cyanLeft > 0
            ? (cyanLeft--, colors.accent.phosphorCyan)
            : NEUTRAL_DOT;
          const delta = Number(s.deltaC) || 0;
          const deltaSign = delta > 0 ? "+" : delta < 0 ? "-" : "";
          // Grayscale neutral estricto. Sin verde (positivo) ni rojo
          // (negativo). En Windows ClearType, fuentes peso 200 sobre
          // dark con alpha < 1 muestran fringing cromatico — alpha 1.0
          // + font-smoothing grayscale los elimina.
          const deltaColor = delta > 0
            ? "rgb(245,245,247)"
            : delta < 0
              ? "rgba(245,245,247,0.55)"
              : "rgba(245,245,247,0.32)";

          return (
            <li
              key={`${s.ts}-${idx}`}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: spacing.s16,
                paddingBlock: 14,
                borderBlockEnd: idx === list.length - 1 ? "none" : `0.5px solid ${colors.separator}`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: dotColor,
                  display: "inline-block",
                }}
              />
              <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <span
                  style={{
                    fontFamily: typography.family,
                    fontSize: typography.size.bodyMin,
                    fontWeight: typography.weight.medium,
                    color: "rgba(255,255,255,0.96)",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {name}
                </span>
                <span
                  style={{
                    fontFamily: typography.familyMono,
                    fontSize: typography.size.microCaps,
                    letterSpacing: "0.06em",
                    color: "rgba(255,255,255,0.32)",
                    fontWeight: typography.weight.regular,
                  }}
                >
                  {relativeTime(s.ts)} · {s.d || 120}s
                </span>
              </span>
              <span
                style={{
                  fontFamily: typography.family,
                  // peso 400 (no 200): peso 200 size 17 sobre dark bg en
                  // Windows ClearType crea fringing cromatico (verde/naranja).
                  // Departure deliberado del spec por defecto del sistema.
                  fontWeight: typography.weight.regular,
                  fontSize: typography.size.subtitleMin,
                  color: deltaColor,
                  letterSpacing: "-0.01em",
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "end",
                  minWidth: 36,
                  WebkitFontSmoothing: "antialiased",
                  MozOsxFontSmoothing: "grayscale",
                  textRendering: "geometricPrecision",
                  textShadow: "0 0 0 transparent",
                }}
              >
                {delta === 0 ? "0" : `${deltaSign}${Math.abs(delta)}`}
              </span>
            </li>
          );
        })}
      </ul>

      <div style={{ display: "flex", justifyContent: "center", marginBlockStart: spacing.s24 }}>
        <button
          type="button"
          onClick={onSeeAll}
          style={{
            appearance: "none",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.55)",
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: typography.weight.medium,
            padding: spacing.s8,
          }}
        >
          VER HISTORIAL COMPLETO →
        </button>
      </div>
    </section>
  );
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / (60 * 60 * 1000));
  if (h < 1) return "hace un momento";
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) {
    const dayNames = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    return `${dayNames[new Date(ts).getDay()]} pasado`;
  }
  if (d < 30) return `hace ${d} días`;
  return new Date(ts).toLocaleDateString("es-MX", { month: "short", day: "numeric" });
}
