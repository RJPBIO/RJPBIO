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
} from "../lib/push";
import { toast } from "./ui/Toast";
import { cssVar, radius, space, font } from "./ui/tokens";

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

export default function RemindersCard() {
  const enabled = useStore((s) => !!s.remindersEnabled);
  const hour = useStore((s) => s.reminderHour ?? 9);
  const minute = useStore((s) => s.reminderMinute ?? 0);
  const update = useStore((s) => s.update);

  const [permission, setPermission] = useState("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => { setPermission(readPermission()); }, []);

  // Re-scheduling local reminder cuando cambian hora/minuto o al activar.
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
      // Best-effort: suscribirse a Web Push si hay VAPID. No fatal si falla.
      try { await subscribePush(); } catch { /* noop */ }
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

  return (
    <section
      aria-label="Recordatorios diarios"
      style={{
        padding: space[4],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.lg,
        display: "grid",
        gap: space[3],
      }}
    >
      <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: space[3] }}>
        <div style={{ minInlineSize: 0 }}>
          <h3 style={{ fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text, margin: 0 }}>
            Recordatorio diario
          </h3>
          <p style={{ fontSize: font.size.sm, color: cssVar.textDim, margin: 0, marginBlockStart: 2 }}>
            Un empujón suave a la misma hora para no romper la racha.
          </p>
        </div>
        <label
          style={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            cursor: busy || unsupported ? "not-allowed" : "pointer",
            opacity: unsupported ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          <input
            type="checkbox"
            role="switch"
            aria-checked={enabled}
            checked={enabled}
            disabled={busy || unsupported}
            onChange={onToggle}
            style={{ position: "absolute", opacity: 0, inlineSize: 0, blockSize: 0 }}
          />
          <span
            aria-hidden
            style={{
              inlineSize: 40,
              blockSize: 22,
              background: enabled ? cssVar.accent : cssVar.border,
              borderRadius: 999,
              position: "relative",
              transition: "background 0.2s ease",
            }}
          >
            <span
              style={{
                position: "absolute",
                insetBlockStart: 3,
                insetInlineStart: enabled ? 21 : 3,
                inlineSize: 16,
                blockSize: 16,
                background: "#fff",
                borderRadius: 999,
                transition: "inset-inline-start 0.2s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
              }}
            />
          </span>
        </label>
      </header>

      {enabled && (
        <label style={{ display: "flex", alignItems: "center", gap: space[2], fontSize: font.size.sm, color: cssVar.textDim }}>
          A las
          <input
            type="time"
            value={formatHM(hour, minute)}
            onChange={onTimeChange}
            style={{
              background: cssVar.surface2,
              border: `1px solid ${cssVar.border}`,
              color: cssVar.text,
              borderRadius: radius.md,
              padding: `${space[2]}px ${space[3]}px`,
              fontSize: font.size.md,
              fontFamily: "inherit",
            }}
          />
        </label>
      )}

      {denied && (
        <p
          role="alert"
          style={{
            fontSize: font.size.sm,
            color: cssVar.warn,
            background: `color-mix(in srgb, ${cssVar.warn} 10%, transparent)`,
            padding: space[2],
            borderRadius: radius.md,
            margin: 0,
          }}
        >
          Permiso bloqueado. Actívalo en los ajustes del navegador para este sitio.
        </p>
      )}

      {unsupported && (
        <p style={{ fontSize: font.size.sm, color: cssVar.textMuted, margin: 0 }}>
          Tu navegador no soporta notificaciones — los recordatorios quedarán activos si
          instalas la app como PWA.
        </p>
      )}
    </section>
  );
}
