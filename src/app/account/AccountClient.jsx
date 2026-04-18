"use client";
import { useState } from "react";
import Link from "next/link";

export default function AccountClient({ user, memberships }) {
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState(null);

  async function requestDeletion() {
    if (!confirm("¿Eliminar tu cuenta? Esto inicia un periodo de gracia de 30 días antes del borrado definitivo.")) return;
    setDeleting(true); setMsg(null);
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/v1/users/me", {
        method: "DELETE",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setMsg({ kind: "ok", text: `Solicitud registrada. Eliminación definitiva: ${new Date(j.hardDeleteAt).toLocaleString()}` });
    } catch (e) {
      setMsg({ kind: "err", text: e?.message || "Error" });
    } finally { setDeleting(false); }
  }

  async function signOutAll() {
    if (!confirm("¿Cerrar sesión en todos los dispositivos?")) return;
    try {
      const tokenR = await fetch("/api/auth/csrf");
      const { csrfToken } = await tokenR.json();
      const r = await fetch("/api/auth/signout-all", {
        method: "POST",
        headers: { "x-csrf-token": csrfToken, "Content-Type": "application/json" },
      });
      if (!r.ok) throw new Error(await r.text());
      location.href = "/signin";
    } catch (e) {
      setMsg({ kind: "err", text: e?.message || "Error" });
    }
  }

  return (
    <main style={{ minHeight: "100dvh", padding: "40px 20px", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link href="/" style={{ color: "#94A3B8", fontSize: 13, textDecoration: "none" }}>← Volver</Link>
        <h1 style={{ margin: "12px 0 24px", fontSize: 28 }}>Tu cuenta</h1>

        <Section title="Perfil">
          <Row label="Email" value={user.email} />
          <Row label="Nombre" value={user.name || "—"} />
          <Row label="Idioma" value={user.locale} />
          <Row label="Zona horaria" value={user.timezone} />
          <Row label="MFA" value={user.mfaEnabled ? "Activado ✅" : "Desactivado"} />
          <Row label="Miembro desde" value={new Date(user.createdAt).toLocaleDateString()} />
          {user.lastLoginAt && <Row label="Último acceso" value={new Date(user.lastLoginAt).toLocaleString()} />}
          <div style={{ marginTop: 12 }}>
            <Link href="/mfa" style={link}>Configurar MFA / passkey →</Link>
          </div>
        </Section>

        <Section title={`Organizaciones (${memberships.length})`}>
          {memberships.length === 0 && <p style={{ color: "#64748B" }}>No perteneces a ninguna organización todavía.</p>}
          {memberships.map(m => (
            <div key={m.id} style={{ padding: "12px 0", borderBottom: "1px solid #1E293B" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{m.org?.name}</div>
                  <div style={{ color: "#64748B", fontSize: 12 }}>{m.role} · plan {m.org?.plan}</div>
                </div>
                {(m.role === "OWNER" || m.role === "ADMIN") && (
                  <Link href="/admin" style={link}>Admin →</Link>
                )}
              </div>
            </div>
          ))}
        </Section>

        <Section title="Seguridad">
          <button onClick={signOutAll} style={btnSecondary}>Cerrar sesión en todos los dispositivos</button>
          <div style={{ marginTop: 12 }}>
            <Link href="/settings/sessions" style={link}>Ver sesiones activas →</Link>
          </div>
        </Section>

        <Section title="Privacidad">
          <p style={{ color: "#94A3B8", fontSize: 13, marginTop: 0 }}>
            Puedes exportar tus datos en cualquier momento o solicitar la eliminación de tu cuenta
            (GDPR Art. 17). La eliminación inicia un periodo de gracia de 30 días.
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/api/v1/users/me/export" style={btnSecondary}>Exportar mis datos</Link>
            <button onClick={requestDeletion} disabled={deleting} style={{ ...btnDanger, opacity: deleting ? 0.5 : 1 }}>
              {deleting ? "Procesando…" : "Eliminar mi cuenta"}
            </button>
          </div>
        </Section>

        {msg && (
          <p role={msg.kind === "err" ? "alert" : "status"} style={{
            marginTop: 20, padding: 12, borderRadius: 8,
            background: msg.kind === "err" ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
            color: msg.kind === "err" ? "#FCA5A5" : "#A7F3D0",
            fontSize: 13,
          }}>{msg.text}</p>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginTop: 24, padding: 20, background: "#0F172A", border: "1px solid #1E293B", borderRadius: 12 }}>
      <h2 style={{ margin: "0 0 12px", fontSize: 16, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 14 }}>
      <span style={{ color: "#64748B" }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const link = { color: "#34D399", fontSize: 13, textDecoration: "none", fontWeight: 600 };
const btnSecondary = {
  display: "inline-block", padding: "8px 14px", background: "transparent",
  border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0",
  fontSize: 13, fontWeight: 600, cursor: "pointer", textDecoration: "none",
};
const btnDanger = {
  display: "inline-block", padding: "8px 14px", background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.45)", borderRadius: 8, color: "#FCA5A5",
  fontSize: 13, fontWeight: 600, cursor: "pointer",
};
