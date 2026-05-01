"use client";
/* ═══════════════════════════════════════════════════════════════
   RemindersCard — opt-in a recordatorios diarios.

   Modelo simple: toggle + hora (HH:MM). Al activar:
     1. Pide permiso de notificaciones.
     2. Intenta suscribirse a Web Push (si hay VAPID).
     3. Programa notificación local como fallback — útil si el backend
        no envía push y el usuario mantiene la pestaña/PWA abierta.

   Al desactivar: cancela suscripción push y limpia la intención.

   Nota: es una superficie, no un scheduler robusto. La entrega
   diaria fiable requiere push real del backend; lo local es best-effort.
   ═══════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import {
  requestPushPermission, subscribePush, unsubscribePush, scheduleLocalReminder,
  registerPeriodicReminder, unregisterPeriodicReminder,
} from "../lib/push";
import { toast } from "./ui/Toast";
import { resolveTheme, withAlpha, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

const MONO_RM = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

function formatHM(h, m) {
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm}`;
}

function parseHM(value) {
  const [h, m] = String(value || "").split(":").map(Number);
  return {
    hour: Number.isFinite(h) ? Math.max(0, Math.min(23, h)) : 9,
    minute: Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0,
  };
}

function readPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export default function RemindersCard({ isDark = true, ac = "#10B981" }) {
  const { surface: sf, border: bd, t1, t3 } = resolveTheme(isDark);
  const reduced = useReducedMotion();
  const enabled = useStore((s) => !!s.remindersEnabled);
  const hour = useStore((s) => s.reminderHour ?? 9);
  const minute = useStore((s) => s.reminderMinute ?? 0);
  const update = useStore((s) => s.update);

  const [permission, setPermission] = useState("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPermission(readPermission()); }, []);

  useEffect(() => {
    if (!enabled) return;
    if (readPermission() !== "granted") return;
    scheduleLocalReminder({ hour, minute });
  }, [enabled, hour, minute]);

  const enable = useCallback(async () => {
    setBusy(true);
    try {
      const perm = await requestPushPermission();
      setPermission(perm);
      if (perm !== "granted") {
        toast.warn("Sin permiso no podemos recordarte", {
          action: perm === "denied"
            ? { label: "Ver ayuda", onClick: () => window.open("https://support.google.com/chrome/answer/3220216", "_blank") }
            : null,
        });
        return;
      }
      try { await subscribePush(); } catch { /* noop */ }
      // Sprint 91 — registrar periodicSync como capa adicional para PWA
      // instalada (browser dispara SW handler bio-daily-reminder ~24h
      // independiente de tab abierto). Plus el setTimeout-fallback si
      // user mantiene tab abierto.
      try { await registerPeriodicReminder(); } catch { /* noop */ }
      update({ remindersEnabled: true });
      scheduleLocalReminder({ hour, minute });
      toast.success(`Te recordaré a las ${formatHM(hour, minute)}`);
    } finally {
      setBusy(false);
    }
  }, [hour, minute, update]);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      try { await unsubscribePush(); } catch { /* noop */ }
      try { await unregisterPeriodicReminder(); } catch { /* noop */ }
      update({ remindersEnabled: false });
      toast.info("Recordatorios desactivados");
    } finally {
      setBusy(false);
    }
  }, [update]);

  const onToggle = useCallback(() => {
    if (busy) return;
    if (enabled) disable(); else enable();
  }, [enabled, disable, enable, busy]);

  const onTimeChange = useCallback((e) => {
    const { hour: h, minute: m } = parseHM(e.target.value);
    update({ reminderHour: h, reminderMinute: m });
  }, [update]);

  const unsupported = permission === "unsupported";
  const denied = permission === "denied";
  const switchLabel = `${enabled ? "Desactivar" : "Activar"} recordatorio diario a las ${formatHM(hour, minute)}`;

  // BEACON tint — green active, dim when off
  const beacon = "#34D399";
  const tint = enabled ? beacon : "rgba(245,245,247,0.30)";

  // Hour position on 24-tick dial (top = 00:00, clockwise)
  const dialAngle = (hour + minute / 60) * 15 - 90; // degrees
  const dialRad = dialAngle * Math.PI / 180;

  return (
    <motion.section
      aria-label="Recordatorios diarios"
      initial={reduced ? { opacity: 1 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "relative",
        background: enabled
          ? `radial-gradient(ellipse 60% 100% at 100% 0%, ${withAlpha(beacon, 14)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.12) 100%)`
          : `linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.10) 100%)`,
        backdropFilter: "blur(22px) saturate(150%)",
        WebkitBackdropFilter: "blur(22px) saturate(150%)",
        border: `0.5px solid rgba(255,255,255,0.10)`,
        borderRadius: 18,
        padding: "14px 16px 14px 16px",
        boxShadow: enabled
          ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${withAlpha(beacon, 22)}, 0 6px 20px rgba(0,0,0,0.30), 0 0 18px ${withAlpha(beacon, 10)}`
          : `inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 18px rgba(0,0,0,0.26)`,
        overflow: "hidden",
        transition: "background 0.4s ease, box-shadow 0.4s ease",
      }}
    >
      {/* Top row — eyebrow with pulse dot + toggle */}
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBlockEnd: 12 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <span aria-hidden="true" style={{ position: "relative", inlineSize: 6, blockSize: 6, display: "inline-block" }}>
            <span style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: enabled
                ? `radial-gradient(circle at 35% 30%, #fff 0%, ${beacon} 55%, ${beacon} 100%)`
                : "rgba(245,245,247,0.30)",
              boxShadow: enabled ? `0 0 8px ${beacon}, 0 0 3px ${beacon}` : "none",
              animation: enabled && !reduced ? "shimDot 2.4s ease-in-out infinite" : "none",
            }} />
          </span>
          <span style={{
            fontFamily: MONO_RM,
            fontSize: 8.5,
            fontWeight: 500,
            color: tint,
            letterSpacing: "0.24em",
            textTransform: "uppercase",
            textShadow: enabled ? `0 0 6px ${withAlpha(beacon, 50)}` : "none",
            whiteSpace: "nowrap",
          }}>
            Recordatorio · diario
          </span>
        </span>

        {/* Toggle — refined glass capsule */}
        <label
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: busy || unsupported ? "not-allowed" : "pointer",
            opacity: unsupported ? 0.5 : 1,
            flexShrink: 0,
            minInlineSize: 44,
            minBlockSize: 28,
            padding: 4,
          }}
        >
          <input
            type="checkbox"
            role="switch"
            aria-checked={enabled}
            aria-label={switchLabel}
            checked={enabled}
            disabled={busy || unsupported}
            onChange={onToggle}
            style={{ position: "absolute", opacity: 0, inlineSize: "100%", blockSize: "100%", margin: 0, cursor: "inherit" }}
          />
          <span
            aria-hidden
            style={{
              inlineSize: 42,
              blockSize: 22,
              background: enabled
                ? `linear-gradient(180deg, ${beacon} 0%, ${withAlpha(beacon, 80)} 100%)`
                : "rgba(255,255,255,0.10)",
              border: enabled ? `0.5px solid ${withAlpha(beacon, 50)}` : `0.5px solid rgba(255,255,255,0.12)`,
              borderRadius: 999,
              position: "relative",
              boxShadow: enabled
                ? `inset 0 1px 0 rgba(255,255,255,0.30), 0 0 10px ${withAlpha(beacon, 40)}`
                : `inset 0 1px 0 rgba(255,255,255,0.06)`,
              transition: "background 0.2s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.2s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                insetBlockStart: 3,
                insetInlineStart: 3,
                inlineSize: 16,
                blockSize: 16,
                background: "#fff",
                borderRadius: 999,
                transform: enabled ? "translateX(20px)" : "translateX(0)",
                transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.30)",
              }}
            />
          </span>
        </label>
      </header>

      {/* Main row — time display + 24h dial signature */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Time display tile — large mono numerals */}
        <label
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "baseline",
            gap: 2,
            paddingBlock: 8,
            paddingInline: 12,
            background: enabled
              ? `linear-gradient(180deg, ${withAlpha(beacon, 12)} 0%, ${withAlpha(beacon, 4)} 100%)`
              : "rgba(255,255,255,0.03)",
            border: `0.5px solid ${enabled ? withAlpha(beacon, 30) : "rgba(255,255,255,0.08)"}`,
            borderRadius: 12,
            cursor: enabled ? "pointer" : "default",
            opacity: enabled ? 1 : 0.55,
            transition: "all 0.3s ease",
            boxShadow: enabled ? `inset 0 1px 0 rgba(255,255,255,0.06), 0 0 14px ${withAlpha(beacon, 14)}` : "none",
            flexShrink: 0,
          }}
        >
          <span style={{
            fontFamily: MONO_RM,
            fontSize: 28,
            fontWeight: 300,
            color: enabled ? "rgba(245,245,247,0.96)" : "rgba(245,245,247,0.55)",
            letterSpacing: -0.5,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: enabled ? `0 0 10px ${withAlpha(beacon, 35)}` : "none",
          }}>
            {String(hour).padStart(2, "0")}
          </span>
          <span style={{
            fontFamily: MONO_RM,
            fontSize: 24,
            fontWeight: 300,
            color: enabled ? withAlpha(beacon, 80) : "rgba(245,245,247,0.40)",
            lineHeight: 1,
            opacity: 0.9,
            margin: "0 1px",
          }}>
            :
          </span>
          <span style={{
            fontFamily: MONO_RM,
            fontSize: 28,
            fontWeight: 300,
            color: enabled ? "rgba(245,245,247,0.96)" : "rgba(245,245,247,0.55)",
            letterSpacing: -0.5,
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            textShadow: enabled ? `0 0 10px ${withAlpha(beacon, 35)}` : "none",
          }}>
            {String(minute).padStart(2, "0")}
          </span>
          <input
            type="time"
            value={formatHM(hour, minute)}
            onChange={onTimeChange}
            disabled={!enabled || busy}
            aria-label="Hora del recordatorio"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0,
              cursor: enabled ? "pointer" : "default",
              colorScheme: isDark ? "dark" : "light",
            }}
          />
        </label>

        {/* Identity stack right side */}
        <div style={{ flex: 1, minInlineSize: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <h3 style={{
            fontSize: 13.5,
            fontWeight: 500,
            color: "rgba(245,245,247,0.94)",
            margin: 0,
            letterSpacing: -0.25,
            lineHeight: 1.2,
          }}>
            Recordatorio diario
          </h3>
          <p style={{
            fontSize: 11,
            fontWeight: 400,
            color: "rgba(245,245,247,0.50)",
            margin: 0,
            letterSpacing: 0,
            lineHeight: 1.35,
          }}>
            Un empujón suave a la misma hora para no romper la racha.
          </p>
        </div>

        {/* 24h dial signature (right) */}
        <span aria-hidden="true" style={{ flexShrink: 0, opacity: enabled ? 0.95 : 0.4, transition: "opacity 0.4s ease" }}>
          <svg width="44" height="44" viewBox="0 0 44 44">
            {/* outer dashed ring */}
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" strokeDasharray="2 2" />
            {/* 24 ticks (4 major at quarters, 20 minor) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const a = (i * 15 - 90) * Math.PI / 180;
              const r1 = i % 6 === 0 ? 14 : 16;
              const r2 = 19;
              const x1 = 22 + Math.cos(a) * r1;
              const y1 = 22 + Math.sin(a) * r1;
              const x2 = 22 + Math.cos(a) * r2;
              const y2 = 22 + Math.sin(a) * r2;
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 6 === 0 ? "rgba(245,245,247,0.32)" : "rgba(245,245,247,0.14)"} strokeWidth="0.6" strokeLinecap="round" />;
            })}
            {/* hour position marker */}
            <line
              x1={22 + Math.cos(dialRad) * 6}
              y1={22 + Math.sin(dialRad) * 6}
              x2={22 + Math.cos(dialRad) * 19}
              y2={22 + Math.sin(dialRad) * 19}
              stroke={tint}
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity={enabled ? 1 : 0.5}
            />
            <circle
              cx={22 + Math.cos(dialRad) * 19}
              cy={22 + Math.sin(dialRad) * 19}
              r={enabled ? 2.5 : 2}
              fill={tint}
            />
            {enabled && (
              <circle
                cx={22 + Math.cos(dialRad) * 19}
                cy={22 + Math.sin(dialRad) * 19}
                r="5"
                fill="none"
                stroke={beacon}
                strokeWidth="0.8"
                opacity="0.5"
              >
                {!reduced && <animate attributeName="r" values="3;7;3" dur="2.4s" repeatCount="indefinite" />}
                {!reduced && <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />}
              </circle>
            )}
            {/* center dot */}
            <circle cx="22" cy="22" r="1.5" fill={enabled ? withAlpha(beacon, 70) : "rgba(245,245,247,0.30)"} />
          </svg>
        </span>
      </div>

      {/* Permission warnings */}
      {denied && (
        <p
          role="alert"
          style={{
            fontSize: 11,
            color: semantic.warning,
            background: withAlpha(semantic.warning, 10),
            border: `0.5px solid ${withAlpha(semantic.warning, 30)}`,
            padding: "8px 10px",
            borderRadius: 10,
            margin: 0,
            marginBlockStart: 12,
            letterSpacing: -0.05,
          }}
        >
          Permiso bloqueado. Actívalo en los ajustes del navegador para este sitio.
        </p>
      )}

      {unsupported && (
        <p style={{
          fontSize: 11,
          color: "rgba(245,245,247,0.50)",
          margin: 0,
          marginBlockStart: 12,
          letterSpacing: -0.05,
        }}>
          Tu navegador no soporta notificaciones — los recordatorios quedarán activos si
          instalas la app como PWA.
        </p>
      )}
    </motion.section>
  );
}
