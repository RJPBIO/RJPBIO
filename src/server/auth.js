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
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { auditLog } from "./audit";

async function adapter() {
  if (!process.env.DATABASE_URL) return undefined;
  const orm = await db();
  return PrismaAdapter(orm);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: await adapter().catch(() => undefined),
  session: { strategy: "database", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/signin", error: "/signin?error=1" },
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
    ...(process.env.EMAIL_SERVER ? [Email({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM || "no-reply@bio-ignicion.app",
    })] : []),
  ],
  callbacks: {
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
