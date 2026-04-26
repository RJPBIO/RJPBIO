"use client";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  AUDIT_RETENTION_MIN_DAYS,
  AUDIT_RETENTION_MAX_DAYS,
  formatLastVerified,
  defaultExportRange,
} from "@/lib/audit-retention";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const ERR = {
  required: "Valor requerido",
  not_integer: "Debe ser un entero",
  too_small: `Mínimo ${AUDIT_RETENTION_MIN_DAYS} días`,
  too_large: `Máximo ${AUDIT_RETENTION_MAX_DAYS} días (${Math.round(AUDIT_RETENTION_MAX_DAYS / 365)} años)`,
};

// Convierte Date → "YYYY-MM-DD" para input type="date".
function toDateInput(d) {
  if (!d) return "";
  const dd = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dd.getTime())) return "";
  const y = dd.getUTCFullYear();
  const m = String(dd.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dd.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AuditSettingsClient({
  orgId, orgName, canEdit, initialDays, totalLogs,
  lastVerifiedAt, lastVerifiedStatus,
}) {
  const [days, setDays] = useState(initialDays);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [persistedLastVerified, setPersistedLastVerified] = useState({
    at: lastVerifiedAt, status: lastVerifiedStatus,
  });

  // Date range: default últimos 90 días. Inputs HTML5 date.
  const defaultRange = useMemo(() => defaultExportRange(), []);
  const [from, setFrom] = useState(toDateInput(defaultRange.from));
  const [to, setTo] = useState(toDateInput(defaultRange.to));
  const [previewCount, setPreviewCount] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  // Auto-fetch count cada vez que cambian las fechas (debounced light).
  useEffect(() => {
    let cancelled = false;
    async function loadCount() {
      setPreviewing(true);
      try {
        const params = new URLSearchParams();
        if (from) params.set("from", new Date(from + "T00:00:00Z").toISOString());
        if (to) params.set("to", new Date(to + "T23:59:59Z").toISOString());
        const r = await fetch(`/api/v1/orgs/${orgId}/audit/count?${params.toString()}`, {
          cache: "no-store",
        });
        if (!r.ok) return;
        const j = await r.json();
        if (!cancelled) setPreviewCount(j.count ?? 0);
      } catch { /* no-op */ } finally {
        if (!cancelled) setPreviewing(false);
      }
    }
    const t = setTimeout(loadCount, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [orgId, from, to]);

  const lastVerifiedDisplay = formatLastVerified(
    persistedLastVerified.at,
    persistedLastVerified.status,
  );

  async function onSave(e) {
    e.preventDefault();
    setErr(null);
    const n = Number(days);
    if (!Number.isInteger(n)) { setErr("not_integer"); return; }
    if (n < AUDIT_RETENTION_MIN_DAYS) { setErr("too_small"); return; }
    if (n > AUDIT_RETENTION_MAX_DAYS) { setErr("too_large"); return; }

    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/audit/retention`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ days: n }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.reason && ERR[j.reason]) {
          setErr(j.reason);
          throw new Error(ERR[j.reason]);
        }
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Retention actualizado");
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/audit/verify`, {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setVerifyResult(j);
      // Sprint 10 polish — actualizar last-verified en UI sin reload.
      setPersistedLastVerified({
        at: j.verifiedAt || new Date().toISOString(),
        status: j.status === "verified" ? "verified" : "tampered",
      });
      if (j.status === "verified") toast.success(j.message);
      else toast.error(j.message);
    } catch (e) {
      toast.error(e?.message || "No se pudo verificar");
    } finally {
      setVerifying(false);
    }
  }

  function exportFormat(fmt) {
    const params = new URLSearchParams();
    params.set("format", fmt);
    if (from) params.set("from", new Date(from + "T00:00:00Z").toISOString());
    if (to) params.set("to", new Date(to + "T23:59:59Z").toISOString());
    const url = `/api/v1/orgs/${orgId}/audit/export?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <article style={{ maxWidth: 760, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            Configuración de auditoría
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            Retención · verificación de integridad · export para SOC2/ISO27001 · {orgName}
          </p>
        </div>
        <Badge variant="soft" size="sm">{totalLogs.toLocaleString()} logs</Badge>
      </header>

      {/* Retention */}
      <section style={cardStyle}>
        <header style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>Retención de logs</h2>
        </header>
        <p style={cardDescStyle}>
          Logs con <code>ts</code> más viejos que el cutoff serán borrados por el sweeper.
          Default 365 días. Rango permitido: {AUDIT_RETENTION_MIN_DAYS}–{AUDIT_RETENTION_MAX_DAYS} días
          ({Math.round(AUDIT_RETENTION_MAX_DAYS / 365)} años).
          Borrar logs antiguos NO rompe la verificación de los restantes (la cadena
          continúa desde el primer log no borrado).
        </p>
        <form onSubmit={onSave} style={{ display: "flex", gap: space[2], alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 200px", minWidth: 200 }}>
            <Field label="Días de retención" error={err ? ERR[err] : null}>
              <Input
                type="number"
                min={AUDIT_RETENTION_MIN_DAYS}
                max={AUDIT_RETENTION_MAX_DAYS}
                step={1}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                disabled={!canEdit}
              />
            </Field>
          </div>
          {canEdit && (
            <Button variant="primary" type="submit" loading={busy} loadingLabel="Guardando…">
              Guardar
            </Button>
          )}
        </form>
        {!canEdit && (
          <Alert kind="info">
            Solo OWNER puede modificar retention. Pídele al owner que la ajuste.
          </Alert>
        )}
      </section>

      {/* Verify */}
      <section style={{ ...cardStyle, marginBlockStart: space[4] }}>
        <header style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>Verificación de cadena</h2>
          <Badge
            variant={lastVerifiedDisplay.tone === "success" ? "success"
              : lastVerifiedDisplay.tone === "error" ? "warn"
              : "soft"}
            size="sm"
          >
            {persistedLastVerified.at ? "Verificada" : "Sin verificar"}
          </Badge>
        </header>
        <p style={cardDescStyle}>
          Recomputa el hash chain SHA-256 + HMAC seal. Si algún log fue
          modificado o eliminado del medio, la cadena rompe en ese punto.
          Operación read-only; segura de correr en producción.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: space[3], flexWrap: "wrap" }}>
          <Button onClick={onVerify} loading={verifying} loadingLabel="Verificando…" variant="secondary">
            Verificar ahora
          </Button>
          <span style={{
            color: lastVerifiedDisplay.tone === "error" ? "var(--bi-danger)"
              : lastVerifiedDisplay.tone === "success" ? cssVar.text
              : cssVar.textDim,
            fontSize: font.size.sm,
            fontFamily: cssVar.fontMono,
          }}>
            {lastVerifiedDisplay.text}
          </span>
        </div>
        {verifyResult && (
          <Alert kind={verifyResult.status === "verified" ? "success" : "error"}>
            <strong>{verifyResult.message}</strong>
            {verifyResult.brokenAt && (
              <div style={{ marginTop: space[1], fontSize: font.size.xs, fontFamily: cssVar.fontMono }}>
                Roto en: {verifyResult.brokenAt}
              </div>
            )}
          </Alert>
        )}
      </section>

      {/* Export */}
      <section style={{ ...cardStyle, marginBlockStart: space[4] }}>
        <header style={cardHeaderStyle}>
          <h2 style={cardTitleStyle}>Export para auditoría externa</h2>
        </header>
        <p style={cardDescStyle}>
          Descarga logs del org en el rango seleccionado (cap 50,000 rows)
          para evidencia SOC2/ISO27001 o solicitudes de auditores externos.
          Default: últimos 90 días. CSV machine-friendly. JSONL preserva tipos.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[3] }}>
          <Field label="Desde">
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              max={to || undefined}
            />
          </Field>
          <Field label="Hasta">
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              min={from || undefined}
            />
          </Field>
        </div>
        <div style={{
          padding: `${space[2]}px ${space[3]}px`,
          background: cssVar.surface2,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          fontFamily: cssVar.fontMono,
        }}>
          {previewing ? "Calculando…" : (
            previewCount === null ? "—" :
            previewCount === 0 ? "No hay logs en este rango" :
            previewCount > 50_000
              ? `${previewCount.toLocaleString()} logs en rango (export limitado a primeros 50,000)`
              : `${previewCount.toLocaleString()} logs en rango listos para exportar`
          )}
        </div>
        <div style={{ display: "flex", gap: space[2], flexWrap: "wrap" }}>
          <Button
            onClick={() => exportFormat("csv")}
            variant="secondary"
            disabled={previewCount === 0}
          >
            Descargar CSV
          </Button>
          <Button
            onClick={() => exportFormat("jsonl")}
            variant="secondary"
            disabled={previewCount === 0}
          >
            Descargar JSONL
          </Button>
          <Button
            onClick={() => { setFrom(""); setTo(""); }}
            variant="ghost"
            size="sm"
          >
            Quitar fechas (todo el historial)
          </Button>
        </div>
      </section>

      <section style={{ marginBlockStart: space[5], padding: space[4], background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
          ¿Cómo funciona la inmutabilidad?
        </h2>
        <ul style={{ margin: `${space[2]}px 0 0`, paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.7 }}>
          <li><strong>Hash chain:</strong> cada log incluye <code>prevHash</code> + <code>hash</code> SHA-256(canonicalized). Modificar un log invalida todos los siguientes.</li>
          <li><strong>HMAC seal:</strong> cada log también firma con <code>AUDIT_HMAC_KEY</code>. Un atacante con DB write necesita además la llave para regrabar la cadena.</li>
          <li><strong>Verificación:</strong> el endpoint <code>POST /audit/verify</code> recomputa toda la cadena. CLI offline disponible en <code>scripts/verify-audit-chain.js</code>.</li>
          <li><strong>Auditoría del export:</strong> cada export queda registrado como <code>org.audit.exported</code>; cada verify como <code>org.audit.verified</code>.</li>
        </ul>
      </section>
    </article>
  );
}

const cardStyle = {
  padding: space[5],
  background: cssVar.surface,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
  display: "grid",
  gap: space[3],
};
const cardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: space[3],
};
const cardTitleStyle = {
  margin: 0,
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  color: cssVar.text,
};
const cardDescStyle = {
  margin: 0,
  color: cssVar.textMuted,
  fontSize: font.size.sm,
  lineHeight: 1.6,
};
