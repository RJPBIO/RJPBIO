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

  return (
    <>
      <article
        role="region"
        aria-label={`Evaluación pendiente: ${cfg.instrument.name}`}
        style={{
          background: `linear-gradient(145deg, ${cd}, ${withAlpha(tint, 6)})`,
          border: `1px solid ${withAlpha(tint, 25)}`,
          borderRadius: radius.lg,
          padding: space[4],
          marginBlockEnd: space[4],
          display: "flex",
          gap: space[3],
          alignItems: "center",
        }}
      >
        <div
          aria-hidden
          style={{
            inlineSize: 40,
            blockSize: 40,
            borderRadius: radius.md,
            background: withAlpha(tint, 14),
            color: tint,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={cfg.icon} size={18} color={tint} />
        </div>
        <div style={{ flex: 1, minInlineSize: 0 }}>
          <p
            style={{
              fontSize: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
              color: tint,
              fontWeight: font.weight.bold,
              margin: 0,
            }}
          >
            Evaluación validada
          </p>
          <p style={{ ...ty.title(t1), margin: 0, marginBlockStart: 2 }}>
            {cfg.instrument.name}
          </p>
          <p style={{ ...ty.caption(t3), margin: 0, marginBlockStart: 2 }}>{cfg.blurb}</p>
        </div>
        <button
          onClick={handleOpen}
          aria-label={`Empezar ${cfg.instrument.name}`}
          className="bi-btn bi-btn-primary"
          style={{
            background: tint,
            color: "#fff",
            border: "none",
            borderRadius: radius.md,
            padding: `${space[2.5]}px ${space[4]}px`,
            fontSize: font.size.md,
            fontWeight: font.weight.bold,
            cursor: "pointer",
            whiteSpace: "nowrap",
            fontFamily: "inherit",
            minBlockSize: 40,
            transition: "filter 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
          }}
        >
          Empezar
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
