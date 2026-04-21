import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import MfaSettingsClient from "./MfaSettingsClient";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = { title: "Autenticación en dos pasos" };
export const dynamic = "force-dynamic";

export default async function MfaSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/security/mfa");

  const orm = await db();
  const user = await orm.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      mfaEnabled: true,
      mfaVerifiedAt: true,
      mfaBackupCodes: true,
      trustedDevices: {
        select: { id: true, label: true, ip: true, createdAt: true, lastUsedAt: true, expiresAt: true },
        orderBy: { lastUsedAt: "desc" },
      },
    },
  });
  if (!user) redirect("/signin");

  const locale = await getServerLocale();

  return (
    <MfaSettingsClient
      locale={locale}
      email={user.email}
      state={{
        mfaEnabled: user.mfaEnabled,
        mfaVerifiedAt: user.mfaVerifiedAt?.toISOString() || null,
        backupCodesCount: user.mfaBackupCodes?.length || 0,
        trustedDevices: user.trustedDevices.map((d) => ({
          id: d.id,
          label: d.label,
          ip: d.ip,
          createdAt: d.createdAt.toISOString(),
          lastUsedAt: d.lastUsedAt.toISOString(),
          expiresAt: d.expiresAt.toISOString(),
        })),
      }}
    />
  );
}
