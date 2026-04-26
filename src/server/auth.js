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

/* Magic-link delivery. When EMAIL_SERVER is configured we send via
   nodemailer; otherwise we fall back to a console log so the instance
   is functional from day 0 without Postmark/SES. The console path is
   acceptable for internal pilots — for real users, set EMAIL_SERVER.

   Nodemailer is dynamically imported because its module-level side
   effects (net sockets, streams) break Next.js route analysis when
   loaded from any server path that chain-imports this file. */
async function sendMagicLink({ identifier, url, provider }) {
  if (provider.server) {
    const { default: nodemailer } = await import("nodemailer");
    const t = nodemailer.createTransport(provider.server);
    const result = await t.sendMail({
      to: identifier,
      from: provider.from,
      subject: "Sign in to BIO-IGNICIÓN",
      text: `Sign in to BIO-IGNICIÓN\n\n${url}\n\nLink expires in 24 hours.\n`,
      html: `<p>Sign in to <strong>BIO-IGNICIÓN</strong></p>
             <p><a href="${url}" style="color:#059669;font-weight:600">${url}</a></p>
             <p style="color:#888;font-size:12px">Link expires in 24 hours.</p>`,
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
      "│ expires in 24h · configure EMAIL_SERVER to silence this log",
      "└─────────────────────────────────────────────────────────────────",
      "",
    ].join("\n")
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
const dbAdapter = await adapter().catch(() => undefined);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: dbAdapter,
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  trustHost: process.env.AUTH_TRUST_HOST === "1" || process.env.NODE_ENV !== "production",
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
      authorization: { params: { hd: "*" } },
    })] : []),
    ...(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET ? [Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })] : []),
    Email({
      // Dummy server satisfies NextAuth's init-time validation when
      // EMAIL_SERVER is unset — it's never actually used because our
      // sendMagicLink override handles both real-send and console paths.
      server: process.env.EMAIL_SERVER || "smtp://noop:noop@localhost:25",
      from: process.env.EMAIL_FROM || "no-reply@bio-ignicion.app",
      sendVerificationRequest: sendMagicLink,
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try { if (new URL(url).origin === baseUrl) return url; } catch {}
      return `${baseUrl}/app`;
    },
    async signIn({ user, account }) {
      // Best-effort: si la DB no está disponible, permitimos signin igual
      // (especialmente en JWT mode). El audit log fallido no debe bloquear
      // el login, solo perdería esa traza.
      try {
        const orm = await db();
        await orm.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
      } catch {
        // sin DB → no hay lastLoginAt update; signin sigue válido
      }
      // Personal-org provisioning — idempotente, cubre signups nuevos y
      // legacy users sin org. Failure no bloquea signin.
      ensurePersonalOrg(user.id, user.email).catch(() => {});
      await auditLog({ action: "auth.signin", actorId: user.id, payload: { provider: account?.provider } })
        .catch(() => {});
      return true;
    },
    async jwt({ token, user, trigger }) {
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
        } catch {
          // headers() no disponible en este contexto — sin tracking, signin igual.
        }
      }
      // Sprint 8 polish — lazy revoke validation. Re-valida contra DB cada
      // SESSION_VALIDATION_INTERVAL_MS (60s) o al trigger="update". Si la
      // sesión fue revocada o el epoch cambió → marca token.invalid;
      // session() callback retorna user:null → admin layout redirige a signin.
      else if (shouldRevalidate(token) || trigger === "update") {
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
      }
      // Embed org security policies en el token para que el middleware
      // (edge) los pueda leer vía getToken sin tocar DB.
      // Refresh: al signin (user presente) o cuando el cliente fuerza
      // un update via session().update(). Stale-OK por hasta 8h (TTL JWT)
      // — cambios de policy se aplican al siguiente refresh natural.
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
        } catch {
          // DB sin disponibilidad — no bloquear signin, dejar policies vacío.
          token.securityPolicies = token.securityPolicies || [];
        }
      }
      return token;
    },
    async session({ session, user, token }) {
      // Sprint 8 polish — token.invalid (revoked/epoch-mismatch) → user:null.
      // Layouts/handlers que hacen `if (!session?.user)` redirigen a signin
      // o devuelven 401, efectivamente cerrando la sesión revocada.
      if (token?.invalid) {
        return { ...session, user: null, expires: new Date().toISOString() };
      }
      // En strategy="jwt" no hay `user`; toda la info viene del token.
      // En strategy="database" sí hay `user` y la DB está disponible.
      const u = user || (token ? { id: token.sub, locale: token.locale, timezone: token.timezone } : null);
      if (!u || !session?.user) return session;
      session.user.id = u.id;
      session.user.locale = u.locale || "es";
      session.user.timezone = u.timezone || "America/Mexico_City";
      // Memberships sólo si tenemos DB conectada — un fallo aquí NO
      // debe romper el endpoint completo (hace que retorne 500 a todo
      // visitor del sitio, no sólo a los autenticados).
      if (dbAdapter) {
        try {
          const orm = await db();
          // Sprint 9 polish — include org scalars para que las pages que
          // filtran "no-personal" o necesitan org.name/plan no rompan.
          // Bug previo: m.org era undefined → /admin/sso, /admin/security/*
          // siempre mostraban "no disponible" silenciosamente.
          session.memberships = await orm.membership.findMany({
            where: { userId: u.id },
            include: {
              org: {
                select: { id: true, name: true, slug: true, personal: true, plan: true },
              },
            },
          });
        } catch {
          session.memberships = [];
        }
      } else {
        session.memberships = [];
      }
      // Expose security policies (embebidas en el JWT) para que el cliente
      // pueda mostrar banners (e.g. "este org requiere MFA"). Backend
      // sigue siendo source-of-truth — no confiar en este campo para gating.
      session.securityPolicies = Array.isArray(token?.securityPolicies)
        ? token.securityPolicies
        : [];
      // Sprint 8 — expose jti para que UI pueda marcar la sesión actual
      // como "this device" en /account.
      session.jti = token?.jti || null;
      return session;
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
