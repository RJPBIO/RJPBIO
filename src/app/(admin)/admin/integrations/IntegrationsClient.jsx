"use client";
import { useState } from "react";
import { toast } from "@/components/ui/Toast";

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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginTop: 20 }}>
      {catalog.map((p) => {
        const inst = installed[p.id];
        const enabled = inst?.enabled;
        const test1 = lastResult[p.id];
        return (
          <div key={p.id} style={{
            padding: 18, borderRadius: 14,
            border: `1px solid ${enabled ? "#10B981" : "#064E3B"}`,
            background: enabled ? "rgba(16,185,129,.08)" : "transparent",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: 16 }}>{p.name}</h2>
              {inst && (
                <span style={{ fontSize: 11, color: enabled ? "#34D399" : "#F59E0B" }}>
                  {enabled ? "● Activa" : "● Pausada"}
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#A7F3D0" }}>{p.desc}</p>

            {inst && inst.lastSyncAt && (
              <div style={{ fontSize: 11, color: "#6EE7B7" }}>
                Última sync: {new Date(inst.lastSyncAt).toLocaleString()}
              </div>
            )}

            {test1 && (
              <div style={{
                fontSize: 12, padding: 8, borderRadius: 8,
                background: test1.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                color: test1.ok ? "#34D399" : "#FCA5A5",
                border: `1px solid ${test1.ok ? "#10B981" : "#EF4444"}`,
              }}>
                {test1.ok ? "✓" : "✗"} {test1.detail}
              </div>
            )}

            <div style={{ marginTop: "auto", display: "flex", gap: 8 }}>
              <form
                action={inst ? `/api/v1/integrations/${inst.id}` : "/api/v1/integrations"}
                method="post"
                style={{ flex: 1 }}
              >
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="provider" value={p.id} />
                {inst && <input type="hidden" name="_method" value={enabled ? "PAUSE" : "RESUME"} />}
                <button style={btn}>{inst ? (enabled ? "Pausar" : "Reactivar") : "Conectar"}</button>
              </form>
              {inst && (
                <button
                  type="button"
                  onClick={() => test(p.id)}
                  disabled={testing === p.id}
                  style={{ ...btnGhost, opacity: testing === p.id ? 0.5 : 1 }}
                >
                  {testing === p.id ? "Probando…" : "Probar"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const btn = { padding: "8px 14px", borderRadius: 10, background: "linear-gradient(135deg,#059669,#10B981)", color: "#fff", border: 0, fontWeight: 700, cursor: "pointer", fontSize: 13, width: "100%" };
const btnGhost = { padding: "8px 14px", borderRadius: 10, background: "transparent", color: "#A7F3D0", border: "1px solid #064E3B", fontWeight: 600, cursor: "pointer", fontSize: 13 };
