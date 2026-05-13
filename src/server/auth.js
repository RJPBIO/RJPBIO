/* ═══════════════════════════════════════════════════════════════
   Auth — Auth.js (NextAuth v5). Proveedores: Okta, Azure AD,
   Google Workspace, Email (magic link). Passkeys: flujo propio
   en /api/webauthn/*. MFA TOTP: /api/auth/mfa/verify (step-up).
   NO hay CredentialsProvider: password puro fue removido por
   auth-bypass (authorize no validaba hash).
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import NextAuth from "next-auth";
import Okta from "next-auth/providers/okta";
import AzureAD from "next-auth/providers/azure-ad";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Email from "next-auth/providers/email";
import { headers } from "next/headers";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { auditLog } from "./audit";
import { createSession, getCurrentEpoch, isSessionValid, touchSession, revokeByJti } from "./sessions";
import { shouldRevalidate } from "@/lib/session-tracking";
import { renderEmailHTML, renderCtaButton, escapeHtml } from "@/lib/email-template";

/* Magic-link delivery. When EMAIL_SERVER is configured we send via
   nodemailer; otherwise we fall back to a console log so the instance
   is functional from day 0 without Postmark/SES. The console path es
   aceptable para pilots internos — para real users, setea EMAIL_SERVER.

   Sprint 18 — branding-aware. Lookup el primer org no-personal del
   recipient → aplica logo/colors al HTML rendering. Si no hay branding
   custom, defaults BIO-IGN.

   Nodemailer dynamic-imported (side effects rompen Next.js route analysis).
*/
async function lookupRecipientBranding(email) {
  if (!email) return { branding: null, orgName: null, customDomainVerified: false };
  try {
    const orm = await db();
    const user = await orm.user.findUnique({
      where: { email },
      select: {
        memberships: {
          select: {
            org: {
              select: {
                name: true, branding: true,
                customDomainVerified: true, personal: true,
              },
            },
          },
        },
      },
    });
    const m = user?.memberships?.find((mm) => mm.org && !mm.org.personal);
    if (!m) return { branding: null, orgName: null, customDomainVerified: false };
    return {
      branding: m.org.branding || null,
      orgName: m.org.name,
      customDomainVerified: !!m.org.customDomainVerified,
    };
  } catch {
    return { branding: null, orgName: null, customDomainVerified: false };
  }
}

async function sendMagicLink({ identifier, url, provider }) {
  // Sprint S1.1 — refuse boot al console fallback en producción.
  // Antes: si EMAIL_SERVER ausente en prod, los magic-links iban a stdout,
  // y un agregador de logs (Sentry/CloudWatch) terminaba indexando un
  // secret de auth. Ahora: prod sin EMAIL_SERVER lanza error explícito.
  if (!process.env.EMAIL_SERVER && process.env.NODE_ENV === "production") {
    throw new Error(
      "EMAIL_SERVER not configured in production: magic-link fallback to stdout would leak auth secrets to logs. " +
      "Set EMAIL_SERVER to a SMTP URL (e.g. smtp://user:pass@smtp.postmarkapp.com:587)."
    );
  }

  // Lookup branding del recipient (best-effort).
  const { branding, orgName, customDomainVerified } = await lookupRecipientBranding(identifier);

  if (process.env.EMAIL_SERVER) {
    const { default: nodemailer } = await import("nodemailer");
    const t = nodemailer.createTransport(provider.server);
    // Sprint 18 — render con branding si está disponible.
    const fromAddr = customDomainVerified && branding?.customDomain && orgName
      ? `${orgName.replace(/[^\w\s-]/g, "").trim().slice(0, 60)} <no-reply@${branding.customDomain}>`
      : (provider.from || "no-reply@bio-ignicion.app");
    const subject = orgName
      ? `Sign in to ${orgName}`
      : "Sign in to BIO-IGNICIÓN";
    const ctaHtml = renderCtaButton({ url, label: "Sign in", branding });
    const innerHtml = `<h2>${orgName ? `Welcome back to ${escapeHtml(orgName)}` : "Welcome back"}</h2><p>Click the button below to sign in. Link expires in 24 hours.</p>${ctaHtml}<p style="color:#64748B;font-size:13px">If you didn't request this, ignore this email.</p>`;
    const result = await t.sendMail({
      to: identifier,
      from: fromAddr,
      subject,
      text: `Sign in${orgName ? ` to ${orgName}` : ""}\n\n${url}\n\nLink expires in 24 hours.\n`,
      html: renderEmailHTML({ content: innerHtml, branding, locale: "es" }),
    });
    const failed = [...(result.rejected || []), ...(result.pending || [])].filter(Boolean);
    if (failed.length) throw new Error(`Email delivery failed: ${failed.join(", ")}`);
    return;
  }
  console.log(
    [
      "",
      "┌─ BIO-IGNICIÓN · MAGIC LINK (console fallback) ──────────────────",
      `│ to:     ${identifier}`,
      `│ link:   ${url}`,
      orgName ? `│ org:    ${orgName} (branded: ${branding?.logoUrl ? "yes" : "no"})` : "",
      "│ expires in 24h · configure EMAIL_SERVER to silence this log",
      "└─────────────────────────────────────────────────────────────────",
      "",
    ].filter(Boolean).join("\n")
  );
}

async function adapter() {
  if (!process.env.DATABASE_URL) return undefined;
  const orm = await db();
  return PrismaAdapter(orm);
}

/* Personal-org provisioning — idempotente.
   Cada usuario tiene UN org personal auto-creado, sirve como tenant
   default para sus sesiones individuales. Si después se une a un
   org B2B (vía Invitation), ese org es adicional, no reemplaza el
   personal. Esto preserva la schema multi-tenant sin quemar el
   modelo para usuarios B2C.

   Nombre/slug determinístico: "personal-{userId}". Si ya existe
   (idempotente), no-op. Llamado desde callbacks.signIn para cubrir
   tanto signups nuevos como users que existían antes de v0005. */
async function ensurePersonalOrg(userId, email) {
  if (!userId) return null;
  try {
    const orm = await db();
    const existing = await orm.org.findUnique({ where: { slug: `personal-${userId}` } });
    if (existing) return existing;
    // Crear org personal + membership OWNER en transacción.
    const created = await orm.$transaction(async (tx) => {
      const org = await tx.org.create({
        data: {
          name: email ? `Personal · ${email.split("@")[0]}` : "Personal",
          slug: `personal-${userId}`,
          plan: "FREE",
          personal: true,
          seats: 1,
          seatsUsed: 1,
        },
      });
      await tx.membership.create({
        data: { userId, orgId: org.id, role: "OWNER" },
      });
      return org;
    });
    await auditLog({ orgId: created.id, actorId: userId, action: "org.personal.created" })
      .catch(() => {});
    return created;
  } catch (e) {
    // Race condition: dos signin concurrentes intentan crear → uno gana.
    // Re-fetch para devolver el ganador.
    try {
      const orm = await db();
      return await orm.org.findUnique({ where: { slug: `personal-${userId}` } });
    } catch { return null; }
  }
}

// Resolver el adapter una vez al boot — usado para magic links + signin
// flow (necesita persistir VerificationToken). Pero la STRATEGY de session
// es JWT siempre — esto desacopla las requests de /api/auth/session de la
// DB. Antes: strategy="database" → si Prisma falla (migration ausente,
// URL mala, schema desincronizado), TODO request a /api/auth/session
// devuelve 500. Con JWT, sesiones viven en cookie firmada con AUTH_SECRET.
//
// Tradeoff aceptado: "logout from all devices" requiere lógica custom
// (signout-all route ya existe). Vale el costo a cambio de robustez.
// Wrap el PrismaAdapter con logging por método. Sin esto, cuando una
// operación del adapter (createUser, linkAccount, getUserByAccount, etc.)
// throw en producción, Auth.js solo redirige a ?error=Configuration sin
// dejar pista en logs. Con el Proxy, cada método que falla imprime
// "[auth][adapter.<methodName>]" con el error code (Prisma P-codes) y
// el stack — diagnóstico instantáneo.
function wrapAdapterWithLogging(a) {
  if (!a) return a;
  return new Proxy(a, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== "function") return original;
      return async (...args) => {
        try {
          return await original.apply(target, args);
        } catch (e) {
          console.error(
            `[auth][adapter.${String(prop)}]`,
            e?.name || "Error",
            e?.code ? `[${e.code}]` : "",
            e?.message || e,
            e?.stack ? "\n" + e.stack.split("\n").slice(0, 6).join("\n") : ""
          );
          throw e;
        }
      };
    },
  });
}

const dbAdapter = wrapAdapterWithLogging(
  await adapter().catch((e) => {
    console.error("[auth][adapter-init]", e?.message || e);
    return undefined;
  })
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: dbAdapter,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  // Logger explícito — sin esto, el catch-all `?error=Configuration` no deja
  // pista en Vercel logs. Con esto, cualquier throw del adapter/callback se
  // imprime con stack trace identificable (grep "[auth][error]").
  logger: {
    error(error) {
      console.error("[auth][error]", error?.name || "Error", error?.message || error, error?.stack);
    },
    warn(code) { console.warn("[auth][warn]", code); },
  },
  // Cookie config explícito. Por default Auth.js v5 usa __Secure- prefix
  // en prod (correcto), pero algunos PWA standalone (iOS) tienen issues
  // con cookies sin sameSite explícito. Lo declaramos para evitar surprises.
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  // trustHost: Auth.js v5 valida el `host` header contra AUTH_URL salvo
  // que trustHost sea true. En serverless/Vercel el request llega tras un
  // proxy → host real viene en X-Forwarded-Host → trustHost debe ser true.
  // Auto-detectamos Vercel (env VERCEL=1) y aceptamos AUTH_TRUST_HOST en
  // sus formas comunes ("true" per docs Auth.js, "1" legacy). Sin esto,
  // signin desde el dominio prod devuelve ?error=Configuration.
  trustHost:
    !!process.env.VERCEL ||
    process.env.AUTH_TRUST_HOST === "1" ||
    process.env.AUTH_TRUST_HOST === "true" ||
    process.env.NODE_ENV !== "production",
  providers: [
    ...(process.env.OKTA_CLIENT_ID && process.env.OKTA_CLIENT_SECRET && process.env.OKTA_ISSUER ? [Okta({
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
    })] : []),
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET && process.env.AZURE_AD_TENANT_ID ? [AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    })] : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })] : []),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? [Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })] : []),
    // Email magic-link SOLO si tenemos adapter funcional. NextAuth v5
    // throw "MissingAdapter" en init si Email existe sin adapter — eso
    // mapea a ?error=Configuration y rompe TODOS los providers, no solo
    // Email. Si la DB está caída en prod, OAuth (Google) sigue funcionando
    // vía JWT en vez de fallar todo. Si user habilita Email mas tarde, se
    // re-incluye automaticamente al detectar adapter.
    ...(dbAdapter ? [Email({
      // Dummy server satisfies NextAuth's init-time validation when
      // EMAIL_SERVER is unset — it's never actually used because our
      // sendMagicLink override handles both real-send and console paths.
      server: process.env.EMAIL_SERVER || "smtp://noop:noop@localhost:25",
      from: process.env.EMAIL_FROM || "no-reply@bio-ignicion.app",
      sendVerificationRequest: sendMagicLink,
    })] : []),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try { if (new URL(url).origin === baseUrl) return url; } catch {}
      return `${baseUrl}/app`;
    },
    async signIn({ user, account }) {
      // Bulletproof: callback wrap top-level. Cualquier throw inesperado
      // aquí causa que Auth.js redirija a ?error=Configuration. Auth ya
      // sucedió con el IdP — bloquear por un fallo en housekeeping (audit
      // log, org provisioning) sería peor UX que permitir entrar sin la
      // traza. Best-effort para todo lo que toca DB.
      try {
        try {
          const orm = await db();
          await orm.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
        } catch {
          // sin DB → no hay lastLoginAt update; signin sigue válido
        }
        // Personal-org provisioning — idempotente, cubre signups nuevos y
        // legacy users sin org. Failure no bloquea signin.
        ensurePersonalOrg(user.id, user.email).catch((e) => {
          console.error("[auth][ensurePersonalOrg]", e?.message || e);
        });
        await auditLog({ action: "auth.signin", actorId: user.id, payload: { provider: account?.provider } })
          .catch((e) => {
            console.error("[auth][auditLog signin]", e?.message || e);
          });
      } catch (e) {
        console.error("[auth][signIn-callback]", e?.message || e, e?.stack);
        // Aun así dejar entrar — autenticación con el IdP sí ocurrió.
      }
      return true;
    },
    async jwt({ token, user, trigger }) {
      // Bulletproof: wrap top-level. Cualquier throw aquí causa
      // ?error=Configuration. JWT debe poder construirse incluso si DB
      // está caída — el JWT mínimo válido (sub, locale, timezone) basta
      // para que el user entre; security policies y session tracking se
      // recuperan en el próximo refresh.
      try {
        // Al signin, persistir id/locale/timezone en el token JWT para que
        // session() los pueda leer sin DB.
        if (user) {
          token.sub = user.id;
          token.locale = user.locale;
          token.timezone = user.timezone;
        }
        // Sprint 8 — al signin, crear UserSession row + embebir jti + epoch.
        // El jti permite revoke per-device; el epoch invalida-todos al bump.
        if (user) {
          try {
            const h = await headers();
            const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
            const userAgent = h.get("user-agent") || null;
            const jti = await createSession({ userId: user.id, ip, userAgent });
            if (jti) token.jti = jti;
            token.epoch = await getCurrentEpoch(user.id);
            token.lastValidatedAt = Date.now();
            delete token.invalid;
          } catch (e) {
            console.error("[auth][jwt-session-tracking]", e?.message || e);
            // headers()/createSession fallaron — signin sigue válido sin tracking.
          }
        }
        // Sprint 8 polish — lazy revoke validation. Re-valida contra DB cada
        // SESSION_VALIDATION_INTERVAL_MS (60s) o al trigger="update". Si la
        // sesión fue revocada o el epoch cambió → marca token.invalid;
        // session() callback retorna user:null → admin layout redirige a signin.
        else if (shouldRevalidate(token) || trigger === "update") {
          try {
            const valid = await isSessionValid({
              jti: token.jti,
              userId: token.sub,
              tokenEpoch: token.epoch ?? 0,
            });
            if (!valid) {
              token.invalid = true;
            } else {
              token.lastValidatedAt = Date.now();
              delete token.invalid;
              // Touch lastSeenAt async — no bloquear el callback por esto.
              touchSession(token.jti).catch(() => {});
            }
          } catch (e) {
            console.error("[auth][jwt-revalidation]", e?.message || e);
            // DB fallo durante revalidación — preservar token actual (fail-open).
          }
        }
        // Embed org security policies en el token.
        if (user || trigger === "update") {
          try {
            const orm = await db();
            const userId = token.sub || user?.id;
            if (userId) {
              const memberships = await orm.membership.findMany({
                where: { userId },
                select: { orgId: true, org: {
                  select: {
                    requireMfa: true,
                    sessionMaxAgeMinutes: true,
                    ipAllowlist: true,
                    ipAllowlistEnabled: true,
                  },
                }},
              });
              token.securityPolicies = memberships.map((m) => ({
                orgId: m.orgId,
                requireMfa: !!m.org?.requireMfa,
                sessionMaxAgeMinutes: m.org?.sessionMaxAgeMinutes ?? null,
                ipAllowlist: m.org?.ipAllowlist || [],
                ipAllowlistEnabled: !!m.org?.ipAllowlistEnabled,
              }));
            }
          } catch (e) {
            console.error("[auth][jwt-security-policies]", e?.message || e);
            token.securityPolicies = token.securityPolicies || [];
          }
        }
      } catch (e) {
        console.error("[auth][jwt-callback]", e?.message || e, e?.stack);
        // Return token aunque haya throw inesperado — JWT mínimo es preferible
        // a redirect a /signin?error=Configuration.
      }
      return token;
    },
    async session({ session, user, token }) {
      // Bulletproof: wrap top-level. Si esto throw, /api/auth/session
      // devuelve 500 a TODO visitor del site (también unauth), rompiendo
      // toda navegación. Devolvemos session mínimamente válida en error.
      try {
        // Sprint 8 polish — token.invalid (revoked/epoch-mismatch) → user:null.
        if (token?.invalid) {
          return { ...session, user: null, expires: new Date().toISOString() };
        }
        // En strategy="jwt" no hay `user`; toda la info viene del token.
        const u = user || (token ? { id: token.sub, locale: token.locale, timezone: token.timezone } : null);
        if (!u || !session?.user) return session;
        session.user.id = u.id;
        session.user.locale = u.locale || "es";
        session.user.timezone = u.timezone || "America/Mexico_City";
        if (dbAdapter) {
          try {
            const orm = await db();
            session.memberships = await orm.membership.findMany({
              where: { userId: u.id },
              include: {
                org: {
                  select: { id: true, name: true, slug: true, personal: true, plan: true },
                },
              },
            });
          } catch (e) {
            console.error("[auth][session-memberships]", e?.message || e);
            session.memberships = [];
          }
        } else {
          session.memberships = [];
        }
        session.securityPolicies = Array.isArray(token?.securityPolicies)
          ? token.securityPolicies
          : [];
        session.jti = token?.jti || null;
        return session;
      } catch (e) {
        console.error("[auth][session-callback]", e?.message || e, e?.stack);
        return session;
      }
    },
  },
  events: {
    async signOut(message) {
      // En JWT-strategy el evento trae `token`, en database-strategy `session`.
      const token = message?.token;
      const session = message?.session;
      const actorId = token?.sub || session?.userId;
      const jti = token?.jti;
      // Sprint 8 — revoca la UserSession row del JWT actual (si existe)
      // para que /settings/sessions no muestre una sesión "viva" tras
      // signout normal. Best-effort.
      if (jti) await revokeByJti(jti).catch(() => {});
      await auditLog({ action: "auth.signout", actorId }).catch(() => {});
    },
  },
});
