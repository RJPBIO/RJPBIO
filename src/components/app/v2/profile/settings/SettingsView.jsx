"use client";
import { useStore } from "@/store/useStore";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Row, ScrollPad } from "../primitives";
import { typography, colors, spacing } from "../../tokens";
import Switch from "../Switch";
import Slider from "../Slider";

// Phase 6D SP6 — wiring real al store. Antes (SP3) usábamos
// INITIAL_SETTINGS_LOCAL como fixture local + useState volátil →
// los toggles "funcionaban" en la UI pero no persistían ni
// llegaban al engine de audio/voice/haptic en runtime. Bug-26.
//
// Los campos del DS ya existían post Phase 4 SP2 + Phase 5; SP6
// solo cambia el componente para leerlos del store y dispatch
// vía updateSettings (action existing en useStore.js).
//
// Mapeo store → UI:
//   remindersEnabled (boolean)        → "Recordatorio diario"
//   weeklySummaryEnabled (boolean)    → "Resumen semanal"
//   masterVolume (0..1)               → "Volumen general"
//   musicBedOn (boolean)              → "Música ambiental"
//   binauralOn (boolean)              → "Beats binaurales"
//   voiceOn (boolean)                 → "Voz TTS"
//   voiceRate (0.5..1.5)              → "Velocidad de voz"
//   hapticOn (boolean)                → "Vibraciones"
//   reducedMotionOverride ("auto"|"on"|"off") → "Reducir movimiento"
//
// "Resumen semanal" no tenía campo en DS — se agrega como local default
// que luego SP7+ puede wirar a un campo nuevo `weeklySummaryEnabled`.

export default function SettingsView({ onBack }) {
  // Lectura granular del store (selectores específicos para evitar
  // re-renders cuando cambian campos no relevantes a settings).
  const remindersEnabled = useStore((s) => s.remindersEnabled);
  const masterVolume = useStore((s) => s.masterVolume);
  const musicBedOn = useStore((s) => s.musicBedOn);
  const binauralOn = useStore((s) => s.binauralOn);
  const voiceOn = useStore((s) => s.voiceOn);
  const voiceRate = useStore((s) => s.voiceRate);
  const hapticOn = useStore((s) => s.hapticOn);
  const reducedMotionOverride = useStore((s) => s.reducedMotionOverride);
  const weeklySummaryEnabled = useStore((s) => s.weeklySummaryEnabled);

  const updateSettings = useStore((s) => s.updateSettings);

  // Helper: dispatch + persist via action existente.
  const set = (partial) => updateSettings(partial);

  return (
    <>
      <SubRouteHeader title="Ajustes" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>NOTIFICACIONES</Kicker>
          <ToggleRow
            label="Recordatorio diario"
            checked={!!remindersEnabled}
            onChange={(v) => set({ remindersEnabled: v })}
          />
          <ToggleRow
            label="Resumen semanal"
            checked={weeklySummaryEnabled !== false} // default true
            onChange={(v) => set({ weeklySummaryEnabled: v })}
          />
        </Section>

        <Section>
          <Kicker>AUDIO</Kicker>
          <SliderRow
            label="Volumen general"
            value={Number.isFinite(masterVolume) ? masterVolume : 1}
            onChange={(v) => set({ masterVolume: v })}
            format={(v) => Math.round(v * 100) + "%"}
          />
          <ToggleRow
            label="Música ambiental"
            checked={!!musicBedOn}
            onChange={(v) => set({ musicBedOn: v })}
          />
          <ToggleRow
            label="Beats binaurales"
            checked={!!binauralOn}
            onChange={(v) => set({ binauralOn: v })}
          />
        </Section>

        <Section>
          <Kicker>VOZ</Kicker>
          <ToggleRow
            label="Voz TTS"
            checked={!!voiceOn}
            onChange={(v) => set({ voiceOn: v })}
          />
          <SliderRow
            label="Velocidad de voz"
            min={0.5}
            max={1.5}
            step={0.05}
            value={Number.isFinite(voiceRate) ? voiceRate : 0.83}
            onChange={(v) => set({ voiceRate: v })}
            format={(v) => v.toFixed(2) + "×"}
          />
        </Section>

        <Section>
          <Kicker>HAPTIC</Kicker>
          <ToggleRow
            label="Vibraciones"
            checked={hapticOn !== false} // default true (DS no tiene hapticOn explicit; usamos hapticIntensity para gate)
            onChange={(v) => set({ hapticOn: v })}
          />
        </Section>

        <Section paddingBottom={48}>
          <Kicker>VISUAL</Kicker>
          <ToggleRow
            label="Reducir movimiento"
            checked={reducedMotionOverride === "on"}
            onChange={(v) => set({ reducedMotionOverride: v ? "on" : "auto" })}
          />
        </Section>
      </ScrollPad>
    </>
  );
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: spacing.s16,
        paddingBlock: 14,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
      }}
    >
      <span
        style={{
          fontFamily: typography.family,
          fontSize: typography.size.body,
          fontWeight: typography.weight.regular,
          color: "rgba(255,255,255,0.96)",
        }}
      >
        {label}
      </span>
      <Switch checked={checked} onChange={onChange} ariaLabel={label} />
    </div>
  );
}

function SliderRow({ label, value, onChange, min = 0, max = 1, step = 0.01, format = (v) => v }) {
  return (
    <div
      style={{
        paddingBlock: 14,
        borderBlockEnd: `0.5px solid ${colors.separator}`,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <Row between>
        <span
          style={{
            fontFamily: typography.family,
            fontSize: typography.size.body,
            fontWeight: typography.weight.regular,
            color: "rgba(255,255,255,0.96)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: typography.familyMono,
            fontSize: typography.size.microCaps,
            letterSpacing: "0.06em",
            color: "rgba(255,255,255,0.55)",
            fontWeight: typography.weight.medium,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {format(value)}
        </span>
      </Row>
      <Slider value={value} min={min} max={max} step={step} onChange={onChange} ariaLabel={label} />
    </div>
  );
}
