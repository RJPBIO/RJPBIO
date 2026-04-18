import { redirect } from "next/navigation";
import { auth } from "../../server/auth";
import { db } from "../../server/db";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cuenta" };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin?callbackUrl=/account");

  const orm = await db();
  const [user, memberships] = await Promise.all([
    orm.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, email: true, name: true, locale: true, timezone: true,
        mfaEnabled: true, createdAt: true, lastLoginAt: true, image: true,
      },
    }),
    orm.membership.findMany({
      where: { userId: session.user.id },
      include: { org: { select: { id: true, name: true, slug: true, plan: true } } },
    }),
  ]);

  if (!user) redirect("/signin");

  return <AccountClient user={user} memberships={memberships} />;
}
