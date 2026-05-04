"use client";
import { useStore } from "@/store/useStore";
import { ArrowLeft } from "lucide-react";
import HeaderV2 from "../home/HeaderV2";
import { colors, typography, spacing, radii } from "../tokens";

// Phase 6D SP4c — vista completa de sesiones del user. Wired al
// target:/app/data/sessions/all desde DataV2.SessionsRecent "Ver todas".
// Lee history del store directo (mismo source que DataV2 main view).
// Display: lista cronológica descendente con protocol id + intent + delta
// composite + duración + timestamp.

export default function SessionsAllView({ onBack, onBellClick, onNavigate }) {
  const history = useStore((s) => Array.isArray(s.history) ? s.history : []);
  const sorted = [...history].sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return (
    <>
      <HeaderV2 onBellClick={onBellClick} />
      <SubHeader title="Todas las sesiones" subtitle={`${sorted.length} ${sorted.length === 1 ? "sesión" : "sesiones"} registradas`} onBack={onBack} />
      {sorted.length === 0 ? (
        <article
          style={{
            margin: spacing.s24,
            padding: spacing.s24 - 4,
            background: "transparent",
            border: `0.5px dashed ${colors.separator}`,
            borderRadius: radii.panelLg,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: typography.size.body,
              fontWeight: typography.weight.medium,
              color: colors.text.secondary,
              lineHeight: 1.4,
            }}
          >
            Sin sesiones registradas todavía. Tu historial aparece aquí cuando empieces a usar Bio-Ignición.
          </p>
        </article>
      ) : (
        <ul
          data-testid="sessions-all-list"
          style={{
            listStyle: "none",
            margin: 0,
            paddingInline: spacing.s24,
            paddingBlock: spacing.s16,
          }}
        >
          {sorted.map((session, i) => (
            <SessionRow key={`${session.ts}-${i}`} session={session} isLast={i === sorted.length - 1} />
          ))}
        </ul>
      )}
    </>
  );
}

function SessionRow({ session, isLast }) {
  const date = session.ts ? new Date(session.ts) : null;
  const dateStr = date ? formatDateTime(date) : "—";
  const intent = session.int || "—";
  const delta = typeof session.deltaC === "number" ? session.deltaC : null;
  const deltaSign = delta == null ? "" : delta > 0 ? "+" : delta < 0 ? "" : "";
  const deltaColor = delta == null
    ? colors.text.muted
    : delta > 0 ? colors.accent.phosphorCyan
    : delta < 0 ? colors.semantic.danger
    : colors.text.secondary;
  return (
    <li
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.s16,
        paddingBlock: 14,
        borderBlockEnd: isLast ? "none" : `0.5px solid ${colors.separator}`,
      }}
    >
      <span style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            textTransform: "capitalize",
          }}
        >
          {intent}
        </span>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.06em",
            color: colors.text.muted,
            fontWeight: typography.weight.regular,
          }}
        >
          {dateStr}{session.d ? ` · ${session.d}s` : ""}
        </span>
      </span>
      {delta != null && (
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.bodyMin,
            fontWeight: typography.weight.medium,
            color: deltaColor,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          Δ {deltaSign}{delta}
        </span>
      )}
    </li>
  );
}

function SubHeader({ title, subtitle, onBack }) {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
        paddingInline: spacing.s24,
        paddingBlock: spacing.s16,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Volver"
        data-testid="sessions-all-back"
        style={{
          appearance: "none",
          background: "transparent",
          border: "none",
          color: colors.text.secondary,
          cursor: "pointer",
          padding: spacing.s8,
          margin: -spacing.s8,
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <ArrowLeft size={20} strokeWidth={1.5} />
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <h2
          style={{
            margin: 0,
            fontFamily: typography.family,
            fontSize: typography.size.subtitleMin,
            fontWeight: typography.weight.medium,
            color: colors.text.strong,
            letterSpacing: "-0.005em",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <span
            style={{
              fontFamily: typography.family,
              fontSize: typography.size.caption,
              fontWeight: typography.weight.regular,
              color: colors.text.muted,
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </header>
  );
}

function formatDateTime(date) {
  const d = date.getDate();
  const m = date.toLocaleString("es-MX", { month: "short" });
  const y = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${d} ${m} ${y} · ${hh}:${mm}`;
}
