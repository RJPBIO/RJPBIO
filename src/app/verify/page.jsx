import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";

export const metadata = { title: "Revisa tu correo" };
export const dynamic = "force-dynamic";

const COPY = {
  es: {
    title: "Revisa tu correo",
    sentTo: (email) => (<>Enviamos un enlace a <b style={{ color: cssVar.text }}>{email || "tu correo"}</b>.</>),
    expires: "Se vence en 10 minutos.",
    resend: "Reenviar enlace",
    spam: "¿No llegó? Revisa la carpeta de spam o promociones.",
    wrong: "¿Correo incorrecto?",
    retry: "Vuelve a intentar",
  },
  en: {
    title: "Check your inbox",
    sentTo: (email) => (<>We sent a link to <b style={{ color: cssVar.text }}>{email || "your inbox"}</b>.</>),
    expires: "It expires in 10 minutes.",
    resend: "Resend link",
    spam: "Didn't arrive? Check spam or promotions.",
    wrong: "Wrong address?",
    retry: "Try again",
  },
};

export default async function VerifyPage({ searchParams }) {
  const { email } = (await searchParams) || {};
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <AuthShell
      size="md"
      footer={
        <span>
          {T.wrong} <Link href="/signin" style={{ color: cssVar.accent, fontWeight: font.weight.semibold, textDecoration: "none" }}>{T.retry}</Link>
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
          {T.title}
        </h1>
        <p style={{ marginTop: space[2], color: cssVar.textDim, fontSize: font.size.md, lineHeight: font.leading.normal }}>
          {T.sentTo(email)}
          <br />
          {T.expires}
        </p>

        <div style={{ marginTop: space[6] }}>
          <Button href="/signin" variant="secondary">{T.resend}</Button>
        </div>

        <p style={{ marginTop: space[5], color: cssVar.textMuted, fontSize: font.size.sm }}>
          {T.spam}
        </p>
      </div>
    </AuthShell>
  );
}
