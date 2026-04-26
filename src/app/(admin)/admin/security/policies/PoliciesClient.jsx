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
  validatePolicy,
  SESSION_MAX_AGE_MIN_MINUTES,
  SESSION_MAX_AGE_MAX_MINUTES,
  IP_ALLOWLIST_MAX,
} from "@/lib/org-security";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const ERROR_MSGS = {
  requireMfa: { not_boolean: "Valor inválido" },
  sessionMaxAgeMinutes: {
    not_integer: "Debe ser un número entero",
    too_small: `Mínimo ${SESSION_MAX_AGE_MIN_MINUTES} minutos`,
    too_large: `Máximo ${SESSION_MAX_AGE_MAX_MINUTES} minutos (${SESSION_MAX_AGE_MAX_MINUTES / 60 / 24} días)`,
  },
  ipAllowlist: {
    invalid_cidr: "CIDR inválido",
    too_many: `Máximo ${IP_ALLOWLIST_MAX} entradas`,
    non_string: "Entrada inválida",
    not_array: "Lista inválida",
  },
};

function fieldError(errors, field) {
  const e = errors.find((er) => er.field === field);
  if (!e) return null;
  return ERROR_MSGS[field]?.[e.error] || e.error;
}

export default function PoliciesClient({ orgId, orgName, plan, initial }) {
  const [requireMfa, setRequireMfa] = useState(initial.requireMfa);
  const [ipAllowlistEnabled, setIpAllowlistEnabled] = useState(initial.ipAllowlistEnabled);
  const [ipAllowlistText, setIpAllowlistText] = useState(initial.ipAllowlist.join("\n"));
  const [sessionMaxAgeMinutes, setSessionMaxAgeMinutes] = useState(
    initial.sessionMaxAgeMinutes ?? ""
  );
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState([]);

  // Validation client-side: feedback inmediato sin round-trip.
  const validation = useMemo(() => {
    const list = ipAllowlistText
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const ttl = sessionMaxAgeMinutes === "" ? null : Number(sessionMaxAgeMinutes);
    return validatePolicy({
      requireMfa,
      ipAllowlistEnabled,
      ipAllowlist: list,
      sessionMaxAgeMinutes: ttl,
    });
  }, [requireMfa, ipAllowlistEnabled, ipAllowlistText, sessionMaxAgeMinutes]);

  // El plan ENTERPRISE habilita todas las policies; GROWTH habilita MFA;
  // STARTER/FREE solo lectura. Esto es informativo — backend gating real
  // sería un follow-up con isB2BPlan() de billing.js.
  const planAllowsAdvanced = plan === "ENTERPRISE" || plan === "GROWTH";

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
      const r = await fetch(`/api/v1/orgs/${orgId}/security`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify(validation.policy),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        if (Array.isArray(j?.details)) {
          setErrors(j.details);
          throw new Error("Revisa los campos marcados");
        }
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Políticas actualizadas");
      // Reload para forzar nuevo JWT con policies frescos.
      setTimeout(() => location.reload(), 600);
    } catch (e) {
      toast.error(e?.message || "No se pudo guardar");
    } finally {
      setBusy(false);
    }
  }

  const ipCount = ipAllowlistText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length;
  const isActive = requireMfa || ipAllowlistEnabled || sessionMaxAgeMinutes !== "";

  return (
    <article style={{ maxWidth: 760, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            Políticas de seguridad
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            MFA obligatorio · IP allowlist · TTL de sesión · {orgName}
          </p>
        </div>
        <Badge variant={isActive ? "success" : "soft"} size="sm">
          {isActive ? "Activas" : "Sin políticas"}
        </Badge>
      </header>

      <form onSubmit={onSave} style={{ display: "grid", gap: space[5] }}>
        {/* Require MFA */}
        <section style={cardStyle}>
          <header style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>MFA obligatorio</h2>
            <Toggle checked={requireMfa} onChange={setRequireMfa} disabled={!planAllowsAdvanced} />
          </header>
          <p style={cardDescStyle}>
            Cuando está activo, todos los miembros del org deben tener MFA configurado.
            Usuarios sin MFA serán redirigidos a configurarlo al iniciar sesión.
          </p>
          {fieldError(errors, "requireMfa") && (
            <div style={errorStyle}>{fieldError(errors, "requireMfa")}</div>
          )}
        </section>

        {/* IP Allowlist */}
        <section style={cardStyle}>
          <header style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>IP allowlist (CIDR)</h2>
            <Toggle checked={ipAllowlistEnabled} onChange={setIpAllowlistEnabled} disabled={!planAllowsAdvanced} />
          </header>
          <p style={cardDescStyle}>
            Restringe acceso a /admin y /api/v1 desde IPs específicas.
            Una entrada por línea (acepta CIDR IPv4 — ej: <code>10.0.0.0/8</code>, <code>192.168.1.0/24</code>).
            IPv6 aún no soportado. Máximo {IP_ALLOWLIST_MAX} entradas.
          </p>
          <Field label={`Allowlist (${ipCount}/${IP_ALLOWLIST_MAX})`} hint="Una entrada por línea." error={fieldError(errors, "ipAllowlist")}>
            <textarea
              value={ipAllowlistText}
              onChange={(e) => setIpAllowlistText(e.target.value)}
              rows={6}
              disabled={!ipAllowlistEnabled || !planAllowsAdvanced}
              placeholder={"10.0.0.0/8\n192.168.1.0/24\n203.0.113.5/32"}
              style={{
                width: "100%",
                padding: `${space[2]}px ${space[3]}px`,
                background: cssVar.surface2,
                border: `1px solid ${fieldError(errors, "ipAllowlist") ? "var(--bi-danger)" : cssVar.border}`,
                borderRadius: radius.sm,
                color: cssVar.text,
                fontFamily: cssVar.fontMono,
                fontSize: font.size.sm,
                resize: "vertical",
                opacity: ipAllowlistEnabled && planAllowsAdvanced ? 1 : 0.5,
              }}
            />
          </Field>
          {ipAllowlistEnabled && ipCount === 0 && (
            <Alert kind="warn">
              IP allowlist activado pero vacío — esto NO bloquea nada (sin entradas el enforcement es no-op).
              Añade al menos una entrada para que tenga efecto.
            </Alert>
          )}
        </section>

        {/* Session TTL */}
        <section style={cardStyle}>
          <header style={cardHeaderStyle}>
            <h2 style={cardTitleStyle}>TTL de sesión (minutos)</h2>
          </header>
          <p style={cardDescStyle}>
            Tiempo máximo de validez de una sesión antes de requerir re-login.
            Default global: 480 min (8h). Vacío = usar default.
            Rango: {SESSION_MAX_AGE_MIN_MINUTES}–{SESSION_MAX_AGE_MAX_MINUTES} min.
          </p>
          <Field label="Minutos" error={fieldError(errors, "sessionMaxAgeMinutes")}>
            <Input
              type="number"
              min={SESSION_MAX_AGE_MIN_MINUTES}
              max={SESSION_MAX_AGE_MAX_MINUTES}
              step={5}
              value={sessionMaxAgeMinutes}
              onChange={(e) => setSessionMaxAgeMinutes(e.target.value)}
              placeholder="(default 480)"
              disabled={!planAllowsAdvanced}
            />
          </Field>
        </section>

        {!planAllowsAdvanced && (
          <Alert kind="warn">
            Las políticas avanzadas (MFA obligatorio, IP allowlist, TTL de sesión) requieren plan
            <strong> Growth o superior</strong>. Actualmente: <strong>{plan}</strong>.{" "}
            <a href="/admin/billing" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>
              Actualizar plan
            </a>.
          </Alert>
        )}

        <div style={{ display: "flex", gap: space[2], justifyContent: "flex-end", paddingBlockStart: space[2], borderBlockStart: `1px solid ${cssVar.border}` }}>
          <Button
            variant="primary"
            type="submit"
            loading={busy}
            loadingLabel="Guardando…"
            disabled={!planAllowsAdvanced}
          >
            Guardar políticas
          </Button>
        </div>
      </form>

      <section style={{ marginBlockStart: space[5], padding: space[4], background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
          ¿Cómo se aplican las políticas?
        </h2>
        <ul style={{ margin: `${space[2]}px 0 0`, paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.7 }}>
          <li><strong>MFA obligatorio:</strong> al iniciar sesión, si requireMfa=true en algún org del usuario, se fuerza setup de MFA antes de acceder a /admin.</li>
          <li><strong>IP allowlist:</strong> middleware edge bloquea con 403 si la IP no está en el allowlist (most-restrictive: si tienes membership en varios orgs, todos los allowlists deben permitir tu IP).</li>
          <li><strong>TTL de sesión:</strong> el JWT expira en min(maxAge global, sessionMaxAgeMinutes de cada org). Más restrictivo gana.</li>
          <li><strong>Audit log:</strong> cada cambio queda registrado con diff antes/después en /admin/audit.</li>
        </ul>
      </section>
    </article>
  );
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      style={{
        appearance: "none",
        width: 48,
        height: 28,
        borderRadius: 999,
        background: checked ? "var(--bi-success)" : cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "background 160ms ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          insetInlineStart: checked ? 22 : 2,
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: "#fff",
          transition: "inset-inline-start 160ms ease",
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }}
      />
    </button>
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
const errorStyle = {
  marginTop: space[1],
  fontSize: font.size.xs,
  color: "var(--bi-danger)",
};
