"use client";
/* ═══════════════════════════════════════════════════════════════
   /dev/protocol-player — Preview de ProtocolPlayer con protocolo #1.
   Dev-only. Robots no-index.
   ═══════════════════════════════════════════════════════════════ */

import { useState } from "react";
import dynamic from "next/dynamic";
import { P } from "@/lib/protocols";

const ProtocolPlayer = dynamic(
  () => import("@/components/protocol/v2/ProtocolPlayer"),
  { ssr: false },
);

export default function DevProtocolPlayer() {
  const [protocolId, setProtocolId] = useState(null);
  const [completion, setCompletion] = useState(null);
  const protocol = P.find((p) => p.id === protocolId) || null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080A",
      color: "rgba(245,245,247,0.92)",
      fontFamily: '"Inter Tight", system-ui, sans-serif',
      paddingBlock: 32,
      paddingInline: 20,
      maxInlineSize: 720,
      marginInline: "auto",
    }}>
      <p style={{
        margin: 0,
        fontSize: 11,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "rgba(245,245,247,0.38)",
        fontWeight: 500,
      }}>dev / protocol player</p>
      <h1 style={{
        margin: "8px 0 0",
        fontWeight: 200,
        fontSize: 28,
        letterSpacing: "-0.02em",
      }}>SP3 e2e harness</h1>
      <p style={{ margin: "8px 0 24px", fontSize: 13, color: "rgba(245,245,247,0.62)" }}>
        Selecciona un protocolo para mountar ProtocolPlayer.
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {P.map((p) => (
          <button
            key={p.id}
            type="button"
            data-test={`pick-${p.id}`}
            onClick={() => { setProtocolId(p.id); setCompletion(null); }}
            style={{
              appearance: "none",
              cursor: "pointer",
              padding: "8px 12px",
              background: protocolId === p.id ? "#22D3EE" : "rgba(255,255,255,0.03)",
              color: protocolId === p.id ? "#08080A" : "rgba(245,245,247,0.72)",
              border: `0.5px solid ${protocolId === p.id ? "#22D3EE" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 999,
              fontFamily: "inherit",
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            #{p.id} {p.n}
          </button>
        ))}
      </div>

      {completion && (
        <pre data-test="completion-data" style={{
          marginTop: 24,
          padding: 16,
          background: "rgba(255,255,255,0.03)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          borderRadius: 14,
          fontSize: 11,
          fontFamily: "JetBrains Mono, monospace",
          color: "rgba(245,245,247,0.72)",
          overflow: "auto",
        }}>
          {JSON.stringify(completion, null, 2)}
        </pre>
      )}

      {protocol && (
        <ProtocolPlayer
          key={`pp-${protocol.id}`}
          protocol={protocol}
          voiceOn={false}
          hapticOn={false}
          binauralOn={false}
          onComplete={(data) => {
            setCompletion({ result: "complete", ...data });
            setProtocolId(null);
          }}
          onCancel={() => {
            setCompletion({ result: "cancelled" });
            setProtocolId(null);
          }}
        />
      )}
    </div>
  );
}
