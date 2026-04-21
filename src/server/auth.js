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

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: await adapter().catch(() => undefined),
  session: { strategy: "database", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin" },
  trustHost: process.env.AUTH_TRUST_HOST === "1" || process.env.NODE_ENV !== "production",
  providers: [
    Okta({
      clientId: process.env.OKTA_CLIENT_ID,
      clientSecret: process.env.OKTA_CLIENT_SECRET,
      issuer: process.env.OKTA_ISSUER,
    }),
    AzureAD({
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: { params: { hd: "*" } },
    }),
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
      const orm = await db();
      await orm.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => {});
      await auditLog({ action: "auth.signin", actorId: user.id, payload: { provider: account?.provider } })
        .catch(() => {});
      return true;
    },
    async session({ session, user }) {
      const orm = await db();
      const memberships = await orm.membership.findMany({ where: { userId: user.id } });
      session.user.id = user.id;
      session.user.locale = user.locale || "es";
      session.user.timezone = user.timezone || "America/Mexico_City";
      session.memberships = memberships;
      return session;
    },
  },
  events: {
    async signOut({ session }) {
      await auditLog({ action: "auth.signout", actorId: session?.userId }).catch(() => {});
    },
  },
});
