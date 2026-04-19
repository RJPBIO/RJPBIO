"use client";
import { useEffect, useState } from "react";
import { toast } from "@/components/ui/Toast";
import { DataTable } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const ALL_EVENTS = [
  "session.completed", "session.started",
  "member.added", "member.removed",
  "station.tap", "billing.overage",
];

function csrfHeader() {
  const c = document.cookie.split("; ").find((r) => r.startsWith("bio-csrf="));
  return c ? decodeURIComponent(c.split("=")[1]) : "";
}

function RevealSecret({ secret, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  }
  return (
    <Dialog
      open={!!secret}
      onClose={onClose}
      size="lg"
      title="Secret HMAC"
      description="Úsalo para verificar la cabecera webhook-signature. No se vuelve a mostrar completo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Ya lo guardé</Button>
          <Button variant="primary" onClick={copy}>{copied ? "¡Copiado!" : "Copiar"}</Button>
        </>
      }
    >
      <Alert kind="warn">El secret no se guarda en claro. Si lo pierdes, rótalo.</Alert>
      <pre style={{
        marginTop: space[4], padding: space[4],
        background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.sm,
        fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.accent,
        wordBreak: "break-all", whiteSpace: "pre-wrap",
      }}>{secret}</pre>
    </Dialog>
  );
}

function DeliveriesDialog({ hookId, onClose }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/webhooks/${hookId}/deliveries`);
      const j = await r.json();
      setRows(j.data || []);
    } finally { setLoading(false); }
  }

  useEffect(() => { if (hookId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [hookId]);

  async function retry(did) {
    setRetrying(did);
    try {
      const r = await fetch(`/api/v1/webhooks/${hookId}/deliveries?action=retry&did=${did}`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "Error");
      toast.success("Reintento encolado");
      setTimeout(load, 800);
    } catch (e) { toast.error(e.message); }
    finally { setRetrying(null); }
  }

  const columns = [
    { key: "event", label: "Evento", render: (d) => <code style={{ fontFamily: cssVar.fontMono, color: cssVar.accent, fontSize: font.size.sm }}>{d.event}</code> },
    {
      key: "status", label: "Status", width: 90,
      render: (d) => {
        if (!d.status) return <Badge variant="soft" size="sm">—</Badge>;
        const ok = d.status >= 200 && d.status < 300;
        return <Badge variant={ok ? "success" : "danger"} size="sm">{d.status}</Badge>;
      },
    },
    { key: "attempts", label: "Intentos", width: 80, render: (d) => <span style={{ fontFamily: cssVar.fontMono }}>{d.attempts}</span> },
    { key: "createdAt", label: "Creado", render: (d) => new Date(d.createdAt).toLocaleString() },
    { key: "deliveredAt", label: "Entregado", render: (d) => d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—" },
    { key: "error", label: "Error", render: (d) => d.error ? <span title={d.error} style={{ color: cssVar.danger, maxWidth: 220, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.error.slice(0, 60)}</span> : "" },
    {
      key: "__actions", label: "", align: "right", width: 120,
      render: (d) => !d.deliveredAt && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => retry(d.id)}
          loading={retrying === d.id}
          loadingLabel="Reintentando…"
        >
          Reintentar
        </Button>
      ),
    },
  ];

  return (
    <Dialog
      open={!!hookId}
      onClose={onClose}
      size="lg"
      title="Últimas entregas"
      footer={
        <>
          <Button variant="ghost" onClick={load}>Refrescar</Button>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </>
      }
    >
      <DataTable
        columns={columns}
        rows={rows}
        loading={loading}
        skeletonRows={4}
        getKey={(d) => d.id}
        dense
        emptyTitle="Sin entregas aún"
        emptyDescription='Prueba con "Test ping" para generar una.'
      />
    </Dialog>
  );
}

function isValidHttpsUrl(u) {
  try {
    const p = new URL(u);
    return p.protocol === "https:" || p.protocol === "http:";
  } catch { return false; }
}

export default function WebhooksClient({ initial }) {
  const [hooks, setHooks] = useState(initial);
  const [url, setUrl] = useState("");
  const [urlTouched, setUrlTouched] = useState(false);
  const [events, setEvents] = useState(new Set(["session.completed"]));
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null); // "${id}:${action}"
  const [revealed, setRevealed] = useState(null);
  const [deliveriesFor, setDeliveriesFor] = useState(null);

  const urlError = urlTouched && url && !isValidHttpsUrl(url)
    ? "Debe ser una URL completa (https://…)"
    : null;

  function toggleEvent(e) {
    setEvents((c) => { const n = new Set(c); n.has(e) ? n.delete(e) : n.add(e); return n; });
  }

  async function create(e) {
    e.preventDefault();
    if (!isValidHttpsUrl(url)) { setUrlTouched(true); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ url, events: [...events] }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setHooks((s) => [{ id: j.id, url: j.url, events: j.events, active: j.active, secretTail: j.secret.slice(-4), createdAt: new Date().toISOString() }, ...s]);
      setRevealed(j.secret);
      setUrl("");
      setUrlTouched(false);
      toast.success("Webhook creado");
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  }

  async function toggle(h) {
    if (h.active && !confirm(`Pausar ${h.url}? Los eventos dejarán de entregarse hasta reactivarlo.`)) return;
    setRowBusy(`${h.id}:toggle`);
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", "x-csrf-token": csrfHeader() },
        body: JSON.stringify({ active: !h.active }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setHooks((s) => s.map((x) => x.id === h.id ? { ...x, active: j.active } : x));
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

  async function rotate(h) {
    if (!confirm(`Rotar secret de ${h.url}? La firma vieja deja de validar.`)) return;
    setRowBusy(`${h.id}:rotate`);
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}?action=rotate`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setRevealed(j.secret);
      setHooks((s) => s.map((x) => x.id === h.id ? { ...x, secretTail: j.secret.slice(-4) } : x));
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

  async function testPing(h) {
    setRowBusy(`${h.id}:test`);
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}?action=test`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      toast.success("Ping enviado — revisa entregas");
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

  async function remove(h) {
    if (!confirm(`Eliminar webhook ${h.url}?`)) return;
    setRowBusy(`${h.id}:delete`);
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrfHeader() },
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Error"); }
      setHooks((s) => s.filter((x) => x.id !== h.id));
      toast.success("Webhook eliminado");
    } catch (err) { toast.error(err.message); }
    finally { setRowBusy(null); }
  }

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
          <span style={labelStyle}>URL del endpoint</span>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onBlur={() => setUrlTouched(true)}
            type="url"
            placeholder="https://tu-endpoint.com/hook"
            required
            aria-invalid={urlError ? true : undefined}
            aria-describedby={urlError ? "webhook-url-error" : undefined}
          />
          {urlError && (
            <span
              id="webhook-url-error"
              role="alert"
              style={{ display: "block", marginTop: space[1], fontSize: font.size.sm, color: cssVar.danger }}
            >
              {urlError}
            </span>
          )}
        </label>
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ ...labelStyle, padding: 0, marginBottom: space[2] }}>Eventos</legend>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: space[2] }}>
            {ALL_EVENTS.map((e) => (
              <label key={e} style={{
                display: "flex", alignItems: "center", gap: space[2],
                padding: `${space[2]}px ${space[3]}px`,
                background: events.has(e) ? cssVar.accentSoft : cssVar.surface,
                border: `1px solid ${events.has(e) ? cssVar.accent : cssVar.border}`,
                borderRadius: radius.sm, cursor: "pointer",
                transition: "background .12s ease, border-color .12s ease",
              }}>
                <input type="checkbox" checked={events.has(e)} onChange={() => toggleEvent(e)} style={{ accentColor: "var(--bi-accent)" }} />
                <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>{e}</code>
              </label>
            ))}
          </div>
        </fieldset>
        <Button
          type="submit"
          variant="primary"
          loading={busy}
          loadingLabel="Creando…"
          disabled={!url || events.size === 0 || !!urlError}
          style={{ justifySelf: "start" }}
        >
          Crear webhook
        </Button>
      </form>

      {hooks.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>Sin webhooks</div>
          <div style={{ fontSize: font.size.sm, color: cssVar.textMuted, marginTop: space[1] }}>Crea el primero con el formulario de arriba.</div>
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[2] }}>
          {hooks.map((h) => {
            const anyBusy = rowBusy?.startsWith(`${h.id}:`);
            const busyKey = anyBusy ? rowBusy.split(":")[1] : null;
            const otherBusy = (k) => anyBusy && busyKey !== k;
            return (
              <li key={h.id} style={{
                padding: space[4],
                background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: space[2], alignItems: "center" }}>
                  <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, wordBreak: "break-all", color: cssVar.text }}>{h.url}</span>
                  <Badge variant={h.active ? "success" : "warn"} size="sm">{h.active ? "Activo" : "Pausado"}</Badge>
                </div>
                <div style={{ marginTop: space[2], display: "flex", flexWrap: "wrap", gap: space[1] }}>
                  {(h.events || []).map((e) => <Badge key={e} variant="soft" size="sm">{e}</Badge>)}
                  <Badge variant="neutral" size="sm">secret …{h.secretTail}</Badge>
                </div>
                <div style={{ marginTop: space[3], display: "flex", gap: space[1], flexWrap: "wrap" }}>
                  <Button size="sm" variant="ghost" onClick={() => toggle(h)}   loading={busyKey === "toggle"} disabled={otherBusy("toggle")}>{h.active ? "Pausar" : "Reactivar"}</Button>
                  <Button size="sm" variant="ghost" onClick={() => testPing(h)} loading={busyKey === "test"}   disabled={otherBusy("test")}>Test ping</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeliveriesFor(h.id)} disabled={anyBusy}>Ver entregas</Button>
                  <Button size="sm" variant="ghost" onClick={() => rotate(h)}   loading={busyKey === "rotate"} disabled={otherBusy("rotate")}>Rotar secret</Button>
                  <Button size="sm" variant="danger" onClick={() => remove(h)}  loading={busyKey === "delete"} disabled={otherBusy("delete")}>Eliminar</Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <RevealSecret secret={revealed} onClose={() => setRevealed(null)} />
      <DeliveriesDialog hookId={deliveriesFor} onClose={() => setDeliveriesFor(null)} />
    </>
  );
}

const labelStyle = {
  display: "block", fontSize: 12, color: "var(--bi-text-dim)",
  fontWeight: 600, marginBottom: 4,
};
const emptyStyle = {
  padding: "40px 20px", textAlign: "center",
  background: "var(--bi-surface)",
  border: `1px solid var(--bi-border)`,
  borderRadius: 12, color: "var(--bi-text-muted)",
};
