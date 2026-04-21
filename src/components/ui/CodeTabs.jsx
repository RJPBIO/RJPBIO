"use client";
import { useState, useId } from "react";
import { toast } from "./Toast";
import { cssVar, radius, space, font } from "./tokens";

/**
 * CodeTabs — multi-language code snippets with copy-to-clipboard.
 * tabs: [{ id, label, code }]
 */
export default function CodeTabs({ tabs, ariaLabel = "Code samples", copyLabel = "Copiar", copiedLabel = "Copiado al portapapeles", copyErrorLabel = "No se pudo copiar" }) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === activeId) || tabs[0];

  async function copy() {
    try {
      await navigator.clipboard.writeText(current.code);
      toast.success(copiedLabel);
    } catch {
      toast.error(copyErrorLabel);
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${cssVar.border}`,
        borderRadius: radius.md,
        overflow: "hidden",
        background: "#0B0E14",
        marginBlock: space[3],
      }}
    >
      <div
        role="tablist"
        aria-label={ariaLabel}
        style={{
          display: "flex",
          alignItems: "center",
          gap: space[1],
          paddingInline: space[2],
          paddingBlock: space[1],
          background: "#141820",
          borderBlockEnd: "1px solid #1E2330",
        }}
      >
        {tabs.map((t) => {
          const selected = t.id === current.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveId(t.id)}
              style={{
                padding: `${space[1.5]}px ${space[3]}px`,
                borderRadius: radius.sm,
                background: selected ? "#0B0E14" : "transparent",
                color: selected ? "#10B981" : "#8B95A8",
                border: "none",
                fontSize: font.size.sm,
                fontWeight: font.weight.semibold,
                cursor: "pointer",
                fontFamily: cssVar.fontMono,
                transition: "color .12s ease, background .12s ease",
              }}
            >
              {t.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={copy}
          aria-label={copyLabel}
          style={{
            marginInlineStart: "auto",
            padding: `${space[1]}px ${space[3]}px`,
            borderRadius: radius.sm,
            background: "transparent",
            color: "#A7F3D0",
            border: "1px solid #1E2330",
            fontSize: font.size.sm,
            fontWeight: font.weight.semibold,
            cursor: "pointer",
            fontFamily: cssVar.fontMono,
            letterSpacing: -0.05,
          }}
        >
          {copyLabel}
        </button>
      </div>
      <pre
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        style={{
          margin: 0,
          padding: space[4],
          fontSize: font.size.sm,
          lineHeight: 1.6,
          color: "#E8ECF4",
          fontFamily: cssVar.fontMono,
          overflow: "auto",
          background: "transparent",
          border: "none",
          borderRadius: 0,
        }}
      >
        <code>{current.code}</code>
      </pre>
    </div>
  );
}
