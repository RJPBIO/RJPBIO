"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import { BioGlyph } from "@/components/BioIgnicionMark";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  MAINTENANCE_STATUSES,
  statusLabel, statusTone, formatDuration,
  isUpcoming, isInProgress, isFinished,
} from "@/lib/maintenance";
import { INCIDENT_COMPONENTS } from "@/lib/incidents";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const TONE_VARIANT = {
  success: "success",
  warn: "warn",
  soft: "soft",
  neutral: "neutral",
  danger: "danger",
};

function toLocalInput(iso) {
  if (!iso) return "";
  // Convierte ISO a "YYYY-MM-DDTHH:mm" para datetime-local input.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function MaintenanceClient({ initial }) {
  const [windows, setWindows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  // Sprint 36 — Cmd+K action: ?action=create auto-opens form
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("action") === "create") setCreating(true);
  }, [searchParams]);
  const [form, setForm] = useState({
    title: "", body: "",
    scheduledStart: "", scheduledEnd: "",
    components: new Set(),
  });

  function toggleComponent(c) {
    setForm((s) => {
      const next = new Set(s.components);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { ...s, components: next };
    });
  }

  async function refresh() {
    try {
      const r = await fetch("/api/v1/maintenance", { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setWindows(j.windows || []);
    } catch { /* no-op */ }
  }

  async function createWindow(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.scheduledStart || !form.scheduledEnd) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch("/api/v1/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          title: form.title,
          body: form.body || undefined,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: new Date(form.scheduledEnd).toISOString(),
          components: [...form.components],
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Maintenance window programada — visible en /status");
      setForm({ title: "", body: "", scheduledStart: "", scheduledEnd: "", components: new Set() });
      setCreating(false);
      await refresh();
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function transition(windowId, status) {
    if (status === "cancelled" && !confirm("¿Cancelar esta ventana? Subscribers ya notificados sabrán que no procede.")) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/maintenance/${windowId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success(`Status → ${status}`);
      await refresh();
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article>
      <PageHeader
        eyebrow="Plataforma · scheduled"
        italic="Ventanas"
        title="de mantenimiento."
        subtitle="Programa con notify automático a T-24h, T-0 y T+done."
        actions={
          <Button variant="primary" onClick={() => setCreating(!creating)}>
            {creating ? "Cancelar" : "Nueva ventana"}
          </Button>
        }
      />

      <Alert kind="info" style={{ marginBlockEnd: space[4] }}>
        <strong>Notify cadence:</strong> los subscribers verificados (Sprint 20)
        reciben push-email/webhook automáticamente:
        <ul style={{ margin: `${space[1]}px 0 0`, paddingInlineStart: space[5] }}>
          <li>T-24h: pre-aviso para que prepare integraciones</li>
          <li>T-0: confirmamos start cuando arranca</li>
          <li>T+done: aviso de completion (con duración real)</li>
        </ul>
      </Alert>

      {creating && (
        <form onSubmit={createWindow} style={{
          display: "grid", gap: space[3],
          padding: space[4], marginBlockEnd: space[4],
          background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
        }}>
          <Field label="Título">
            <Input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="Postgres 16 upgrade"
              maxLength={120}
              required
            />
          </Field>
          <Field label="Cuerpo (opcional)">
            <textarea
              value={form.body}
              onChange={(e) => setForm((s) => ({ ...s, body: e.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Detalles para usuarios. Qué se va a actualizar, qué impacto esperar."
              style={{
                width: "100%",
                padding: `${space[2]}px ${space[3]}px`,
                background: cssVar.surface2,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.sm,
                color: cssVar.text,
                fontFamily: cssVar.fontSans,
                fontSize: font.size.sm,
                resize: "vertical",
              }}
            />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[3] }}>
            <Field label="Inicio programado">
              <Input
                type="datetime-local"
                value={form.scheduledStart}
                onChange={(e) => setForm((s) => ({ ...s, scheduledStart: e.target.value }))}
                required
              />
            </Field>
            <Field label="Fin programado">
              <Input
                type="datetime-local"
                value={form.scheduledEnd}
                onChange={(e) => setForm((s) => ({ ...s, scheduledEnd: e.target.value }))}
                required
              />
            </Field>
          </div>
          <Field label="Componentes afectados">
            <div style={{ display: "flex", flexWrap: "wrap", gap: space[1] }}>
              {INCIDENT_COMPONENTS.map((c) => (
                <label key={c} style={{
                  display: "inline-flex", alignItems: "center", gap: space[1],
                  padding: `${space[1]}px ${space[2]}px`,
                  background: form.components.has(c) ? cssVar.accentSoft : cssVar.surface2,
                  border: `1px solid ${form.components.has(c) ? cssVar.accent : cssVar.border}`,
                  borderRadius: radius.sm,
                  fontSize: font.size.xs,
                  cursor: "pointer",
                }}>
                  <input
                    type="checkbox"
                    checked={form.components.has(c)}
                    onChange={() => toggleComponent(c)}
                    style={{ accentColor: "var(--bi-accent)" }}
                  />
                  <code style={{ fontFamily: cssVar.fontMono }}>{c}</code>
                </label>
              ))}
            </div>
          </Field>
          <div>
            <Button type="submit" variant="primary" loading={busy} loadingLabel="Programando…">
              Programar maintenance
            </Button>
          </div>
        </form>
      )}

      {windows.length === 0 ? (
        <div className="bi-admin-empty">
          <span className="bi-admin-empty-glyph"><BioGlyph size={36} /></span>
          <div className="bi-admin-empty-title">Sin ventanas programadas.</div>
          <div className="bi-admin-empty-body">
            Cuando programes mantenimiento, los subscribers recibirán notify automático a T-24h, T-0 y T+done.
          </div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[3] }}>
          {windows.map((w) => {
            const tone = statusTone(w);
            const upcoming = isUpcoming(w);
            const inProgress = isInProgress(w);
            const finished = isFinished(w);
            return (
              <li key={w.id} style={{
                padding: space[4],
                background: cssVar.surface,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.md,
              }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space[2] }}>
                  <strong style={{ color: cssVar.text }}>{w.title}</strong>
                  <Badge variant={TONE_VARIANT[tone] || "soft"} size="sm">
                    {statusLabel(w.status)}{inProgress && w.status === "scheduled" ? " (auto)" : ""}
                  </Badge>
                </header>

                {w.body && (
                  <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.sm }}>
                    {w.body}
                  </p>
                )}

                <div style={{ marginBlockStart: space[2], color: cssVar.textDim, fontSize: font.size.xs, fontFamily: cssVar.fontMono }}>
                  {new Date(w.scheduledStart).toLocaleString()} → {new Date(w.scheduledEnd).toLocaleString()}
                  <span style={{ marginInlineStart: space[2], color: cssVar.textMuted }}>
                    ({formatDuration(w.scheduledStart, w.scheduledEnd)})
                  </span>
                  {w.components?.length > 0 && (
                    <div>Componentes: {w.components.join(", ")}</div>
                  )}
                  {(w.actualStart || w.actualEnd) && (
                    <div>
                      Actual: {w.actualStart ? new Date(w.actualStart).toLocaleString() : "—"}
                      {" → "}
                      {w.actualEnd ? new Date(w.actualEnd).toLocaleString() : "en curso"}
                    </div>
                  )}
                  <div style={{ marginBlockStart: space[1], color: cssVar.textDim }}>
                    Notifies: {w.notifiedT24 ? "T-24 ✓" : "T-24 ⌛"} · {w.notifiedT0 ? "T-0 ✓" : "T-0 ⌛"} · {w.notifiedComplete ? "complete ✓" : "complete ⌛"}
                  </div>
                </div>

                {!finished && (
                  <div style={{ marginBlockStart: space[3], display: "flex", gap: space[2], flexWrap: "wrap" }}>
                    {MAINTENANCE_STATUSES.filter((s) =>
                      // Solo siguiente válido por state machine — usa simple check.
                      (w.status === "scheduled" && (s === "in_progress" || s === "completed" || s === "cancelled")) ||
                      (w.status === "in_progress" && (s === "completed" || s === "cancelled"))
                    ).map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant={next === "completed" ? "primary" : next === "cancelled" ? "danger" : "ghost"}
                        onClick={() => transition(w.id, next)}
                        disabled={busy}
                      >
                        → {statusLabel(next)}
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
