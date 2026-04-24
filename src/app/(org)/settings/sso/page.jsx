/* ═══════════════════════════════════════════════════════════════
   /(org)/settings/sso — Admin SSO / SCIM config

   Authed page for org OWNER/ADMIN. Muestra el estado SSO de la
   organización + permite generar tokens SCIM para auto-provisioning.
   Si el usuario NO es owner/admin, redirige a /account.
   ═══════════════════════════════════════════════════════════════ */

import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import SsoSettingsClient from "./SsoSettingsClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = { title: "SSO & SCIM" };
export const dynamic = "force-dynamic";

export default async function SsoSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/sso");

  // Buscar la primera org donde el usuario es OWNER o ADMIN.
  // Si no hay ninguna → redirige a /account (no tiene permiso
  // para configurar SSO).
  const ownerMembership = session.memberships?.find(
    (m) => m.role === "OWNER" || m.role === "ADMIN"
  );
  if (!ownerMembership) redirect("/account");

  const orm = await db();
  const org = await orm.org.findUnique({
    where: { id: ownerMembership.orgId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      ssoDomain: true,
      ssoProvider: true,
      createdAt: true,
      seats: true,
      seatsUsed: true,
      apiKeys: {
        where: { revokedAt: null },
        select: {
          id: true,
          name: true,
          prefix: true,
          scopes: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!org) redirect("/account");

  const locale = await getServerLocale();

  // Detectar qué providers están disponibles en el backend (vía
  // envs configuradas al deploy). Este dato ayuda al admin a
  // saber qué provider está realmente activo en SU instancia.
  const providersAvailable = {
    okta: !!(
      process.env.OKTA_CLIENT_ID &&
      process.env.OKTA_CLIENT_SECRET &&
      process.env.OKTA_ISSUER
    ),
    azure: !!(
      process.env.AZURE_AD_CLIENT_ID &&
      process.env.AZURE_AD_CLIENT_SECRET &&
      process.env.AZURE_AD_TENANT_ID
    ),
    google: !!(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
  };

  // Separar las SCIM keys de las otras (para UI limpia).
  const scimKeys = org.apiKeys.filter((k) => k.scopes.includes("scim"));
  const otherKeys = org.apiKeys.filter((k) => !k.scopes.includes("scim"));

  return (
    <SsoSettingsClient
      org={{
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        ssoDomain: org.ssoDomain,
        ssoProvider: org.ssoProvider,
        seats: org.seats,
        seatsUsed: org.seatsUsed,
      }}
      providersAvailable={providersAvailable}
      scimKeys={scimKeys}
      otherKeys={otherKeys}
      userRole={ownerMembership.role}
      locale={locale}
    />
  );
}
