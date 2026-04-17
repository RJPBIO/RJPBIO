/* ═══════════════════════════════════════════════════════════════
   Auth — Auth.js (NextAuth v5) con OIDC, SAML, Credenciales, MFA
   Proveedores: Okta, Azure AD, Google Workspace, GitHub, Email,
   SAML genérico (Auth.js providers/saml-jackson) y TOTP.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";
import NextAuth from "next-auth";
import Okta from "next-auth/providers/okta";
import AzureAD from "next-auth/providers/azure-ad";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import { auditLog } from "./audit";
import { verifyTOTP } from "./mfa";

async function adapter() {
  if (!process.env.DATABASE_URL) return undefined;
  const orm = await db();
  return PrismaAdapter(orm);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: await adapter().catch(() => undefined),
  session: { strategy: "database", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/auth/signin", error: "/auth/error" },
  trustHost: true,
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
    Credentials({
      name: "email-mfa",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totp: { label: "MFA code", type: "text" },
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        const orm = await db();
        const user = await orm.user.findUnique({ where: { email: creds.email } });
        if (!user) return null;
        if (user.mfaEnabled) {
          const ok = await verifyTOTP(user.mfaSecret, creds.totp);
          if (!ok) return null;
        }
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
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
