/* GET /api/v1/me/providers — lista de OAuth providers vinculados al
   user actual. Phase 6D SP4a. Usado por UnlinkProviderModal para
   poblar la lista de providers sin re-fetch de session.

   Auth: cualquier sesión válida. Sólo devuelve los del user actual. */

import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const orm = await db();
  const accounts = await orm.account.findMany({
    where: { userId: session.user.id },
    select: { provider: true, providerAccountId: true, type: true },
    orderBy: { provider: "asc" },
  });
  // No devolver providerAccountId completo (puede contener PII en
  // algunos providers como email magic-link). Solo el provider name
  // y un sub-fragment para identificación visual.
  const sanitized = accounts.map((a) => ({
    provider: a.provider,
    type: a.type,
    // Trunca a primeros 8 chars para no exponer ID completo.
    accountSub: typeof a.providerAccountId === "string"
      ? a.providerAccountId.slice(0, 8)
      : null,
  }));
  return NextResponse.json({ providers: sanitized, count: sanitized.length });
}
