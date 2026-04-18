"use client";
import { useState, useId, Children, isValidElement } from "react";
import { cssVar, radius, space, font } from "./tokens";

/**
 * Tabs con roving tabindex + aria.
 * Uso:
 *   <Tabs value={tab} onChange={setTab}>
 *     <Tab value="a" label="Uno">contenido A</Tab>
 *     <Tab value="b" label="Dos">contenido B</Tab>
 *   </Tabs>
 */
export function Tabs({ value, onChange, children }) {
  const baseId = useId();
  const [internal, setInternal] = useState(() => {
    const first = Children.toArray(children).find(isValidElement);
    return first?.props?.value;
  });
  const active = value !== undefined ? value : internal;
  const set = onChange || setInternal;

  const tabs = Children.toArray(children).filter((c) => isValidElement(c));

  return (
    <div className="bi-tabs">
      <div
        role="tablist"
        style={{
          display: "inline-flex",
          gap: space[1],
          padding: space[1],
          background: cssVar.surface2,
          border: `1px solid ${cssVar.border}`,
          borderRadius: radius.full,
        }}
      >
        {tabs.map((c) => {
          const v = c.props.value;
          const selected = v === active;
          return (
            <button
              key={v}
              role="tab"
              id={`${baseId}-tab-${v}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${v}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => set(v)}
              style={{
                padding: `${space[1.5]}px ${space[4]}px`,
                borderRadius: radius.full,
                background: selected ? cssVar.surface : "transparent",
                color: selected ? cssVar.text : cssVar.textMuted,
                border: "none",
                fontSize: font.size.md,
                fontWeight: font.weight.semibold,
                cursor: "pointer",
                boxShadow: selected ? `0 1px 2px rgba(0,0,0,0.08)` : "none",
                transition: "color .12s ease, background .12s ease",
              }}
            >
              {c.props.label}
            </button>
          );
        })}
      </div>
      {tabs.map((c) => {
        const v = c.props.value;
        const selected = v === active;
        return (
          <div
            key={v}
            role="tabpanel"
            id={`${baseId}-panel-${v}`}
            aria-labelledby={`${baseId}-tab-${v}`}
            hidden={!selected}
            style={{ marginTop: space[4] }}
          >
            {selected ? c.props.children : null}
          </div>
        );
      })}
    </div>
  );
}

export function Tab({ children }) { return <>{children}</>; }
