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
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { auditLog } from "./audit";

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
    async jwt({ token, user }) {
      // Al signin, persistir id/locale/timezone en el token JWT para que
      // session() los pueda leer sin DB.
      if (user) {
        token.sub = user.id;
        token.locale = user.locale;
        token.timezone = user.timezone;
      }
      return token;
    },
    async session({ session, user, token }) {
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
          session.memberships = await orm.membership.findMany({ where: { userId: u.id } });
        } catch {
          session.memberships = [];
        }
      } else {
        session.memberships = [];
      }
      return session;
    },
  },
  events: {
    async signOut({ session }) {
      await auditLog({ action: "auth.signout", actorId: session?.userId }).catch(() => {});
    },
  },
});
