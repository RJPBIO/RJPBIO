"use client";
/* ═══════════════════════════════════════════════════════════════
   EVIDENCE BADGE — compact visual marker per protocol
   ═══════════════════════════════════════════════════════════════
   Chip monoespaciado que aparece junto al nombre del protocolo en
   el picker. Transmite credibility clínica sin fricción: el usuario
   ve antes de tap que este protocolo está respaldado por estudios.

   Uso:
     <EvidenceBadge protocol={p} />
     <EvidenceBadge evidence={evidenceObject} />  (directo)

   Tier → visual:
     high      → "CLÍNICO"    · accent verde (brand.primary)
     moderate  → "VALIDADO"   · info (semantic.info)
     limited   → "INICIAL"    · warning
     null      → no render (protocolos sin evidencia no muestran nada;
                 implícitamente son "applied" — no desinforma)
   ═══════════════════════════════════════════════════════════════ */

import { useMemo } from "react";
import { withAlpha, brand } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { evidenceForProtocol } from "../lib/evidence";
import { useT } from "../hooks/useT";

const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const TIER_KEY = {
  high: "clinical",
  moderate: "validated",
  limited: "limited",
};

const TIER_COLOR = {
  high: brand.primary,
  moderate: semantic.info,
  limited: semantic.warning,
};

/**
 * @param {object} props
 * @param {object} [props.protocol]   — objeto protocolo { n, int, ... }
 * @param {object} [props.evidence]   — evidence card directamente (bypass lookup)
 * @param {"sm"|"md"} [props.size="sm"]
 * @param {boolean} [props.showIcon=false] — punto decorativo inicial
 */
export default function EvidenceBadge({ protocol, evidence, size = "sm", showIcon = false }) {
  const { t } = useT();
  const resolved = useMemo(() => {
    if (evidence) return evidence;
    if (protocol) return evidenceForProtocol(protocol);
    return null;
  }, [protocol, evidence]);

  if (!resolved) return null;
  const tier = resolved.evidenceLevel;
  if (!tier || !TIER_KEY[tier]) return null;

  const color = TIER_COLOR[tier];
  const tierKey = TIER_KEY[tier];
  const label = t(`evidence.tier.${tierKey}`);
  const desc = t(`evidence.tierDesc.${tierKey}`);

  const isMd = size === "md";

  return (
    <span
      role="note"
      aria-label={`Nivel de evidencia: ${label.toLowerCase()}. ${desc}`}
      title={desc}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontFamily: MONO,
        fontSize: isMd ? 10 : 9,
        fontWeight: 800,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: color,
        paddingInline: isMd ? 8 : 7,
        paddingBlock: isMd ? 4 : 3,
        borderRadius: 999,
        background: withAlpha(color, 10),
        border: `1px solid ${withAlpha(color, 28)}`,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {showIcon && (
        <span
          aria-hidden="true"
          style={{
            inlineSize: 4,
            blockSize: 4,
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 6px ${withAlpha(color, 90)}`,
          }}
        />
      )}
      {label}
    </span>
  );
}
