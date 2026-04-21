"use client";
/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENT BADGE — insignias ilustradas por logro
   ═══════════════════════════════════════════════════════════════
   Cada archetype es una escena SVG con paleta y tier. Las tiers
   raras (gold/violet/rose) reciben capa de identidad adicional:
   sparkles en golden-angle, arco conic rotatorio (solo gold) y
   kicker mono con tier, para que un logro elite se lea como
   artefacto — no como emoji.
   ═══════════════════════════════════════════════════════════════ */

import { motion } from "framer-motion";
import { bioSignal, font, space, radius, withAlpha } from "../lib/theme";
import { semantic } from "../lib/tokens";
import { useReducedMotion } from "../lib/a11y";

// Bronze/Silver no tienen token propio en bioSignal porque literalmente
// son colores de medalla (no del sistema neural). Bronze usa semantic.warning
// porque coincide con el ámbar de warning; silver queda como gray neutral
// (no mapea a ningún token — es "metal", no estado semántico).
const TIERS = {
  bronze: { primary: semantic.warning,       secondary: "#92400E", glow: "#FBBF24", name: "Bronce" },
  silver: { primary: "#94A3B8",              secondary: "#64748B", glow: "#E2E8F0", name: "Plata" },
  gold:   { primary: bioSignal.ignition,     secondary: "#D97706", glow: "#FEF3C7", name: "Oro" },
  cyan:   { primary: bioSignal.phosphorCyan, secondary: "#0891B2", glow: "#A5F3FC", name: "Cian" },
  violet: { primary: bioSignal.neuralViolet, secondary: "#6D28D9", glow: "#C4B5FD", name: "Violeta" },
  rose:   { primary: bioSignal.plasmaPink,   secondary: "#DB2777", glow: "#FBCFE8", name: "Rosa" },
};

const RARE = new Set(["gold", "violet", "rose"]);
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const MONO = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";

const META = {
  streak7:      { archetype: "flame",   tier: "bronze", label: "Chispa", caption: "7 días" },
  streak14:     { archetype: "flame",   tier: "silver", label: "Brasa",  caption: "14 días" },
  streak30:     { archetype: "flame",   tier: "gold",   label: "Fuego",  caption: "30 días" },
  streak60:     { archetype: "flame",   tier: "gold",   label: "Ignición", caption: "60 días" },
  sessions50:   { archetype: "rings",   tier: "cyan",   label: "50",     caption: "Sesiones" },
  sessions100:  { archetype: "rings",   tier: "violet", label: "100",    caption: "Centurión" },
  sessions250:  { archetype: "rings",   tier: "gold",   label: "250",    caption: "Arquitecto" },
  time60:       { archetype: "arc",     tier: "cyan",   label: "1h",     caption: "Tiempo" },
  time300:      { archetype: "arc",     tier: "violet", label: "5h",     caption: "Tiempo" },
  coherencia90: { archetype: "spark",   tier: "cyan",   label: "90%",    caption: "Coherencia" },
  bioSignal80:  { archetype: "spark",   tier: "gold",   label: "80+",    caption: "BioSignal" },
  mood5:        { archetype: "spark",   tier: "rose",   label: "Pico",   caption: "Ánimo 5/5" },
  moodRecovery: { archetype: "spark",   tier: "violet", label: "↑",      caption: "Recuperación" },
  earlyBird:    { archetype: "sun",     tier: "gold",   label: "AM",     caption: "Antes 7am" },
  nightOwl:     { archetype: "moon",    tier: "violet", label: "PM",     caption: "Después 10pm" },
  calibrated:   { archetype: "target",  tier: "cyan",   label: "Base",   caption: "Calibrado" },
  weekPerfect:  { archetype: "week",    tier: "gold",   label: "7/7",    caption: "Semana perfecta" },
  allProtos:    { archetype: "grid",    tier: "violet", label: "14",     caption: "Todos" },
};

const svgCommon = { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 64 64" };

function FrameHex({ color, locked }) {
  return (
    <g>
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={locked ? 0.3 : 0.7}
      />
      <polygon
        points="32,4 56,18 56,46 32,60 8,46 8,18"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        strokeDasharray="1 2"
        opacity={locked ? 0.2 : 0.35}
        transform="scale(0.88) translate(4.4 4.4)"
      />
    </g>
  );
}

function FrameRing({ color, locked }) {
  return (
    <g>
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity={locked ? 0.3 : 0.7}
        strokeDasharray="1 4"
      />
      <circle
        cx="32"
        cy="32"
        r="24"
        fill="none"
        stroke={color}
        strokeWidth="0.5"
        opacity={locked ? 0.2 : 0.35}
      />
    </g>
  );
}

function FlameGlyph({ t }) {
  return (
    <g>
      <path d="M32 16 Q38 26, 38 34 Q38 44, 32 48 Q26 44, 26 34 Q26 26, 32 16Z" fill={t.primary} />
      <path d="M32 26 Q35 32, 35 37 Q35 43, 32 45 Q29 43, 29 37 Q29 32, 32 26Z" fill={t.glow} opacity="0.9" />
      <circle cx="32" cy="40" r="2" fill="#FFFFFF" />
    </g>
  );
}

function RingsGlyph({ t }) {
  return (
    <g>
      <circle cx="32" cy="32" r="18" fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.4" />
      <circle cx="32" cy="32" r="13" fill="none" stroke={t.primary} strokeWidth="1.5" opacity="0.7" />
      <circle cx="32" cy="32" r="8" fill={t.primary} opacity="0.6" />
      <circle cx="32" cy="32" r="4" fill={t.glow} />
    </g>
  );
}

function ArcGlyph({ t }) {
  return (
    <g>
      <path d="M16 42 A 16 16 0 0 1 48 42" fill="none" stroke={t.primary} strokeWidth="2" strokeLinecap="round" />
      <path d="M20 42 A 12 12 0 0 1 44 42" fill="none" stroke={t.primary} strokeWidth="1" strokeDasharray="1.5 2" opacity="0.5" />
      <line x1="32" y1="42" x2="42" y2="28" stroke={t.primary} strokeWidth="2" strokeLinecap="round" />
      <circle cx="32" cy="42" r="3" fill={t.primary} />
      <circle cx="42" cy="28" r="2.2" fill={t.glow} />
    </g>
  );
}

function SparkGlyph({ t }) {
  const pts = [
    { x: 32, y: 14, r: 3 },
    { x: 48, y: 28, r: 2 },
    { x: 32, y: 50, r: 2.5 },
    { x: 16, y: 28, r: 1.8 },
    { x: 42, y: 44, r: 1.5 },
  ];
  return (
    <g>
      {pts.map((p, i) => (
        <line key={i} x1="32" y1="32" x2={p.x} y2={p.y} stroke={t.primary} strokeWidth="0.8" opacity="0.35" />
      ))}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={t.primary} />
      ))}
      <circle cx="32" cy="32" r="5" fill={t.glow} />
      <circle cx="32" cy="32" r="2" fill="#FFFFFF" />
    </g>
  );
}

function SunGlyph({ t }) {
  return (
    <g>
      <circle cx="32" cy="38" r="8" fill={t.primary} />
      <circle cx="32" cy="38" r="4" fill={t.glow} />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <line
          key={i}
          x1={32 + i * 4}
          y1={22}
          x2={32 + i * 4}
          y2={18}
          stroke={t.primary}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={1 - Math.abs(i) * 0.2}
        />
      ))}
      <line x1="10" y1="48" x2="54" y2="48" stroke={t.primary} strokeWidth="1.2" opacity="0.6" />
    </g>
  );
}

function MoonGlyph({ t }) {
  return (
    <g>
      <path
        d="M38 18 A 16 16 0 1 0 44 46 A 12 12 0 0 1 38 18 Z"
        fill={t.primary}
      />
      <circle cx="16" cy="14" r="1" fill={t.glow} />
      <circle cx="48" cy="24" r="1.3" fill={t.glow} />
      <circle cx="14" cy="34" r="0.8" fill={t.glow} opacity="0.7" />
      <circle cx="52" cy="44" r="0.8" fill={t.glow} opacity="0.7" />
    </g>
  );
}

function TargetGlyph({ t }) {
  return (
    <g>
      <circle cx="32" cy="32" r="14" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.45" />
      <circle cx="32" cy="32" r="9" fill="none" stroke={t.primary} strokeWidth="1.2" opacity="0.7" />
      <circle cx="32" cy="32" r="4" fill={t.primary} />
      <line x1="32" y1="14" x2="32" y2="18" stroke={t.primary} strokeWidth="1.5" />
      <line x1="32" y1="46" x2="32" y2="50" stroke={t.primary} strokeWidth="1.5" />
      <line x1="14" y1="32" x2="18" y2="32" stroke={t.primary} strokeWidth="1.5" />
      <line x1="46" y1="32" x2="50" y2="32" stroke={t.primary} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="1.5" fill={t.glow} />
    </g>
  );
}

function WeekGlyph({ t }) {
  return (
    <g>
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 10 + i * 7.3;
        return (
          <g key={i}>
            <circle cx={x} cy="32" r="3" fill={t.primary} />
            <circle cx={x} cy="32" r="1.3" fill={t.glow} />
          </g>
        );
      })}
      <path d="M6 40 Q 32 46, 58 40" stroke={t.primary} strokeWidth="1.2" fill="none" opacity="0.4" />
    </g>
  );
}

function GridGlyph({ t }) {
  const cells = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const idx = r * 4 + c;
      if (idx >= 14) continue;
      const x = 16 + c * 8;
      const y = 16 + r * 8;
      cells.push({ x, y, k: idx });
    }
  }
  return (
    <g>
      {cells.map((cell) => (
        <rect
          key={cell.k}
          x={cell.x}
          y={cell.y}
          width="5"
          height="5"
          rx="1.2"
          fill={t.primary}
          opacity={0.55 + (cell.k % 3) * 0.15}
        />
      ))}
    </g>
  );
}

const ARCHETYPES = {
  flame: { glyph: FlameGlyph, frame: FrameHex },
  rings: { glyph: RingsGlyph, frame: FrameRing },
  arc: { glyph: ArcGlyph, frame: FrameHex },
  spark: { glyph: SparkGlyph, frame: FrameRing },
  sun: { glyph: SunGlyph, frame: FrameHex },
  moon: { glyph: MoonGlyph, frame: FrameHex },
  target: { glyph: TargetGlyph, frame: FrameRing },
  week: { glyph: WeekGlyph, frame: FrameHex },
  grid: { glyph: GridGlyph, frame: FrameHex },
};

export function achievementMeta(id) {
  return META[id] || { archetype: "spark", tier: "cyan", label: "?", caption: id };
}

export default function AchievementBadge({ id, unlocked = false, size = 72, showCaption = true, recent = false }) {
  const reduced = useReducedMotion();
  const meta = META[id] || { archetype: "spark", tier: "cyan", label: "?", caption: id };
  const t = TIERS[meta.tier] || TIERS.cyan;
  const arch = ARCHETYPES[meta.archetype] || ARCHETYPES.spark;
  const Frame = arch.frame;
  const Glyph = arch.glyph;
  const isRare = unlocked && RARE.has(meta.tier);

  const sparkles = Array.from({ length: 5 }, (_, i) => {
    const angle = i * GOLDEN_ANGLE;
    const radius = size * 0.48;
    return {
      id: i,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      delay: i * 0.35,
      r: 1.4 + (i % 3) * 0.6,
    };
  });

  const ariaLabel = `${meta.label} · ${meta.caption}${unlocked ? (recent ? " (desbloqueado recientemente)" : "") : " (bloqueado)"}`;

  return (
    <motion.div
      role="img"
      aria-label={ariaLabel}
      whileHover={reduced || !unlocked ? {} : { scale: 1.05 }}
      whileTap={reduced || !unlocked ? {} : { scale: 0.96 }}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: space[1],
        filter: unlocked ? "none" : "grayscale(1) brightness(0.6)",
        opacity: unlocked ? 1 : 0.55,
        transition: "filter 0.3s, opacity 0.3s",
      }}
    >
      <div
        style={{
          position: "relative",
          inlineSize: size,
          blockSize: size,
        }}
      >
        {unlocked && !reduced && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -2,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${t.glow}, transparent 70%)`,
              filter: "blur(8px)",
              opacity: 0.35,
            }}
            animate={{ opacity: recent ? [0.4, 0.85, 0.4] : [0.2, 0.5, 0.2] }}
            transition={{ duration: recent ? 1.6 : 3, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {unlocked && recent && !reduced && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${bioSignal.ignition}, transparent 65%)`,
              filter: "blur(12px)",
              mixBlendMode: "screen",
            }}
            animate={{ opacity: [0.35, 0.75, 0.35], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        {meta.tier === "gold" && unlocked && !reduced && (
          <motion.div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: "50%",
              padding: 1,
              background: `conic-gradient(from 0deg, transparent 0%, ${t.glow} 10%, ${t.primary} 25%, transparent 40%, transparent 60%, ${t.glow} 75%, transparent 90%)`,
              WebkitMask: "radial-gradient(circle, transparent 66%, #000 68%)",
              mask: "radial-gradient(circle, transparent 66%, #000 68%)",
              opacity: 0.85,
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          />
        )}

        {isRare && !reduced && (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              insetInlineStart: "50%",
              insetBlockStart: "50%",
              inlineSize: 0,
              blockSize: 0,
            }}
          >
            {sparkles.map((s) => (
              <motion.span
                key={s.id}
                style={{
                  position: "absolute",
                  insetInlineStart: s.x,
                  insetBlockStart: s.y,
                  inlineSize: s.r * 2,
                  blockSize: s.r * 2,
                  borderRadius: "50%",
                  background: t.glow,
                  boxShadow: `0 0 6px ${t.primary}`,
                  translate: "-50% -50%",
                }}
                animate={{ opacity: [0, 1, 0], scale: [0.6, 1.1, 0.6] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  delay: s.delay,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        <svg
          {...svgCommon}
          width={size}
          height={size}
          style={{ position: "relative", display: "block" }}
        >
          <Frame color={t.primary} locked={!unlocked} />
          <Glyph t={t} />
          {!unlocked && (
            <g opacity="0.92">
              <circle cx="32" cy="36" r="11" fill="rgba(15,23,42,0.88)" stroke="#64748B" strokeWidth="0.8" />
              <rect x="26" y="33" width="12" height="10" rx="1.5" fill="#1A2330" stroke="#94A3B8" strokeWidth="0.9" />
              <path d="M28.5 33 L 28.5 29.5 A 3.5 3.5 0 0 1 35.5 29.5 L 35.5 33" fill="none" stroke="#94A3B8" strokeWidth="1" />
              <circle cx="32" cy="38" r="1.3" fill="#94A3B8" />
            </g>
          )}
        </svg>
      </div>
      {showCaption && (
        <div style={{ textAlign: "center", maxInlineSize: size + 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          {unlocked && recent && (
            <span
              aria-label="Desbloqueado recientemente"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                fontFamily: MONO,
                fontSize: 8,
                fontWeight: font.weight.black,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: bioSignal.ignition,
                paddingInline: 5,
                paddingBlock: 1,
                borderRadius: radius.full,
                background: withAlpha(bioSignal.ignition, 12),
                border: `1px solid ${withAlpha(bioSignal.ignition, 30)}`,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  inlineSize: 3,
                  blockSize: 3,
                  borderRadius: "50%",
                  background: bioSignal.ignition,
                  boxShadow: `0 0 4px ${bioSignal.ignition}`,
                }}
              />
              Nuevo
            </span>
          )}
          <div
            style={{
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: font.weight.bold,
              color: unlocked ? t.primary : "rgba(148,163,184,0.8)",
              letterSpacing: -0.2,
              lineHeight: 1.2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {meta.label}
          </div>
          <div
            style={{
              fontSize: 10,
              fontWeight: font.weight.medium,
              color: unlocked ? "rgba(148,163,184,0.85)" : "rgba(148,163,184,0.6)",
              letterSpacing: -0.05,
              lineHeight: 1.3,
            }}
          >
            {unlocked ? meta.caption : "Bloqueado"}
          </div>
        </div>
      )}
    </motion.div>
  );
}
