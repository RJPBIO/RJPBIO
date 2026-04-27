"use client";
import { useState, useMemo, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toast";
import { PageHeader } from "@/components/admin/PageHeader";
import SegmentedNav from "@/components/admin/SegmentedNav";
import { BioGlyph } from "@/components/BioIgnicionMark";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

const SECURITY_NAV = [
  { href: "/admin/security/policies", label: "Políticas" },
  { href: "/admin/security/sessions", label: "Sesiones" },
  { href: "/admin/security", label: "Reset MFA" },
];
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

export default function OrgSessionsClient({ orgId, orgName, actorRole, actorUserId, currentJti, initialGroups, initialTotal }) {
  const [groups, setGroups] = useState(initialGroups);
  const [total, setTotal] = useState(initialTotal);
  const [busy, startTransition] = useTransition();
  const [revoking, setRevoking] = useState(null);
  const [query, setQuery] = useState("");
  const [includeRevoked, setIncludeRevoked] = useState(false);

  async function refresh(opts = {}) {
    const include = typeof opts.includeRevoked === "boolean" ? opts.includeRevoked : includeRevoked;
    try {
      const url = include
        ? `/api/v1/orgs/${orgId}/sessions?includeRevoked=1`
        : `/api/v1/orgs/${orgId}/sessions`;
      const r = await fetch(url, { cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      setGroups(j.groups || []);
      setTotal(j.total || 0);
    } catch { /* no-op */ }
  }

  // Filtra grupos por query (email/name). Case-insensitive.
  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter((g) => {
      const haystack = `${g.userEmail || ""} ${g.userName || ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [groups, query]);

  function toggleIncludeRevoked() {
    const next = !includeRevoked;
    setIncludeRevoked(next);
    refresh({ includeRevoked: next });
  }

  async function revokeOne(sessionId, isCurrent) {
    if (isCurrent) {
      const yes = confirm(
        "Estás revocando TU PROPIA sesión actual. Serás cerrado en ≤60 s.\n\n¿Continuar?"
      );
      if (!yes) return;
    }
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
    const isSelf = userId === actorUserId;
    const msg = isSelf
      ? `¿Cerrar TODAS TUS sesiones (incluyendo ésta)? Quedarás fuera y tendrás que volver a iniciar sesión.`
      : `¿Cerrar TODAS las sesiones de ${userEmail || userId}? Útil al offboardear: invalidamos sus JWTs en todos los orgs.`;
    if (!confirm(msg)) return;
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
    <article>
      <PageHeader
        eyebrow="Seguridad · live sessions"
        italic="Quién"
        title="está dentro, ahora."
        subtitle={`${total} sesión(es) ${includeRevoked ? "(activas + revocadas recientes)" : "activa(s)"} en ${orgName}. Revoca específicas o todas al offboardear.`}
        actions={
          <Badge variant={actorRole === "OWNER" ? "success" : "soft"} size="sm">
            {actorRole}
          </Badge>
        }
      />
      <SegmentedNav items={SECURITY_NAV} ariaLabel="Sub-navegación de seguridad" />

      {/* Toolbar: search + include-revoked toggle */}
      <div style={{
        display: "flex",
        gap: space[3],
        alignItems: "center",
        flexWrap: "wrap",
        marginBlockEnd: space[4],
        padding: `${space[3]}px ${space[4]}px`,
        background: cssVar.surface2,
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
      }}>
        <div style={{ flex: "1 1 240px", minWidth: 240 }}>
          <Input
            type="search"
            placeholder="Buscar por email o nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar sesiones por usuario"
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: space[2], cursor: "pointer", color: cssVar.text, fontSize: font.size.sm }}>
          <input
            type="checkbox"
            checked={includeRevoked}
            onChange={toggleIncludeRevoked}
            style={{ width: 16, height: 16, cursor: "pointer" }}
          />
          Incluir revocadas
        </label>
        {(query || includeRevoked) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setQuery(""); if (includeRevoked) toggleIncludeRevoked(); }}
          >
            Limpiar
          </Button>
        )}
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bi-admin-empty">
          <span className="bi-admin-empty-glyph"><BioGlyph size={36} /></span>
          <div className="bi-admin-empty-title">
            {query ? "Sin coincidencias." : "Nadie conectado ahora mismo."}
          </div>
          <div className="bi-admin-empty-body">
            {query
              ? `No hay sesiones que coincidan con "${query}".`
              : "Cuando los miembros inicien sesión aparecerán aquí — con su dispositivo, IP y last-seen."}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: space[4] }}>
          {filteredGroups.map((g) => {
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
                    {g.userName && g.userEmail && (
                      <span style={{ color: cssVar.textDim, fontSize: font.size.sm }}>
                        {g.userEmail}
                      </span>
                    )}
                    <Badge
                      variant={g.userRole === "OWNER" ? "success" : g.userRole === "ADMIN" ? "soft" : "neutral"}
                      size="sm"
                    >
                      {g.userRole}
                    </Badge>
                    {g.userId === actorUserId && (
                      <Badge variant="success" size="sm">Tú</Badge>
                    )}
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
                  {g.sessions.map((s) => {
                    const isCurrent = !!currentJti && s.jti === currentJti;
                    return (
                      <li
                        key={s.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: space[3],
                          padding: `${space[3]}px ${space[5]}px`,
                          borderBlockStart: `1px solid ${cssVar.border}`,
                          background: isCurrent ? cssVar.surface2 : "transparent",
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: cssVar.text, fontSize: font.size.sm, display: "flex", alignItems: "center", gap: space[2], flexWrap: "wrap" }}>
                            <span>{s.label || "Sesión"}</span>
                            {isCurrent && <Badge variant="success" size="sm">Esta sesión</Badge>}
                            {s.revokedAt && <Badge variant="warn" size="sm">Revocada</Badge>}
                          </div>
                          <div style={{ color: cssVar.textDim, fontSize: font.size.xs, marginTop: 2 }}>
                            Última actividad: {timeAgo(s.lastSeenAt)} · Expira: {new Date(s.expiresAt).toLocaleString()}
                            {s.ip && <> · {s.ip}</>}
                            {s.revokedAt && <> · Revocada {timeAgo(s.revokedAt)}</>}
                          </div>
                        </div>
                        {!s.revokedAt && canRevokeUser && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => revokeOne(s.id, isCurrent)}
                            disabled={busy || revoking === s.id}
                          >
                            {revoking === s.id ? "Revocando…" : "Revocar"}
                          </Button>
                        )}
                      </li>
                    );
                  })}
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
