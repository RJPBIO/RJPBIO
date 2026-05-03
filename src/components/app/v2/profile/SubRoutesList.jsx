"use client";
import {
  Compass, ClipboardList, ShieldCheck, Activity, Settings, Lock, Users, Download, User,
  ChevronRight,
} from "lucide-react";
import { colors, typography, spacing, radii, surfaces, icon, motion as motionTok } from "../tokens";

export default function SubRoutesList({ rows, onPick }) {
  return (
    <section
      data-v2-subroutes
      aria-label="Ajustes"
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s96,
        display: "flex",
        flexDirection: "column",
        gap: 8,
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
          marginBlockEnd: 4,
        }}
      >
        AJUSTES
      </div>
      {rows.map((r) => (
        <Row key={r.id} row={r} onPick={onPick} />
      ))}
    </section>
  );
}

function Row({ row, onPick }) {
  const Icon = ICONS[row.icon] || Settings;
  return (
    <button
      type="button"
      onClick={() => onPick && onPick(row.id)}
      data-v2-subroute={row.id}
      style={{
        appearance: "none",
        textAlign: "start",
        background: colors.bg.raised,
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
        color: "inherit",
        cursor: "pointer",
        width: "100%",
        transitionProperty: "background, transform",
        transitionDuration: "180ms",
        transitionTimingFunction: motionTok.ease.out,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = surfaces.rowHover; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = colors.bg.raised; }}
      onPointerDown={(e) => { e.currentTarget.style.transform = `scale(${motionTok.tap.scale})`; }}
      onPointerUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onPointerLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          background: surfaces.iconBox,
          borderRadius: radii.iconBox,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.55)",
          flexShrink: 0,
        }}
      >
        <Icon size={icon.size} strokeWidth={icon.strokeWidth} />
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.medium,
            color: "rgba(255,255,255,0.96)",
            letterSpacing: "-0.005em",
            lineHeight: 1.2,
          }}
        >
          {row.title}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.caption,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.4,
          }}
        >
          {row.descriptor}
        </span>
      </span>
      <ChevronRight size={18} strokeWidth={icon.strokeWidth} color="rgba(255,255,255,0.32)" aria-hidden="true" />
    </button>
  );
}

const ICONS = {
  compass:        Compass,
  "clipboard-list": ClipboardList,
  "shield-check": ShieldCheck,
  activity:       Activity,
  settings:       Settings,
  lock:           Lock,
  users:          Users,
  download:       Download,
  user:           User,
};
