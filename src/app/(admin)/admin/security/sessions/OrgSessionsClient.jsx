"use client";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";
import { canRevokeTarget } from "@/lib/org-sessions";

async function getCsrf() {
  try {
    const r = await fetch("/api/auth/csrf", { cache: "no-store" });
    const j = await r.json();
    return j?.csrfToken || "";
  } catch { return ""; }
}

function timeAgo(iso) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  return `hace ${days} d`;
}

export default function OrgSessionsClient({ orgId, orgName, actorRole, actorUserId, initialGroups, initialTotal }) {
  const [groups, setGroups] = useState(initialGroups);
  const [total, setTotal] = useState(initialTotal);
  const [busy, startTransition] = useTransition();
  const [revoking, setRevoking] = useState(null);

  async function refresh() {
    try {
      const r = await fetch(`/api/v1/orgs/${orgId}/sessions`, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setGroups(j.groups || []);
      setTotal(j.total || 0);
    } catch { /* no-op */ }
  }

  async function revokeOne(sessionId) {
    setRevoking(sessionId);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/sessions/${sessionId}`, {
        method: "DELETE",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      toast.success("Sesión revocada");
      startTransition(() => refresh());
    } catch (e) {
      toast.error(e?.message || "No se pudo revocar");
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllForUser(userId, userEmail) {
    if (!confirm(`¿Cerrar TODAS las sesiones de ${userEmail || userId}? Útil al offboardear: invalidamos sus JWTs en todos los orgs.`)) return;
    setRevoking(`user:${userId}`);
    try {
      const csrf = await getCsrf();
      const r = await fetch(`/api/v1/orgs/${orgId}/members/${userId}/revoke-sessions`, {
        method: "POST",
        headers: { "x-csrf-token": csrf },
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      const j = await r.json();
      toast.success(`Revocadas ${j.count || 0} sesión(es) de ${userEmail || userId}`);
      startTransition(() => refresh());
    } catch (e) {
      toast.error(e?.message || "No se pudo revocar");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <article style={{ maxWidth: 960, margin: "0 auto" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: space[3], marginBlockEnd: space[4] }}>
        <div>
          <h1 style={{ margin: 0, fontSize: font.size["2xl"], fontWeight: font.weight.black, letterSpacing: font.tracking.tight, color: cssVar.text }}>
            Sesiones del org
          </h1>
          <p style={{ color: cssVar.textMuted, marginTop: space[1], fontSize: font.size.sm }}>
            {total} sesión(es) activa(s) en {orgName}. Revoca específicas o todas al offboardear.
          </p>
        </div>
        <Badge variant={actorRole === "OWNER" ? "success" : "soft"} size="sm">
          {actorRole}
        </Badge>
      </header>

      {groups.length === 0 ? (
        <div style={{ padding: space[6], textAlign: "center", color: cssVar.textMuted, background: cssVar.surface, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
          No hay sesiones activas en este org.
        </div>
      ) : (
        <div style={{ display: "grid", gap: space[4] }}>
          {groups.map((g) => {
            const canRevokeUser = canRevokeTarget({
              actorRole, actorUserId,
              targetRole: g.userRole,
              targetUserId: g.userId,
            });
            return (
              <section key={g.userId} style={{
                background: cssVar.surface,
                border: `1px solid ${cssVar.border}`,
                borderRadius: radius.md,
                overflow: "hidden",
              }}>
                <header style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: `${space[4]}px ${space[5]}px`,
                  background: cssVar.surface2,
                  gap: space[3],
                  flexWrap: "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: space[2], flexWrap: "wrap" }}>
                    <strong style={{ color: cssVar.text }}>
                      {g.userName || g.userEmail || g.userId}
                    </strong>
                    <span style={{ color: cssVar.textDim, fontSize: font.size.sm }}>
                      {g.userEmail !== g.userName ? g.userEmail : ""}
                    </span>
                    <Badge
                      variant={g.userRole === "OWNER" ? "success" : g.userRole === "ADMIN" ? "soft" : "neutral"}
                      size="sm"
                    >
                      {g.userRole}
                    </Badge>
                    <span style={{ color: cssVar.textDim, fontSize: font.size.xs }}>
                      · {g.sessions.length} sesión(es)
                    </span>
                  </div>
                  {canRevokeUser && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => revokeAllForUser(g.userId, g.userEmail)}
                      disabled={busy || revoking === `user:${g.userId}`}
                    >
                      {revoking === `user:${g.userId}` ? "Revocando…" : "Cerrar todas"}
                    </Button>
                  )}
                </header>
                <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                  {g.sessions.map((s) => (
                    <li
                      key={s.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: space[3],
                        padding: `${space[3]}px ${space[5]}px`,
                        borderBlockStart: `1px solid ${cssVar.border}`,
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ color: cssVar.text, fontSize: font.size.sm }}>
                          {s.label || "Sesión"}
                          {s.revokedAt && (
                            <Badge variant="warn" size="sm" style={{ marginInlineStart: space[2] }}>
                              Revocada
                            </Badge>
                          )}
                        </div>
                        <div style={{ color: cssVar.textDim, fontSize: font.size.xs, marginTop: 2 }}>
                          Última actividad: {timeAgo(s.lastSeenAt)} · Expira: {new Date(s.expiresAt).toLocaleString()}
                          {s.ip && <> · {s.ip}</>}
                        </div>
                      </div>
                      {!s.revokedAt && canRevokeUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => revokeOne(s.id)}
                          disabled={busy || revoking === s.id}
                        >
                          {revoking === s.id ? "Revocando…" : "Revocar"}
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <section style={{ marginBlockStart: space[5], padding: space[4], background: cssVar.surface2, border: `1px solid ${cssVar.border}`, borderRadius: radius.md }}>
        <h2 style={{ margin: 0, fontSize: font.size.md, fontWeight: font.weight.bold, color: cssVar.text }}>
          ¿Cómo funciona el offboarding?
        </h2>
        <ul style={{ margin: `${space[2]}px 0 0`, paddingInlineStart: space[5], color: cssVar.textMuted, fontSize: font.size.sm, lineHeight: 1.7 }}>
          <li><strong>Revocar específica:</strong> marca la row con revokedAt; lazy validation rechaza el JWT en ≤60 s.</li>
          <li><strong>Cerrar todas:</strong> bumpea User.sessionEpoch → invalida JWTs en TODOS los orgs del user (no solo este).</li>
          <li><strong>Anti-warfare:</strong> ADMIN solo puede revocar MEMBERs; cualquier acción contra ADMIN/OWNER requiere OWNER.</li>
          <li><strong>Audit:</strong> cada acción queda registrada como <code>org.session.revoked</code> o <code>org.member.sessions.revoked</code> en /admin/audit.</li>
        </ul>
      </section>
    </article>
  );
}
