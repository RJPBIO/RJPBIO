"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import SubmitButton from "@/components/ui/SubmitButton";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export default function IntegrationsClient({ orgId, catalog, installed }) {
  const [testing, setTesting] = useState(null);
  const [lastResult, setLastResult] = useState({});

  async function test(provider) {
    setTesting(provider);
    try {
      const r = await fetch(`/api/v1/integrations/test?provider=${provider}`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Fallo de conexión");
      setLastResult((s) => ({ ...s, [provider]: { ok: true, at: Date.now(), detail: j.detail || "Conectado" } }));
      toast.success(`${provider}: conexión verificada`);
    } catch (e) {
      setLastResult((s) => ({ ...s, [provider]: { ok: false, at: Date.now(), detail: e.message } }));
      toast.error(`${provider}: ${e.message}`);
    } finally { setTesting(null); }
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
      gap: space[3],
      marginTop: space[4],
    }}>
      {catalog.map((p) => {
        const inst = installed[p.id];
        const enabled = inst?.enabled;
        const test1 = lastResult[p.id];
        return (
          <article
            key={p.id}
            style={{
              padding: space[4],
              borderRadius: radius.md,
              border: `1px solid ${enabled ? cssVar.accent : cssVar.border}`,
              background: enabled ? cssVar.accentSoft : cssVar.surface2,
              display: "flex",
              flexDirection: "column",
              gap: space[3],
              transition: "border-color .15s ease, background .15s ease",
            }}
          >
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: space[2] }}>
              <h2 style={{
                margin: 0,
                fontSize: font.size.lg,
                fontWeight: font.weight.bold,
                color: cssVar.text,
                letterSpacing: font.tracking.tight,
              }}>
                {p.name}
              </h2>
              {inst && (
                enabled
                  ? <Badge variant="success" size="sm">Activa</Badge>
                  : <Badge variant="warn" size="sm">Pausada</Badge>
              )}
            </header>

            <p style={{ margin: 0, fontSize: font.size.sm, color: cssVar.textMuted, lineHeight: 1.5 }}>
              {p.desc}
            </p>

            {inst && inst.lastSyncAt && (
              <div style={{ fontSize: font.size.xs, color: cssVar.textDim, fontFamily: cssVar.fontMono }}>
                Última sync: {new Date(inst.lastSyncAt).toLocaleString()}
              </div>
            )}

            {test1 && (
              <Alert kind={test1.ok ? "success" : "danger"}>
                {test1.detail}
              </Alert>
            )}

            <div style={{ marginTop: "auto", display: "flex", gap: space[2] }}>
              <form
                action={inst ? `/api/v1/integrations/${inst.id}` : "/api/v1/integrations"}
                method="post"
                style={{ flex: 1 }}
              >
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="provider" value={p.id} />
                {inst && <input type="hidden" name="_method" value={enabled ? "PAUSE" : "RESUME"} />}
                <SubmitButton
                  variant={inst ? (enabled ? "secondary" : "primary") : "primary"}
                  size="sm"
                  style={{ width: "100%" }}
                  loadingLabel={inst ? (enabled ? "Pausando…" : "Reactivando…") : "Conectando…"}
                  onClick={(e) => {
                    if (enabled && !confirm(`Pausar ${p.name}? Los syncs se detendrán hasta reactivar.`)) {
                      e.preventDefault();
                    }
                  }}
                >
                  {inst ? (enabled ? "Pausar" : "Reactivar") : "Conectar"}
                </SubmitButton>
              </form>
              {inst && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => test(p.id)}
                  loading={testing === p.id}
                  loadingLabel="Probando…"
                  disabled={testing !== null && testing !== p.id}
                >
                  Probar
                </Button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
