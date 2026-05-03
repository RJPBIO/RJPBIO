"use client";
/* ═══════════════════════════════════════════════════════════════
   ChipSelector — chip pill horizontales con anti-trampa thinking time.
   Patrón heredado de Coach v2 EmptyState.
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { colors, typography, spacing } from "../../../app/v2/tokens";

const ACCENT = colors.accent.phosphorCyan;

export default function ChipSelector({
  question = "",
  chips = [],
  min_thinking_ms = 1500,
  multi_select = false,
  onSelect,
}) {
  const [active, setActive] = useState(false);
  const [selected, setSelected] = useState([]);
  const lockRef = useRef(false);

  useEffect(() => {
    const id = setTimeout(() => setActive(true), min_thinking_ms);
    return () => clearTimeout(id);
  }, [min_thinking_ms]);

  const handleChip = (id) => {
    if (!active || lockRef.current) return;
    if (!multi_select) {
      lockRef.current = true;
      setSelected([id]);
      setTimeout(() => {
        if (typeof onSelect === "function") onSelect(id);
      }, 200);
      return;
    }
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleConfirm = () => {
    if (lockRef.current || selected.length === 0) return;
    lockRef.current = true;
    if (typeof onSelect === "function") onSelect(selected);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: spacing.s24 }}>
      {question && (
        <p style={{
          margin: 0,
          textAlign: "center",
          fontFamily: typography.family,
          fontWeight: typography.weight.regular,
          fontSize: 17,
          color: colors.text.primary,
          letterSpacing: "-0.01em",
          maxInlineSize: 480,
        }}>
          {question}
        </p>
      )}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 10,
        opacity: active ? 1 : 0.4,
        transition: "opacity 200ms linear",
      }}>
        {chips.map((c) => {
          const isSel = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              disabled={!active}
              onClick={() => handleChip(c.id)}
              style={{
                appearance: "none",
                cursor: active ? "pointer" : "default",
                padding: "10px 16px",
                background: isSel ? ACCENT : "rgba(255,255,255,0.03)",
                color: isSel ? "#08080A" : colors.text.secondary,
                border: `0.5px solid ${isSel ? ACCENT : colors.separator}`,
                borderRadius: 999,
                fontFamily: typography.family,
                fontWeight: typography.weight.medium,
                fontSize: 13,
                letterSpacing: "0.02em",
                transition: "background 120ms linear, color 120ms linear, border-color 120ms linear",
              }}
            >
              {c.label}
            </button>
          );
        })}
      </div>
      {multi_select && selected.length > 0 && (
        <button
          type="button"
          onClick={handleConfirm}
          style={{
            appearance: "none",
            cursor: "pointer",
            padding: "12px 24px",
            background: ACCENT,
            color: "#08080A",
            border: "none",
            borderRadius: 999,
            fontFamily: typography.family,
            fontWeight: typography.weight.medium,
            fontSize: 13,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Confirmar
        </button>
      )}
    </div>
  );
}
