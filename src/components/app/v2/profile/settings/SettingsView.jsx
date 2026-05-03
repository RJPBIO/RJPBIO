"use client";
import { useState } from "react";
import SubRouteHeader from "../SubRouteHeader";
import { Section, Kicker, Row, ScrollPad } from "../primitives";
import { typography, colors, spacing } from "../../tokens";
import Switch from "../Switch";
import Slider from "../Slider";
import { FIXTURE_SETTINGS } from "../fixtures";

export default function SettingsView({ onBack }) {
  const [s, setS] = useState(FIXTURE_SETTINGS);
  const upd = (path) => (v) => setS((prev) => deepSet(prev, path, v));

  return (
    <>
      <SubRouteHeader title="Ajustes" onBack={onBack} />
      <ScrollPad>
        <Section>
          <Kicker>NOTIFICACIONES</Kicker>
          <ToggleRow label="Recordatorio diario" checked={s.reminders.enabled} onChange={upd("reminders.enabled")} />
          <ToggleRow label="Resumen semanal"     checked={s.weeklySummary}     onChange={upd("weeklySummary")} />
        </Section>

        <Section>
          <Kicker>AUDIO</Kicker>
          <SliderRow label="Volumen general" value={s.audio.volume} onChange={upd("audio.volume")} format={(v) => Math.round(v * 100) + "%"} />
          <ToggleRow label="Música ambiental"  checked={s.audio.music}    onChange={upd("audio.music")} />
          <ToggleRow label="Beats binaurales"  checked={s.audio.binaural} onChange={upd("audio.binaural")} />
        </Section>

        <Section>
          <Kicker>VOZ</Kicker>
          <ToggleRow label="Voz TTS" checked={s.voice.enabled} onChange={upd("voice.enabled")} />
          <SliderRow label="Velocidad de voz" min={0.5} max={1.5} step={0.05} value={s.voice.rate} onChange={upd("voice.rate")} format={(v) => v.toFixed(2) + "×"} />
        </Section>

        <Section>
          <Kicker>HAPTIC</Kicker>
          <ToggleRow label="Vibraciones" checked={s.haptic.enabled} onChange={upd("haptic.enabled")} />
        </Section>

        <Section paddingBottom={48}>
          <Kicker>VISUAL</Kicker>
          <ToggleRow label="Reducir movimiento" checked={s.reducedMotion} onChange={upd("reducedMotion")} />
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

function deepSet(obj, path, value) {
  const keys = path.split(".");
  const out = JSON.parse(JSON.stringify(obj));
  let cur = out;
  for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
  cur[keys[keys.length - 1]] = value;
  return out;
}
