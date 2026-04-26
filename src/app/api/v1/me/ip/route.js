/* GET /api/v1/me/ip — devuelve la IP del request actual.
   Útil para que el admin vea qué IP debe añadir al allowlist antes
   de activarlo (evita self-lockout). Auth: cualquier sesión válida. */

import { auth } from "@/server/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await auth();
  if (!session?.user) return Response.json({ error: "unauthorized" }, { status: 401 });

  const xff = request.headers.get("x-forwarded-for") || "";
  const ip = xff.split(",")[0]?.trim() || null;
  return Response.json({ ip });
}
