"use client";
import { useState, useCallback, useMemo } from "react";
import { fmtDate } from "@/lib/i18n";
import { toast } from "@/components/ui/Toast";
import { DataTable, TableToolbar } from "@/components/ui/Table";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const POLICIES = [
  { v: "ENTRY_EXIT",   l: "Entrada + Salida (recomendado)" },
  { v: "ANY",          l: "Cualquier horario" },
  { v: "MORNING_ONLY", l: "Solo mañana" },
  { v: "EVENING_ONLY", l: "Solo tarde" },
];

function csrfHeaders() {
  if (typeof document === "undefined") return {};
  const m = document.cookie.match(/(?:^|; )bio-csrf=([^;]+)/);
  return m ? { "x-csrf-token": decodeURIComponent(m[1]) } : {};
}

export default function StationsClient({ orgId, origin, initial }) {
  const [rows, setRows] = useState(initial || []);
  const [draft, setDraft] = useState({ label: "", location: "", policy: "ENTRY_EXIT" });
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState(null); // "${id}:${action}"
  const [reveal, setReveal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("ALL");
  const [policyF, setPolicyF] = useState("ALL");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusF === "ACTIVE" && !s.active) return false;
      if (statusF === "INACTIVE" && s.active) return false;
      if (policyF !== "ALL" && s.policy !== policyF) return false;
      if (!needle) return true;
      return (s.label || "").toLowerCase().includes(needle) || (s.location || "").toLowerCase().includes(needle);
    });
  }, [rows, q, statusF, policyF]);

  const create = useCallback(async (e) => {
    e.preventDefault();
    if (!draft.label.trim()) return;
    setBusy(true);
    try {
      const r = await fetch("/api/v1/stations", {
        method: "POST",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ orgId, ...draft }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "error");
      setRows((x) => [{ ...j.data, lastTapAt: null }, ...x]);
      setReveal({ id: j.data.id, label: j.data.label, tapUrl: j.tapUrl, rotated: false });
      setDraft({ label: "", location: "", policy: "ENTRY_EXIT" });
      toast.success("Estación creada");
    } catch (err) {
      toast.error("No se pudo crear: " + err.message);
    } finally {
      setBusy(false);
    }
  }, [draft, orgId]);

  const toggleActive = useCallback(async (id, active) => {
    if (active && !confirm("Desactivar la estación impedirá nuevos taps hasta reactivarla. ¿Continuar?")) return;
    setRowBusy(`${id}:toggle`);
    try {
      const r = await fetch(`/api/v1/stations/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json", ...csrfHeaders() },
        body: JSON.stringify({ active: !active }),
      });
      if (r.ok) {
        setRows((x) => x.map((s) => s.id === id ? { ...s, active: !active } : s));
        toast.success(active ? "Estación desactivada" : "Estación activada");
      } else {
        toast.error("No se pudo actualizar");
      }
    } finally { setRowBusy(null); }
  }, []);

  const rotate = useCallback(async (id) => {
    if (!confirm("Rotar clave invalidará los tags impresos. ¿Continuar?")) return;
    setRowBusy(`${id}:rotate`);
    try {
      const r = await fetch(`/api/v1/stations/${id}?action=rotate`, { method: "POST", headers: csrfHeaders() });
      const j = await r.json();
      if (r.ok) {
        setReveal({ id, label: rows.find((s) => s.id === id)?.label || "", tapUrl: j.tapUrl, rotated: true });
        toast.success("Clave rotada");
      } else {
        toast.error("Falló: " + j.error);
      }
    } finally { setRowBusy(null); }
  }, [rows]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(reveal.tapUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { toast.error("No se pudo copiar"); }
  }

  const columns = [
    {
      key: "label", label: "Etiqueta",
      render: (s) => <span style={{ fontWeight: font.weight.semibold, color: cssVar.text }}>{s.label}</span>,
    },
    {
      key: "location", label: "Ubicación",
      render: (s) => s.location || <span style={{ color: cssVar.textMuted }}>—</span>,
    },
    {
      key: "policy", label: "Política", width: 180,
      render: (s) => <Badge variant="soft" size="sm">{s.policy}</Badge>,
    },
    {
      key: "active", label: "Estado", width: 110,
      render: (s) => s.active
        ? <Badge variant="success" size="sm">Activa</Badge>
        : <Badge variant="danger" size="sm">Inactiva</Badge>,
    },
    {
      key: "lastTapAt", label: "Último tap", width: 170,
      render: (s) => s.lastTapAt
        ? <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm }}>{fmtDate(s.lastTapAt, { dateStyle: "short", timeStyle: "short" })}</span>
        : <span style={{ color: cssVar.textMuted }}>—</span>,
    },
    {
      key: "__actions", label: "", align: "right", width: 200,
      render: (s) => {
        const anyBusy = rowBusy?.startsWith(`${s.id}:`);
        return (
          <span style={{ display: "inline-flex", gap: space[1] }}>
            <Button
              size="sm" variant="ghost"
              onClick={() => toggleActive(s.id, s.active)}
              loading={rowBusy === `${s.id}:toggle`}
              disabled={anyBusy && rowBusy !== `${s.id}:toggle`}
            >
              {s.active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              size="sm" variant="ghost"
              onClick={() => rotate(s.id)}
              loading={rowBusy === `${s.id}:rotate`}
              disabled={anyBusy && rowBusy !== `${s.id}:rotate`}
            >
              Rotar
            </Button>
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <header style={{ marginBottom: space[4] }}>
        <h1 style={{
          margin: 0,
          fontSize: font.size["2xl"],
          fontWeight: font.weight.black,
          letterSpacing: font.tracking.tight,
          color: cssVar.text,
        }}>
          Estaciones · Tap-to-Ignite
        </h1>
        <p style={{
          margin: `${space[1]}px 0 0`,
          color: cssVar.textMuted,
          fontSize: font.size.sm,
          lineHeight: 1.5,
        }}>
          Cada estación genera una URL firmada para imprimir en QR o grabar en NFC.
          Los empleados tapean para iniciar sesión en 1 segundo.
        </p>
      </header>

      <form
        onSubmit={create}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: space[2],
          padding: space[4],
          marginBottom: space[4],
          background: cssVar.surface2,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.md,
          alignItems: "end",
        }}
      >
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Etiqueta</span>
          <Input
            placeholder="ej. Recepción piso 3"
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            required
            maxLength={80}
          />
        </label>
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Ubicación (opcional)</span>
          <Input
            placeholder="Piso / sala"
            value={draft.location}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            maxLength={120}
          />
        </label>
        <label style={{ display: "block" }}>
          <span style={labelStyle}>Política</span>
          <Select
            value={draft.policy}
            onChange={(e) => setDraft({ ...draft, policy: e.target.value })}
          >
            {POLICIES.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
          </Select>
        </label>
        <Button type="submit" variant="primary" loading={busy} loadingLabel="Creando…">
          Crear estación
        </Button>
      </form>

      {rows.length > 0 && (
        <TableToolbar>
          <div style={{ flex: "1 1 240px", minWidth: 200 }}>
            <Input
              type="search"
              value={q}
              placeholder="Buscar etiqueta o ubicación…"
              onChange={(e) => setQ(e.target.value)}
              aria-label="Buscar estaciones"
            />
          </div>
          <div style={{ minWidth: 140 }}>
            <Select value={statusF} onChange={(e) => setStatusF(e.target.value)} aria-label="Filtrar por estado">
              <option value="ALL">Todas</option>
              <option value="ACTIVE">Activas</option>
              <option value="INACTIVE">Inactivas</option>
            </Select>
          </div>
          <div style={{ minWidth: 180 }}>
            <Select value={policyF} onChange={(e) => setPolicyF(e.target.value)} aria-label="Filtrar por política">
              <option value="ALL">Cualquier política</option>
              {POLICIES.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
            </Select>
          </div>
          {(q || statusF !== "ALL" || policyF !== "ALL") && (
            <span style={{ color: cssVar.textDim, fontSize: font.size.sm }}>
              {filtered.length} de {rows.length}
            </span>
          )}
        </TableToolbar>
      )}

      <DataTable
        columns={columns}
        rows={filtered}
        getKey={(s) => s.id}
        emptyTitle={(q || statusF !== "ALL" || policyF !== "ALL") ? "Sin coincidencias" : "Sin estaciones todavía"}
        emptyDescription={(q || statusF !== "ALL" || policyF !== "ALL") ? "Ajusta los filtros para ver resultados." : "Crea la primera con el formulario de arriba."}
      />

      <details style={{
        marginTop: space[5],
        padding: space[4],
        background: cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        fontSize: font.size.sm,
        color: cssVar.textMuted,
      }}>
        <summary style={{
          cursor: "pointer",
          fontWeight: font.weight.semibold,
          color: cssVar.text,
        }}>
          ¿Cómo desplegarlas?
        </summary>
        <ol style={{ lineHeight: 1.7, marginTop: space[2], paddingInlineStart: space[5] }}>
          <li>Crea una estación por área física (recepción, escritorio, sala, cocina).</li>
          <li>Copia la URL o escanea el QR generado.</li>
          <li>
            Imprime el QR en adhesivo laminado <b>o</b> graba en un tag NFC NDEF tipo URL
            (NTAG213/215 funcionan perfecto).
          </li>
          <li>
            Pégala en el punto físico. El empleado tapea con su celular → se abre la PWA y corre la sesión
            prescrita sin pedir login. 0 fricción.
          </li>
          <li>
            La política <b>Entrada + Salida</b> activa solo en ventanas 05–11 y 16–22 hora local; fuera
            de esas ventanas no cuenta como sesión obligatoria (pero sí como voluntaria).
          </li>
        </ol>
      </details>

      <Dialog
        open={!!reveal}
        onClose={() => { setReveal(null); setCopied(false); }}
        size="lg"
        title={reveal?.rotated ? "Clave rotada" : "Estación creada"}
        description={reveal ? `${reveal.label} — imprime o graba esta URL` : ""}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setReveal(null); setCopied(false); }}>Cerrar</Button>
            <Button variant="primary" onClick={copyUrl}>{copied ? "¡Copiado!" : "Copiar URL"}</Button>
          </>
        }
      >
        <Alert kind="warn" title="URL única">
          Esta URL no se vuelve a mostrar. Si la pierdes, rota la clave y re-imprime los tags.
          Para el QR, genera el código con una herramienta offline (evita servicios web: la URL es una credencial firmada).
        </Alert>
        {reveal && (
          <pre style={{
            marginTop: space[4],
            padding: space[4],
            background: cssVar.surface2,
            border: `1px solid ${cssVar.border}`,
            borderRadius: radius.sm,
            fontFamily: cssVar.fontMono,
            fontSize: font.size.sm,
            color: cssVar.accent,
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
            margin: `${space[4]}px 0 0`,
          }}>
            {reveal.tapUrl}
          </pre>
        )}
      </Dialog>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 12,
  color: "var(--bi-text-dim)",
  fontWeight: 600,
  marginBottom: 4,
};
