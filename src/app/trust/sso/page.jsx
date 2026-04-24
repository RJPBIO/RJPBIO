/* ═══════════════════════════════════════════════════════════════
   /trust/sso — public-facing IT admin documentation

   Deliverable Tier 2 para Enterprise B2B: transmite rigor técnico
   sin fricción. Para el CIO / IT director que pregunta "¿soportan
   SSO? ¿Azure AD? ¿SCIM?" antes de conectar con ventas.

   Cubre:
     — Feature scan rápido (providers soportados + SCIM + MFA)
     — Setup guides paso a paso por provider (colapsables)
     — SCIM 2.0 endpoints + schema
     — Security posture (audit, RBAC, tenancy)
     — FAQ (data retention, revocación, sesiones)
     — Contact IT

   Pattern reutiliza /trust: PublicShell + Container + tokens del
   brand system (no CSS nuevo).
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { cssVar, space, font, bioSignal, radius } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

export const metadata = {
  title: "Enterprise SSO · SCIM · MFA — BIO-IGNICIÓN",
  description:
    "SSO empresarial (Okta · Azure AD / Entra ID · Google Workspace), SCIM 2.0 auto-provisioning, MFA TOTP, passkeys. Para CIO, CISO, IT admin.",
  alternates: { canonical: "/trust/sso" },
  openGraph: {
    title: "BIO-IGNICIÓN · Enterprise SSO",
    description:
      "Infraestructura de identidad enterprise: SSO, SCIM 2.0, MFA, passkeys, audit trail. Listo para IT.",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const kickerStyle = {
  fontSize: font.size.xs,
  fontFamily: cssVar.fontMono,
  color: bioSignal.phosphorCyanInk,
  textTransform: "uppercase",
  letterSpacing: "0.28em",
  fontWeight: font.weight.bold,
};

const sectionHeading = {
  margin: 0,
  fontSize: "clamp(28px, 3.6vw, 42px)",
  letterSpacing: "-0.025em",
  lineHeight: 1.1,
  fontWeight: font.weight.black,
  color: cssVar.text,
};

const h3Style = {
  margin: 0,
  fontSize: font.size.xl,
  letterSpacing: "-0.02em",
  lineHeight: 1.2,
  fontWeight: font.weight.bold,
  color: cssVar.text,
};

const bodyStyle = {
  margin: 0,
  fontSize: font.size.base,
  color: cssVar.textMuted,
  lineHeight: 1.65,
};

const monoBlockStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.sm,
  lineHeight: 1.55,
  background: cssVar.surface2,
  color: cssVar.text,
  padding: space[4],
  borderRadius: radius.md,
  border: `1px solid ${cssVar.border}`,
  overflow: "auto",
  whiteSpace: "pre",
};

const COPY = {
  es: {
    eyebrow: "ENTERPRISE · SSO · SCIM · MFA",
    h1: "Identidad lista para enterprise.",
    editorial:
      "SSO con los providers que usa tu organización. SCIM 2.0 para auto-provisioning. MFA, passkeys, audit trail — construidos, no prometidos.",
    contactLabel: "Ingeniería",
    contactEmail: "security@bio-ignicion.app",

    // Feature scan
    featureScanKicker: "FEATURES",
    featureScanH: "Qué soportamos hoy",
    featureScanRows: [
      { label: "SSO OIDC", value: "Okta · Azure AD (Entra ID) · Google Workspace · Apple" },
      { label: "SAML 2.0", value: "Vía IdP → OIDC bridge (Azure AD / Okta lo manejan nativamente)" },
      { label: "SCIM 2.0", value: "Users + Groups · RFC 7643 · RFC 7644" },
      { label: "MFA", value: "TOTP + backup codes + trusted devices (step-up)" },
      { label: "Passkeys", value: "WebAuthn registro + autenticación" },
      { label: "Discovery", value: "Email domain → IdP automático (user@company.com → redirect)" },
      { label: "Session", value: "Cookies secure/SameSite/HttpOnly · maxAge 8h · rotación server-side" },
      { label: "Audit trail", value: "auth.signin · auth.signout · mfa.verify · apikey.create · SCIM events" },
      { label: "RBAC", value: "OWNER · ADMIN · MEMBER · granular permissions (apikey.manage, etc)" },
      { label: "Tenancy", value: "Membership multi-org · impersonation solo para support con consent" },
    ],

    // Setup guides
    setupKicker: "SETUP",
    setupH: "Configuración paso a paso",
    setupSub: "Pensadas para tu equipo de IT. Cada provider requiere ~15-30 min de setup.",
    providers: [
      {
        id: "azure",
        n: "Azure AD · Entra ID",
        steps: [
          "Entra en portal.azure.com · Microsoft Entra ID · App registrations · New registration.",
          "Name: BIO-IGNICIÓN. Account types: Single tenant (tu org).",
          "Redirect URI (Web): https://<tu-instancia>/api/auth/callback/azure-ad",
          "Register. Copia Application (client) ID + Directory (tenant) ID.",
          "Certificates & secrets · New client secret. Copia el value (no se muestra de nuevo).",
          "API permissions · Microsoft Graph · User.Read (delegated). Grant admin consent.",
          "Configúranos: AZURE_AD_CLIENT_ID · AZURE_AD_CLIENT_SECRET · AZURE_AD_TENANT_ID.",
        ],
      },
      {
        id: "okta",
        n: "Okta",
        steps: [
          "Admin dashboard · Applications · Create App Integration · OIDC + Web Application.",
          "App name: BIO-IGNICIÓN. Grant type: Authorization Code.",
          "Sign-in redirect URIs: https://<tu-instancia>/api/auth/callback/okta",
          "Sign-out redirect URIs: https://<tu-instancia>/signin",
          "Assignments: asigna Everyone (o el grupo que corresponda).",
          "Copy Client ID + Client Secret + Okta Domain (tudominio.okta.com).",
          "Configúranos: OKTA_CLIENT_ID · OKTA_CLIENT_SECRET · OKTA_ISSUER (https://<tudominio>.okta.com).",
        ],
      },
      {
        id: "google",
        n: "Google Workspace",
        steps: [
          "console.cloud.google.com · APIs & Services · Credentials · Create Credentials · OAuth client ID.",
          "Application type: Web application. Name: BIO-IGNICIÓN.",
          "Authorized redirect URIs: https://<tu-instancia>/api/auth/callback/google",
          "Create. Copia Client ID + Client Secret.",
          "OAuth consent screen: configura app verification + scopes (email + profile).",
          "Restringe a tu dominio (hd=tudominio.com) para limitar a empleados.",
          "Configúranos: GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET.",
        ],
      },
    ],

    // SCIM
    scimKicker: "SCIM 2.0",
    scimH: "Auto-provisioning de usuarios",
    scimSub:
      "Cuando un empleado entra/sale de tu organización, tu IdP sincroniza automáticamente. Sin tickets, sin delay.",
    scimEndpoints: [
      { method: "GET/POST", path: "/api/scim/v2/Users", note: "Listar · crear · buscar" },
      { method: "GET/PATCH/DELETE", path: "/api/scim/v2/Users/{id}", note: "Leer · actualizar · desactivar" },
      { method: "GET/POST", path: "/api/scim/v2/Groups", note: "Grupos" },
      { method: "GET/PATCH/DELETE", path: "/api/scim/v2/Groups/{id}", note: "Members mgmt" },
      { method: "GET", path: "/api/scim/v2/ServiceProviderConfig", note: "Capabilities (RFC 7643)" },
    ],
    scimAuthH: "Autenticación",
    scimAuthBody:
      "Bearer token con scope 'scim'. Genera desde /org/settings/sso tras configurar tu plan Enterprise.",

    // FAQ
    faqKicker: "FAQ IT",
    faqH: "Preguntas frecuentes de IT",
    faq: [
      {
        q: "¿Qué pasa cuando revoco acceso a un empleado?",
        a: "Si usas SCIM: tu IdP emite DELETE /Users/{id} → membership removida + sesiones invalidadas en segundos. Si usas solo SSO sin SCIM: el empleado pierde acceso cuando intenta renovar token (session maxAge = 8h).",
      },
      {
        q: "¿Qué datos se retienen al desactivar un usuario?",
        a: "El registro User se marca inactive pero se preserva. Sessions, moodLog individual y HRV logs del empleado se despersonalizan a las 48h (hash irreversible del email). Los agregados org-level (k-anonimato k≥5) permanecen para cumplir con reporting NOM-035 histórico.",
      },
      {
        q: "¿Soportan SAML además de OIDC?",
        a: "Directamente no — NextAuth v5 es OIDC-first. Pero Azure AD y Okta emiten OIDC nativamente aunque tu política corporativa diga 'SAML'. Si necesitas SAML puro, contacta security@bio-ignicion.app: tenemos roadmap para SAML 2.0 propio en Q3 2026.",
      },
      {
        q: "¿Cómo funciona MFA step-up?",
        a: "TOTP requerido antes de acciones privilegiadas (export de datos, generar API key, administrar miembros, modificar SSO config). Endpoint /api/auth/mfa/verify valida el código. Backup codes + trusted devices (30d) para UX.",
      },
      {
        q: "¿Passkeys disponibles?",
        a: "Sí. WebAuthn en /api/webauthn/register + /api/webauthn/auth. FIDO2 compliant. El usuario registra passkey desde /account tras login inicial.",
      },
      {
        q: "¿Cuál es el blast radius de un API key comprometido?",
        a: "Cada key tiene scopes explícitos (read:sessions, write:members, scim, read:audit). Scope least-privilege. Rotation audit en audit trail. Revocación instantánea desde /org/settings/sso.",
      },
      {
        q: "¿Logs de auditoría exportables?",
        a: "Sí. /api/v1/audit export en JSON o CSV con filtros (fecha, acción, actor). Retención 18 meses por defecto, configurable hasta 7 años (GDPR Art. 30 + compliance SOC 2).",
      },
    ],

    // Deploy note
    deployKicker: "DEPLOY",
    deployH: "Multi-tenant vs dedicated instance",
    deployBody:
      "Actualmente cada cliente enterprise recibe una instancia dedicada con su propia config de env vars. Roadmap Q2 2026: self-service multi-tenant (configura SSO desde /org/settings sin env vars). Si necesitas multi-tenant hoy, agendemos: security@bio-ignicion.app.",

    contactH: "Pregunta no respondida",
    contactBody: "Escríbenos. Respondemos en 24-48h con diagramas + SOC 2 cert path + checklist completo para tu revisión de seguridad.",
    contactCta: "security@bio-ignicion.app",
  },
  en: {
    eyebrow: "ENTERPRISE · SSO · SCIM · MFA",
    h1: "Enterprise-ready identity.",
    editorial:
      "SSO with the providers your organization uses. SCIM 2.0 auto-provisioning. MFA, passkeys, audit trail — built, not promised.",
    contactLabel: "Engineering",
    contactEmail: "security@bio-ignicion.app",

    featureScanKicker: "FEATURES",
    featureScanH: "What we support today",
    featureScanRows: [
      { label: "SSO OIDC", value: "Okta · Azure AD (Entra ID) · Google Workspace · Apple" },
      { label: "SAML 2.0", value: "Via IdP → OIDC bridge (Azure AD / Okta handle it natively)" },
      { label: "SCIM 2.0", value: "Users + Groups · RFC 7643 · RFC 7644" },
      { label: "MFA", value: "TOTP + backup codes + trusted devices (step-up)" },
      { label: "Passkeys", value: "WebAuthn register + auth" },
      { label: "Discovery", value: "Email domain → IdP auto (user@company.com → redirect)" },
      { label: "Session", value: "Cookies secure/SameSite/HttpOnly · maxAge 8h · server-side rotation" },
      { label: "Audit trail", value: "auth.signin · auth.signout · mfa.verify · apikey.create · SCIM events" },
      { label: "RBAC", value: "OWNER · ADMIN · MEMBER · granular permissions" },
      { label: "Tenancy", value: "Multi-org membership · consented impersonation for support only" },
    ],

    setupKicker: "SETUP",
    setupH: "Step-by-step setup",
    setupSub: "Written for your IT team. Each provider takes ~15-30 min.",
    providers: [
      {
        id: "azure",
        n: "Azure AD · Entra ID",
        steps: [
          "Go to portal.azure.com · Microsoft Entra ID · App registrations · New registration.",
          "Name: BIO-IGNICIÓN. Account types: Single tenant (your org).",
          "Redirect URI (Web): https://<your-instance>/api/auth/callback/azure-ad",
          "Register. Copy Application (client) ID + Directory (tenant) ID.",
          "Certificates & secrets · New client secret. Copy the value (not shown again).",
          "API permissions · Microsoft Graph · User.Read (delegated). Grant admin consent.",
          "Configure us: AZURE_AD_CLIENT_ID · AZURE_AD_CLIENT_SECRET · AZURE_AD_TENANT_ID.",
        ],
      },
      {
        id: "okta",
        n: "Okta",
        steps: [
          "Admin dashboard · Applications · Create App Integration · OIDC + Web Application.",
          "App name: BIO-IGNICIÓN. Grant type: Authorization Code.",
          "Sign-in redirect URIs: https://<your-instance>/api/auth/callback/okta",
          "Sign-out redirect URIs: https://<your-instance>/signin",
          "Assignments: assign Everyone (or the relevant group).",
          "Copy Client ID + Client Secret + Okta Domain (yourdomain.okta.com).",
          "Configure us: OKTA_CLIENT_ID · OKTA_CLIENT_SECRET · OKTA_ISSUER (https://<yourdomain>.okta.com).",
        ],
      },
      {
        id: "google",
        n: "Google Workspace",
        steps: [
          "console.cloud.google.com · APIs & Services · Credentials · Create Credentials · OAuth client ID.",
          "Application type: Web application. Name: BIO-IGNICIÓN.",
          "Authorized redirect URIs: https://<your-instance>/api/auth/callback/google",
          "Create. Copy Client ID + Client Secret.",
          "OAuth consent screen: configure app verification + scopes (email + profile).",
          "Restrict to your domain (hd=yourdomain.com) to limit to employees.",
          "Configure us: GOOGLE_CLIENT_ID · GOOGLE_CLIENT_SECRET.",
        ],
      },
    ],

    scimKicker: "SCIM 2.0",
    scimH: "User auto-provisioning",
    scimSub:
      "When an employee joins/leaves your organization, your IdP syncs automatically. No tickets, no delay.",
    scimEndpoints: [
      { method: "GET/POST", path: "/api/scim/v2/Users", note: "List · create · search" },
      { method: "GET/PATCH/DELETE", path: "/api/scim/v2/Users/{id}", note: "Read · update · deactivate" },
      { method: "GET/POST", path: "/api/scim/v2/Groups", note: "Groups" },
      { method: "GET/PATCH/DELETE", path: "/api/scim/v2/Groups/{id}", note: "Members mgmt" },
      { method: "GET", path: "/api/scim/v2/ServiceProviderConfig", note: "Capabilities (RFC 7643)" },
    ],
    scimAuthH: "Authentication",
    scimAuthBody:
      "Bearer token with 'scim' scope. Generate from /org/settings/sso after configuring Enterprise plan.",

    faqKicker: "IT FAQ",
    faqH: "Frequently asked by IT",
    faq: [
      {
        q: "What happens when I revoke an employee's access?",
        a: "With SCIM: your IdP emits DELETE /Users/{id} → membership removed + sessions invalidated in seconds. SSO-only (no SCIM): user loses access when token refreshes (session maxAge = 8h).",
      },
      {
        q: "What data is retained when a user is deactivated?",
        a: "User record marked inactive but preserved. Sessions, individual moodLog and HRV logs depersonalized after 48h (irreversible email hash). Org-level aggregates (k-anonymity k≥5) remain for NOM-035 historical reporting compliance.",
      },
      {
        q: "Do you support SAML in addition to OIDC?",
        a: "Not directly — NextAuth v5 is OIDC-first. But Azure AD and Okta emit OIDC natively even if your corporate policy says 'SAML'. For pure SAML, contact security@bio-ignicion.app: roadmap for native SAML 2.0 in Q3 2026.",
      },
      {
        q: "How does MFA step-up work?",
        a: "TOTP required before privileged actions (data export, API key generation, member admin, SSO config changes). /api/auth/mfa/verify endpoint validates the code. Backup codes + trusted devices (30d) for UX.",
      },
      {
        q: "Passkeys available?",
        a: "Yes. WebAuthn at /api/webauthn/register + /api/webauthn/auth. FIDO2 compliant. User registers passkey from /account after initial login.",
      },
      {
        q: "What's the blast radius of a compromised API key?",
        a: "Each key has explicit scopes (read:sessions, write:members, scim, read:audit). Least-privilege scope. Rotation audit in audit trail. Instant revoke from /org/settings/sso.",
      },
      {
        q: "Exportable audit logs?",
        a: "Yes. /api/v1/audit export as JSON or CSV with filters (date, action, actor). 18-month retention by default, configurable up to 7 years (GDPR Art. 30 + SOC 2 compliance).",
      },
    ],

    deployKicker: "DEPLOY",
    deployH: "Multi-tenant vs dedicated instance",
    deployBody:
      "Currently each enterprise client receives a dedicated instance with their own env var config. Q2 2026 roadmap: self-service multi-tenant (configure SSO from /org/settings without env vars). For multi-tenant today, let's schedule: security@bio-ignicion.app.",

    contactH: "Question not answered",
    contactBody: "Write to us. We respond in 24-48h with diagrams + SOC 2 cert path + complete checklist for your security review.",
    contactCta: "security@bio-ignicion.app",
  },
};

export default async function EnterpriseSSOPage() {
  const locale = await getServerLocale();
  const t = COPY[locale === "en" ? "en" : "es"];

  return (
    <PublicShell activePath="/trust/sso">
      <main id="main-content">
        {/* ═══ HERO ═══ */}
        <section style={{ position: "relative", paddingBlock: `clamp(40px, 6vw, 72px) clamp(40px, 7vw, 80px)` }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", opacity: 0.55, maskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 60%, transparent 100%)" }}>
            <BioglyphLattice variant="ambient" />
          </div>
          <Container size="xl" style={{ position: "relative", zIndex: 1, paddingBlock: 0 }}>
            <IgnitionReveal sparkOrigin="22% 30%">
              <p style={kickerStyle}>{t.eyebrow}</p>
              <h1 style={{ margin: 0, marginBlockStart: space[3], fontSize: "clamp(40px, 8vw, 110px)", letterSpacing: "-0.045em", lineHeight: 1.02, fontWeight: font.weight.black, color: cssVar.text }}>
                {t.h1}
              </h1>
              <p style={{ margin: `${space[5]}px 0 0`, fontFamily: "var(--font-editorial)", fontStyle: "italic", fontSize: "clamp(18px, 2.2vw, 22px)", lineHeight: 1.45, color: cssVar.textMuted, maxWidth: "62ch" }}>
                {t.editorial}
              </p>
              <div style={{ marginBlockStart: space[6], display: "flex", flexWrap: "wrap", gap: space[3], alignItems: "baseline" }}>
                <span style={kickerStyle}>{t.contactLabel}</span>
                <a href={`mailto:${t.contactEmail}`} style={{ color: bioSignal.phosphorCyanInk, fontFamily: cssVar.fontMono, fontSize: font.size.sm, fontWeight: font.weight.bold }}>
                  {t.contactEmail}
                </a>
              </div>
            </IgnitionReveal>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ FEATURE SCAN ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.featureScanKicker}</p>
            <h2 style={{ ...sectionHeading, marginBlockStart: space[3] }}>{t.featureScanH}</h2>
            <div style={{ marginBlockStart: space[8], border: `1px solid ${cssVar.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
              {t.featureScanRows.map((row, i) => (
                <div key={row.label} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 180px) 1fr",
                  gap: space[4],
                  padding: `${space[3]}px ${space[5]}px`,
                  borderBlockEnd: i < t.featureScanRows.length - 1 ? `1px solid ${cssVar.border}` : "none",
                  background: i % 2 === 0 ? "transparent" : cssVar.surface2,
                }}>
                  <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, fontWeight: font.weight.bold, color: bioSignal.phosphorCyanInk, letterSpacing: "0.04em" }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: font.size.sm, color: cssVar.text, lineHeight: 1.55 }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ SETUP GUIDES ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.setupKicker}</p>
            <h2 style={{ ...sectionHeading, marginBlockStart: space[3] }}>{t.setupH}</h2>
            <p style={{ ...bodyStyle, marginBlockStart: space[3], maxWidth: "60ch" }}>{t.setupSub}</p>
            <div style={{ marginBlockStart: space[8], display: "grid", gap: space[3] }}>
              {t.providers.map((p) => (
                <details key={p.id} style={{
                  border: `1px solid ${cssVar.border}`,
                  borderRadius: radius.lg,
                  padding: `${space[4]}px ${space[5]}px`,
                  background: cssVar.surface,
                }}>
                  <summary style={{
                    cursor: "pointer",
                    fontSize: font.size.lg,
                    fontWeight: font.weight.bold,
                    color: cssVar.text,
                    listStyle: "none",
                    display: "flex",
                    gap: space[3],
                    alignItems: "center",
                  }}>
                    <span aria-hidden style={{ color: bioSignal.phosphorCyanInk, fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>▸</span>
                    {p.n}
                  </summary>
                  <ol style={{ margin: `${space[4]}px 0 0`, paddingInlineStart: space[6], display: "grid", gap: space[2] }}>
                    {p.steps.map((step, idx) => (
                      <li key={idx} style={{ fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.6 }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ SCIM ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.scimKicker}</p>
            <h2 style={{ ...sectionHeading, marginBlockStart: space[3] }}>{t.scimH}</h2>
            <p style={{ ...bodyStyle, marginBlockStart: space[3], maxWidth: "60ch" }}>{t.scimSub}</p>
            <div style={{ marginBlockStart: space[8], border: `1px solid ${cssVar.border}`, borderRadius: radius.lg, overflow: "hidden" }}>
              {t.scimEndpoints.map((ep, i) => (
                <div key={ep.path} style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(120px, 180px) minmax(200px, 280px) 1fr",
                  gap: space[4],
                  padding: `${space[3]}px ${space[5]}px`,
                  borderBlockEnd: i < t.scimEndpoints.length - 1 ? `1px solid ${cssVar.border}` : "none",
                  background: i % 2 === 0 ? "transparent" : cssVar.surface2,
                  alignItems: "baseline",
                }}>
                  <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.xs, fontWeight: font.weight.bold, color: bioSignal.phosphorCyanInk, letterSpacing: "0.04em" }}>
                    {ep.method}
                  </span>
                  <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>
                    {ep.path}
                  </code>
                  <span style={{ fontSize: font.size.sm, color: cssVar.textMuted }}>
                    {ep.note}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginBlockStart: space[6] }}>
              <h3 style={h3Style}>{t.scimAuthH}</h3>
              <p style={{ ...bodyStyle, marginBlockStart: space[3], maxWidth: "60ch" }}>{t.scimAuthBody}</p>
              <pre style={{ ...monoBlockStyle, marginBlockStart: space[4] }}>
{`curl -H "Authorization: Bearer <token>" \\
     https://<your-instance>/api/scim/v2/Users`}
              </pre>
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ FAQ ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.faqKicker}</p>
            <h2 style={{ ...sectionHeading, marginBlockStart: space[3] }}>{t.faqH}</h2>
            <div style={{ marginBlockStart: space[8], display: "grid", gap: space[3] }}>
              {t.faq.map((f, i) => (
                <details key={i} style={{
                  border: `1px solid ${cssVar.border}`,
                  borderRadius: radius.lg,
                  padding: `${space[4]}px ${space[5]}px`,
                  background: cssVar.surface,
                }}>
                  <summary style={{
                    cursor: "pointer",
                    fontWeight: font.weight.bold,
                    fontSize: font.size.base,
                    color: cssVar.text,
                    listStyle: "none",
                    display: "flex",
                    gap: space[3],
                    alignItems: "flex-start",
                  }}>
                    <span aria-hidden style={{ color: bioSignal.phosphorCyanInk, fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>
                      Q{String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{f.q}</span>
                  </summary>
                  <p style={{ margin: `${space[3]}px 0 0`, color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.6 }}>
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ DEPLOY NOTE ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <p style={kickerStyle}>{t.deployKicker}</p>
            <h2 style={{ ...sectionHeading, marginBlockStart: space[3] }}>{t.deployH}</h2>
            <p style={{ ...bodyStyle, marginBlockStart: space[3], maxWidth: "60ch" }}>{t.deployBody}</p>
          </Container>
        </section>

        <PulseDivider intensity="dim" />

        {/* ═══ CONTACT ═══ */}
        <section style={{ paddingBlock: "clamp(64px, 9vw, 120px)" }}>
          <Container size="xl">
            <h2 style={{ ...sectionHeading, maxWidth: "22ch" }}>{t.contactH}</h2>
            <p style={{ ...bodyStyle, marginBlockStart: space[4], maxWidth: "60ch" }}>{t.contactBody}</p>
            <a href={`mailto:${t.contactEmail}`} style={{
              display: "inline-block",
              marginBlockStart: space[6],
              padding: `${space[3]}px ${space[5]}px`,
              background: bioSignal.phosphorCyanInk,
              color: "#ffffff",
              borderRadius: radius.md,
              fontFamily: cssVar.fontMono,
              fontSize: font.size.sm,
              fontWeight: font.weight.bold,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}>
              {t.contactCta}
            </a>
          </Container>
        </section>
      </main>
    </PublicShell>
  );
}
