"use client";
import { useState, useEffect, useCallback } from "react";

/* Signin — magic link + SSO discovery por dominio + passkey directo.
   SSO discovery: al escribir email, consulta /api/auth/sso-discover?domain=
   y si hay IdP federado, prioriza ese botón. */
export default function SignIn() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sso, setSso] = useState(null); // { provider, domain } | null
  const [lastMethod, setLastMethod] = useState(null);

  useEffect(() => {
    try {
      const v = localStorage.getItem("bio-last-signin");
      if (v) setLastMethod(v);
    } catch {}
  }, []);

  const probeSso = useCallback(async (value) => {
    const at = value.indexOf("@");
    if (at < 0 || at === value.length - 1) { setSso(null); return; }
    const domain = value.slice(at + 1).toLowerCase().trim();
    if (!domain.includes(".")) { setSso(null); return; }
    try {
      const r = await fetch(`/api/auth/sso-discover?domain=${encodeURIComponent(domain)}`);
      if (!r.ok) { setSso(null); return; }
      const j = await r.json();
      if (j?.provider) setSso({ provider: j.provider, domain });
      else setSso(null);
    } catch { setSso(null); }
  }, []);

  useEffect(() => {
    if (!email) { setSso(null); return; }
    const t = setTimeout(() => probeSso(email), 400);
    return () => clearTimeout(t);
  }, [email, probeSso]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitting(true); setErr(""); setOk("");
    try {
      const r = await fetch("/api/auth/signin/email", { method: "POST", body: new URLSearchParams({ email }) });
      if (!r.ok) throw new Error((await r.text()) || "Error al enviar");
      try { localStorage.setItem("bio-last-signin", "magic-link"); } catch {}
      setOk("Enlace enviado. Revisa tu correo.");
      setTimeout(() => { location.href = "/verify?email=" + encodeURIComponent(email); }, 500);
    } catch (e) { setErr(e.message || "Error"); } finally { setSubmitting(false); }
  }

  async function usePasskey() {
    setSubmitting(true); setErr(""); setOk("");
    try {
      if (!email) throw new Error("Ingresa tu correo primero");
      const optsR = await fetch("/api/webauthn/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!optsR.ok) throw new Error("No hay passkey para este correo");
      const opts = await optsR.json();
      const { startAuthentication } = await import("@simplewebauthn/browser");
      const assertion = await startAuthentication({ optionsJSON: opts });
      const verifyR = await fetch("/api/webauthn/auth", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assertion),
      });
      if (!verifyR.ok) throw new Error((await verifyR.text()) || "Falló la verificación");
      try { localStorage.setItem("bio-last-signin", "passkey"); } catch {}
      location.href = "/";
    } catch (e) { setErr(e.message || "Error con passkey"); } finally { setSubmitting(false); }
  }

  const wasLast = (m) => lastMethod === m;

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <form onSubmit={onSubmit} style={{ width: 380, padding: 32, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 16 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Entrar a BIO-IGNICIÓN</h1>
        <p style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>
          Te enviaremos un enlace mágico, usa tu passkey o SSO corporativo.
        </p>
        <input
          type="email" required autoFocus
          value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="tú@empresa.com"
          autoComplete="email"
          style={{ width: "100%", marginTop: 20, padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }}
        />

        {sso && (
          <a
            href={`/api/auth/signin/${sso.provider}?email=${encodeURIComponent(email)}`}
            style={{ ...btnPrimary, marginTop: 12, textDecoration: "none", display: "block", textAlign: "center" }}
          >
            Continuar con SSO ({sso.provider.toUpperCase()})
          </a>
        )}

        <button
          disabled={submitting || !email}
          style={{ ...btnPrimary, marginTop: 12, opacity: (submitting || !email) ? 0.6 : 1, cursor: submitting ? "wait" : "pointer" }}
        >
          {submitting ? "Enviando…" : "Enviar enlace mágico"}
          {wasLast("magic-link") && <span style={tag}>Último usado</span>}
        </button>

        <button
          type="button" onClick={usePasskey}
          disabled={submitting || !email}
          style={{ ...btnSecondary, marginTop: 8, opacity: (submitting || !email) ? 0.5 : 1 }}
        >
          🔑 Usar passkey
          {wasLast("passkey") && <span style={tag}>Último usado</span>}
        </button>

        {err && <p role="alert" style={{ color: "#F87171", fontSize: 13, marginTop: 12 }}>{err}</p>}
        {ok && <p role="status" style={{ color: "#34D399", fontSize: 13, marginTop: 12 }}>{ok}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 12px", color: "#475569", fontSize: 11 }}>
          <hr style={{ flex: 1, border: 0, borderTop: "1px solid #1E293B" }} />
          <span>O CON TU IdP</span>
          <hr style={{ flex: 1, border: 0, borderTop: "1px solid #1E293B" }} />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <a href="/api/auth/signin/okta" style={btnOauth}>Okta</a>
          <a href="/api/auth/signin/azure-ad" style={btnOauth}>Azure AD</a>
          <a href="/api/auth/signin/google" style={btnOauth}>Google</a>
        </div>

        <p style={{ color: "#64748B", fontSize: 12, marginTop: 24, textAlign: "center" }}>
          <a href="/recover" style={{ color: "#94A3B8" }}>¿Problemas para entrar?</a> · <a href="/terms" style={{ color: "#94A3B8" }}>Términos</a> · <a href="/privacy" style={{ color: "#94A3B8" }}>Privacidad</a>
        </p>
      </form>
    </main>
  );
}

const btnPrimary = {
  width: "100%", padding: 10, background: "#10B981", border: "none", borderRadius: 8,
  color: "#fff", fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
};
const btnSecondary = {
  width: "100%", padding: 10, background: "transparent", color: "#A7F3D0",
  border: "1px solid #10B981", borderRadius: 8, cursor: "pointer", fontWeight: 600,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14,
};
const btnOauth = { flex: 1, padding: "8px 10px", background: "#1E293B", borderRadius: 8, textAlign: "center", color: "#E2E8F0", fontSize: 13, textDecoration: "none" };
const tag = { fontSize: 10, padding: "2px 6px", background: "rgba(255,255,255,0.12)", borderRadius: 4, textTransform: "uppercase", letterSpacing: 1 };
