"use client";
import { useMemo } from "react";
import { typography, spacing, colors } from "../tokens";
import StreamingCursor from "./StreamingCursor";
import { P } from "@/lib/protocols";
import { getUseCase } from "@/lib/protocols";

// Coach plano: izquierda, sin bubble. Caption "COACH · hace Xm" arriba.
//
// Phase 6C SP2 — parser markup tappeable [run:N]:
// El system prompt enseña al LLM a escribir [run:N] cuando recomienda
// un protocolo. Aquí lo parseamos y reemplazamos por un tap chip cyan
// que dispara onProtocolTap(id). Defensa explícita: protocolos crisis
// (#18, #19, #20) NUNCA renderizan como tap aunque el LLM los emita —
// crisis se accede solo por el botón SOS persistente.

const RUN_MARKUP_RE = /\[run:(\d+)\]/g;

/**
 * Parsea texto del coach. Retorna array de segmentos:
 *   [{type:"text", content}, {type:"protocol", protocol, match}, ...]
 * Pure function — testeable sin React.
 */
export function parseRunMarkup(content) {
  if (!content || typeof content !== "string") return [{ type: "text", content }];
  const parts = [];
  let lastIndex = 0;
  // Re-instantiate regex porque .exec con /g mantiene state entre llamadas.
  const re = new RegExp(RUN_MARKUP_RE.source, "g");
  let match;
  while ((match = re.exec(content)) !== null) {
    const id = parseInt(match[1], 10);
    const protocol = P.find((p) => p.id === id);
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    // Defensa: protocol debe existir Y NO ser crisis. LLM disobedience
    // (genera [run:18]) cae a texto literal — user no puede tap por accidente.
    if (protocol && getUseCase(protocol) !== "crisis") {
      parts.push({ type: "protocol", protocol, match: match[0] });
    } else {
      parts.push({ type: "text", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < content.length) {
    parts.push({ type: "text", content: content.slice(lastIndex) });
  }
  if (parts.length === 0) parts.push({ type: "text", content: "" });
  return parts;
}

export default function MessageCoach({ content, ts, streaming = false, onProtocolTap }) {
  const parts = useMemo(() => parseRunMarkup(content), [content]);
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
          {parts.map((part, idx) => {
            if (part.type === "protocol") {
              return (
                <ProtocolTapInline
                  key={`p-${idx}`}
                  protocol={part.protocol}
                  onTap={onProtocolTap ? () => onProtocolTap(part.protocol.id) : null}
                />
              );
            }
            return <span key={`t-${idx}`}>{part.content}</span>;
          })}
          {streaming && <StreamingCursor />}
        </div>
      </div>
    </div>
  );
}

function ProtocolTapInline({ protocol, onTap }) {
  return (
    <button
      type="button"
      onClick={onTap || undefined}
      disabled={!onTap}
      data-v2-protocol-tap={protocol.id}
      aria-label={`Iniciar protocolo ${protocol.n}, ${protocol.d} segundos`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        marginInline: 2,
        verticalAlign: "baseline",
        background: "rgba(34, 211, 238, 0.06)",
        border: `0.5px solid ${colors.accent.phosphorCyan}`,
        borderRadius: 4,
        fontFamily: typography.family,
        fontSize: typography.size.caption,
        fontWeight: typography.weight.medium,
        color: colors.accent.phosphorCyan,
        cursor: onTap ? "pointer" : "default",
        textDecoration: "none",
        opacity: onTap ? 1 : 0.6,
      }}
    >
      <span style={{ fontSize: 10, lineHeight: 1 }} aria-hidden="true">▶</span>
      <span>{protocol.n}</span>
      <span style={{ opacity: 0.6, fontSize: 11 }}>· {protocol.d}s</span>
    </button>
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
