"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { SUPPORTED_SSO_PROVIDERS, SSO_PROVIDER_LABELS } from "@/lib/sso";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const ERROR_MSGS = {
  domain: {
    empty: "Dominio requerido",
    invalid: "Formato de dominio inválido (ej: acme.com)",
    too_long: "Dominio demasiado largo",
  },
  provider: {
    invalid_provider: "Selecciona un provider válido",
  },
  metadata: {
    must_be_object: "Metadata debe ser JSON válido (objeto)",
  },
};

export default function SsoClient({ orgId, orgName, plan, initial }) {
  const [domain, setDomain] = useState(initial.domain);
  const [provider, setProvider] = useState(initial.provider);
  const [metadataText, setMetadataText] = useState(
    initial.metadata ? JSON.stringify(initial.metadata, null, 2) : ""
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});

  const isConfigured = !!(initial.domain && initial.provider);
  // SAML necesita Plan ENTERPRISE — los providers OAuth (Okta/Azure/Google)
  // funcionan con GROWTH+. Esto es informativo en UI; el backend acepta
  // cualquier provider válido.
  const samlAvailable = plan === "ENTERPRISE";

  async function onSave(e) {
    e.preventDefault();
    setErrors({});
    setBusy(true);
    let metadata = null;
    if (metadataText.trim()) {
      try { metadata = JSON.parse(metadataText); }
      catch {
        setErrors({ metadata: "must_be_object" });
        setBusy(false);
        return;
      }
    }
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/sso`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ domain, provider, metadata }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (j?.details) {
          setErrors(j.details);
          throw new Error("Revisa los campos marcados");
        }
        if (j?.error === "domain_taken") {
          throw new Error("Ese dominio ya está vinculado a otra organización");
        }
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("SSO configurado");
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onDisable() {
    if (!confirm(`¿Deshabilitar SSO para ${orgName}? Los usuarios volverán a auth normal (email magic link).`)) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/sso`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("SSO deshabilitado");
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast.error(e?.message || "No se pudo deshabilitar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article style={{ maxWidth: 720, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            Single Sign-On
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            Federation via Okta, Microsoft, Google o SAML 2.0. Solo OWNER del org puede modificar.
          </p>
        </div>
        <Badge variant={isConfigured ? "success" : "soft"} size="sm">
          {isConfigured ? "Activo" : "No configurado"}
        </Badge>
      </header>

      <form onSubmit={onSave} style={{ display: "grid", gap: space[4], padding: space[5], background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <Field label="Dominio de email" hint="Usuarios con email en este dominio serán redirigidos al IdP." error={ERROR_MSGS.domain[errors.domain]}>
          <Input
            type="text"
            placeholder="acme.com"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            autoComplete="off"
          />
        </Field>

        <Field label="Provider" hint="Tipo de IdP que tu empresa usa." error={ERROR_MSGS.provider[errors.provider]}>
          <Select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="">Selecciona un provider…</option>
            {SUPPORTED_SSO_PROVIDERS.map((p) => (
              <option key={p} value={p} disabled={p === "saml" && !samlAvailable}>
                {SSO_PROVIDER_LABELS[p]}{p === "saml" && !samlAvailable ? " (requiere Enterprise)" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Metadata (opcional, JSON)" hint="Para SAML: entityId, x509 cert, etc. Para OAuth: ignorado.">
          <textarea
            value={metadataText}
            onChange={(e) => setMetadataText(e.target.value)}
            rows={6}
            placeholder='{"entityId": "https://acme.com/saml", "x509": "MII..."}'
            style={{
              width: "100%",
              padding: `${space[2]}px ${space[3]}px`,
              background: cssVar.surface2,
              border: `1px solid ${errors.metadata ? "var(--bi-danger)" : cssVar.border}`,
              borderRadius: radius.sm,
              color: cssVar.text,
              fontFamily: cssVar.fontMono,
              fontSize: font.size.sm,
              resize: "vertical",
            }}
          />
          {errors.metadata && (
            <div style={{ marginTop: space[1], fontSize: font.size.xs, color: "var(--bi-danger)" }}>
              {ERROR_MSGS.metadata[errors.metadata]}
            </div>
          )}
        </Field>

        {plan !== "ENTERPRISE" && plan !== "GROWTH" && (
          <Alert kind="warn">
            SSO requiere plan Growth o superior. Actualmente: <strong>{plan}</strong>. <a href="/admin/billing" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>Actualizar plan</a>.
          </Alert>
        )}

        <div style={{ display: "flex", gap: space[2], justifyContent: "flex-end", paddingBlockStart: space[2], borderBlockStart: `1px solid ${cssVar.border}` }}>
          {isConfigured && (
            <Button variant="danger" type="button" onClick={onDisable} disabled={busy}>
              Deshabilitar SSO
            </Button>
          )}
          <Button variant="primary" type="submit" loading={busy} loadingLabel="Guardando…">
            {isConfigured ? "Actualizar" : "Activar SSO"}
          </Button>
        </div>
      </form>

      <section style={{ marginBlockStart: space[5], padding: space[4], background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
          ¿Cómo funciona?
        </h2>
        <ol style={{ margin: `${space[2]}px 0 0`, paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.7 }}>
          <li>Usuario entra a /signin con email <code>@{domain || "tu-dominio.com"}</code></li>
          <li>El sistema detecta el dominio federado vía <code>/api/auth/sso-discover</code></li>
          <li>Redirige automáticamente a tu IdP (sin pedir password)</li>
          <li>IdP valida → callback → user dentro de la app</li>
        </ol>
      </section>
    </article>
  );
}
