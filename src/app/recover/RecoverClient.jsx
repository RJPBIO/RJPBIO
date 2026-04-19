"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export default function RecoverClient() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function sendLink(e) {
    e.preventDefault();
    setBusy(true); setMsg(""); setErr("");
    try {
      const r = await fetch("/api/auth/signin/email", { method: "POST", body: new URLSearchParams({ email }) });
      if (!r.ok) throw new Error(await r.text());
      setMsg("Enlace enviado. Revisa tu correo.");
    } catch (e) { setErr(e.message || "Error"); } finally { setBusy(false); }
  }

  return (
    <AuthShell
      title="Recuperar acceso"
      subtitle="Elige la opción que mejor describa tu situación."
      footer={
        <span>
          <Link href="/signin" className="bi-auth-link" style={{ color: cssVar.accent, fontWeight: font.weight.semibold }}>Volver a entrar</Link>
        </span>
      }
    >
      <form onSubmit={sendLink} noValidate>
        <Step label="No recuerdo mi método" hint="Enviaremos un enlace mágico a tu correo. No necesitas contraseña.">
          <Field label="Correo" required>
            {(a) => <Input {...a} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tú@empresa.com" />}
          </Field>
          <Button type="submit" variant="primary" block disabled={busy || !email}>
            {busy ? "Enviando…" : "Enviarme un enlace"}
          </Button>
        </Step>
      </form>

      <hr style={divider} />

      <Step label="Perdí mi dispositivo con TOTP / passkey" hint="Tu administrador puede reiniciar el segundo factor desde el panel de miembros, o contacta a soporte con tu correo corporativo.">
        <Button href="mailto:soporte@bio-ignicion.app?subject=Reset%20MFA" variant="secondary" size="sm">Pedir reset de MFA</Button>
      </Step>

      <hr style={divider} />

      <Step label="Bloqueado por un admin" hint="Tu administrador puede reactivar tu cuenta desde el panel de miembros.">
        <Button href="mailto:soporte@bio-ignicion.app" variant="secondary" size="sm">Contactar soporte</Button>
      </Step>

      {msg && <div style={{ marginTop: space[4] }}><Alert kind="success">{msg}</Alert></div>}
      {err && <div style={{ marginTop: space[4] }}><Alert kind="danger">{err}</Alert></div>}
    </AuthShell>
  );
}

function Step({ label, hint, children }) {
  return (
    <section style={{ marginBottom: space[2] }}>
      <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>{label}</h2>
      {hint && <p style={{ margin: `${space[1]}px 0 ${space[3]}px`, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: font.leading.normal }}>{hint}</p>}
      {children}
    </section>
  );
}

const divider = { border: 0, borderTop: "1px solid var(--bi-border)", margin: `${space[5]}px 0` };
