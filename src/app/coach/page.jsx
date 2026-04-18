"use client";
import { useState, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

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
    <main style={{
      minHeight: "100dvh",
      background: cssVar.bg,
      color: cssVar.text,
      fontFamily: cssVar.fontSans,
      display: "flex",
      flexDirection: "column",
    }}>
      <header style={{
        padding: space[4],
        borderBlockEnd: `1px solid ${cssVar.border}`,
        background: cssVar.surface,
      }}>
        <h1 style={{
          margin: 0,
          fontSize: font.size.lg,
          fontWeight: font.weight.bold,
          letterSpacing: font.tracking.tight,
          color: cssVar.text,
        }}>
          Coach neural
        </h1>
      </header>

      <div style={{ flex: 1, overflow: "auto", padding: space[4] }}>
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: space[4],
              textAlign: m.role === "user" ? "right" : "left",
            }}
          >
            <div style={{
              display: "inline-block",
              maxWidth: "80%",
              padding: `${space[2]}px ${space[3]}px`,
              borderRadius: radius.md,
              background: m.role === "user" ? cssVar.accent : cssVar.surface2,
              color: m.role === "user" ? cssVar.accentInk : cssVar.text,
              border: m.role === "user" ? "none" : `1px solid ${cssVar.border}`,
              fontSize: font.size.md,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}>
              {m.content || <em style={{ color: cssVar.textMuted }}>pensando…</em>}
            </div>
          </div>
        ))}
      </div>

      <footer style={{
        padding: space[3],
        borderBlockStart: `1px solid ${cssVar.border}`,
        background: cssVar.surface,
        display: "flex",
        gap: space[2],
      }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="¿Cómo te sientes hoy?"
          disabled={streaming}
          style={{ flex: 1 }}
        />
        <Button
          variant={streaming ? "danger" : "primary"}
          onClick={streaming ? () => ctrl.current?.abort() : send}
        >
          {streaming ? "Detener" : "Enviar"}
        </Button>
      </footer>
    </main>
  );
}
