"use client";
import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cssVar, radius, space, font } from "@/components/ui/tokens";

export default function Coach() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const ctrl = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs]);

  async function send() {
    if (!input.trim()) return;
    const user = { role: "user", content: input };
    setMsgs((m) => [...m, user, { role: "assistant", content: "" }]);
    setInput(""); setStreaming(true);
    ctrl.current = new AbortController();
    let acc = "";
    try {
      const r = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...msgs, user] }),
        signal: ctrl.current.signal,
      });
      if (!r.ok || !r.body) throw new Error(`HTTP ${r.status}`);
      const reader = r.body.getReader();
      const decoder = new TextDecoder();
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
    } catch (e) {
      if (e?.name !== "AbortError") toast.error(e?.message || "No se pudo contactar al coach");
      setMsgs((m) => {
        const last = m[m.length - 1];
        if (last?.role !== "assistant") return m;
        if (acc) return m;
        const c = m.slice(0, -1);
        c.push({ role: "assistant", content: e?.name === "AbortError" ? "— detenido —" : "— sin respuesta —" });
        return c;
      });
    } finally {
      setStreaming(false);
      ctrl.current = null;
      inputRef.current?.focus();
    }
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

      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        aria-label="Conversación con el coach"
        style={{ flex: 1, overflow: "auto", padding: space[4] }}
      >
        {msgs.length === 0 && (
          <div style={{
            display: "grid",
            placeItems: "center",
            minHeight: "100%",
            color: cssVar.textMuted,
            fontSize: font.size.sm,
            textAlign: "center",
            padding: space[6],
          }}>
            <div>
              <p style={{ margin: 0, fontSize: font.size.md, color: cssVar.textDim }}>
                Conversa con tu coach neural.
              </p>
              <p style={{ margin: `${space[2]}px 0 0`, fontSize: font.size.sm, color: cssVar.textMuted }}>
                Respuestas basadas en tu sesión y literatura publicada. No sustituye atención clínica.
              </p>
            </div>
          </div>
        )}
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
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="¿Cómo te sientes hoy?"
          aria-label="Mensaje para el coach"
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
