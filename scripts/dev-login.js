#!/usr/bin/env node
/* Dev-only: print a NextAuth v5 session cookie value for owner@demo.local.
   Paste in browser DevTools → Application → Cookies → authjs.session-token.
   NO production safe — use only in localhost. */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { encode, decode } from "next-auth/jwt";
import { PrismaClient } from "@prisma/client";

const EMAIL = process.argv[2] || "owner@demo.local";

const prisma = new PrismaClient();
const user = await prisma.user.findUnique({ where: { email: EMAIL } });
if (!user) {
  console.error(`User ${EMAIL} not found. Run npm run seed first.`);
  process.exit(1);
}

const secret = process.env.AUTH_SECRET;
if (!secret) { console.error("AUTH_SECRET missing in .env.local"); process.exit(1); }

const maxAge = 8 * 60 * 60;
const expiresAt = new Date(Date.now() + maxAge * 1000);

const epochRow = await prisma.user.findUnique({
  where: { id: user.id }, select: { sessionEpoch: true },
}).catch(() => null);
const epoch = epochRow?.sessionEpoch ?? 0;

const tokenPayload = {
  sub: user.id,
  name: user.name,
  email: user.email,
  locale: user.locale,
  timezone: user.timezone,
  epoch,
  lastValidatedAt: Date.now(),
};

const cookieValue = await encode({
  token: tokenPayload,
  secret,
  salt: "authjs.session-token",
  maxAge,
});

const decoded = await decode({ token: cookieValue, secret, salt: "authjs.session-token" });
const jti = decoded?.jti;
if (!jti) { console.error("Could not extract jti from encoded JWT"); process.exit(1); }

await prisma.userSession.create({
  data: {
    userId: user.id, jti,
    ip: "127.0.0.1", userAgent: "dev-login-script",
    label: "Dev login (script)",
    expiresAt,
  },
});

console.log("\n┌─ DEV LOGIN COOKIE ──────────────────────────────────────────────");
console.log(`│ user:   ${user.email}  (id=${user.id})`);
console.log(`│ cookie: authjs.session-token`);
console.log(`│ value:  ${cookieValue}`);
console.log("├─ Pegar en DevTools (F12) → Application → Cookies → http://localhost:3000");
console.log("│   Name:    authjs.session-token");
console.log("│   Path:    /");
console.log("│   HttpOnly recomendado pero no obligatorio");
console.log("│   SameSite: Lax");
console.log("└─────────────────────────────────────────────────────────────────");
console.log("\nLuego abre http://localhost:3000/admin/onboarding\n");

await prisma.$disconnect();
