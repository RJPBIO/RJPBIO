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
import { useStore } from "../store/useStore";
import {
  requestPushPermission, subscribePush, unsubscribePush, scheduleLocalReminder,
  registerPeriodicReminder, unregisterPeriodicReminder,
} from "../lib/push";
import { toast } from "./ui/Toast";
import { resolveTheme, withAlpha, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";

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

  return (
    <section
      aria-label="Recordatorios diarios"
      style={{
        padding: space[4],
        background: sf,
        border: `1px solid ${bd}`,
        borderRadius: radius.lg,
        display: "grid",
        gap: space[3],
      }}
    >
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: space[3] }}>
        <div style={{ minInlineSize: 0, flex: 1 }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: 700, color: t1, margin: 0, letterSpacing: -0.1 }}>
            Recordatorio diario
          </h3>
          <p style={{ fontSize: font.size.sm, color: t3, margin: 0, marginBlockStart: 2, letterSpacing: -0.05 }}>
            Un empujón suave a la misma hora para no romper la racha.
          </p>
        </div>
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
            minBlockSize: 44,
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
              inlineSize: 40,
              blockSize: 22,
              background: enabled ? ac : bd,
              borderRadius: 999,
              position: "relative",
              transition: "background 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
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
                transform: enabled ? "translateX(18px)" : "translateX(0)",
                transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </span>
        </label>
      </header>

      {enabled && (
        <label style={{ display: "flex", alignItems: "center", gap: space[2], fontSize: font.size.sm, color: t3 }}>
          A las
          <input
            type="time"
            value={formatHM(hour, minute)}
            onChange={onTimeChange}
            style={{
              background: isDark ? "rgba(255,255,255,.04)" : "#F1F4F9",
              border: `1px solid ${bd}`,
              color: t1,
              borderRadius: radius.md,
              padding: `${space[2]}px ${space[3]}px`,
              fontSize: font.size.md,
              fontFamily: "inherit",
              colorScheme: isDark ? "dark" : "light",
              minBlockSize: 44,
            }}
          />
        </label>
      )}

      {denied && (
        <p
          role="alert"
          style={{
            fontSize: font.size.sm,
            color: semantic.warning,
            background: withAlpha(semantic.warning, isDark ? 10 : 8),
            border: `1px solid ${withAlpha(semantic.warning, 20)}`,
            padding: space[3],
            borderRadius: radius.md,
            margin: 0,
          }}
        >
          Permiso bloqueado. Actívalo en los ajustes del navegador para este sitio.
        </p>
      )}

      {unsupported && (
        <p style={{ fontSize: font.size.sm, color: t3, margin: 0 }}>
          Tu navegador no soporta notificaciones — los recordatorios quedarán activos si
          instalas la app como PWA.
        </p>
      )}
    </section>
  );
}
