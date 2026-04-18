import { auth } from "../../../../server/auth";
import { db } from "../../../../server/db";
import { auditLog } from "../../../../server/audit";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export const dynamic = "force-dynamic";

async function revoke(formData) {
  "use server";
  const id = formData.get("id");
  const orm = await db();
  await orm.session.delete({ where: { id } }).catch(() => {});
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
  redirect("/signin?deleted=1");
}

export default async function Sessions() {
  const session = await auth();
  if (!session?.user) redirect("/signin?next=/settings/sessions");
  const orm = await db();
  const items = await orm.session.findMany({
    where: { userId: session.user.id }, orderBy: { expires: "desc" },
  });

  return (
    <article style={{
      maxWidth: 760,
      margin: "0 auto",
      padding: `${space[6]}px ${space[4]}px`,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
    }}>
      <h1 style={{
        margin: 0,
        fontSize: font.size["2xl"],
        fontWeight: font.weight.black,
        letterSpacing: font.tracking.tight,
      }}>
        Sesiones activas
      </h1>
      <p style={{
        color: cssVar.textMuted,
        fontSize: font.size.sm,
        marginTop: space[2],
      }}>
        Revoca cualquier sesión que no reconozcas.
      </p>

      <div style={{
        marginTop: space[4],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: font.size.sm,
        }}>
          <thead>
            <tr style={{ background: cssVar.surface2 }}>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Expira</th>
              <th style={thStyle} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={3} style={{
                  padding: space[6],
                  textAlign: "center",
                  color: cssVar.textMuted,
                }}>
                  Sin sesiones activas.
                </td>
              </tr>
            )}
            {items.map((s) => (
              <tr key={s.id} style={{ borderBlockStart: `1px solid ${cssVar.border}` }}>
                <td style={{
                  ...tdStyle,
                  fontFamily: cssVar.fontMono,
                  color: cssVar.textDim,
                }}>
                  {s.id.slice(0, 12)}…
                </td>
                <td style={tdStyle}>{new Date(s.expires).toLocaleString()}</td>
                <td style={{ ...tdStyle, textAlign: "right" }}>
                  <form action={revoke} style={{ display: "inline" }}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button type="submit" variant="danger" size="sm">Revocar</Button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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
        <form action={deleteAccount} style={{ display: "inline" }}>
          <Button type="submit" variant="danger">Borrar mi cuenta</Button>
        </form>
      </div>
    </article>
  );
}

const thStyle = {
  textAlign: "left",
  padding: `${space[3]}px ${space[4]}px`,
  fontSize: font.size.xs,
  color: cssVar.textDim,
  fontWeight: font.weight.semibold,
  textTransform: "uppercase",
  letterSpacing: font.tracking.wide,
};

const tdStyle = {
  padding: `${space[3]}px ${space[4]}px`,
  color: cssVar.text,
};
