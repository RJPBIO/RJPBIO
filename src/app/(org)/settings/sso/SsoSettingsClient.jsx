"use client";
/* ═══════════════════════════════════════════════════════════════
   SsoSettingsClient — admin panel for SSO + SCIM management

   Secciones:
     1. Status card — qué provider está configurado, qué dominio
     2. Provider matrix — cuáles están disponibles en la instancia
     3. SCIM tokens — listar + generar + revocar
     4. Copy-to-IT template — email formateado para IT admin
     5. Docs link — /trust/sso

   CSRF usa /api/auth/csrf si existe; fallback al header. Reusa
   /api/v1/api-keys para crear tokens.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo } from "react";
import Link from "next/link";
import Icon from "@/components/Icon";
import { resolveTheme, withAlpha, space, font, radius, brand } from "@/lib/theme";
import { semantic } from "@/lib/tokens";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const COPY = {
  es: {
    title: "SSO & SCIM",
    subtitle: "Identidad empresarial: provider de autenticación + auto-provisioning de usuarios.",
    docsLink: "Ver guía completa para IT",

    // Status
    statusKicker: "ESTADO",
    statusConfigured: "Configurado",
    statusPartial: "Parcial",
    statusNotConfigured: "No configurado",
    providerLabel: "Provider activo",
    domainLabel: "Dominio SSO",
    planLabel: "Plan",
    seatsLabel: "Seats",
    none: "(sin configurar)",

    // Providers available
    providersKicker: "PROVIDERS DISPONIBLES",
    providersSub: "Estos providers tienen credenciales configuradas en la instancia. Si falta alguno que necesitas, contacta a IT.",
    providerActive: "Activo",
    providerInactive: "Inactivo",

    // SCIM
    scimKicker: "SCIM 2.0",
    scimH: "Auto-provisioning de usuarios",
    scimSub: "Tokens bearer con scope 'scim'. Entrega uno a tu IdP (Azure AD / Okta / Workspace) para que sincronice usuarios automáticamente.",
    scimEndpoint: "Endpoint base",
    scimTokensLabel: "Tokens SCIM activos",
    scimNoTokens: "Aún no hay tokens SCIM. Genera uno para habilitar auto-provisioning.",
    scimGenerateCta: "Generar token SCIM",
    scimGenerateNameLabel: "Nombre del token (p.ej. 'Azure AD prod')",
    scimGenerateNamePlaceholder: "Mi IdP token",
    scimGenerateConfirm: "Generar",
    scimGenerateCancel: "Cancelar",
    scimTokenCreatedH: "Token creado",
    scimTokenCreatedBody: "Copia este token AHORA — no se mostrará de nuevo. Guárdalo de forma segura y configúralo en tu IdP.",
    scimTokenCopy: "Copiar token",
    scimTokenCopied: "¡Copiado!",
    scimTokenClose: "Cerrar",
    scimTokenRevoke: "Revocar",
    scimTokenRevokeConfirm: "¿Revocar este token? Las integraciones que lo usen dejarán de sincronizar inmediatamente.",

    // Other API keys
    otherKeysKicker: "OTRAS API KEYS",
    otherKeysSub: "Tokens para otros usos (analytics, reads, etc). Gestiona desde /settings/api-keys.",

    // Copy to IT
    copyItKicker: "ONBOARDING IT",
    copyItH: "Plantilla para tu equipo de IT",
    copyItSub: "Copia este mensaje y envíalo a quien configura identidad en tu organización.",
    copyItButton: "Copiar plantilla",
    copyItCopied: "¡Plantilla copiada!",

    // Errors
    errorGenerating: "No se pudo generar el token. Intenta de nuevo.",
    errorRevoking: "No se pudo revocar. Intenta de nuevo.",
  },
  en: {
    title: "SSO & SCIM",
    subtitle: "Enterprise identity: authentication provider + user auto-provisioning.",
    docsLink: "See full IT setup guide",

    statusKicker: "STATUS",
    statusConfigured: "Configured",
    statusPartial: "Partial",
    statusNotConfigured: "Not configured",
    providerLabel: "Active provider",
    domainLabel: "SSO domain",
    planLabel: "Plan",
    seatsLabel: "Seats",
    none: "(not set)",

    providersKicker: "PROVIDERS AVAILABLE",
    providersSub: "These providers have credentials configured in the instance. If one is missing, contact IT.",
    providerActive: "Active",
    providerInactive: "Inactive",

    scimKicker: "SCIM 2.0",
    scimH: "User auto-provisioning",
    scimSub: "Bearer tokens with 'scim' scope. Hand one to your IdP (Azure AD / Okta / Workspace) so it syncs users automatically.",
    scimEndpoint: "Base endpoint",
    scimTokensLabel: "Active SCIM tokens",
    scimNoTokens: "No SCIM tokens yet. Generate one to enable auto-provisioning.",
    scimGenerateCta: "Generate SCIM token",
    scimGenerateNameLabel: "Token name (e.g., 'Azure AD prod')",
    scimGenerateNamePlaceholder: "My IdP token",
    scimGenerateConfirm: "Generate",
    scimGenerateCancel: "Cancel",
    scimTokenCreatedH: "Token created",
    scimTokenCreatedBody: "Copy this token NOW — it won't be shown again. Store it securely and configure it in your IdP.",
    scimTokenCopy: "Copy token",
    scimTokenCopied: "Copied!",
    scimTokenClose: "Close",
    scimTokenRevoke: "Revoke",
    scimTokenRevokeConfirm: "Revoke this token? Integrations using it will stop syncing immediately.",

    otherKeysKicker: "OTHER API KEYS",
    otherKeysSub: "Tokens for other uses (analytics, reads, etc). Manage from /settings/api-keys.",

    copyItKicker: "IT ONBOARDING",
    copyItH: "Template for your IT team",
    copyItSub: "Copy this message and send it to whoever configures identity in your organization.",
    copyItButton: "Copy template",
    copyItCopied: "Template copied!",

    errorGenerating: "Could not generate token. Try again.",
    errorRevoking: "Could not revoke. Try again.",
  },
};

export default function SsoSettingsClient({
  org,
  providersAvailable,
  scimKeys,
  otherKeys,
  userRole,
  locale,
}) {
  const isDark = true; // Page renders inside authed shell; assume dark-ish
  const tm = resolveTheme(isDark);
  const t = COPY[locale === "en" ? "en" : "es"];

  const [keys, setKeys] = useState(scimKeys);
  const [generating, setGenerating] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [newToken, setNewToken] = useState(null); // { id, token, prefix, scopes }
  const [copied, setCopied] = useState(false);
  const [itCopied, setItCopied] = useState(false);
  const [error, setError] = useState(null);

  const hasAnyProvider = Object.values(providersAvailable).some(Boolean);
  const statusKind = org.ssoDomain && org.ssoProvider
    ? "configured"
    : hasAnyProvider
      ? "partial"
      : "notConfigured";
  const statusColor = statusKind === "configured" ? semantic.success
    : statusKind === "partial" ? semantic.info
    : semantic.warning;
  const statusLabel = statusKind === "configured" ? t.statusConfigured
    : statusKind === "partial" ? t.statusPartial
    : t.statusNotConfigured;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const itTemplate = useMemo(() => {
    return locale === "en"
      ? `Hi IT team,

Please help configure enterprise SSO for BIO-IGNICIÓN for our organization "${org.name}".

Next steps:
1. Review setup guide: ${baseUrl}/trust/sso
2. Create an app integration in our IdP (Azure AD / Okta / Google Workspace).
3. Callback URL: ${baseUrl}/api/auth/callback/<provider>
4. Send the resulting env vars (CLIENT_ID, CLIENT_SECRET, TENANT_ID, ISSUER) to our BIO-IGNICIÓN account manager.
5. For auto-provisioning via SCIM, I will generate a bearer token from /settings/sso and share it with you.

Contact for questions: security@bio-ignicion.app

Thanks,
${org.name}`
      : `Hola equipo de IT,

Ayúdame a configurar SSO empresarial con BIO-IGNICIÓN para nuestra organización "${org.name}".

Pasos:
1. Revisar guía de setup: ${baseUrl}/trust/sso
2. Crear una app integration en nuestro IdP (Azure AD / Okta / Google Workspace).
3. Callback URL: ${baseUrl}/api/auth/callback/<provider>
4. Enviar las env vars resultantes (CLIENT_ID, CLIENT_SECRET, TENANT_ID, ISSUER) al account manager de BIO-IGNICIÓN.
5. Para auto-provisioning vía SCIM, generaré un bearer token desde /settings/sso y te lo compartiré.

Contacto para dudas: security@bio-ignicion.app

Gracias,
${org.name}`;
  }, [org.name, baseUrl, locale]);

  async function generateToken() {
    if (!tokenName.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      // Get CSRF token
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfJson = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfJson.csrfToken;

      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({
          name: tokenName.trim(),
          scopes: ["scim"],
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setNewToken(data);
      setKeys((prev) => [
        { id: data.id, name: tokenName.trim(), prefix: data.prefix, scopes: data.scopes, createdAt: new Date().toISOString(), lastUsedAt: null },
        ...prev,
      ]);
      setTokenName("");
      setShowGenerate(false);
    } catch (e) {
      setError(t.errorGenerating);
    } finally {
      setGenerating(false);
    }
  }

  async function revokeToken(id) {
    if (!window.confirm(t.scimTokenRevokeConfirm)) return;
    setError(null);
    try {
      const csrfRes = await fetch("/api/auth/csrf");
      const csrfJson = await csrfRes.json().catch(() => ({}));
      const csrfToken = csrfJson.csrfToken;

      const res = await fetch(`/api/v1/api-keys/${id}`, {
        method: "DELETE",
        headers: csrfToken ? { "x-csrf-token": csrfToken } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setKeys((prev) => prev.filter((k) => k.id !== id));
    } catch (e) {
      setError(t.errorRevoking);
    }
  }

  async function copyToken() {
    if (!newToken?.token) return;
    try {
      await navigator.clipboard.writeText(newToken.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function copyItTemplate() {
    try {
      await navigator.clipboard.writeText(itTemplate);
      setItCopied(true);
      setTimeout(() => setItCopied(false), 2000);
    } catch {}
  }

  const sectionStyle = {
    background: tm.card,
    border: `1px solid ${tm.border}`,
    borderRadius: radius.lg,
    padding: space[5],
    marginBlockEnd: space[4],
  };
  const kickerStyle = {
    fontFamily: MONO,
    fontSize: 10,
    letterSpacing: "0.16em",
    color: tm.t3,
    fontWeight: 700,
    textTransform: "uppercase",
    marginBlockEnd: 6,
  };

  return (
    <main
      style={{
        maxWidth: 880,
        margin: "0 auto",
        padding: `${space[6]}px ${space[5]}px`,
        color: tm.t1,
        fontFamily: font.family,
      }}
    >
      <header style={{ marginBlockEnd: space[5] }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -0.5, color: tm.t1 }}>
          {t.title}
        </h1>
        <p style={{ margin: `${space[2]}px 0 0`, fontSize: 14, color: tm.t2, lineHeight: 1.55 }}>
          {t.subtitle}
        </p>
        <Link
          href="/trust/sso"
          target="_blank"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            marginBlockStart: space[3],
            fontSize: 13,
            color: brand.primary,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          {t.docsLink} →
        </Link>
      </header>

      {error && (
        <div
          role="alert"
          style={{
            background: withAlpha(semantic.danger, 10),
            border: `1px solid ${withAlpha(semantic.danger, 28)}`,
            color: semantic.danger,
            padding: `${space[3]}px ${space[4]}px`,
            borderRadius: radius.md,
            marginBlockEnd: space[4],
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {/* ═══ Status card ═══ */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{t.statusKicker}</div>
        <div style={{ display: "flex", alignItems: "center", gap: space[3], marginBlockEnd: space[4] }}>
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: withAlpha(statusColor, 14),
              border: `1px solid ${withAlpha(statusColor, 28)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={statusKind === "configured" ? "check" : "alert"} size={18} color={statusColor} />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: tm.t1, letterSpacing: -0.2 }}>{statusLabel}</div>
            <div style={{ fontSize: 11, color: tm.t3 }}>{org.name} · {org.plan}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: space[3] }}>
          <Stat label={t.providerLabel} value={org.ssoProvider || t.none} theme={tm} />
          <Stat label={t.domainLabel} value={org.ssoDomain || t.none} theme={tm} />
          <Stat label={t.planLabel} value={org.plan} theme={tm} />
          <Stat label={t.seatsLabel} value={`${org.seatsUsed} / ${org.seats}`} theme={tm} />
        </div>
      </section>

      {/* ═══ Providers available ═══ */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{t.providersKicker}</div>
        <p style={{ margin: 0, fontSize: 12, color: tm.t2, marginBlockEnd: space[4], lineHeight: 1.5 }}>
          {t.providersSub}
        </p>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: space[2],
          }}
        >
          {[
            { id: "azure", label: "Azure AD · Entra ID" },
            { id: "okta", label: "Okta" },
            { id: "google", label: "Google Workspace" },
            { id: "apple", label: "Apple" },
          ].map((p) => {
            const active = !!providersAvailable[p.id];
            return (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: `${space[2]}px ${space[3]}px`,
                  border: `1px solid ${tm.border}`,
                  borderRadius: radius.md,
                  background: active ? withAlpha(semantic.success, 5) : "transparent",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: active ? semantic.success : tm.t3,
                  }}
                />
                <span style={{ fontSize: 12, color: tm.t1, fontWeight: 600, flex: 1 }}>{p.label}</span>
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    fontWeight: 700,
                    color: active ? semantic.success : tm.t3,
                    letterSpacing: "0.06em",
                  }}
                >
                  {active ? t.providerActive : t.providerInactive}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ═══ SCIM tokens ═══ */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{t.scimKicker}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tm.t1, letterSpacing: -0.2 }}>
          {t.scimH}
        </h2>
        <p style={{ margin: `${space[2]}px 0 0`, fontSize: 13, color: tm.t2, lineHeight: 1.55 }}>{t.scimSub}</p>

        <div style={{ marginBlockStart: space[4], padding: space[3], background: tm.surface2, borderRadius: radius.md, border: `1px solid ${tm.border}` }}>
          <div style={{ fontSize: 10, fontFamily: MONO, color: tm.t3, fontWeight: 700, letterSpacing: "0.08em", marginBlockEnd: 4 }}>
            {t.scimEndpoint}
          </div>
          <code style={{ fontFamily: MONO, fontSize: 12, color: tm.t1, wordBreak: "break-all" }}>
            {baseUrl}/api/scim/v2
          </code>
        </div>

        <div style={{ marginBlockStart: space[5], display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[3], flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, color: tm.t3, fontFamily: MONO, fontWeight: 700, letterSpacing: "0.08em" }}>
            {t.scimTokensLabel}
          </div>
          {!showGenerate && (
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              style={{
                padding: `${space[2]}px ${space[4]}px`,
                background: brand.primary,
                color: "#fff",
                border: "none",
                borderRadius: radius.md,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.05px",
              }}
            >
              + {t.scimGenerateCta}
            </button>
          )}
        </div>

        {showGenerate && (
          <div
            style={{
              marginBlockStart: space[3],
              padding: space[4],
              border: `1.5px solid ${withAlpha(brand.primary, 40)}`,
              borderRadius: radius.md,
              background: withAlpha(brand.primary, 6),
            }}
          >
            <label style={{ display: "block", fontSize: 11, color: tm.t2, fontWeight: 600, marginBlockEnd: 6 }}>
              {t.scimGenerateNameLabel}
            </label>
            <input
              type="text"
              value={tokenName}
              onChange={(e) => setTokenName(e.target.value)}
              placeholder={t.scimGenerateNamePlaceholder}
              maxLength={80}
              style={{
                width: "100%",
                padding: `${space[2]}px ${space[3]}px`,
                border: `1px solid ${tm.border}`,
                borderRadius: radius.sm,
                background: tm.card,
                color: tm.t1,
                fontSize: 13,
                fontFamily: MONO,
              }}
            />
            <div style={{ display: "flex", gap: space[2], marginBlockStart: space[3] }}>
              <button
                type="button"
                onClick={generateToken}
                disabled={generating || !tokenName.trim()}
                style={{
                  padding: `${space[2]}px ${space[4]}px`,
                  background: brand.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: radius.sm,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: generating || !tokenName.trim() ? "not-allowed" : "pointer",
                  opacity: generating || !tokenName.trim() ? 0.5 : 1,
                }}
              >
                {generating ? "..." : t.scimGenerateConfirm}
              </button>
              <button
                type="button"
                onClick={() => { setShowGenerate(false); setTokenName(""); }}
                style={{
                  padding: `${space[2]}px ${space[4]}px`,
                  background: "transparent",
                  color: tm.t2,
                  border: `1px solid ${tm.border}`,
                  borderRadius: radius.sm,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.scimGenerateCancel}
              </button>
            </div>
          </div>
        )}

        {keys.length === 0 && !showGenerate && (
          <p style={{ marginBlockStart: space[4], fontSize: 12, color: tm.t3, fontStyle: "italic" }}>
            {t.scimNoTokens}
          </p>
        )}

        {keys.length > 0 && (
          <ul style={{ listStyle: "none", padding: 0, margin: `${space[3]}px 0 0`, display: "flex", flexDirection: "column", gap: space[2] }}>
            {keys.map((k) => (
              <li
                key={k.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: space[3],
                  alignItems: "center",
                  padding: `${space[3]}px ${space[4]}px`,
                  border: `1px solid ${tm.border}`,
                  borderRadius: radius.md,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tm.t1 }}>{k.name}</div>
                  <div style={{ fontSize: 10, color: tm.t3, fontFamily: MONO, letterSpacing: "0.02em", marginBlockStart: 3 }}>
                    {k.prefix}…  ·  created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt && <> · last used {new Date(k.lastUsedAt).toLocaleDateString()}</>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeToken(k.id)}
                  style={{
                    padding: `${space[2]}px ${space[3]}px`,
                    background: "transparent",
                    color: semantic.danger,
                    border: `1px solid ${withAlpha(semantic.danger, 28)}`,
                    borderRadius: radius.sm,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {t.scimTokenRevoke}
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Token creado modal-inline */}
        {newToken && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              marginBlockStart: space[4],
              padding: space[4],
              border: `2px solid ${withAlpha(semantic.success, 40)}`,
              background: withAlpha(semantic.success, 8),
              borderRadius: radius.md,
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: tm.t1, marginBlockEnd: 6 }}>
              {t.scimTokenCreatedH}
            </div>
            <p style={{ margin: `0 0 ${space[3]}px`, fontSize: 12, color: tm.t2, lineHeight: 1.55 }}>
              {t.scimTokenCreatedBody}
            </p>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: tm.t1,
                background: tm.card,
                border: `1px solid ${tm.border}`,
                padding: space[3],
                borderRadius: radius.sm,
                wordBreak: "break-all",
                marginBlockEnd: space[3],
              }}
            >
              {newToken.token}
            </div>
            <div style={{ display: "flex", gap: space[2] }}>
              <button
                type="button"
                onClick={copyToken}
                style={{
                  padding: `${space[2]}px ${space[4]}px`,
                  background: copied ? semantic.success : brand.primary,
                  color: "#fff",
                  border: "none",
                  borderRadius: radius.sm,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {copied ? t.scimTokenCopied : t.scimTokenCopy}
              </button>
              <button
                type="button"
                onClick={() => setNewToken(null)}
                style={{
                  padding: `${space[2]}px ${space[4]}px`,
                  background: "transparent",
                  color: tm.t2,
                  border: `1px solid ${tm.border}`,
                  borderRadius: radius.sm,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t.scimTokenClose}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ═══ IT onboarding template ═══ */}
      <section style={sectionStyle}>
        <div style={kickerStyle}>{t.copyItKicker}</div>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: tm.t1, letterSpacing: -0.2 }}>
          {t.copyItH}
        </h2>
        <p style={{ margin: `${space[2]}px 0 0`, fontSize: 13, color: tm.t2, lineHeight: 1.55 }}>{t.copyItSub}</p>
        <pre
          style={{
            fontFamily: MONO,
            fontSize: 11,
            lineHeight: 1.6,
            background: tm.surface2,
            color: tm.t1,
            padding: space[4],
            borderRadius: radius.md,
            border: `1px solid ${tm.border}`,
            marginBlockStart: space[3],
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {itTemplate}
        </pre>
        <button
          type="button"
          onClick={copyItTemplate}
          style={{
            marginBlockStart: space[3],
            padding: `${space[2]}px ${space[4]}px`,
            background: itCopied ? semantic.success : brand.primary,
            color: "#fff",
            border: "none",
            borderRadius: radius.sm,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {itCopied ? t.copyItCopied : t.copyItButton}
        </button>
      </section>
    </main>
  );
}

function Stat({ label, value, theme }) {
  return (
    <div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 9,
          letterSpacing: "0.12em",
          color: theme.t3,
          fontWeight: 700,
          textTransform: "uppercase",
          marginBlockEnd: 4,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, color: theme.t1, fontWeight: 600, wordBreak: "break-word" }}>{value}</div>
    </div>
  );
}
