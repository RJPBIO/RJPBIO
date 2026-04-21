import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import ResendClient from "./ResendClient";
import AuthHero from "@/components/brand/AuthHero";

export const metadata = { title: "Revisa tu correo" };
export const dynamic = "force-dynamic";

const COPY = {
  es: {
    kicker: "ENLACE · ENVIADO",
    title: "Revisa tu correo",
    heroKicker: "BIO-IGNICIÓN · ENLACE EN VUELO",
    heroStatement: "Un enlace, un uso, diez minutos.",
    heroTagline: "Te enviamos un magic link firmado. Ciérrale sesión y úsalo desde el dispositivo que prefieras.",
    heroTrust: "Firmado HS256 · rotación de token por intento · sin cookies hasta la validación.",
    heroChips: ["Magic link", "One-time", "10 min TTL"],
    sentToPrefix: "Enviamos un enlace a",
    sentToFallback: "tu correo",
    expires: "Se vence en 10 minutos.",
    resend: "Reenviar enlace",
    sending: "Reenviando…",
    okResent: "Enlace reenviado. Revisa tu correo.",
    errNoEmail: "Falta el correo en la URL para reenviar.",
    errGeneric: "No se pudo reenviar el enlace.",
    cooldownLabel: (s) => `Reenviar en ${s}s`,
    cooldownHint: "Esperamos unos segundos para no saturar tu bandeja.",
    spam: "¿No llegó? Revisa la carpeta de spam o promociones.",
    wrong: "¿Correo incorrecto?",
    retry: "Vuelve a intentar",
    providerLabel: "Abrir tu correo",
    openIn: "Abrir {p}",
    helpersLabel: "Ayuda",
    helperBack: "← Cambiar correo",
    helperSupport: "Contactar soporte",
    editLabel: "Editar correo",
    editPlaceholder: "tu@empresa.com",
    editSave: "Guardar y reenviar",
    editCancel: "Cancelar",
    editInvalid: "Formato de correo inválido.",
    idleTitle: "¿Sigue sin llegar?",
    idleSpam: "Revisa spam o promociones.",
    idleEdit: "Corrige la dirección arriba.",
    idleSupport: "O escríbenos a soporte.",
    idleKicker: "30 SEG · SIN SEÑAL",
  },
  en: {
    kicker: "LINK · SENT",
    title: "Check your inbox",
    heroKicker: "BIO-IGNICIÓN · LINK IN FLIGHT",
    heroStatement: "One link, one use, ten minutes.",
    heroTagline: "We've sent a signed magic link. Close this tab and open it from the device you prefer.",
    heroTrust: "HS256-signed · token rotates per attempt · no cookies set before validation.",
    heroChips: ["Magic link", "One-time", "10 min TTL"],
    sentToPrefix: "We sent a link to",
    sentToFallback: "your inbox",
    expires: "It expires in 10 minutes.",
    resend: "Resend link",
    sending: "Resending…",
    okResent: "Link resent. Check your inbox.",
    errNoEmail: "Email missing from URL, cannot resend.",
    errGeneric: "Could not resend the link.",
    cooldownLabel: (s) => `Resend in ${s}s`,
    cooldownHint: "We wait a few seconds to avoid flooding your inbox.",
    spam: "Didn't arrive? Check spam or promotions.",
    wrong: "Wrong address?",
    retry: "Try again",
    providerLabel: "Open your mail",
    openIn: "Open {p}",
    helpersLabel: "Help",
    helperBack: "← Change email",
    helperSupport: "Contact support",
    editLabel: "Edit email",
    editPlaceholder: "you@company.com",
    editSave: "Save and resend",
    editCancel: "Cancel",
    editInvalid: "Invalid email format.",
    idleTitle: "Still nothing?",
    idleSpam: "Check spam or promotions.",
    idleEdit: "Correct the address above.",
    idleSupport: "Or email our support.",
    idleKicker: "30 SEC · NO SIGNAL",
  },
};

export default async function VerifyPage({ searchParams }) {
  const { email } = (await searchParams) || {};
  const locale = await getServerLocale();
  const T = COPY[locale === "en" ? "en" : "es"];

  return (
    <AuthShell
      locale={locale}
      size="md"
      hero={<AuthHero kicker={T.heroKicker} statement={T.heroStatement} tagline={T.heroTagline} trust={T.heroTrust} chips={T.heroChips} />}
      footer={
        <span>
          {T.wrong}{" "}
          <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold, textDecoration: "none" }}>
            {T.retry}
          </Link>
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

        <div style={{
          fontFamily: cssVar.fontMono,
          fontSize: font.size.xs,
          color: bioSignal.phosphorCyan,
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          fontWeight: font.weight.bold,
          marginBlockEnd: space[4],
        }}>
          {T.kicker}
        </div>
        <h1 style={{
          margin: 0,
          fontSize: "clamp(30px, 3.4vw, 40px)",
          fontWeight: font.weight.black,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          color: cssVar.text,
        }}>
          {T.title}
        </h1>
        <ResendClient
          email={email || ""}
          labels={{
            resend: T.resend,
            sending: T.sending,
            okResent: T.okResent,
            errNoEmail: T.errNoEmail,
            errGeneric: T.errGeneric,
            cooldownLabel: T.cooldownLabel,
            cooldownHint: T.cooldownHint,
            providerLabel: T.providerLabel,
            openIn: T.openIn,
            helpersLabel: T.helpersLabel,
            helperBack: T.helperBack,
            helperSupport: T.helperSupport,
            expires: T.expires,
            sentToPrefix: T.sentToPrefix,
            sentToFallback: T.sentToFallback,
            editLabel: T.editLabel,
            editPlaceholder: T.editPlaceholder,
            editSave: T.editSave,
            editCancel: T.editCancel,
            editInvalid: T.editInvalid,
            idleTitle: T.idleTitle,
            idleSpam: T.idleSpam,
            idleEdit: T.idleEdit,
            idleSupport: T.idleSupport,
            idleKicker: T.idleKicker,
          }}
        />

        <p style={{ marginTop: space[5], color: cssVar.textMuted, fontSize: font.size.sm }}>
          {T.spam}
        </p>
      </div>
    </AuthShell>
  );
}
