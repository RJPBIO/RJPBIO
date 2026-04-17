"use client";
import { useState, useRef } from "react";

export default function Coach() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const ctrl = useRef(null);

  async function send() {
    if (!input.trim()) return;
    const user = { role: "user", content: input };
    setMsgs((m) => [...m, user, { role: "assistant", content: "" }]);
    setInput(""); setStreaming(true);
    ctrl.current = new AbortController();
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, user] }),
        signal: ctrl.current.signal,
      });
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (line.startsWith("data:")) {
            try {
              const p = JSON.parse(line.slice(5));
              if (p.delta) { acc += p.delta; setMsgs((m) => { const c = [...m]; c[c.length - 1] = { role: "assistant", content: acc }; return c; }); }
            } catch {}
          }
        }
      }
    } finally { setStreaming(false); }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "#0B0E14", color: "#E2E8F0", fontFamily: "system-ui", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: 20, borderBottom: "1px solid #1E293B" }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>Coach neural</h1>
      </header>
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ marginBottom: 16, textAlign: m.role === "user" ? "right" : "left" }}>
            <div style={{ display: "inline-block", maxWidth: "80%", padding: "10px 14px", borderRadius: 12, background: m.role === "user" ? "#10B981" : "#1E293B", color: m.role === "user" ? "#fff" : "#E2E8F0" }}>
              {m.content || <em style={{ color: "#64748B" }}>pensando…</em>}
            </div>
          </div>
        ))}
      </div>
      <footer style={{ padding: 16, borderTop: "1px solid #1E293B", display: "flex", gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="¿Cómo te sientes hoy?" disabled={streaming}
          style={{ flex: 1, padding: "10px 12px", background: "#020617", border: "1px solid #334155", borderRadius: 8, color: "#E2E8F0" }} />
        <button onClick={streaming ? () => ctrl.current?.abort() : send}
          style={{ padding: "10px 16px", background: streaming ? "#F87171" : "#10B981", border: "none", borderRadius: 8, color: "#fff", fontWeight: 600 }}>
          {streaming ? "Detener" : "Enviar"}
        </button>
      </footer>
    </main>
  );
}
