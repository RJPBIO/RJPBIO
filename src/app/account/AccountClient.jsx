"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, space, font } from "@/components/ui/tokens";

const COPY = {
  es: {
    title: "Tu cuenta",
    back: "← Volver a la app",
    profile: "Perfil",
    labelName: "Nombre",
    labelLocale: "Idioma",
    labelTz: "Zona horaria",
    labelMfa: "MFA",
    mfaOn: "Activado",
    mfaOff: "Desactivado",
    labelMemberSince: "Miembro desde",
    labelLastLogin: "Último acceso",
    cfgMfa: "Configurar MFA / passkey",
    orgs: (n) => `Organizaciones (${n})`,
    orgsEmpty: "No perteneces a ninguna organización todavía.",
    planLabel: "plan",
    adminCta: "Admin →",
    security: "Seguridad",
    signOutAll: "Cerrar sesión en todos los dispositivos",
    signingOut: "Cerrando sesiones…",
    viewSessions: "Ver sesiones activas →",
    privacy: "Privacidad",
    privacyBody:
      "Puedes exportar tus datos en cualquier momento o solicitar la eliminación de tu cuenta (GDPR Art. 17). La eliminación inicia un periodo de gracia de 30 días.",
    exportBtn: "Exportar mis datos",
    deleteBtn: "Eliminar mi cuenta",
    deleting: "Procesando…",
    confirmDelete: "¿Eliminar tu cuenta? Esto inicia un periodo de gracia de 30 días antes del borrado definitivo.",
    confirmSignOutAll: "¿Cerrar sesión en todos los dispositivos?",
    deleteOk: (when) => `Solicitud registrada. Eliminación definitiva: ${when}`,
    genericErr: "Error",
  },
  en: {
    title: "Your account",
    back: "← Back to the app",
    profile: "Profile",
    labelName: "Name",
    labelLocale: "Language",
    labelTz: "Time zone",
    labelMfa: "MFA",
    mfaOn: "Enabled",
    mfaOff: "Disabled",
    labelMemberSince: "Member since",
    labelLastLogin: "Last login",
    cfgMfa: "Configure MFA / passkey",
    orgs: (n) => `Organizations (${n})`,
    orgsEmpty: "You don't belong to any organization yet.",
    planLabel: "plan",
    adminCta: "Admin →",
    security: "Security",
    signOutAll: "Sign out of all devices",
    signingOut: "Signing out…",
    viewSessions: "View active sessions →",
    privacy: "Privacy",
    privacyBody:
      "You can export your data any time or request account deletion (GDPR Art. 17). Deletion starts a 30-day grace period.",
    exportBtn: "Export my data",
    deleteBtn: "Delete my account",
    deleting: "Processing…",
    confirmDelete: "Delete your account? This starts a 30-day grace period before permanent removal.",
    confirmSignOutAll: "Sign out of all devices?",
    deleteOk: (when) => `Request recorded. Permanent deletion: ${when}`,
    genericErr: "Error",
  },
};

export default function AccountClient({ user, memberships, locale = "es" }) {
  const L = locale === "en" ? "en" : "es";
  const t = COPY[L];
  const dateLocale = L === "en" ? "en-US" : "es-MX";

  const [deleting, setDeleting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [msg, setMsg] = useState(null);

  async function requestDeletion() {
    if (!confirm(t.confirmDelete)) return;
    setDeleting(true); setMsg(null);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setMsg({ kind: "success", text: t.deleteOk(new Date(j.hardDeleteAt).toLocaleString(dateLocale)) });
    } catch (e) {
      setMsg({ kind: "danger", text: e?.message || t.genericErr });
    } finally { setDeleting(false); }
  }

  async function signOutAll() {
    if (!confirm(t.confirmSignOutAll)) return;
    setSigningOut(true); setMsg(null);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/auth/signout-all", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(await r.text());
      location.href = "/signin";
    } catch (e) {
      setMsg({ kind: "danger", text: e?.message || t.genericErr });
      setSigningOut(false);
    }
  }

  return (
    <AuthShell
      locale={L}
      size="lg"
      title={t.title}
      subtitle={user.email}
      footer={
        <Link href="/app" style={{ color: cssVar.textDim, fontWeight: font.weight.semibold, textDecoration: "none" }}>
          {t.back}
        </Link>
      }
    >
      <Section title={t.profile}>
        <Row label={t.labelName}        value={user.name || "—"} />
        <Row label={t.labelLocale}      value={user.locale} />
        <Row label={t.labelTz}          value={user.timezone} />
        <Row
          label={t.labelMfa}
          value={
            user.mfaEnabled
              ? <Badge variant="success" size="sm">{t.mfaOn}</Badge>
              : <Badge variant="soft" size="sm">{t.mfaOff}</Badge>
          }
        />
        <Row label={t.labelMemberSince} value={new Date(user.createdAt).toLocaleDateString(dateLocale)} />
        {user.lastLoginAt && (
          <Row label={t.labelLastLogin} value={new Date(user.lastLoginAt).toLocaleString(dateLocale)} />
        )}
        <div style={{ marginTop: space[3] }}>
          <Button href="/settings/security/mfa" variant="secondary" size="sm">{t.cfgMfa}</Button>
        </div>
      </Section>

      <Section title={t.orgs(memberships.length)}>
        {memberships.length === 0 && <p style={{ color: cssVar.textMuted }}>{t.orgsEmpty}</p>}
        {memberships.map((m) => (
          <div key={m.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${space[3]}px 0`, borderBottom: `1px solid ${cssVar.border}`,
          }}>
            <div>
              <div style={{ fontWeight: font.weight.bold, color: cssVar.text }}>{m.org?.name}</div>
              <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: 2 }}>
                <Badge variant="accent" size="sm" style={{ marginInlineEnd: space[2] }}>{m.role}</Badge>
                {t.planLabel} {m.org?.plan}
              </div>
            </div>
            {(m.role === "OWNER" || m.role === "ADMIN") && (
              <Button href="/admin" variant="ghost" size="sm">{t.adminCta}</Button>
            )}
          </div>
        ))}
      </Section>

      <Section title={t.security}>
        <Button
          onClick={signOutAll}
          variant="secondary"
          size="sm"
          loading={signingOut}
          loadingLabel={t.signingOut}
          disabled={deleting}
        >
          {t.signOutAll}
        </Button>
        <div style={{ marginTop: space[3] }}>
          <Link href="/settings/sessions" style={{ color: cssVar.accent, fontSize: font.size.sm, fontWeight: font.weight.semibold, textDecoration: "none" }}>
            {t.viewSessions}
          </Link>
        </div>
      </Section>

      <Section title={t.privacy} last>
        <p style={{ margin: 0, color: cssVar.textDim, fontSize: font.size.sm, lineHeight: font.leading.normal }}>
          {t.privacyBody}
        </p>
        <div style={{ display: "flex", gap: space[2], flexWrap: "wrap", marginTop: space[3] }}>
          <Button href="/api/v1/users/me/export" variant="secondary" size="sm">{t.exportBtn}</Button>
          <Button
            onClick={requestDeletion}
            variant="danger"
            size="sm"
            loading={deleting}
            loadingLabel={t.deleting}
            disabled={signingOut}
          >
            {t.deleteBtn}
          </Button>
        </div>
      </Section>

      {msg && (
        <div style={{ marginTop: space[5] }} role={msg.kind === "danger" ? "alert" : "status"}>
          <Alert kind={msg.kind}>{msg.text}</Alert>
        </div>
      )}
    </AuthShell>
  );
}

function Section({ title, children, last }) {
  return (
    <section style={{
      padding: `${space[4]}px 0`,
      borderBottom: last ? undefined : `1px solid ${cssVar.border}`,
    }}>
      <h2 style={{
        margin: `0 0 ${space[3]}px`,
        fontSize: font.size.xs, fontWeight: font.weight.bold,
        color: cssVar.accent, textTransform: "uppercase", letterSpacing: font.tracking.caps,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[4],
      padding: `${space[2]}px 0`, fontSize: font.size.md,
    }}>
      <span style={{ color: cssVar.textMuted }}>{label}</span>
      <span style={{ color: cssVar.text, fontWeight: font.weight.medium, display: "inline-flex", alignItems: "center", gap: space[2] }}>{value}</span>
    </div>
  );
}
