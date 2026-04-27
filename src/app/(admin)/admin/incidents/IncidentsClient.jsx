"use client";
import { useState } from "react";
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
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INCIDENT_COMPONENTS,
  statusLabel, severityLabel, statusTone,
} from "@/lib/incidents";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const SEVERITY_VARIANT = {
  critical: "danger",
  major: "warn",
  minor: "soft",
};

export default function IncidentsClient({ initial }) {
  const [incidents, setIncidents] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: "", body: "", severity: "minor", components: new Set(),
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
      const r = await fetch("/api/v1/incidents", { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      // Endpoint público devuelve sólo activos + recientes; para admin
      // refetch desde page (server component) sería más completo. Reusamos
      // el initial state hasta que el user recargue.
      setIncidents(j.incidents || []);
    } catch { /* no-op */ }
  }

  async function createIncident(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch("/api/v1/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          title: form.title,
          body: form.body || undefined,
          severity: form.severity,
          components: [...form.components],
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setIncidents((s) => [j.incident, ...s]);
      setForm({ title: "", body: "", severity: "minor", components: new Set() });
      setCreating(false);
      toast.success("Incident creado — visible en /status");
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  async function postUpdate(incidentId, status) {
    const body = prompt(`Update body para incident (status=${status}):`);
    if (!body) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/incidents/${incidentId}/updates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ status, body }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success(`Update agregado — status=${status}`);
      // Reload página para refrescar updates timeline + status badge.
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article>
      <PageHeader
        eyebrow="Plataforma · status page"
        italic="Estado"
        title="público."
        subtitle={<>Visible en <a href="/status" style={{ color: cssVar.accent }}>/status</a> + RSS feed.xml.</>}
        actions={
          <Button variant="primary" onClick={() => setCreating(!creating)}>
            {creating ? "Cancelar" : "Nuevo incidente"}
          </Button>
        }
      />

      <Alert kind="warn" style={{ marginBlockEnd: space[4] }}>
        <strong>Platform admin area.</strong> Lo que crees aquí es PÚBLICO — visible
        para todos los tenants. Verifica antes de publicar; resolved es terminal.
      </Alert>

      {creating && (
        <form onSubmit={createIncident} style={{
          display: "grid", gap: space[3],
          padding: space[4], marginBlockEnd: space[4],
          background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
        }}>
          <Field label="Título">
            <Input
              value={form.title}
              onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
              placeholder="API latency spike — investigando"
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
              placeholder="Detalles iniciales para usuarios. Se irá actualizando con cada update."
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
          <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: space[3] }}>
            <Field label="Severidad">
              <Select value={form.severity} onChange={(e) => setForm((s) => ({ ...s, severity: e.target.value }))}>
                {INCIDENT_SEVERITIES.map((s) => (
                  <option key={s} value={s}>{severityLabel(s)}</option>
                ))}
              </Select>
            </Field>
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
          </div>
          <div>
            <Button type="submit" variant="primary" loading={busy} loadingLabel="Creando…">
              Publicar incident
            </Button>
          </div>
        </form>
      )}

      {incidents.length === 0 ? (
        <div className="bi-admin-empty">
          <span className="bi-admin-empty-glyph"><BioGlyph size={36} /></span>
          <div className="bi-admin-empty-title">Sistema operativo.</div>
          <div className="bi-admin-empty-body">
            Sin incidentes activos. El status page público muestra todo verde.
          </div>
        </div>
      ) : (
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[3] }}>
          {incidents.map((i) => (
            <li key={i.id} style={{
              padding: space[4],
              background: cssVar.surface,
              border: `1px solid ${cssVar.border}`,
              borderRadius: radius.md,
            }}>
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space[2] }}>
                <strong style={{ color: cssVar.text }}>{i.title}</strong>
                <div style={{ display: "flex", gap: space[1] }}>
                  <Badge variant={SEVERITY_VARIANT[i.severity] || "soft"} size="sm">
                    {severityLabel(i.severity)}
                  </Badge>
                  <Badge variant={statusTone(i.status, i.severity) === "danger" ? "danger" : statusTone(i.status, i.severity) === "warn" ? "warn" : statusTone(i.status, i.severity) === "success" ? "success" : "soft"} size="sm">
                    {statusLabel(i.status)}
                  </Badge>
                </div>
              </header>

              {i.body && (
                <p style={{ margin: `${space[2]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.sm }}>
                  {i.body}
                </p>
              )}

              <div style={{ marginBlockStart: space[2], color: cssVar.textDim, fontSize: font.size.xs }}>
                Iniciado: {new Date(i.startedAt).toLocaleString()}
                {i.resolvedAt && <> · Resuelto: {new Date(i.resolvedAt).toLocaleString()}</>}
                {i.components?.length > 0 && (
                  <> · Componentes: {i.components.join(", ")}</>
                )}
              </div>

              {i.updates?.length > 0 && (
                <details style={{ marginBlockStart: space[2] }}>
                  <summary style={{ cursor: "pointer", color: cssVar.textMuted, fontSize: font.size.xs }}>
                    {i.updates.length} update{i.updates.length !== 1 ? "s" : ""}
                  </summary>
                  <ul style={{ marginBlockStart: space[2], paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm }}>
                    {i.updates.map((u) => (
                      <li key={u.id} style={{ marginBlockEnd: space[1] }}>
                        <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.xs }}>{statusLabel(u.status)}</code>
                        {" "}— {u.body}
                        <span style={{ color: cssVar.textDim, marginInlineStart: space[1] }}>({new Date(u.createdAt).toLocaleString()})</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {i.status !== "resolved" && (
                <div style={{ marginBlockStart: space[3], display: "flex", gap: space[2], flexWrap: "wrap" }}>
                  {INCIDENT_STATUSES.filter((s) => s !== i.status).map((next) => (
                    <Button
                      key={next}
                      size="sm"
                      variant={next === "resolved" ? "primary" : "ghost"}
                      onClick={() => postUpdate(i.id, next)}
                      disabled={busy}
                    >
                      → {statusLabel(next)}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
