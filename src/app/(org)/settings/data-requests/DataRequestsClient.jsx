"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const SETTINGS_NAV = [
  { href: "/settings/sessions", label: "Sesiones" },
  { href: "/settings/security/mfa", label: "MFA" },
  { href: "/settings/sso", label: "SSO" },
  { href: "/settings/data-requests", label: "Mis datos (GDPR)" },
  { href: "/settings/neural", label: "Motor adaptativo" },
];
import {
  DSAR_KINDS,
  DSAR_REASON_MAX,
  kindLabel,
  statusLabel,
  daysUntilExpiry,
} from "@/lib/dsar";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const STATUS_VARIANT = {
  PENDING: "warn",
  APPROVED: "soft",
  REJECTED: "danger",
  COMPLETED: "success",
  EXPIRED: "neutral",
};

export default function DataRequestsClient({ initial, orgs }) {
  const [requests, setRequests] = useState(initial);
  const [kind, setKind] = useState("ACCESS");
  const [reason, setReason] = useState("");
  const [orgId, setOrgId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    if (kind === "ERASURE" && !confirm(
      "ERASURE iniciará el proceso de borrado de tu cuenta. " +
      "El admin del org debe aprobar (puede tomar hasta 30 días). " +
      "Datos agregados anónimos pueden retenerse según Recital 26 GDPR. ¿Continuar?"
    )) return;

    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch("/api/v1/me/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ kind, reason: reason || undefined, orgId: orgId || undefined }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      setRequests([j.request, ...requests]);
      setReason("");
      if (j.request.status === "COMPLETED") {
        toast.success("Solicitud creada y completada — descarga disponible");
      } else {
        toast.success("Solicitud enviada — el admin la revisará");
      }
    } catch (e) {
      setError(e?.message || "No se pudo crear la solicitud");
      toast.error(e?.message || "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="bi-admin-shell" style={{ maxWidth: 880, margin: "0 auto", padding: `${space[6]}px ${space[4]}px`, color: cssVar.text, fontFamily: cssVar.fontSans }}>
      <PageHeader
        eyebrow="Cuenta · datos personales"
        italic="Tus datos,"
        title="bajo tu control."
        subtitle="GDPR Art. 15 (acceso), Art. 17 (borrado), Art. 20 (portabilidad). Tú eliges qué pides y cuándo."
      />
      <SegmentedNav items={SETTINGS_NAV} ariaLabel="Sub-navegación de cuenta" />

      <Alert kind="info" style={{ marginBlockStart: space[3] }}>
        <strong>Acceso y portabilidad</strong> se completan automáticamente con un link al export
        de tus datos. <strong>Borrado</strong> requiere aprobación del admin del org y tiene
        30 días de gracia. Datos agregados anónimos pueden retenerse según Recital 26 GDPR.
      </Alert>

      {/* Form */}
      <section style={cardStyle}>
        <h2 style={cardTitleStyle}>Nueva solicitud</h2>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: space[3] }}>
          <Field label="Tipo de solicitud">
            <Select value={kind} onChange={(e) => setKind(e.target.value)}>
              {DSAR_KINDS.map((k) => (
                <option key={k} value={k}>{kindLabel(k)}</option>
              ))}
            </Select>
          </Field>

          {orgs.length > 0 && (
            <Field label="Org (opcional)" hint="Si tu solicitud es sobre datos asociados a un org B2B específico">
              <Select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
                <option value="">Datos personales (no-org)</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </Select>
            </Field>
          )}

          <Field label={`Motivo (opcional, ${reason.length}/${DSAR_REASON_MAX})`}>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={DSAR_REASON_MAX}
              rows={3}
              placeholder="Ej: Cierre de mi cuenta, cambio de empleo, compliance interno…"
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

          {error && <Alert kind="error">{error}</Alert>}

          <div>
            <Button
              type="submit"
              variant={kind === "ERASURE" ? "danger" : "primary"}
              loading={busy}
              loadingLabel="Enviando…"
            >
              {kind === "ERASURE" ? "Solicitar borrado" : "Enviar solicitud"}
            </Button>
          </div>
        </form>
      </section>

      {/* History */}
      <section style={{ ...cardStyle, marginBlockStart: space[4] }}>
        <h2 style={cardTitleStyle}>Mis solicitudes</h2>
        {requests.length === 0 ? (
          <p style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
            No has creado ninguna solicitud todavía.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: space[3] }}>
            {requests.map((r) => {
              const days = daysUntilExpiry(r);
              return (
                <li
                  key={r.id}
                  style={{
                    padding: space[3],
                    background: cssVar.surface2,
                    border: `1px solid ${cssVar.border}`,
                    borderRadius: radius.sm,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space[2] }}>
                    <div>
                      <strong style={{ color: cssVar.text }}>{kindLabel(r.kind)}</strong>
                      <div style={{ color: cssVar.textDim, fontSize: font.size.xs, marginTop: 2 }}>
                        Solicitada: {new Date(r.requestedAt).toLocaleString()}
                        {r.resolvedAt && <> · Resuelta: {new Date(r.resolvedAt).toLocaleString()}</>}
                        {r.status === "PENDING" && days !== Infinity && (
                          <> · Vence en {days} día{days !== 1 ? "s" : ""}</>
                        )}
                      </div>
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status] || "soft"} size="sm">
                      {statusLabel(r.status)}
                    </Badge>
                  </div>
                  {r.reason && (
                    <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: space[2], marginBlockEnd: 0 }}>
                      Motivo: {r.reason}
                    </p>
                  )}
                  {r.resolverNotes && (
                    <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginBlockStart: space[1], marginBlockEnd: 0 }}>
                      Notas del admin: {r.resolverNotes}
                    </p>
                  )}
                  {r.artifactUrl && r.status === "COMPLETED" && (
                    <div style={{ marginBlockStart: space[2] }}>
                      <Button
                        href={r.artifactUrl}
                        variant="secondary"
                        size="sm"
                      >
                        Descargar mis datos
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </article>
  );
}

const cardStyle = {
  marginBlockStart: space[4],
  padding: space[4],
  background: cssVar.surface,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
};
const cardTitleStyle = {
  margin: `0 0 ${space[3]}px`,
  fontSize: font.size.lg,
  fontWeight: font.weight.bold,
  color: cssVar.text,
};
