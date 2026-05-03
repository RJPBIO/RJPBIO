"use client";
import { typography, spacing } from "../tokens";
import StreamingCursor from "./StreamingCursor";

// Coach plano: izquierda, sin bubble. Caption "COACH · hace Xm" arriba.

export default function MessageCoach({ content, ts, streaming = false }) {
  return (
    <div
      data-v2-msg="coach"
      style={{
        display: "flex",
        justifyContent: "flex-start",
        marginBlock: 0,
      }}
    >
      <div style={{ maxWidth: "90%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, paddingInline: 14 }}>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.32)",
            fontWeight: typography.weight.medium,
          }}
        >
          COACH{ts != null ? ` · ${relativeTime(ts)}` : ""}
        </span>
        <div
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
            lineHeight: 1.5,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {content}
          {streaming && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}

function relativeTime(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "ahora";
  if (m < 60) return `hace ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ayer";
  return `hace ${d} días`;
}
