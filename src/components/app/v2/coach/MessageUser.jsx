"use client";
import { typography, spacing } from "../tokens";

// Bubble user: derecha, max 80%, bg sutil, asymmetric radius bottom-right 6.

export default function MessageUser({ content, ts }) {
  return (
    <div
      data-v2-msg="user"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        marginBlock: 0,
      }}
    >
      <div style={{ maxWidth: "80%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            borderRadius: 16,
            borderBottomRightRadius: 6,
            padding: "12px 14px",
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
        </div>
        {ts != null && (
          <span
            style={{
              fontFamily: typography.familyMono,
              fontSize: typography.size.microCaps,
              letterSpacing: "0.06em",
              color: "rgba(255,255,255,0.32)",
              fontWeight: typography.weight.regular,
              paddingInlineEnd: 4,
            }}
          >
            {relativeTime(ts)}
          </span>
        )}
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
