"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, space, font } from "@/components/ui/tokens";
import { PLAN_LABELS, isInTrial, trialDaysLeft, isB2BPlan } from "@/lib/billing";

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
    billing: "Suscripción",
    currentPlan: "Plan actual",
    trialEnds: (n) => `${n} día${n === 1 ? "" : "s"} de prueba restante${n === 1 ? "" : "s"}`,
    trialExpired: "Prueba expirada",
    upgradeProTitle: "Pro · individual",
    upgradeProBody: "Sesiones ilimitadas, todos los protocolos, voces premium, sync multi-device, NOM-035 PDF personal.",
    upgradeProCta: "Activar Pro · 7 días gratis",
    upgradeTeamTitle: "¿Tu empresa?",
    upgradeTeamBody: "Starter para equipos pequeños o Enterprise con SAML, DPA, residencia de datos.",
    upgradeTeamCta: "Ver planes empresa →",
    managePortal: "Administrar suscripción",
    portalErr: "No se pudo abrir el portal",
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
    billing: "Subscription",
    currentPlan: "Current plan",
    trialEnds: (n) => `${n} day${n === 1 ? "" : "s"} left in trial`,
    trialExpired: "Trial expired",
    upgradeProTitle: "Pro · individual",
    upgradeProBody: "Unlimited sessions, all protocols, premium voices, multi-device sync, personal NOM-035 PDF.",
    upgradeProCta: "Start Pro · 7-day free trial",
    upgradeTeamTitle: "Your company?",
    upgradeTeamBody: "Starter for small teams or Enterprise with SAML, DPA, data residency.",
    upgradeTeamCta: "See team plans →",
    managePortal: "Manage subscription",
    portalErr: "Could not open portal",
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

  async function upgradePro(orgId) {
    setMsg(null);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/x-www-form-urlencoded" },
        body: `plan=PRO&orgId=${encodeURIComponent(orgId)}`,
        redirect: "manual",
      });
      const loc = r.headers.get("location");
      if (loc) { location.href = loc; return; }
      throw new Error(await r.text() || t.portalErr);
    } catch (e) {
      setMsg({ kind: "danger", text: e?.message || t.portalErr });
    }
  }

  async function openPortal(orgId) {
    setMsg(null);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/x-www-form-urlencoded" },
        body: `orgId=${encodeURIComponent(orgId)}`,
        redirect: "manual",
      });
      // El endpoint redirige (303). Algunos browsers exponen Location;
      // si no, fallback a respuesta JSON con `url`.
      const loc = r.headers.get("location");
      if (loc) { location.href = loc; return; }
      try {
        const j = await r.json();
        if (j?.url) { location.href = j.url; return; }
      } catch {}
      throw new Error(t.portalErr);
    } catch (e) {
      setMsg({ kind: "danger", text: e?.message || t.portalErr });
    }
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

      <Section title={t.billing}>
        {(() => {
          // Personal-org del user (si existe) — fuente primaria del estado de billing B2C.
          const personal = memberships.find((m) => m.org?.personal);
          const plan = personal?.org?.plan || "FREE";
          const trialEnds = personal?.org?.trialEndsAt;
          const inTrial = isInTrial(trialEnds);
          const daysLeft = inTrial ? trialDaysLeft(trialEnds) : 0;
          const hasStripe = !!personal?.org?.stripeCustomer;
          return (
            <>
              <Row
                label={t.currentPlan}
                value={
                  <span style={{ display: "inline-flex", alignItems: "center", gap: space[2] }}>
                    <Badge variant={plan === "FREE" ? "soft" : "accent"} size="sm">
                      {PLAN_LABELS[plan] || plan}
                    </Badge>
                    {inTrial && (
                      <span style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>
                        {t.trialEnds(daysLeft)}
                      </span>
                    )}
                    {trialEnds && !inTrial && plan === "FREE" && (
                      <span style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>
                        {t.trialExpired}
                      </span>
                    )}
                  </span>
                }
              />
              {/* Upgrade CTA — solo si plan FREE (no en PRO+ ni B2B).
                  fetch+manual redirect porque requireCsrf espera header,
                  un form post nativo no podría enviar x-csrf-token. */}
              {plan === "FREE" && personal?.org?.id && (
                <div style={{
                  marginTop: space[3],
                  padding: space[4],
                  borderRadius: 12,
                  border: `1px solid ${cssVar.border}`,
                  background: `color-mix(in srgb, ${cssVar.accent} 4%, transparent)`,
                }}>
                  <div style={{ fontWeight: font.weight.bold, color: cssVar.text, marginBottom: 4 }}>
                    {t.upgradeProTitle}
                  </div>
                  <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: font.leading.normal }}>
                    {t.upgradeProBody}
                  </p>
                  <div style={{ marginTop: space[3] }}>
                    <Button
                      onClick={() => upgradePro(personal.org.id)}
                      variant="primary"
                      size="sm"
                    >
                      {t.upgradeProCta}
                    </Button>
                  </div>
                </div>
              )}
              {/* Portal — solo si tiene Stripe customer (sub previa o actual) */}
              {hasStripe && (
                <div style={{ marginTop: space[3] }}>
                  <Button
                    onClick={() => openPortal(personal.org.id)}
                    variant="secondary"
                    size="sm"
                  >
                    {t.managePortal}
                  </Button>
                </div>
              )}
              {/* B2B teaser — siempre visible para descubrimiento */}
              <div style={{ marginTop: space[4], paddingTop: space[3], borderTop: `1px dashed ${cssVar.border}` }}>
                <div style={{ fontWeight: font.weight.semibold, color: cssVar.text, marginBottom: 2 }}>
                  {t.upgradeTeamTitle}
                </div>
                <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: font.leading.normal }}>
                  {t.upgradeTeamBody}
                </p>
                <div style={{ marginTop: space[2] }}>
                  <Link href="/pricing" style={{ color: cssVar.accent, fontSize: font.size.sm, fontWeight: font.weight.semibold, textDecoration: "none" }}>
                    {t.upgradeTeamCta}
                  </Link>
                </div>
              </div>
            </>
          );
        })()}
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
