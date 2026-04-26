import { db } from "../../../server/db";
import { auth } from "../../../server/auth";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { validateInvitationForAcceptance } from "@/lib/invitation";

export const dynamic = "force-dynamic";

export default async function AcceptInvite({ params }) {
  const { token } = await params;
  // BUG FIX: db() es async, antes se usaba sin await — la página
  // siempre mostraba "no encontrada" porque la promesa nunca resolvía.
  const orm = await db().catch(() => null);
  if (!orm) {
    return <Frame><FrameTitle>Servicio no disponible</FrameTitle>
      <p style={mutedP}>No pudimos verificar la invitación. Reintenta en unos minutos.</p>
    </Frame>;
  }

  const inv = await orm.invitation.findUnique({ where: { token } }).catch(() => null);
  const validation = validateInvitationForAcceptance(inv);

  // Datos contextuales para mostrar al user lo que va a aceptar
  const org = inv?.orgId ? await orm.org.findUnique({
    where: { id: inv.orgId },
    select: { name: true, plan: true },
  }) : null;

  // Si el user ya está autenticado, mostramos su email para confirmar
  const session = await auth();
  const userEmail = session?.user?.email || null;
  const emailMismatch = userEmail && inv?.email && userEmail.toLowerCase() !== inv.email.toLowerCase();

  if (!validation.ok) {
    const titles = {
      not_found: "Invitación no encontrada",
      already_accepted: "Invitación ya usada",
      expired: "Invitación expirada",
    };
    const bodies = {
      not_found: "El enlace no es válido. Pídele al admin que te envíe una invitación nueva.",
      already_accepted: "Ya aceptaste esta invitación antes. Ve directo a tu app.",
      expired: "Esta invitación expiró tras 7 días. Pide una nueva al admin.",
    };
    return <Frame>
      <FrameTitle>{titles[validation.reason] || "Invitación inválida"}</FrameTitle>
      <p style={mutedP}>{bodies[validation.reason] || "El enlace no es válido."}</p>
      {validation.reason === "already_accepted" && (
        <Button href="/app" variant="primary" block>Ir a la app</Button>
      )}
    </Frame>;
  }

  return <Frame>
    <FrameTitle>Te invitan a unirte</FrameTitle>
    {org && (
      <p style={{ ...mutedP, fontSize: font.size.md, color: cssVar.text, fontWeight: font.weight.semibold }}>
        {org.name}
      </p>
    )}
    <div style={{ display: "flex", flexDirection: "column", gap: space[2], paddingBlock: space[3], borderTop: `1px solid ${cssVar.border}`, borderBottom: `1px solid ${cssVar.border}` }}>
      <Row label="Rol" value={<Badge variant="accent" size="sm">{inv.role}</Badge>} />
      <Row label="Email" value={<span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>{inv.email}</span>} />
      <Row label="Expira" value={<span style={{ fontSize: font.size.sm }}>{new Date(inv.expiresAt).toLocaleDateString()}</span>} />
    </div>

    {emailMismatch && (
      <div role="alert" style={{ padding: space[3], borderRadius: radius.sm, background: "color-mix(in srgb, var(--bi-warn) 8%, transparent)", border: `1px solid var(--bi-warn)`, color: "var(--bi-warn)", fontSize: font.size.sm }}>
        ⚠ Estás autenticado como <strong>{userEmail}</strong>. Esta invitación es para <strong>{inv.email}</strong>. Cierra sesión y vuelve a entrar con el correo correcto.
      </div>
    )}

    {!session?.user && (
      <div style={{ padding: space[3], borderRadius: radius.sm, background: cssVar.surface2, border: `1px solid ${cssVar.border}`, color: cssVar.textMuted, fontSize: font.size.sm }}>
        Te pediremos iniciar sesión con <strong>{inv.email}</strong> para aceptar.
      </div>
    )}

    <form method="POST" action={`/api/v1/invitations/${token}/accept`} style={{ display: "grid", gap: space[2] }}>
      <Button type="submit" variant="primary" block disabled={emailMismatch}>
        {session?.user ? "Aceptar invitación" : "Iniciar sesión y aceptar"}
      </Button>
    </form>
  </Frame>;
}

function Frame({ children }) {
  return (
    <main style={{
      minHeight: "100dvh",
      display: "grid",
      placeItems: "center",
      background: cssVar.bg,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      padding: space[5],
    }}>
      <div style={{
        maxWidth: 460,
        width: "100%",
        padding: space[6],
        background: cssVar.surface,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.lg,
        display: "grid",
        gap: space[3],
      }}>
        {children}
      </div>
    </main>
  );
}

function FrameTitle({ children }) {
  return <h1 style={{
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    letterSpacing: font.tracking.tight,
    margin: 0,
  }}>{children}</h1>;
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[3] }}>
      <span style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>{label}</span>
      <span style={{ color: cssVar.text }}>{value}</span>
    </div>
  );
}

const mutedP = { color: cssVar.textMuted, margin: 0 };
