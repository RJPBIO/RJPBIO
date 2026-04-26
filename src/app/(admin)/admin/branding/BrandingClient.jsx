"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  BRANDING_DEFAULTS,
  COACH_PERSONA_MAX,
  validateBranding,
  canEditBranding,
  canSetCustomDomain,
  gradientFromBranding,
} from "@/lib/branding";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const ERR = {
  logoUrl: {
    invalid_https_url: "Debe ser una URL https:// válida",
    not_string: "URL inválida",
  },
  primaryColor: { invalid_hex: "Color hex inválido (#RGB o #RRGGBB)" },
  accentColor: { invalid_hex: "Color hex inválido (#RGB o #RRGGBB)" },
  customDomain: {
    invalid_domain: "Dominio inválido (ej: app.empresa.com)",
    plan_required: "Custom domain requiere plan ENTERPRISE",
    not_string: "Valor inválido",
  },
  coachPersona: {
    too_long: `Máximo ${COACH_PERSONA_MAX} caracteres`,
    not_string: "Texto inválido",
  },
};

function fieldError(errors, field) {
  const e = errors.find((er) => er.field === field);
  if (!e) return null;
  return ERR[field]?.[e.error] || e.error;
}

export default function BrandingClient({ orgId, orgName, plan, canEdit, initial }) {
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);

  const planEdits = canEditBranding(plan);
  const planDomain = canSetCustomDomain(plan);
  const editingDisabled = !canEdit || !planEdits;

  // Live validation client-side para feedback inmediato.
  const validation = useMemo(
    () => validateBranding(form, { plan: planEdits ? plan : null }),
    [form, plan, planEdits]
  );

  function set(k) {
    return (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  }

  async function onSave(e) {
    e.preventDefault();
    setErrors([]);
    if (!validation.ok) {
      setErrors(validation.errors);
      toast.error("Revisa los campos marcados");
      return;
    }
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(validation.value),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (Array.isArray(j?.details)) {
          setErrors(j.details);
          throw new Error("Revisa los campos marcados");
        }
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Branding actualizado");
      // Reload para que admin layout aplique el nuevo branding.
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  async function onReset() {
    if (!confirm("¿Restaurar defaults? Se perderá tu branding actual.")) return;
    setBusy(true);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/branding`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          logoUrl: "", primaryColor: "", accentColor: "",
          customDomain: "", coachPersona: "",
        }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Branding restaurado");
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast.error(e?.message || "No se pudo restaurar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article style={{ maxWidth: 1080, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            Branding
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            Personaliza logo, colores y tono del coach para {orgName}.
          </p>
        </div>
        <div style={{ display: "flex", gap: space[2] }}>
          <Badge variant={planEdits ? "success" : "soft"} size="sm">{plan}</Badge>
          {!canEdit && <Badge variant="soft" size="sm">Read-only (ADMIN)</Badge>}
        </div>
      </header>

      {!planEdits && (
        <Alert kind="warn">
          <strong>Branding requiere plan Growth o superior.</strong>{" "}
          Actualmente: <strong>{plan}</strong>. Puedes ver el preview y configurar valores
          pero el guardado está deshabilitado.{" "}
          <a href="/admin/billing" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>
            Actualizar plan →
          </a>
        </Alert>
      )}

      {!canEdit && planEdits && (
        <Alert kind="info">
          Solo OWNER puede modificar branding. ADMIN ve el preview con la configuración actual.
        </Alert>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1fr) minmax(280px, 1fr)", gap: space[5], alignItems: "start", marginBlockStart: space[4] }}>
        {/* Form */}
        <form onSubmit={onSave} style={{ display: "grid", gap: space[4] }}>
          <Field label="Logo URL" hint="Debe ser https://" error={fieldError(errors, "logoUrl")}>
            <Input
              type="url"
              value={form.logoUrl}
              onChange={set("logoUrl")}
              placeholder="https://cdn.empresa.com/logo.svg"
              disabled={editingDisabled}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: space[3] }}>
            <Field label="Color primario" error={fieldError(errors, "primaryColor")}>
              <ColorPair
                value={form.primaryColor}
                onChange={set("primaryColor")}
                disabled={editingDisabled}
              />
            </Field>
            <Field label="Color acento" error={fieldError(errors, "accentColor")}>
              <ColorPair
                value={form.accentColor}
                onChange={set("accentColor")}
                disabled={editingDisabled}
              />
            </Field>
          </div>

          <Field
            label="Dominio personalizado"
            hint={planDomain ? "ej: app.empresa.com (DNS verification flow)" : "Requiere plan ENTERPRISE"}
            error={fieldError(errors, "customDomain")}
          >
            <Input
              type="text"
              value={form.customDomain}
              onChange={set("customDomain")}
              placeholder="app.tu-empresa.com"
              disabled={editingDisabled || !planDomain}
            />
          </Field>

          <Field
            label="Persona del coach (opcional)"
            hint={`${form.coachPersona?.length || 0}/${COACH_PERSONA_MAX} caracteres`}
            error={fieldError(errors, "coachPersona")}
          >
            <textarea
              value={form.coachPersona}
              onChange={set("coachPersona")}
              rows={3}
              maxLength={COACH_PERSONA_MAX + 50}
              placeholder="ej. tono Kaizen, referencias a mushin, mantras Spartan…"
              disabled={editingDisabled}
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
                opacity: editingDisabled ? 0.5 : 1,
              }}
            />
          </Field>

          <div style={{ display: "flex", gap: space[2], paddingBlockStart: space[2], borderBlockStart: `1px solid ${cssVar.border}` }}>
            <Button
              variant="primary"
              type="submit"
              loading={busy}
              loadingLabel="Guardando…"
              disabled={editingDisabled}
            >
              Guardar
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setForm({ ...BRANDING_DEFAULTS })}
              disabled={editingDisabled}
            >
              Limpiar campos
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onReset}
              disabled={editingDisabled || busy}
            >
              Restaurar defaults
            </Button>
          </div>
        </form>

        {/* Preview */}
        <aside aria-label="Preview" style={{
          position: "sticky",
          top: space[4],
          padding: space[4],
          background: cssVar.surface,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
        }}>
          <p style={{
            margin: 0,
            fontSize: font.size.xs,
            letterSpacing: font.tracking.wider,
            textTransform: "uppercase",
            color: cssVar.textDim,
          }}>
            Preview
          </p>
          <div style={{
            marginTop: space[3],
            padding: space[4],
            borderRadius: radius.md,
            background: `linear-gradient(135deg, ${form.primaryColor}15, ${form.accentColor}10)`,
            border: `1px solid ${form.primaryColor}40`,
          }}>
            {form.logoUrl
              ? <img
                  src={form.logoUrl}
                  alt={`logo ${orgName}`}
                  style={{ maxHeight: 36, maxWidth: "100%" }}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              : <div style={{
                  height: 36,
                  width: 120,
                  borderRadius: radius.sm,
                  background: form.primaryColor,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  fontWeight: font.weight.bold,
                  fontSize: font.size.sm,
                }}>
                  TU LOGO
                </div>
            }
            <h3 style={{ margin: `${space[3]}px 0 ${space[1]}px`, color: cssVar.text }}>
              Bienvenido de vuelta
            </h3>
            <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted }}>
              Hoy es un buen día para avanzar.
            </p>
            <button
              type="button"
              style={{
                marginTop: space[3],
                padding: `${space[2]}px ${space[4]}px`,
                background: gradientFromBranding(form),
                border: 0,
                color: "#fff",
                borderRadius: 999,
                fontWeight: font.weight.bold,
                cursor: "pointer",
                fontSize: font.size.sm,
              }}
            >
              Empezar sesión
            </button>
          </div>
          {form.customDomain && planDomain && (
            <p style={{ marginTop: space[3], fontSize: font.size.xs, color: cssVar.textMuted, fontFamily: cssVar.fontMono }}>
              Dominio: <code>{form.customDomain}</code>
            </p>
          )}
          {form.coachPersona && (
            <div style={{
              marginTop: space[3],
              padding: space[3],
              background: cssVar.surface2,
              borderRadius: radius.sm,
              borderLeft: `3px solid ${form.accentColor}`,
            }}>
              <p style={{ margin: 0, fontSize: font.size.xs, color: cssVar.textDim, letterSpacing: font.tracking.wide, textTransform: "uppercase" }}>
                COACH
              </p>
              <p style={{ margin: `${space[1]}px 0 0`, fontSize: font.size.sm, color: cssVar.text }}>
                {form.coachPersona}
              </p>
            </div>
          )}
        </aside>
      </div>

      <section style={{ marginBlockStart: space[5], padding: space[4], background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
          ¿Dónde se aplica el branding?
        </h2>
        <ul style={{ margin: `${space[2]}px 0 0`, paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.7 }}>
          <li><strong>Logo:</strong> reemplaza "BIO-IGN · ADMIN" en el sidebar de /admin.</li>
          <li><strong>Color acento:</strong> override del background del item nav activo.</li>
          <li><strong>Custom domain:</strong> requiere ENTERPRISE + DNS verification flow (TXT record en _bio-ignicion.{domain}).</li>
          <li><strong>Coach persona:</strong> tono que el coach usa al hablar con miembros del org.</li>
          <li><strong>Validación HTTPS:</strong> logos http:// rechazados (mixed-content). data:/ javascript: rechazados (XSS).</li>
        </ul>
      </section>
    </article>
  );
}

function ColorPair({ value, onChange, disabled }) {
  return (
    <div style={{ display: "flex", gap: space[2], alignItems: "center" }}>
      <input
        type="color"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          width: 40,
          height: 38,
          padding: 0,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.sm,
          background: cssVar.surface2,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        aria-label="Color picker"
      />
      <Input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{ flex: 1, fontFamily: cssVar.fontMono }}
      />
    </div>
  );
}
