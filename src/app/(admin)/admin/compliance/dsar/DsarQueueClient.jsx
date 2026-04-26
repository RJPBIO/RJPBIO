"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import {
  DSAR_STATUSES,
  kindLabel,
  statusLabel,
  countByStatus,
  daysUntilExpiry,
} from "@/lib/dsar";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

const STATUS_VARIANT = {
  PENDING: "warn",
  APPROVED: "soft",
  REJECTED: "danger",
  COMPLETED: "success",
  EXPIRED: "neutral",
};

export default function DsarQueueClient({ orgId, orgName, actorRole, initialRequests }) {
  const [requests, setRequests] = useState(initialRequests);
  const [filter, setFilter] = useState("PENDING");
  const [busyId, setBusyId] = useState(null);

  const counts = useMemo(() => countByStatus(requests), [requests]);
  const filtered = useMemo(() => {
    if (!filter) return requests;
    return requests.filter((r) => r.status === filter);
  }, [requests, filter]);

  async function refresh() {
    try {
      const r = await fetch(`/api/v1/orgs/${orgId}/dsar`, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setRequests(j.requests || []);
    } catch { /* no-op */ }
  }

  async function resolve(id, status, kind) {
    let notes = null;
    if (status === "REJECTED") {
      notes = prompt("Motivo del rechazo (opcional, visible al usuario):") || null;
    }
    if (status === "APPROVED" && kind === "ERASURE") {
      const ok = confirm(
        "Aprobar borrado iniciará el proceso: User.deletedAt set + sesiones revocadas + " +
        "audit log. Hard-delete tras 30 días. ¿Continuar?"
      );
      if (!ok) return;
    }

    setBusyId(id);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/dsar/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ status, notes: notes || undefined }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success(`Solicitud ${status.toLowerCase()}`);
      await refresh();
    } catch (e) {
      toast.error(e?.message || "No se pudo resolver");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <article style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            DSAR — Solicitudes de datos
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            GDPR Art. 15 / 17 / 20 · {orgName} · {actorRole}
          </p>
        </div>
      </header>

      {/* Status chip filter */}
      <div role="toolbar" aria-label="Filtros por status" style={{
        display: "flex", flexWrap: "wrap", gap: space[2], marginBlockEnd: space[4],
      }}>
        <StatusChip
          label="Todas"
          active={filter === ""}
          count={requests.length}
          onClick={() => setFilter("")}
        />
        {DSAR_STATUSES.map((s) => (
          <StatusChip
            key={s}
            label={statusLabel(s)}
            count={counts[s] || 0}
            active={filter === s}
            onClick={() => setFilter(s)}
            variant={STATUS_VARIANT[s] || "soft"}
          />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: space[6], textAlign: "center", color: cssVar.textMuted, background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
          {filter === "PENDING"
            ? "No hay solicitudes pendientes — todo al día."
            : `No hay solicitudes con status ${statusLabel(filter)}`}
        </div>
      ) : (
        <div style={{ display: "grid", gap: space[3] }}>
          {filtered.map((r) => {
            const days = daysUntilExpiry(r);
            return (
              <article key={r.id} style={{
                padding: space[4],
                background: cssVar.surface,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.md,
              }}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: space[2] }}>
                  <div>
                    <strong style={{ color: cssVar.text, fontSize: font.size.md }}>
                      {kindLabel(r.kind)}
                    </strong>
                    <div style={{ color: cssVar.textDim, fontSize: font.size.xs, marginTop: 2, fontFamily: cssVar.fontMono }}>
                      {r.userEmail || r.userId}
                    </div>
                  </div>
                  <Badge variant={STATUS_VARIANT[r.status] || "soft"} size="sm">
                    {statusLabel(r.status)}
                  </Badge>
                </header>

                <div style={{ marginBlockStart: space[2], color: cssVar.textMuted, fontSize: font.size.sm }}>
                  Solicitada: {new Date(r.requestedAt).toLocaleString()}
                  {r.resolvedAt && <> · Resuelta: {new Date(r.resolvedAt).toLocaleString()}</>}
                  {r.status === "PENDING" && days !== Infinity && (
                    <span style={{ color: days < 7 ? "var(--bi-danger)" : cssVar.textDim }}>
                      {" "}· Vence en {days} día{days !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {r.reason && (
                  <p style={{ marginBlockStart: space[2], color: cssVar.text, fontSize: font.size.sm, padding: space[2], background: cssVar.surface2, borderRadius: radius.sm }}>
                    <span style={{ color: cssVar.textDim, fontSize: font.size.xs }}>Motivo:</span><br/>
                    {r.reason}
                  </p>
                )}

                {r.resolverNotes && (
                  <p style={{ marginBlockStart: space[2], color: cssVar.text, fontSize: font.size.sm, padding: space[2], background: cssVar.surface2, borderRadius: radius.sm }}>
                    <span style={{ color: cssVar.textDim, fontSize: font.size.xs }}>Notas del resolver ({r.resolverEmail || "?"}):</span><br/>
                    {r.resolverNotes}
                  </p>
                )}

                {r.status === "PENDING" && (
                  <div style={{ marginBlockStart: space[3], display: "flex", gap: space[2], flexWrap: "wrap" }}>
                    <Button
                      variant={r.kind === "ERASURE" ? "danger" : "primary"}
                      size="sm"
                      onClick={() => resolve(r.id, "APPROVED", r.kind)}
                      disabled={busyId === r.id}
                    >
                      {busyId === r.id ? "…" : "Aprobar"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resolve(r.id, "REJECTED", r.kind)}
                      disabled={busyId === r.id}
                    >
                      Rechazar
                    </Button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      <Alert kind="info" style={{ marginBlockStart: space[5] }}>
        <strong>State machine:</strong> PENDING → APPROVED/REJECTED. APPROVED de ERASURE setea
        <code> User.deletedAt</code>, revoca sesiones y audit-loga. Hard-delete tras 30d via
        cron sweep (no implementado en este sprint).
      </Alert>
    </article>
  );
}

function StatusChip({ label, count, active, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: space[1],
        padding: `${space[1]}px ${space[3]}px`,
        background: active ? cssVar.accent : cssVar.surface,
        color: active ? "#fff" : cssVar.text,
        border: `1px solid ${active ? cssVar.accent : cssVar.border}`,
        borderRadius: 999,
        fontSize: font.size.sm,
        cursor: "pointer",
        fontWeight: active ? font.weight.bold : font.weight.regular,
      }}
    >
      <span>{label}</span>
      <span style={{
        padding: `0 ${space[2]}px`,
        background: active ? "rgba(255,255,255,0.2)" : cssVar.surface2,
        borderRadius: 999,
        fontSize: font.size.xs,
        fontFamily: cssVar.fontMono,
      }}>
        {count}
      </span>
    </button>
  );
}
