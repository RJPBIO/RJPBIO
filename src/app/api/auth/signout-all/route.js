/* Cerrar sesión en todos los dispositivos.
   - Borra todas las rows de Session del usuario.
   - Emite Clear-Site-Data para limpiar cookies/storage/cache del origen.
   - 303 → /signin?signedOut=1 para flujo de formulario clásico. */

import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { auditLog } from "@/server/audit";
import { requireCsrf } from "@/server/csrf";
import { revokeAllForUser } from "@/server/sessions";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const csrf = requireCsrf(request);
  if (csrf) return csrf;

  const session = await auth();
  if (!session?.user) return new Response("unauthorized", { status: 401 });

  const orm = await db();
  // NextAuth Session table (database-strategy legacy) — clean por si acaso.
  await orm.session.deleteMany({ where: { userId: session.user.id } }).catch(() => {});
  // Sprint 8 — revoca UserSession rows + bumps sessionEpoch para invalidar
  // cualquier JWT existente que el atacante haya obtenido (defense in depth).
  await revokeAllForUser(session.user.id);
  await auditLog({ action: "auth.signout.all", actorId: session.user.id }).catch(() => {});

  const origin = new URL(request.url).origin;
  return new Response(null, {
    status: 303,
    headers: {
      "Location": `${origin}/signin?signedOut=1`,
      "Clear-Site-Data": '"cookies", "storage", "cache"',
    },
  });
}
