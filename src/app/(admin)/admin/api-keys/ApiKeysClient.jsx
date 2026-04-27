"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { DataTable } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  summarizeKey,
  formatLastUsed,
  describeQuota,
  validateExpiryDays,
  API_KEY_EXPIRY_MIN_DAYS,
  API_KEY_EXPIRY_MAX_DAYS,
} from "@/lib/api-quotas";

const ALL_SCOPES = [
  { id: "read:sessions",  label: "Leer sesiones" },
  { id: "write:sessions", label: "Escribir sesiones" },
  { id: "read:members",   label: "Leer miembros" },
  { id: "write:members",  label: "Escribir miembros" },
  { id: "read:analytics", label: "Leer analíticas (k-anon)" },
  { id: "read:audit",     label: "Leer audit log" },
  { id: "scim",           label: "SCIM (provisioning Okta/Azure AD)" },
];

const STATUS_VARIANT = {
  active: "success",
  expired: "warn",
  revoked: "danger",
  unknown: "soft",
};

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

export default function ApiKeysClient({ initial, plan = "FREE" }) {
  const [keys, setKeys] = useState(initial);
  const [name, setName] = useState("");
  const nameInputRef = useRef(null);
  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams?.get("action") === "create") {
      requestAnimationFrame(() => {
        nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        nameInputRef.current?.focus({ preventScroll: true });
      });
    }
  }, [searchParams]);
  const [scopes, setScopes] = useState(new Set(["read:sessions"]));
  const [expiresAtDays, setExpiresAtDays] = useState(""); // "" = sin expiry
  const [expiryError, setExpiryError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null); // "${id}:${action}"
  const [revealed, setRevealed] = useState(null);
  const quota = describeQuota(plan);

  function toggleScope(s) {
    setScopes((curr) => {
      const n = new Set(curr);
      if (n.has(s)) n.delete(s); else n.add(s);
      return n;
    });
  }

  async function create(e) {
    e.preventDefault();
    setExpiryError(null);
    if (!name.trim() || scopes.size === 0) return;
    const expiryV = validateExpiryDays(expiresAtDays === "" ? null : Number(expiresAtDays));
    if (!expiryV.ok) {
      setExpiryError(expiryV.error);
      toast.error("Días de expiración inválidos");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({
          name,
          scopes: [...scopes],
          expiresAtDays: expiryV.value,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setKeys((s) => [{
        id: j.id, name, prefix: j.prefix, scopes: j.scopes,
        createdAt: new Date().toISOString(),
        lastUsedAt: null, lastUsedIp: null,
        expiresAt: j.expiresAt || null,
        revokedAt: null,
      }, ...s]);
      setRevealed(j.token);
      setName("");
      setExpiresAtDays("");
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
    {
      key: "lastUsed", label: "Último uso", width: 200,
      render: (k) => {
        const f = formatLastUsed(k.lastUsedAt, k.lastUsedIp);
        if (f.tone === "neutral") return <span style={{ color: cssVar.textMuted }}>{f.text}</span>;
        return <span style={{ color: cssVar.text, fontSize: font.size.xs }}>{f.text}</span>;
      },
    },
    {
      key: "state", label: "Estado", width: 140,
      render: (k) => {
        const s = summarizeKey(k);
        return (
          <span title={s.detail}>
            <Badge variant={STATUS_VARIANT[s.status] || "soft"} size="sm">
              {s.label}
            </Badge>
            {s.daysUntilExpiry !== undefined && s.daysUntilExpiry <= 7 && (
              <span style={{ marginInlineStart: space[1], fontSize: font.size.xs, color: "var(--bi-danger)" }}>
                {s.daysUntilExpiry}d
              </span>
            )}
          </span>
        );
      },
    },
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
      <Alert kind="info" style={{ marginBottom: space[4] }}>
        <strong>Quota plan {plan}:</strong> {quota.text}. Las quotas son por org (suma de todas las keys); upgrade a planes superiores para más throughput.
      </Alert>

      <form
        onSubmit={create}
        style={{
          display: "grid", gap: space[3],
          padding: space[4], marginBottom: space[4],
          background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
        }}
      >
        <div style={{ display: "grid", gridTemplateColumns: "1fr 200px", gap: space[3] }}>
          <label>
            <span style={labelStyle}>Nombre</span>
            <Input ref={nameInputRef} value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Zapier prod" required maxLength={80} />
          </label>
          <label>
            <span style={labelStyle}>Expira en (días, opcional)</span>
            <Input
              type="number"
              min={API_KEY_EXPIRY_MIN_DAYS}
              max={API_KEY_EXPIRY_MAX_DAYS}
              step={1}
              value={expiresAtDays}
              onChange={(e) => { setExpiresAtDays(e.target.value); setExpiryError(null); }}
              placeholder="Sin expiry"
            />
            {expiryError && (
              <span style={{ fontSize: font.size.xs, color: "var(--bi-danger)" }}>
                {expiryError === "too_small" ? `Mínimo ${API_KEY_EXPIRY_MIN_DAYS} día` :
                 expiryError === "too_large" ? `Máximo ${API_KEY_EXPIRY_MAX_DAYS} días` :
                 expiryError === "not_integer" ? "Debe ser entero" : expiryError}
              </span>
            )}
          </label>
        </div>
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
