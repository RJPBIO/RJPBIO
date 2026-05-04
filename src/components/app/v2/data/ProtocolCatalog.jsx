"use client";
/* ═══════════════════════════════════════════════════════════════
   ProtocolCatalog — Sección browseable en Tab Datos.
   Phase 6 SP4. Muestra los 18 active protocols con filtros por
   intent + dificultad. Tap card → onSelectProtocol(protocol).
   Crisis (#18-#20) excluidos — sólo via CrisisFAB.
   Training (#16, #17) excluidos del catálogo público.
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { getActiveProtocols } from "@/lib/protocols";
import { colors, typography, spacing, radii } from "../tokens";

const INTENT_OPTIONS = [
  { id: "all", label: "Todos" },
  { id: "calma", label: "Calma" },
  { id: "enfoque", label: "Enfoque" },
  { id: "energia", label: "Energía" },
  { id: "reset", label: "Reset" },
];

const DIFFICULTY_OPTIONS = [
  { id: "all", label: "Todas" },
  { id: "1", label: "Suave" },
  { id: "2", label: "Media" },
  { id: "3", label: "Intensa" },
];

export default function ProtocolCatalog({ onSelectProtocol }) {
  const [filterIntent, setFilterIntent] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  const protocols = useMemo(() => {
    const all = getActiveProtocols();
    return all.filter((p) => {
      if (filterIntent !== "all" && p.int !== filterIntent) return false;
      if (filterDifficulty !== "all" && p.dif !== Number(filterDifficulty)) return false;
      return true;
    });
  }, [filterIntent, filterDifficulty]);

  return (
    <section
      data-v2-protocol-catalog
      style={{
        paddingInline: spacing.s24,
        paddingBlockStart: spacing.s48,
        paddingBlockEnd: spacing.s48,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <Kicker>CATÁLOGO</Kicker>
      <h2
        style={{
          margin: "8px 0 0",
          fontFamily: typography.family,
          fontSize: 22,
          fontWeight: typography.weight.regular,
          letterSpacing: "-0.02em",
          color: colors.text.primary,
        }}
      >
        Protocolos disponibles
      </h2>
      <p
        style={{
          marginBlock: "8px 0",
          fontFamily: typography.family,
          fontSize: 13,
          fontWeight: typography.weight.regular,
          color: colors.text.muted,
          lineHeight: 1.4,
        }}
      >
        {protocols.length} de {getActiveProtocols().length} mostrados.
      </p>

      <FilterRow
        kicker="INTENT"
        options={INTENT_OPTIONS}
        selected={filterIntent}
        onChange={setFilterIntent}
      />
      <FilterRow
        kicker="DIFICULTAD"
        options={DIFFICULTY_OPTIONS}
        selected={filterDifficulty}
        onChange={setFilterDifficulty}
      />

      <div
        data-testid="protocol-grid"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBlockStart: spacing.s24,
        }}
      >
        {protocols.length === 0 ? (
          <p
            style={{
              margin: 0,
              fontFamily: typography.family,
              fontSize: 13,
              color: colors.text.muted,
              paddingBlock: spacing.s24,
              textAlign: "center",
            }}
          >
            Sin protocolos para los filtros seleccionados.
          </p>
        ) : (
          protocols.map((p) => (
            <ProtocolCard
              key={p.id}
              protocol={p}
              onTap={() => onSelectProtocol && onSelectProtocol(p)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ProtocolCard({ protocol, onTap }) {
  const minutes = Math.max(1, Math.round((protocol.d || 90) / 60));
  return (
    <button
      type="button"
      onClick={onTap}
      data-testid={`protocol-card-${protocol.id}`}
      data-protocol-id={protocol.id}
      style={{
        appearance: "none",
        cursor: "pointer",
        width: "100%",
        background: "rgba(255,255,255,0.03)",
        border: `0.5px solid ${colors.separator}`,
        borderRadius: radii.panel,
        padding: "16px 18px",
        display: "flex",
        alignItems: "center",
        gap: spacing.s16,
        color: "inherit",
        textAlign: "start",
        minHeight: 44,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontFamily: typography.familyMono,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: colors.accent.phosphorCyan,
          fontWeight: typography.weight.medium,
          minWidth: 36,
        }}
      >
        {protocol.tg}
      </span>
      <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 15,
            fontWeight: typography.weight.medium,
            color: colors.text.primary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {protocol.n}
        </span>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: 12,
            fontWeight: typography.weight.regular,
            color: colors.text.muted,
            lineHeight: 1.4,
          }}
        >
          {humanIntent(protocol.int)} · {minutes} min · dif {protocol.dif}
        </span>
      </span>
      <ChevronRight
        size={18}
        strokeWidth={1.5}
        color={colors.text.muted}
        aria-hidden="true"
      />
    </button>
  );
}

function FilterRow({ kicker, options, selected, onChange }) {
  return (
    <div style={{ marginBlockStart: spacing.s16 }}>
      <Kicker tone="muted" size="micro">
        {kicker}
      </Kicker>
      <div
        role="radiogroup"
        aria-label={kicker}
        style={{
          marginBlockStart: 6,
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
        }}
      >
        {options.map((opt) => {
          const active = opt.id === selected;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              role="radio"
              aria-checked={active}
              data-testid={`filter-${kicker.toLowerCase()}-${opt.id}`}
              style={{
                appearance: "none",
                cursor: "pointer",
                paddingInline: 12,
                paddingBlock: 6,
                background: active ? colors.accent.phosphorCyan : "rgba(255,255,255,0.03)",
                color: active ? colors.bg.base : colors.text.secondary,
                border: `0.5px solid ${active ? colors.accent.phosphorCyan : colors.separator}`,
                borderRadius: 999,
                fontFamily: typography.family,
                fontSize: 12,
                fontWeight: typography.weight.medium,
                letterSpacing: "0.02em",
                minHeight: 32,
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Kicker({ children, tone = "cyan", size = "small" }) {
  const color = tone === "cyan" ? colors.accent.phosphorCyan : "rgba(255,255,255,0.55)";
  return (
    <div
      style={{
        fontFamily: typography.familyMono,
        fontSize: size === "micro" ? 10 : typography.size.microCaps,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color,
        fontWeight: typography.weight.medium,
      }}
    >
      {children}
    </div>
  );
}

function humanIntent(intent) {
  if (intent === "calma") return "Calma";
  if (intent === "enfoque") return "Enfoque";
  if (intent === "energia") return "Energía";
  if (intent === "reset") return "Reset";
  return intent || "—";
}
