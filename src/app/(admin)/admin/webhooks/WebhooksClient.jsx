"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "@/components/ui/Toast";
import { DataTable } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import Drawer from "@/components/admin/Drawer";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
// Sprint 29 — delivery search v2 (operadores Stripe-style + chips)
import {
  parseDeliveryQuery, matchesDeliveryQuery, statusTone, summarizeDeliveries,
  DELIVERY_SEARCH_HINT_ES,
} from "@/lib/webhook-delivery-search";
// Sprint 30 — webhook event catalog (grouped + sample payloads)
import {
  WEBHOOK_EVENTS, groupByCategory, getEvent, groupLabel, serializeSample,
} from "@/lib/webhook-events";
import { BioGlyph } from "@/components/BioIgnicionMark";

const ALL_EVENTS = WEBHOOK_EVENTS.map((e) => e.id);
const EVENT_GROUPS = groupByCategory();

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
  // Sprint 29 — search v2 con operadores
  const [q, setQ] = useState("");

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

  // Sprint 29 — parsed query + filtered rows + summary chips
  const parsed = useMemo(() => parseDeliveryQuery(q), [q]);
  const filtered = useMemo(
    () => rows.filter((d) => matchesDeliveryQuery(d, parsed)),
    [rows, parsed]
  );
  const summary = useMemo(() => summarizeDeliveries(rows), [rows]);

  const TONE_VARIANT = {
    success: "success", warn: "warn", danger: "danger", soft: "soft", neutral: "neutral",
  };

  const columns = [
    { key: "event", label: "Evento", render: (d) => <code style={{ fontFamily: cssVar.fontMono, color: cssVar.accent, fontSize: font.size.sm }}>{d.event}</code> },
    {
      key: "status", label: "Status", width: 100,
      render: (d) => {
        const tone = statusTone(d);
        return (
          <Badge variant={TONE_VARIANT[tone] || "soft"} size="sm">
            {d.status ?? (d.error ? "ERR" : "—")}
          </Badge>
        );
      },
    },
    { key: "attempts", label: "Intentos", width: 80, render: (d) => <span style={{ fontFamily: cssVar.fontMono }}>{d.attempts}</span> },
    { key: "createdAt", label: "Creado", render: (d) => new Date(d.createdAt).toLocaleString() },
    { key: "deliveredAt", label: "Entregado", render: (d) => d.deliveredAt ? new Date(d.deliveredAt).toLocaleString() : "—" },
    { key: "error", label: "Error", render: (d) => d.error ? <span title={d.error} style={{ color: "var(--bi-danger)", maxWidth: 220, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.error.slice(0, 60)}</span> : "" },
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
    <Drawer
      open={!!hookId}
      onClose={onClose}
      width={720}
      title="Últimas entregas"
      footer={
        <>
          <Button variant="ghost" onClick={load}>Refrescar</Button>
          <Button variant="secondary" onClick={onClose}>Cerrar</Button>
        </>
      }
    >
      {/* Sprint 29 — toolbar con search + chips quick-filter */}
      <div style={{ display: "flex", gap: space[2], flexWrap: "wrap", marginBottom: space[3], alignItems: "center" }}>
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={DELIVERY_SEARCH_HINT_ES}
          style={{ flex: "1 1 280px", minWidth: 240 }}
        />
        <button
          type="button"
          onClick={() => setQ("has:failed")}
          style={chipBtn(q === "has:failed", "danger")}
        >
          Solo fallos · {summary.failed}
        </button>
        <button
          type="button"
          onClick={() => setQ("has:delivered")}
          style={chipBtn(q === "has:delivered", "success")}
        >
          Entregados · {summary.delivered}
        </button>
        {summary.pending > 0 && (
          <button
            type="button"
            onClick={() => setQ("attempts:>1 has:failed")}
            style={chipBtn(q === "attempts:>1 has:failed", "warn")}
          >
            Reintentando · {summary.pending}
          </button>
        )}
        {q && (
          <Button variant="ghost" size="sm" onClick={() => setQ("")}>Limpiar</Button>
        )}
      </div>
      <p style={{ margin: 0, marginBottom: space[2], fontSize: font.size.xs, color: cssVar.textMuted }}>
        Mostrando {filtered.length} de {rows.length} entregas
        {parsed.text || Object.keys(parsed.operators).length > 0 ? " (filtradas)" : ""}
      </p>
      <DataTable
        columns={columns}
        rows={filtered}
        loading={loading}
        skeletonRows={4}
        getKey={(d) => d.id}
        dense
        emptyTitle={q ? "Sin coincidencias" : "Sin entregas aún"}
        emptyDescription={q ? "Ajusta los filtros o limpia la búsqueda." : 'Prueba con "Test ping" para generar una.'}
      />
    </Drawer>
  );
}

function chipBtn(active, accent) {
  const colors = {
    success: { active: "#10B981", border: "#10B98155" },
    warn:    { active: "#F59E0B", border: "#F59E0B55" },
    danger:  { active: "#EF4444", border: "#EF444455" },
  };
  const c = colors[accent] || colors.warn;
  return {
    padding: `4px 10px`,
    borderRadius: 999,
    fontSize: 12,
    border: `1px solid ${active ? c.active : c.border}`,
    background: active ? c.active : "transparent",
    color: active ? "#fff" : "var(--bi-text)",
    cursor: "pointer",
    fontWeight: 600,
  };
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
    // Sprint 17 — rotation con overlap. Default 7d; admin puede override.
    const overlapStr = prompt(
      `Rotar secret de ${h.url}\n\n` +
      `Días de overlap (1-30, default 7): durante ese tiempo se firma con\n` +
      `AMBOS secrets para que actualices integraciones sin downtime.`,
      "7"
    );
    if (overlapStr === null) return; // cancelado
    const overlapDays = parseInt(overlapStr, 10) || 7;
    setRowBusy(`${h.id}:rotate`);
    try {
      const r = await fetch(`/api/v1/webhooks/${h.id}?action=rotate`, {
        method: "POST",
        headers: { "x-csrf-token": csrfHeader(), "content-type": "application/json" },
        body: JSON.stringify({ overlapDays }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setRevealed(j.secret);
      setHooks((s) => s.map((x) => x.id === h.id ? {
        ...x,
        secretTail: j.secret.slice(-4),
        hasPrevSecret: true,
        prevSecretExpiresAt: j.prevSecretExpiresAt,
        secretRotatedAt: new Date().toISOString(),
      } : x));
      toast.success(j.message || "Secret rotado");
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
          <div style={{ display: "grid", gap: space[3] }}>
            {Object.entries(EVENT_GROUPS).map(([group, list]) => (
              <div key={group}>
                <div style={{
                  fontSize: font.size.xs,
                  textTransform: "uppercase",
                  letterSpacing: font.tracking.wide,
                  color: cssVar.textDim,
                  fontWeight: font.weight.semibold,
                  marginBottom: space[1],
                }}>
                  {groupLabel(group)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: space[2] }}>
                  {list.map((ev) => (
                    <label key={ev.id} title={ev.description} style={{
                      display: "flex", alignItems: "flex-start", gap: space[2],
                      padding: `${space[2]}px ${space[3]}px`,
                      background: events.has(ev.id) ? cssVar.accentSoft : cssVar.surface,
                      border: `1px solid ${events.has(ev.id) ? cssVar.accent : cssVar.border}`,
                      borderRadius: radius.sm, cursor: "pointer",
                      transition: "background .12s ease, border-color .12s ease",
                    }}>
                      <input
                        type="checkbox"
                        checked={events.has(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        style={{ accentColor: "var(--bi-accent)", marginTop: 3 }}
                      />
                      <span style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                        <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>{ev.id}</code>
                        <span style={{ fontSize: font.size.xs, color: cssVar.textMuted, lineHeight: 1.3 }}>{ev.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
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
        <div className="bi-admin-empty">
          <span className="bi-admin-empty-glyph">
            <BioGlyph size={36} />
          </span>
          <div className="bi-admin-empty-title">Aún no fluyen eventos.</div>
          <div className="bi-admin-empty-body">
            Conecta tu primer endpoint y BIO-IGNICIÓN te enviará eventos firmados (HMAC-SHA256) en tiempo real.
          </div>
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
                  {h.hasPrevSecret && h.prevSecretExpiresAt && (() => {
                    const days = Math.max(0, Math.ceil((new Date(h.prevSecretExpiresAt).getTime() - Date.now()) / 86400_000));
                    return days > 0 ? (
                      <Badge variant="warn" size="sm" title={`Secret anterior expira el ${new Date(h.prevSecretExpiresAt).toLocaleString()}`}>
                        Rotando · {days}d
                      </Badge>
                    ) : null;
                  })()}
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

      <EventsCatalog />

      <RevealSecret secret={revealed} onClose={() => setRevealed(null)} />
      <DeliveriesDialog hookId={deliveriesFor} onClose={() => setDeliveriesFor(null)} />
    </>
  );
}

/* ── Sprint 30: Events catalog con sample payloads expandables ─── */
function EventsCatalog() {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  return (
    <section style={{
      marginTop: space[5],
      padding: space[4],
      background: cssVar.surface,
      border: `1px solid ${cssVar.border}`,
      borderRadius: radius.md,
    }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          all: "unset", cursor: "pointer", display: "flex", alignItems: "center",
          justifyContent: "space-between", width: "100%", gap: space[2],
        }}
      >
        <span>
          <span style={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text }}>
            Catálogo de eventos
          </span>
          <span style={{ marginInlineStart: space[2], fontSize: font.size.sm, color: cssVar.textMuted }}>
            {ALL_EVENTS.length} eventos disponibles · payloads de ejemplo para tu integración
          </span>
        </span>
        <span aria-hidden style={{ color: cssVar.textMuted, fontSize: font.size.sm }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div style={{ marginTop: space[3], display: "grid", gap: space[3] }}>
          {Object.entries(EVENT_GROUPS).map(([group, list]) => (
            <div key={group}>
              <div style={{
                fontSize: font.size.xs,
                textTransform: "uppercase",
                letterSpacing: font.tracking.wide,
                color: cssVar.textDim,
                fontWeight: font.weight.semibold,
                marginBottom: space[1],
              }}>
                {groupLabel(group)}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: space[1] }}>
                {list.map((ev) => {
                  const isExpanded = expandedId === ev.id;
                  return (
                    <li key={ev.id} style={{
                      border: `1px solid ${cssVar.border}`,
                      borderRadius: radius.sm,
                      background: cssVar.bg,
                    }}>
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : ev.id)}
                        aria-expanded={isExpanded}
                        style={{
                          all: "unset", cursor: "pointer", display: "flex",
                          alignItems: "center", justifyContent: "space-between",
                          gap: space[2], padding: `${space[2]}px ${space[3]}px`,
                          width: "100%", boxSizing: "border-box",
                        }}
                      >
                        <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0, flex: 1 }}>
                          <code style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>{ev.id}</code>
                          <span style={{ fontSize: font.size.xs, color: cssVar.textMuted }}>{ev.description}</span>
                        </span>
                        <Badge variant="soft" size="sm">{ev.since}</Badge>
                        <span aria-hidden style={{ color: cssVar.textMuted, fontSize: font.size.xs }}>
                          {isExpanded ? "▾" : "▸"}
                        </span>
                      </button>
                      {isExpanded && (
                        <pre style={{
                          margin: 0,
                          padding: space[3],
                          background: "var(--bi-surface-alt, #0a0a0a)",
                          borderTop: `1px solid ${cssVar.border}`,
                          color: cssVar.text,
                          fontFamily: cssVar.fontMono,
                          fontSize: font.size.xs,
                          overflowX: "auto",
                          borderRadius: `0 0 ${radius.sm}px ${radius.sm}px`,
                        }}>
                          {serializeSample(ev)}
                        </pre>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
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
