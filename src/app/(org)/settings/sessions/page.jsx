import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import {
  listUserSessions,
  revokeSession,
  revokeAllForUser,
} from "../../../../server/sessions";
import { activeSessions, markCurrent } from "../../../../lib/session-tracking";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmForm } from "@/components/ui/ConfirmForm";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const SETTINGS_NAV = [
  { href: "/settings/sessions", label: "Sesiones" },
  { href: "/settings/security/mfa", label: "MFA" },
  { href: "/settings/sso", label: "SSO" },
  { href: "/settings/data-requests", label: "Mis datos (GDPR)" },
];

export const dynamic = "force-dynamic";

async function revoke(formData) {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  const id = formData.get("id");
  const ok = await revokeSession({ sessionId: id, userId: session.user.id });
  if (ok) {
    await auditLog({
      actorId: session.user.id,
      action: "session.revoked",
      payload: { sessionId: id, by: "self" },
    }).catch(() => {});
  }
}

async function revokeAll() {
  "use server";
  const session = await auth();
  if (!session?.user) return;
  await revokeAllForUser(session.user.id);
  await auditLog({ action: "auth.signout.all", actorId: session.user.id }).catch(() => {});
  redirect("/signin?signedOut=1");
}

async function deleteAccount() {
  "use server";
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const userId = session.user.id;
  const orm = await db();
  await orm.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      email: `deleted-${userId}@bio-ignicion.local`,
      name: null,
      image: null,
    },
  });
  const memberships = await orm.membership.findMany({ where: { userId } });
  for (const m of memberships) {
    await auditLog({
      orgId: m.orgId, actorId: userId,
      action: "user.deletion.requested", target: userId, payload: { graceDays: 30 },
    }).catch(() => {});
  }
  await orm.session.deleteMany({ where: { userId } }).catch(() => {});
  await revokeAllForUser(userId);
  redirect("/signin?deleted=1");
}

function timeAgo(iso) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

export default async function Sessions() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/sessions");

  const allRows = await listUserSessions(session.user.id);
  const live = activeSessions(allRows);
  const items = markCurrent(live, session.jti);

  return (
    <article className="bi-admin-shell" style={{
      maxWidth: 880,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <PageHeader
        eyebrow="Cuenta · seguridad"
        italic="Tus"
        title="sesiones activas."
        subtitle="Revoca cualquier sesión que no reconozcas. La sesión actual está marcada."
      />
      <SegmentedNav items={SETTINGS_NAV} ariaLabel="Sub-navegación de cuenta" />

      <div style={{
        marginTop: space[4],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        {items.length === 0 ? (
          <div style={{
            padding: space[6],
            textAlign: "center",
            color: cssVar.textMuted,
            fontSize: font.size.sm,
          }}>
            Sin sesiones activas registradas.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {items.map((s) => (
              <li
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: space[3],
                  padding: `${space[4]}px ${space[5]}px`,
                  borderBlockStart: `1px solid ${cssVar.border}`,
                  background: s.current ? cssVar.surface2 : "transparent",
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: space[2],
                    flexWrap: "wrap",
                  }}>
                    <strong style={{ color: cssVar.text, fontWeight: font.weight.semibold }}>
                      {s.label || "Sesión"}
                    </strong>
                    {s.current && <Badge variant="success" size="sm">Esta sesión</Badge>}
                  </div>
                  <div style={{
                    color: cssVar.textDim,
                    fontSize: font.size.xs,
                    marginTop: space[1],
                  }}>
                    Última actividad: {timeAgo(s.lastSeenAt)} · Expira: {new Date(s.expiresAt).toLocaleString()}
                  </div>
                </div>
                {!s.current && (
                  <form action={revoke} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="danger" size="sm">Revocar</Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 1 && (
        <div style={{ marginTop: space[4] }}>
          <ConfirmForm
            action={revokeAll}
            message="¿Cerrar todas las demás sesiones? Quedarás únicamente con esta."
            style={{ display: "inline" }}
          >
            <Button type="submit" variant="secondary">
              Cerrar todas las demás
            </Button>
          </ConfirmForm>
        </div>
      )}

      <hr style={{
        margin: `${space[8]}px 0`,
        border: "none",
        borderTop: `1px solid ${cssVar.border}`,
      }} />

      <h2 style={{
        fontSize: font.size.lg,
        fontWeight: font.weight.bold,
        margin: 0,
      }}>
        Mis datos
      </h2>
      <p style={{
        color: cssVar.textMuted,
        fontSize: font.size.sm,
        marginTop: space[2],
      }}>
        Descarga todo tu historial (GDPR Art. 15 / LFPDPPP Art. 22).
      </p>
      <div style={{ display: "flex", gap: space[2], marginTop: space[3], flexWrap: "wrap" }}>
        <Button href="/api/v1/users/me/export" variant="primary">
          Descargar mis datos
        </Button>
        <Button href="/settings/data-requests" variant="secondary">
          Solicitudes DSAR (GDPR)
        </Button>
        <ConfirmForm
          action={deleteAccount}
          message="¿Borrar tu cuenta definitivamente? Iniciaremos eliminación con 30 días de gracia y cerraremos tus sesiones ahora."
          style={{ display: "inline" }}
        >
          <Button type="submit" variant="danger">Borrar mi cuenta</Button>
        </ConfirmForm>
      </div>
    </article>
  );
}
