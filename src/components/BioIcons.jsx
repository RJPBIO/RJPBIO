"use client";
/* ═══════════════════════════════════════════════════════════════
   BIO-ICONS — glifos propios de la identidad neural
   ═══════════════════════════════════════════════════════════════
   Iconos artesanales para el dominio bio-neural. Cada glifo usa
   el vocabulario visual: nodo + rayos asimétricos, trazo 1.5,
   punto de luz en vértices clave (cian fósforo). Se consumen por
   nombre desde Icon.jsx; si un nombre no existe aquí, cae a
   lucide-react. No reemplazamos todo — solo los identitarios.
   ═══════════════════════════════════════════════════════════════ */

import { bioSignal } from "../lib/theme";

const base = (size, color, strokeWidth) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: color,
  strokeWidth,
  strokeLinecap: "round",
  strokeLinejoin: "round",
});

export function NeuralSpark({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <circle cx="12" cy="12" r="2.6" fill={color} stroke="none" />
      <line x1="12" y1="12" x2="18.5" y2="5.5" />
      <line x1="12" y1="12" x2="5.5" y2="18.5" opacity="0.55" />
      <line x1="12" y1="12" x2="12" y2="22" opacity="0.75" />
      <circle cx="18.5" cy="5.5" r="1" fill={bioSignal.ignition} stroke="none" />
    </svg>
  );
}

export function PrefrontalTarget({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <circle cx="12" cy="12" r="9" opacity="0.35" />
      <circle cx="12" cy="12" r="5.5" opacity="0.7" />
      <circle cx="12" cy="12" r="1.5" fill={color} stroke="none" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
  );
}

export function VagalWave({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <path d="M2 14 Q 6 7, 10 14 T 18 14" />
      <path d="M2 18 Q 6 12, 10 18 T 18 18" opacity="0.45" />
      <circle cx="20" cy="14" r="1.8" fill={color} stroke="none" />
      <circle cx="20" cy="14" r="3.2" opacity="0.35" />
    </svg>
  );
}

export function IgnitionCore({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <circle cx="12" cy="12" r="3" fill={color} stroke="none" />
      <path d="M12 4 L 13.6 9 L 12 12 L 10.4 9 Z" />
      <path d="M12 20 L 13.6 15 L 12 12 L 10.4 15 Z" opacity="0.6" />
      <path d="M4 12 L 9 13.6 L 12 12 L 9 10.4 Z" opacity="0.75" />
      <path d="M20 12 L 15 13.6 L 12 12 L 15 10.4 Z" opacity="0.5" />
    </svg>
  );
}

export function ResilienceField({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <path d="M12 2 L 21 7 L 21 14 Q 21 19, 12 22 Q 3 19, 3 14 L 3 7 Z" />
      <circle cx="12" cy="12" r="2" fill={color} stroke="none" />
      <line x1="12" y1="12" x2="15.5" y2="8.5" opacity="0.6" />
      <line x1="12" y1="12" x2="8.5" y2="15.5" opacity="0.6" />
    </svg>
  );
}

export function SignalDots({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <path d="M12 3 L 13.5 10.5 L 21 12 L 13.5 13.5 L 12 21 L 10.5 13.5 L 3 12 L 10.5 10.5 Z" fill={color} stroke="none" opacity="0.85" />
      <circle cx="19" cy="5" r="1.2" fill={bioSignal.ignition} stroke="none" />
      <circle cx="5" cy="19" r="0.8" fill={color} stroke="none" opacity="0.7" />
    </svg>
  );
}

export function InstrumentArc({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <path d="M3 16 A 9 9 0 0 1 21 16" />
      <path d="M6 16 A 6 6 0 0 1 18 16" opacity="0.4" strokeDasharray="1.5 2" />
      <line x1="12" y1="16" x2="16.5" y2="10" />
      <circle cx="12" cy="16" r="1.8" fill={color} stroke="none" />
      <circle cx="16.5" cy="10" r="1.1" fill={bioSignal.ignition} stroke="none" />
    </svg>
  );
}

export function NeuralMesh({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <line x1="7" y1="6" x2="17" y2="12" opacity="0.55" />
      <line x1="17" y1="12" x2="6" y2="18" opacity="0.55" />
      <line x1="7" y1="6" x2="6" y2="18" opacity="0.35" />
      <circle cx="7" cy="6" r="2.2" fill={color} stroke="none" />
      <circle cx="17" cy="12" r="2.6" fill={color} stroke="none" />
      <circle cx="6" cy="18" r="1.8" fill={color} stroke="none" />
      <circle cx="17" cy="12" r="4" opacity="0.3" />
    </svg>
  );
}

export function IgnitionCrown({ size, color, strokeWidth = 1.5, aria }) {
  return (
    <svg {...base(size, color, strokeWidth)} role={aria ? "img" : undefined} aria-label={aria} aria-hidden={aria ? undefined : "true"}>
      <path d="M4 18 L 5 9 L 9 13 L 12 6 L 15 13 L 19 9 L 20 18 Z" fill={color} stroke="none" opacity="0.9" />
      <circle cx="12" cy="6" r="1.3" fill={bioSignal.ignition} stroke="none" />
      <line x1="5" y1="21" x2="19" y2="21" strokeWidth={strokeWidth * 1.2} />
    </svg>
  );
}

export const BIO_ICONS = {
  bolt: NeuralSpark,
  focus: PrefrontalTarget,
  calm: VagalWave,
  energy: IgnitionCore,
  shield: ResilienceField,
  sparkle: SignalDots,
  gauge: InstrumentArc,
  brain: NeuralMesh,
  mind: NeuralMesh,
  trophy: IgnitionCrown,
};
