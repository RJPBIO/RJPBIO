"use client";
/* ═══════════════════════════════════════════════════════════════
   InstrumentDueCard — CTA discreto para el próximo instrumento
   psicométrico pendiente (PSS-4 mensual, SWEMWBS trimestral,
   PHQ-2 bajo demanda).

   Se apoya en `nextInstrumentDue` para decidir qué mostrar, abre
   `InstrumentRunner` cuando el usuario acepta, y persiste el
   resultado vía `useStore.logInstrument`.

   Invisible cuando no hay nada pendiente — no debe ensuciar el UI
   estable. Uso esperado: en el Dashboard (día 0 = primer baseline)
   y en Profile (recordatorio periódico).
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import Icon from "./Icon";
import InstrumentRunner from "./InstrumentRunner";
import { useStore } from "../store/useStore";
import {
  PSS4, WEMWBS7, PHQ2,
  scorePss4, scoreWemwbs7, scorePhq2,
  nextInstrumentDue,
} from "../lib/instruments";
import { resolveTheme, withAlpha, ty, font, space, radius } from "../lib/theme";
import { semantic } from "../lib/tokens";

const CONFIG = {
  "pss-4": {
    instrument: PSS4,
    scorer: scorePss4,
    blurb: "4 preguntas · estrés percibido · 1 minuto",
    icon: "shield",
    color: "#6366F1",
  },
  "wemwbs-7": {
    instrument: WEMWBS7,
    scorer: scoreWemwbs7,
    blurb: "7 preguntas · bienestar mental · 2 minutos",
    icon: "calm",
    color: "#059669",
  },
  "phq-2": {
    instrument: PHQ2,
    scorer: scorePhq2,
    blurb: "2 preguntas · screening opcional · 30 segundos",
    icon: "heart",
    color: "#DC2626",
  },
};

export default function InstrumentDueCard({ isDark, ac, defaultForce = null }) {
  const instruments = useStore((s) => s.instruments);
  const logInstrument = useStore((s) => s.logInstrument);
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(null);

  const due = useMemo(
    () => defaultForce || nextInstrumentDue(instruments || []),
    [instruments, defaultForce]
  );

  const { card: cd, border: bd, t1, t2, t3 } = resolveTheme(isDark);

  if (!due) return null;
  const cfg = CONFIG[due];
  if (!cfg) return null;

  const tint = cfg.color || ac;

  function handleOpen() {
    setPicked(due);
    setOpen(true);
  }

  function handleComplete(entry) {
    logInstrument(entry);
    setOpen(false);
    setPicked(null);
  }

  const pickedCfg = picked ? CONFIG[picked] : null;

  const MONO_DUE = "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
  return (
    <>
      <article
        role="region"
        aria-label={`Evaluación pendiente: ${cfg.instrument.name}`}
        style={{
          position: "relative",
          background: `radial-gradient(ellipse 70% 100% at 0% 50%, ${withAlpha(tint, 18)} 0%, transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.10) 100%)`,
          backdropFilter: "blur(22px) saturate(150%)",
          WebkitBackdropFilter: "blur(22px) saturate(150%)",
          border: `0.5px solid rgba(255,255,255,0.10)`,
          borderRadius: 16,
          padding: "13px 14px 13px 18px",
          marginBlockEnd: 14,
          display: "flex",
          gap: 12,
          alignItems: "center",
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 0 0 1px ${withAlpha(tint, 26)}, 0 6px 20px rgba(0,0,0,0.28), 0 0 18px ${withAlpha(tint, 12)}`,
          overflow: "hidden",
        }}
      >
        {/* Vertical accent strip on left edge — distinct "alert" marker */}
        <span aria-hidden="true" style={{ position: "absolute", insetBlockStart: 10, insetBlockEnd: 10, insetInlineStart: 0, inlineSize: 3, borderStartEndRadius: 99, borderEndEndRadius: 99, background: `linear-gradient(180deg, ${tint} 0%, ${withAlpha(tint, 60)} 100%)`, boxShadow: `0 0 8px ${withAlpha(tint, 70)}`, pointerEvents: "none" }} />

        {/* Icon tile glass */}
        <div
          aria-hidden="true"
          style={{
            position: "relative",
            inlineSize: 38,
            blockSize: 38,
            borderRadius: 11,
            background: `radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 55%), linear-gradient(140deg, ${withAlpha(tint, 28)} 0%, ${withAlpha(tint, 10)} 100%)`,
            border: `0.5px solid ${withAlpha(tint, 38)}`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18), 0 0 12px ${withAlpha(tint, 24)}, 0 0 0 1px rgba(0,0,0,0.20)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span style={{ filter: `drop-shadow(0 0 5px ${withAlpha(tint, 70)})` }}>
            <Icon name={cfg.icon} size={16} color={tint} />
          </span>
        </div>

        {/* Content stack */}
        <div style={{ flex: 1, minInlineSize: 0, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden="true" style={{ position: "relative", inlineSize: 5, blockSize: 5, display: "inline-block", flexShrink: 0 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: `radial-gradient(circle at 35% 30%, #fff 0%, ${tint} 55%, ${tint} 100%)`, boxShadow: `0 0 6px ${tint}, 0 0 2px ${tint}`, animation: "shimDot 2.4s ease-in-out infinite" }} />
            </span>
            <span style={{ fontFamily: MONO_DUE, fontSize: 8.5, fontWeight: 500, color: tint, letterSpacing: "0.22em", textTransform: "uppercase", textShadow: `0 0 6px ${withAlpha(tint, 50)}`, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Evaluación validada</span>
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: "rgba(245,245,247,0.96)", letterSpacing: -0.25, lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cfg.instrument.name}</span>
          <span style={{ fontFamily: MONO_DUE, fontSize: 8.5, fontWeight: 500, color: "rgba(245,245,247,0.50)", letterSpacing: "0.14em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cfg.blurb}</span>
        </div>

        {/* CTA pill — refined glass primary */}
        <button
          onClick={handleOpen}
          aria-label={`Empezar ${cfg.instrument.name}`}
          style={{
            position: "relative",
            background: `linear-gradient(180deg, ${tint} 0%, ${withAlpha(tint, 90)} 100%)`,
            color: "#08080A",
            border: "none",
            borderRadius: 99,
            paddingBlock: 10,
            paddingInline: 16,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.05,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            minBlockSize: 36,
            boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.40), inset 0 -1px 0 rgba(0,0,0,0.20), 0 0 0 1px ${withAlpha(tint, 60)}, 0 4px 14px ${withAlpha(tint, 40)}, 0 0 18px ${withAlpha(tint, 22)}`,
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <span aria-hidden="true" style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)`, pointerEvents: "none" }} />
          <span style={{ position: "relative", textShadow: "0 0 8px rgba(255,255,255,0.30), 0 1px 1px rgba(0,0,0,0.18)" }}>Empezar</span>
        </button>
      </article>

      {pickedCfg && (
        <InstrumentRunner
          show={open}
          instrument={pickedCfg.instrument}
          scorer={pickedCfg.scorer}
          isDark={isDark}
          onComplete={handleComplete}
          onClose={() => {
            setOpen(false);
            setPicked(null);
          }}
        />
      )}
    </>
  );
}
