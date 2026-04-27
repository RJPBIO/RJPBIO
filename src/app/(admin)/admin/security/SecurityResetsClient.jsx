"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";
import { DataTable } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const SECURITY_NAV = [
  { href: "/admin/security/policies", label: "Políticas" },
  { href: "/admin/security/sessions", label: "Sesiones" },
  { href: "/admin/security", label: "Reset MFA" },
];

const STATUS_VARIANT = { pending: "warn", approved: "success", rejected: "soft" };

function shortUA(ua) {
  if (!ua) return "—";
  const s = String(ua);
  if (s.length <= 64) return s;
  return `${s.slice(0, 60)}…`;
}

function fmtDT(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function fmtAge(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export default function SecurityResetsClient({ pending = [], resolved = [] }) {
  const [pendingRows, setPendingRows] = useState(pending);
  const [resolvedRows, setResolvedRows] = useState(resolved);
  const [openId, setOpenId] = useState(null);
  const [note, setNote] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function resolve(id, action) {
    const ok = action === "approved"
      ? confirm("¿Aprobar reset de MFA? Se borrará el secreto TOTP, los códigos de respaldo y todos los dispositivos de confianza. Se cerrarán todas las sesiones activas del usuario.")
      : confirm("¿Denegar esta solicitud? El usuario recibirá un correo con tu mensaje si incluiste uno.");
    if (!ok) return;
    setBusyId(id);
    try {
      const r = await fetch(`/api/v1/mfa-reset-request/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note || undefined }),
      });
      if (!r.ok) throw new Error(await r.text());

      const target = pendingRows.find((x) => x.id === id);
      setPendingRows((list) => list.filter((x) => x.id !== id));
      if (target) {
        setResolvedRows((list) => [{
          ...target,
          status: action,
          resolvedAt: new Date().toISOString(),
          resolverEmail: "tú",
        }, ...list].slice(0, 50));
      }
      setOpenId(null);
      setNote("");
      toast.success(action === "approved" ? "Reset aplicado y usuario notificado." : "Solicitud denegada.");
    } catch (e) {
      toast.error(e?.message || "No se pudo procesar.");
    } finally {
      setBusyId(null);
    }
  }

  const pendingColumns = [
    {
      key: "user", label: "Usuario", render: (r) => (
        <div>
          <div style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text, fontWeight: font.weight.semibold }}>
            {r.userEmail}
          </div>
          {r.userName && (
            <div style={{ fontSize: font.size.xs, color: cssVar.textMuted, marginBlockStart: 2 }}>{r.userName}</div>
          )}
        </div>
      ),
    },
    {
      key: "mfa", label: "MFA", width: 100, render: (r) =>
        r.mfaEnabled ? <Badge variant="success" size="sm">activo</Badge> : <Badge variant="soft" size="sm">inactivo</Badge>,
    },
    {
      key: "reason", label: "Contexto", render: (r) => (
        <span style={{ color: cssVar.textDim, fontSize: font.size.sm, lineHeight: 1.4 }}>
          {r.reason || <span style={{ color: cssVar.textMuted, fontStyle: "italic" }}>Sin contexto</span>}
        </span>
      ),
    },
    {
      key: "meta", label: "Origen", width: 220, render: (r) => (
        <div style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted, lineHeight: 1.5 }}>
          <div>{r.ip || "ip desconocida"}</div>
          <div title={r.userAgent || ""}>{shortUA(r.userAgent)}</div>
        </div>
      ),
    },
    {
      key: "createdAt", label: "Recibida", width: 140, render: (r) => (
        <div>
          <div style={{ fontSize: font.size.sm, color: cssVar.text }}>{fmtAge(r.createdAt)}</div>
          <div style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted }}>{fmtDT(r.createdAt)}</div>
        </div>
      ),
    },
    {
      key: "actions", label: "", width: 260, render: (r) => {
        const isOpen = openId === r.id;
        if (!isOpen) {
          return (
            <div style={{ display: "flex", gap: space[2], justifyContent: "flex-end" }}>
              <Button size="sm" variant="ghost" onClick={() => { setOpenId(r.id); setNote(""); }}>
                Revisar
              </Button>
            </div>
          );
        }
        return (
          <div style={{ display: "grid", gap: space[2] }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              rows={2}
              placeholder="Nota (opcional, se incluye si deniegas)"
              style={{
                width: "100%", padding: `${space[2]}px ${space[3]}px`,
                background: cssVar.bg, color: cssVar.text,
                border: `1px solid ${cssVar.border}`, borderRadius: radius.sm,
                fontSize: font.size.sm, fontFamily: "inherit", resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: space[2], justifyContent: "flex-end" }}>
              <Button size="sm" variant="ghost" onClick={() => { setOpenId(null); setNote(""); }} disabled={busyId === r.id}>
                Cerrar
              </Button>
              <Button size="sm" variant="danger" onClick={() => resolve(r.id, "rejected")} loading={busyId === r.id}>
                Denegar
              </Button>
              <Button size="sm" variant="primary" onClick={() => resolve(r.id, "approved")} loading={busyId === r.id}>
                Aprobar
              </Button>
            </div>
          </div>
        );
      },
    },
  ];

  const resolvedColumns = [
    {
      key: "user", label: "Usuario", render: (r) => (
        <span style={{ fontFamily: cssVar.fontMono, fontSize: font.size.sm, color: cssVar.text }}>{r.userEmail}</span>
      ),
    },
    {
      key: "status", label: "Resultado", width: 120, render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] || "soft"} size="sm">{r.status}</Badge>
      ),
    },
    {
      key: "resolvedAt", label: "Resuelta", width: 200, render: (r) => fmtDT(r.resolvedAt),
    },
    {
      key: "resolver", label: "Por", render: (r) => (
        <span style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted }}>{r.resolverEmail || "—"}</span>
      ),
    },
    {
      key: "createdAt", label: "Creada", width: 160, render: (r) => (
        <span style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted }}>{fmtDT(r.createdAt)}</span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Seguridad · MFA recovery"
        italic="Reactivación"
        title="con auditoría completa."
        subtitle="Solicitudes auto-registradas por usuarios que perdieron su segundo factor. Al aprobar se borra TOTP + backup codes + trusted devices, y se revocan todas las sesiones. Toda acción queda en audit log con hash-chain."
      />
      <SegmentedNav items={SECURITY_NAV} ariaLabel="Sub-navegación de seguridad" />

      <section style={{ marginBlockEnd: space[6] }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: space[3], marginBlockEnd: space[3] }}>
          <h2 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "-0.01em" }}>
            Pendientes
          </h2>
          <span style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            {pendingRows.length}
          </span>
        </div>
        <DataTable
          columns={pendingColumns}
          rows={pendingRows}
          getKey={(r) => r.id}
          emptyTitle="Sin pendientes"
          emptyDescription="Ninguna solicitud esperando decisión. Te notificaremos si entra una nueva."
        />
      </section>

      <section>
        <div style={{ display: "flex", alignItems: "baseline", gap: space[3], marginBlockEnd: space[3] }}>
          <h2 style={{ margin: 0, fontSize: font.size.lg, fontWeight: font.weight.bold, color: cssVar.text, letterSpacing: "-0.01em" }}>
            Historial reciente
          </h2>
          <span style={{ fontFamily: cssVar.fontMono, fontSize: 11, color: cssVar.textMuted, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            últimas {resolvedRows.length}
          </span>
        </div>
        <DataTable
          columns={resolvedColumns}
          rows={resolvedRows}
          getKey={(r) => r.id}
          emptyTitle="Sin historial"
          emptyDescription="Aún no se ha resuelto ninguna solicitud."
        />
      </section>
    </>
  );
}
