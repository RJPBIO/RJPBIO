"use client";
/* ═══════════════════════════════════════════════════════════════
   CohortSettingsForm — fija industria / tamaño / turno de la org.
   ───────────────────────────────────────────────────────────────
   Activa el BioSignal Index: sin industria no hay benchmark. OWNER|ADMIN.
   PUT /api/v1/orgs/[orgId]/cohort (CSRF) → recarga para recomputar.
   ═══════════════════════════════════════════════════════════════ */
import { useState } from "react";
import { INDUSTRIES, COMPANY_SIZES, SHIFTS } from "@/lib/orgCohort";
import { cssVar, font, space, radius, bioSignal } from "@/components/ui/tokens";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch {
    return "";
  }
}

const selectStyle = {
  appearance: "none",
  width: "100%",
  padding: `${space[2]}px ${space[3]}px`,
  background: cssVar.surface,
  color: cssVar.text,
  border: `1px solid ${cssVar.border}`,
  borderRadius: radius.md,
  fontSize: font.size.sm,
  fontFamily: "inherit",
};
const labelStyle = {
  display: "block",
  fontSize: font.size.xs,
  color: cssVar.textMuted,
  marginBlockEnd: 4,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
  fontWeight: font.weight.semibold,
};

function Field({ label, value, onChange, options }) {
  return (
    <label style={{ flex: 1, minWidth: 160 }}>
      <span style={labelStyle}>{label}</span>
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function CohortSettingsForm({ orgId, current = {} }) {
  const [industry, setIndustry] = useState(current.industry || "");
  const [companySize, setCompanySize] = useState(current.companySize || "");
  const [shift, setShift] = useState(current.shift || "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/cohort`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ industry, companySize, shift }),
      });
      if (!r.ok) {
        setErr("No se pudo guardar. Verifica tus permisos (OWNER/ADMIN).");
        setSaving(false);
        return;
      }
      setTimeout(() => location.reload(), 400);
    } catch {
      setErr("Error de red. Reintenta.");
      setSaving(false);
    }
  }

  return (
    <section
      style={{
        marginBlockStart: space[4],
        padding: space[5],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        display: "flex",
        flexDirection: "column",
        gap: space[4],
      }}
    >
      <div
        style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: bioSignal.phosphorCyanInk,
          fontWeight: font.weight.semibold,
        }}
      >
        Configurar cohorte
      </div>
      <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.5 }}>
        Define la industria (y opcionalmente tamaño y turno) para activar el benchmark anónimo.
        Solo se usa para agrupar de forma agregada (k-anonimato); nunca identifica a tu organización.
      </p>
      <div style={{ display: "flex", gap: space[3], flexWrap: "wrap" }}>
        <Field label="Industria" value={industry} onChange={setIndustry} options={INDUSTRIES} />
        <Field label="Tamaño" value={companySize} onChange={setCompanySize} options={COMPANY_SIZES} />
        <Field label="Turno" value={shift} onChange={setShift} options={SHIFTS} />
      </div>
      {err && <p style={{ margin: 0, fontSize: font.size.sm, color: "var(--bi-danger)" }}>{err}</p>}
      <div>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          style={{
            appearance: "none",
            cursor: saving ? "default" : "pointer",
            padding: `${space[2]}px ${space[5]}px`,
            background: cssVar.accent,
            color: cssVar.accentInk,
            border: "none",
            borderRadius: radius.md,
            fontWeight: font.weight.bold,
            fontSize: font.size.sm,
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Guardando…" : "Guardar cohorte"}
        </button>
      </div>
    </section>
  );
}
