"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/ui/AuthShell";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

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
      setMsg({ kind: "success", text: `Solicitud registrada. Eliminación definitiva: ${new Date(j.hardDeleteAt).toLocaleString()}` });
    } catch (e) {
      setMsg({ kind: "danger", text: e?.message || "Error" });
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
      setMsg({ kind: "danger", text: e?.message || "Error" });
    }
  }

  return (
    <AuthShell
      size="lg"
      title="Tu cuenta"
      subtitle={user.email}
      footer={
        <Link href="/" style={{ color: cssVar.textDim, fontWeight: font.weight.semibold, textDecoration: "none" }}>← Volver a la app</Link>
      }
    >
      <Section title="Perfil">
        <Row label="Nombre"         value={user.name || "—"} />
        <Row label="Idioma"         value={user.locale} />
        <Row label="Zona horaria"   value={user.timezone} />
        <Row label="MFA"            value={user.mfaEnabled ? <Badge variant="success" size="sm">Activado</Badge> : <Badge variant="soft" size="sm">Desactivado</Badge>} />
        <Row label="Miembro desde"  value={new Date(user.createdAt).toLocaleDateString()} />
        {user.lastLoginAt && <Row label="Último acceso" value={new Date(user.lastLoginAt).toLocaleString()} />}
        <div style={{ marginTop: space[3] }}>
          <Button href="/mfa" variant="secondary" size="sm">Configurar MFA / passkey</Button>
        </div>
      </Section>

      <Section title={`Organizaciones (${memberships.length})`}>
        {memberships.length === 0 && <p style={{ color: cssVar.textMuted }}>No perteneces a ninguna organización todavía.</p>}
        {memberships.map((m) => (
          <div key={m.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${space[3]}px 0`, borderBottom: `1px solid ${cssVar.border}`,
          }}>
            <div>
              <div style={{ fontWeight: font.weight.bold, color: cssVar.text }}>{m.org?.name}</div>
              <div style={{ color: cssVar.textMuted, fontSize: font.size.sm, marginTop: 2 }}>
                <Badge variant="accent" size="sm" style={{ marginInlineEnd: space[2] }}>{m.role}</Badge>
                plan {m.org?.plan}
              </div>
            </div>
            {(m.role === "OWNER" || m.role === "ADMIN") && (
              <Button href="/admin" variant="ghost" size="sm">Admin →</Button>
            )}
          </div>
        ))}
      </Section>

      <Section title="Seguridad">
        <Button onClick={signOutAll} variant="secondary" size="sm">Cerrar sesión en todos los dispositivos</Button>
        <div style={{ marginTop: space[3] }}>
          <Link href="/settings/sessions" style={{ color: cssVar.accent, fontSize: font.size.sm, fontWeight: font.weight.semibold, textDecoration: "none" }}>
            Ver sesiones activas →
          </Link>
        </div>
      </Section>

      <Section title="Privacidad" last>
        <p style={{ margin: 0, color: cssVar.textDim, fontSize: font.size.sm, lineHeight: font.leading.normal }}>
          Puedes exportar tus datos en cualquier momento o solicitar la eliminación de tu cuenta
          (GDPR Art. 17). La eliminación inicia un periodo de gracia de 30 días.
        </p>
        <div style={{ display: "flex", gap: space[2], flexWrap: "wrap", marginTop: space[3] }}>
          <Button href="/api/v1/users/me/export" variant="secondary" size="sm">Exportar mis datos</Button>
          <Button onClick={requestDeletion} variant="danger" size="sm" disabled={deleting}>
            {deleting ? "Procesando…" : "Eliminar mi cuenta"}
          </Button>
        </div>
      </Section>

      {msg && <div style={{ marginTop: space[5] }}><Alert kind={msg.kind}>{msg.text}</Alert></div>}
    </AuthShell>
  );
}

function Section({ title, children, last }) {
  return (
    <section style={{
      padding: `${space[4]}px 0`,
      borderBottom: last ? undefined : `1px solid ${cssVar.border}`,
    }}>
      <h2 style={{
        margin: `0 0 ${space[3]}px`,
        fontSize: font.size.xs, fontWeight: font.weight.bold,
        color: cssVar.accent, textTransform: "uppercase", letterSpacing: font.tracking.caps,
      }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[4],
      padding: `${space[2]}px 0`, fontSize: font.size.md,
    }}>
      <span style={{ color: cssVar.textMuted }}>{label}</span>
      <span style={{ color: cssVar.text, fontWeight: font.weight.medium, display: "inline-flex", alignItems: "center", gap: space[2] }}>{value}</span>
    </div>
  );
}
