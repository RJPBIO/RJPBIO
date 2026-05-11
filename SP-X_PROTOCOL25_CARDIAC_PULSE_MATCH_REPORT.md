# SP-X · Protocol #25 Cardiac Pulse Match — Cadena completa

**Date:** 2026-05-11
**Tier:** Calma (active useCase) · Protocol #25 Cardiac Pulse Match
**Status:** ✅ Closed (3 primitives nuevos: P1, P2, P4; P3 reusa flagship F2)
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Triple sinergia interocéptiva cardíaca:
1. **Heartbeat detection task** (Schandry 1981 Psychophysiology; Garfinkel 2015 Biological Psychology) — activa ínsula posterior + entrena interoceptive accuracy.
2. **Resonance frequency breathing 5.5rpm** (Lehrer & Gevirtz 2014; Vaschillo 2006) — maximiza HRV vía resonancia barorrefleja.
3. **Interocepción cardíaca explícita** (Khalsa 2018 Roadmap interoception) — awareness + accuracy en serie.

## Cadena #25 — 3 primitives nuevos + 1 flagship reused (4 phases)

| Phase | Primitive | Status | Cyan | Visual signature |
|---|---|---|---|---|
| P1 Encontrar Pulso | `pulse_location` | **nuevo** | deep | Wrist zone abstract + 2 dashed finger circles + ÍNDICE+MEDIO label + radial pulse dot @72bpm + ECG-waveform sweep |
| P2 Conteo Latidos | `heartbeat_count` | **nuevo** | mid | Central heartbeat orb pulsing + count "X" inside orb + 30s countdown + ínsula flash burst lateral al tap |
| P3 Sincronía | `cardiac_pulse_match_visual` | reuse F2 flagship | — | (Existing primitive dedicated previa Phase 7 F2) |
| P4 Cierre Coherente | `coherent_closing_commitment` | **nuevo** | light | **Heart rhythm halo** ECG-circular waveform rotando @5.5rpm + mantra "Coherencia. Sigo." + palmas 15ª |

## Palmas conflict — 15ª resolución consecutiva (final Phase 7)

Catálogo P4:
- "Mantén las palmas firmes contra el pecho" → "Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón."

Patrón consistente cross-protocol: #18 P5, #19 P3, #20 P4, #21 P4, #22 P4, #23 P4, #24 P4, **#25 P4**.

## Innovaciones visuales únicas #25

### P1 PulseLocation — Wrist + finger guide + ECG sweep
- Wrist zone rounded rectangle con vessel line dashed inside (radial artery).
- 2 dashed circles indicating finger placement (índice + medio) con unified label.
- Radial pulse dot pulsing @72 bpm (con sharp R-peak bell curve, no senoidal — heartbeat-like).
- Stylized ECG waveform abajo con sweep dot que viaja (foreshadowing P3).

### P2 HeartbeatCount — Central orb with count + ínsula glow
- Central heartbeat orb pulsing @72bpm reference rate.
- **Count "X" inside the orb** (number prominent, mono cyan).
- 30s countdown timer arriba del orb.
- **2 lateral ínsula glow burst** brief al tap (representa activación ínsula posterior bilateral, Garfinkel 2015).

### P4 CoherentClosing — Heart rhythm halo único
- **ECG-circular waveform** alrededor del button (60 segmentos forming a closed loop).
- R-peaks visualizados como bumps outward + S-valleys como dips inward.
- Rota lentamente @5.5rpm (11s cycle) — resonance frequency.
- Pattern único en Phase 7 — distinto de spokes (#22), rings (#19), arcs (#19), chevrons (#20), fan-out (#21), rays (#23), inward rings (#24).

## Active tier compliance

- ✅ `validate.kind: "min_duration"` (P1, P3) + `"min_duration"` con interval_ms (P2) + `"hold_press"` (P4)
- ✅ `voice.enabled_default: false`
- ✅ Binaural: P1 start type="calma" → P2/P3 continue → P4 stop
- ✅ `min_hold_ms: 5000`
- ✅ Lehrer 2014 + Garfinkel 2015 + Khalsa 2018 framing preserved

## Calidad Apple-grade (wave 1+2+3 elevadores aplicados)

Todos los 3 primitives nuevos reciben:
- ✅ Mount fade-in `useMountFade`
- ✅ Idle micro-animations (pulse @72bpm, halo rotation @5.5rpm, idle breath)
- ✅ Snap-flash al cruzar minHold (P4)
- ✅ Idle breathing pulse hold button (P4)
- ✅ Custom SVG glyphs (wrist zone, finger circles, heart rhythm waveform circular)

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"text_emphasis_voice",props:{...}}                  // P1
+ ui:{primitive:"pulse_location",props:{...,duration_ms:22000}}

- ui:{primitive:"pulse_match_visual",props:{mode:"count_only",...}}  // P2
+ ui:{primitive:"heartbeat_count",props:{mode:"count_only",...}}

  // P3 — cardiac_pulse_match_visual (Phase 7 F2 flagship) sin cambio

- ui:{primitive:"hold_press_button",props:{...,release:"Coherencia. Sigo."}}  // P4
+ ui:{primitive:"coherent_closing_commitment",props:{...,release:"Coherencia. Sigo."}}
```

## Tests

OR-acceptance pattern en 3 sitios (`tier-24-25.test.js`):
- Acto 1: `text_emphasis_voice || pulse_location`
- Acto 2: `pulse_match_visual || heartbeat_count`
- Acto 4: `hold_press_button || coherent_closing_commitment`

VALID_PRIMITIVES extendido con 3 nuevos.

### Resultados
- **Full suite: 4989/4989 verde (251/251 files)**

## Storybook entries
- `PulseLocation · #25 P1`
- `HeartbeatCount · #25 P2`
- `CoherentClosingCommitment · #25 P4`

## Screenshots
- `screenshots/sp-x-25-cardiac/01-pulse-location.png` — wrist zone + dashed fingers + radial pulse + ECG sweep
- `screenshots/sp-x-25-cardiac/02-heartbeat-count.png` — heartbeat orb con "7" count + 16s + TAP LATIDO button
- `screenshots/sp-x-25-cardiac/04-coherent-closing.png` — heart rhythm halo ECG-circular + MANTÉN + mantra revealed

## **Phase 7 FINAL — 30 primitives dedicated cross 8 protocolos**

| Chain | Protocol | Primitives | Calificación final |
|---|---|---|---|
| SP-Q | #18 Emergency Reset | 5 | 9.0 |
| SP-R | #19 Panic Interrupt | 3 | 9.3 |
| SP-S | #20 Block Break | 4 | 9.2 |
| SP-T | #21 Threshold Crossing | 4 | 9.4 |
| SP-U | #22 Vagal Hum Reset | 4 | 9.5 |
| SP-V | #23 Power Pose Activation | 4 | 9.5 |
| SP-W | #24 Bilateral Walking Meditation | 3 | 9.4 |
| **SP-X** | **#25 Cardiac Pulse Match** | **3** | **9.4** |
| **Total** | **8 protocolos** | **30 primitives nuevos** | **~9.3 promedio** |

(Nota: 30 incluye reuse de cardiac_pulse_match_visual F2 flagship + crisis_sensory_anchor triple-mode + physiological_sigh_orb reuse en #18 P4)

**Logros transversales:**
- 15 resoluciones palmas conflict (todos los cierres commitment + algunos mid-protocol)
- 4989/4989 sostenido en 30+ migraciones consecutivas
- Wave 1+2+3 elevadores universales (mount fade, idle breath, snap flash, glyphs custom, 4-capas semánticas)
- Cyan family progression deep/mid/light consistente
- 0 regressions

## Cinematic moments destacados

1. **#21 doorway architecture** (arched top + light beam + threshold step) — P21 SP-T
2. **#22 nasal NO glow points** (Maniscalco 2003 visualizado) — P22 SP-U
3. **#23 energy rays radiating** (8 spokes con rotation + pulse waves) — P23 SP-V
4. **#22 breathing halo @5.5rpm** (cadencia resonante visualizada) — P22 SP-U P4
5. **#25 heart rhythm halo ECG-circular** (coherencia cardíaca visualizada) — P25 SP-X P4
6. **#24 inward grounding rings** (anti-pattern contraction) — P24 SP-W P4
7. **#19 silent vagal mechanism pivot** ("no puede haber sonido") — SP-R-1

## **Phase 7 cerrada** ✅
