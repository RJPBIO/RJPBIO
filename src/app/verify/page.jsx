import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

export const metadata = { title: "Revisa tu correo" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({ searchParams }) {
  const { email } = (await searchParams) || {};

  return (
    <AuthShell
      size="md"
      footer={
        <span>
          ¿Correo incorrecto? <Link href="/signin" style={{ color: cssVar.accent, fontWeight: font.weight.semibold, textDecoration: "none" }}>Vuelve a intentar</Link>
        </span>
      }
    >
      <div style={{ textAlign: "center" }}>
        <div aria-hidden style={{
          width: 72, height: 72, margin: `0 auto ${space[5]}px`,
          borderRadius: "50%",
          background: `radial-gradient(closest-side, ${bioSignal.phosphorCyan}66, transparent 70%)`,
          display: "grid", placeItems: "center",
          animation: "bth 2.4s ease-in-out infinite",
        }}>
          <span style={{
            width: 36, height: 36, borderRadius: "50%",
            background: `conic-gradient(from 0deg, var(--bi-accent), ${bioSignal.phosphorCyan}, var(--bi-accent))`,
            boxShadow: `0 0 26px var(--bi-accent)`,
          }} />
        </div>

        <h1 style={{
          margin: 0,
          fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight,
          color: cssVar.text,
        }}>
          Revisa tu correo
        </h1>
        <p style={{ marginTop: space[2], color: cssVar.textDim, fontSize: font.size.md, lineHeight: font.leading.normal }}>
          Enviamos un enlace a <b style={{ color: cssVar.text }}>{email || "tu correo"}</b>.
          <br />
          Se vence en 10 minutos.
        </p>

        <div style={{ marginTop: space[6] }}>
          <Button href="/signin" variant="secondary">Reenviar enlace</Button>
        </div>

        <p style={{ marginTop: space[5], color: cssVar.textMuted, fontSize: font.size.sm }}>
          ¿No llegó? Revisa la carpeta de spam o promociones.
        </p>
      </div>
    </AuthShell>
  );
}
