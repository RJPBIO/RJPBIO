"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export default function SignInClient() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [sso, setSso] = useState(null);
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

  return (
    <AuthShell
      title="Entrar a BIO-IGNICIÓN"
      subtitle="Te enviaremos un enlace mágico, usa tu passkey o SSO corporativo."
      footer={
        <span>
          ¿Primera vez? <Link href="/signup" style={{ color: cssVar.accent, fontWeight: font.weight.semibold, textDecoration: "none" }}>Crea tu organización</Link>
        </span>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <Field label="Correo de trabajo" required>
          {(a) => (
            <Input
              {...a}
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tú@empresa.com"
              autoComplete="email" autoFocus
            />
          )}
        </Field>

        {sso && (
          <Button
            href={`/api/auth/signin/${sso.provider}?email=${encodeURIComponent(email)}`}
            variant="primary" block
            style={{ marginTop: space[2] }}
          >
            Continuar con SSO ({sso.provider.toUpperCase()})
          </Button>
        )}

        <Button
          type="submit" variant="primary" block
          disabled={submitting || !email}
          style={{ marginTop: space[3] }}
        >
          {submitting ? "Enviando…" : "Enviar enlace mágico"}
          {lastMethod === "magic-link" && <Badge variant="soft" size="sm" style={{ marginInlineStart: space[2] }}>Último</Badge>}
        </Button>

        <Button
          type="button" variant="secondary" block
          onClick={usePasskey}
          disabled={submitting || !email}
          style={{ marginTop: space[2] }}
        >
          <span aria-hidden>🔑</span> Usar passkey
          {lastMethod === "passkey" && <Badge variant="soft" size="sm" style={{ marginInlineStart: space[2] }}>Último</Badge>}
        </Button>

        {err && <div style={{ marginTop: space[4] }}><Alert kind="danger">{err}</Alert></div>}
        {ok  && <div style={{ marginTop: space[4] }}><Alert kind="success">{ok}</Alert></div>}

        <div style={{
          display: "flex", alignItems: "center", gap: space[3],
          margin: `${space[5]}px 0 ${space[3]}px`,
          color: cssVar.textMuted, fontSize: font.size.xs, letterSpacing: font.tracking.widest,
        }}>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
          <span>O CON TU IDP</span>
          <hr style={{ flex: 1, border: 0, borderTop: `1px solid ${cssVar.border}` }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: space[2] }}>
          <Button href="/api/auth/signin/okta"     variant="secondary" size="sm">Okta</Button>
          <Button href="/api/auth/signin/azure-ad" variant="secondary" size="sm">Azure AD</Button>
          <Button href="/api/auth/signin/google"   variant="secondary" size="sm">Google</Button>
        </div>

        <p style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: space[5], textAlign: "center" }}>
          <Link href="/recover" style={{ color: cssVar.textDim, textDecoration: "none" }}>¿Problemas para entrar?</Link>
        </p>
      </form>
    </AuthShell>
  );
}
