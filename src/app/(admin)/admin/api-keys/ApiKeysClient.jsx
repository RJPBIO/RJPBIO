"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";
import { DataTable } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const ALL_SCOPES = [
  { id: "read:sessions",  label: "Leer sesiones" },
  { id: "write:sessions", label: "Escribir sesiones" },
  { id: "read:members",   label: "Leer miembros" },
  { id: "write:members",  label: "Escribir miembros" },
  { id: "read:analytics", label: "Leer analíticas (k-anon)" },
  { id: "read:audit",     label: "Leer audit log" },
];

function csrfHeader() {
  const c = document.cookie.split("; ").find((r) => r.startsWith("bio-csrf="));
  return c ? decodeURIComponent(c.split("=")[1]) : "";
}

function Reveal({ token, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(token); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.error("No se pudo copiar"); }
  }
  return (
    <Dialog
      open={!!token}
      onClose={onClose}
      size="lg"
      title="Guarda esta clave"
      description="Solo se muestra una vez — no la volverás a ver."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ya la guardé</Button>
          <Button variant="primary" onClick={copy}>{copied ? "¡Copiado!" : "Copiar"}</Button>
        </>
      }
    >
      <Alert kind="warn" title="Sin backup en servidor">
        Bio-Ignición no almacena la clave en claro. Si la pierdes, tendrás que rotarla.
      </Alert>
      <pre style={{
        marginTop: space[4], padding: space[4],
        background: cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.sm,
        fontFamily: cssVar.fontMono, fontSize: font.size.sm,
        color: cssVar.accent,
        wordBreak: "break-all", whiteSpace: "pre-wrap",
        margin: `${space[4]}px 0 0`,
      }}>
        {token}
      </pre>
    </Dialog>
  );
}

export default function ApiKeysClient({ initial }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState(new Set(["read:sessions"]));
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null); // "${id}:${action}"
  const [revealed, setRevealed] = useState(null);

  function toggleScope(s) {
    setScopes((curr) => {
      const n = new Set(curr);
      if (n.has(s)) n.delete(s); else n.add(s);
      return n;
    });
  }

  async function create(e) {
    e.preventDefault();
    if (!name.trim() || scopes.size === 0) return;
    setBusy(true);
    try {
      const r = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ name, scopes: [...scopes] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setKeys((s) => [{ id: j.id, name, prefix: j.prefix, scopes: j.scopes, createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null }, ...s]);
      setRevealed(j.token);
      setName("");
      toast.success("API key creada");
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function rotate(k) {
    if (!confirm(`Rotar "${k.name}"? La clave actual quedará revocada inmediatamente.`)) return;
    setRowBusy(`${k.id}:rotate`);
    try {
      const r = await fetch(`/api/v1/api-keys/${k.id}?action=rotate`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setKeys((s) => [
        { id: j.id, name: k.name + "·rot", prefix: j.prefix, scopes: j.scopes, createdAt: new Date().toISOString(), lastUsedAt: null, revokedAt: null },
        ...s.map((x) => x.id === k.id ? { ...x, revokedAt: new Date().toISOString() } : x),
      ]);
      setRevealed(j.token);
      toast.success("Clave rotada");
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

  async function revoke(k) {
    if (!confirm(`Revocar "${k.name}"? Cualquier integración que la use dejará de funcionar.`)) return;
    setRowBusy(`${k.id}:revoke`);
    try {
      const r = await fetch(`/api/v1/api-keys/${k.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      setKeys((s) => s.map((x) => x.id === k.id ? { ...x, revokedAt: new Date().toISOString() } : x));
      toast.success("Clave revocada");
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

  const columns = [
    { key: "name",   label: "Nombre", render: (k) => <span style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>{k.name}</span> },
    { key: "prefix", label: "Prefix", width: 130, render: (k) => <code style={{ fontFamily: cssVar.fontMono, color: cssVar.textMuted, fontSize: font.size.sm }}>{k.prefix}…</code> },
    {
      key: "scopes", label: "Scopes",
      render: (k) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: space[1] }}>
          {(k.scopes || []).map((s) => <Badge key={s} variant="soft" size="sm">{s}</Badge>)}
        </div>
      ),
    },
    { key: "createdAt", label: "Creada", width: 120, render: (k) => new Date(k.createdAt).toLocaleDateString() },
    { key: "lastUsedAt", label: "Último uso", width: 160, render: (k) => k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : <span style={{ color: cssVar.textMuted }}>nunca</span> },
    { key: "state", label: "Estado", width: 110, render: (k) => k.revokedAt ? <Badge variant="danger" size="sm">Revocada</Badge> : <Badge variant="success" size="sm">Activa</Badge> },
    {
      key: "__actions", label: "", align: "right", width: 170,
      render: (k) => {
        if (k.revokedAt) return null;
        const rotating = rowBusy === `${k.id}:rotate`;
        const revoking = rowBusy === `${k.id}:revoke`;
        const otherBusy = rowBusy && !rowBusy.startsWith(`${k.id}:`);
        return (
          <span style={{ display: "inline-flex", gap: space[1] }}>
            <Button size="sm" variant="ghost"  onClick={() => rotate(k)} loading={rotating} disabled={otherBusy || revoking}>Rotar</Button>
            <Button size="sm" variant="danger" onClick={() => revoke(k)} loading={revoking} disabled={otherBusy || rotating}>Revocar</Button>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <form
        onSubmit={create}
        style={{
          display: "grid", gap: space[3],
          padding: space[4], marginBottom: space[4],
          background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
        }}
      >
        <label>
          <span style={labelStyle}>Nombre</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Zapier prod" required maxLength={80} />
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ ...labelStyle, padding: 0, marginBottom: space[2] }}>Permisos (scopes)</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: space[2] }}>
            {ALL_SCOPES.map((s) => (
              <label key={s.id} style={{
                display: "flex", alignItems: "center", gap: space[2],
                padding: `${space[2]}px ${space[3]}px`,
                background: scopes.has(s.id) ? cssVar.accentSoft : cssVar.surface,
                border: `1px solid ${scopes.has(s.id) ? cssVar.accent : cssVar.border}`,
                borderRadius: radius.sm,
                fontSize: font.size.sm, color: cssVar.text, cursor: "pointer",
                transition: "background .12s ease, border-color .12s ease",
              }}>
                <input type="checkbox" checked={scopes.has(s.id)} onChange={() => toggleScope(s.id)} style={{ accentColor: "var(--bi-accent)" }} />
                <span>{s.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          loadingLabel="Creando…"
          disabled={!name.trim() || scopes.size === 0}
          style={{ justifySelf: "start" }}
        >
          Crear clave
        </Button>
      </form>

      <DataTable
        columns={columns}
        rows={keys}
        getKey={(k) => k.id}
        emptyTitle="Sin API keys"
        emptyDescription="Crea la primera con el formulario de arriba. Solo se muestra la clave una vez; guárdala en tu gestor de secretos."
      />

      <Reveal token={revealed} onClose={() => setRevealed(null)} />
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, color: "var(--bi-text-dim)",
  fontWeight: 600, marginBottom: 4,
};
