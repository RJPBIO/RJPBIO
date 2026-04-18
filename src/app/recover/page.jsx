"use client";
import { useState } from "react";

/* Recovery — opciones cuando no puedes entrar:
   1) reenviar magic link
   2) resetear MFA (via código de recovery pre-emitido)
   3) soporte */
export default function Recover() {
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
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <section style={{ width: 420, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Recuperar acceso</h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 6 }}>
          Elige la opción que mejor describa tu situación.
        </p>

        <form onSubmit={sendLink} style={{ marginTop: 20 }}>
          <label style={label}>No recuerdo mi método</label>
          <p style={hint}>Enviaremos un enlace mágico a tu correo. No necesitas contraseña.</p>
          <input
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="tú@empresa.com" autoComplete="email"
            style={input}
          />
          <button disabled={busy || !email} style={{ ...btnPrimary, opacity: (busy || !email) ? 0.6 : 1 }}>
            {busy ? "Enviando…" : "Enviarme un enlace"}
          </button>
        </form>

        <hr style={divider} />

        <div>
          <label style={label}>Perdí mi dispositivo con TOTP/passkey</label>
          <p style={hint}>
            Tu administrador puede reiniciar el segundo factor desde <code>/admin/members</code>,
            o contacta a soporte con tu correo corporativo.
          </p>
          <a href="mailto:soporte@bio-ignicion.app?subject=Reset%20MFA" style={btnLink}>Pedir reset de MFA</a>
        </div>

        <hr style={divider} />

        <div>
          <label style={label}>Bloqueado por un admin</label>
          <p style={hint}>Tu administrador puede reactivar tu cuenta desde <code>/admin/members</code>.</p>
          <a href="mailto:soporte@bio-ignicion.app" style={btnLink}>Contactar soporte</a>
        </div>

        {msg && <p role="status" style={{ color: "#34D399", fontSize: 13, marginTop: 16 }}>{msg}</p>}
        {err && <p role="alert" style={{ color: "#F87171", fontSize: 13, marginTop: 16 }}>{err}</p>}

        <p style={{ color: "#64748B", fontSize: 12, marginTop: 24, textAlign: "center" }}>
          <a href="/signin" style={{ color: "#94A3B8" }}>Volver a entrar</a>
        </p>
      </section>
    </main>
  );
}

const label = { display: "block", fontSize: 13, fontWeight: 600, color: "#E2E8F0", marginBottom: 4 };
const hint = { fontSize: 12, color: "#94A3B8", margin: "0 0 12px" };
const input = { width: "100%", padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0", marginBottom: 10 };
const btnPrimary = { width: "100%", padding: 10, background: "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600, cursor: "pointer" };
const btnLink = { display: "inline-block", padding: "8px 14px", background: "transparent", color: "#A7F3D0", border: "1px solid #334155", borderRadius: 8, textDecoration: "none", fontSize: 13 };
const divider = { border: 0, borderTop: "1px solid #1E293B", margin: "22px 0" };
