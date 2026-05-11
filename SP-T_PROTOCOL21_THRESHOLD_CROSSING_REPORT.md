# SP-T · Protocol #21 Threshold Crossing — Cadena completa

**Date:** 2026-05-11
**Tier:** Reset (active useCase) · Protocol #21 Threshold Crossing
**Status:** ✅ Closed (4 primitives dedicated)
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Doorway effect (Radvansky 2006, 2010, 2011) dentro del framework de event segmentation theory (Zacks 2007). Cruzar un boundary físico o mental reorganiza working memory: instrumentación intencional permite reset cognitivo limpio entre tareas. Disclaimer fotosensible mantenido en `safety` (flash <250ms cumple WCAG 2.1 SC 2.3.1).

## Cadena #21 — 4 primitives dedicated con misma calidad SP-R/SP-S

| Phase | Primitive | Cyan | Visual signature distintivo |
|---|---|---|---|
| P1 Estado Actual | `load_identification` | deep | 5 chips load + weight glyph 4 bars + focal pulse + dot markers |
| P2 Aproximación | `threshold_gateway` (mode approach) | mid | Doorway frame 0.32→1.0 + 8 perspective lines + breath orb 4-4 + countdown |
| P3 Cruce | `threshold_gateway` (mode cross) | light | Flash 220ms WCAG + doorway expand 1.0→1.45→settle + "DEL OTRO LADO" emerge |
| P4 Del Otro Lado | `threshold_commitment` | light | Mantra word-by-word + hold-press 5s + 3 horizontal lanes + palmas 11ª |

## Reuse vs Dedicated decisión

- **`threshold_gateway` doble-modo** consolida Phases 2 y 3 en un solo primitive con prop `mode` — patrón ya validado en `crisis_sensory_anchor` (SP-Q-1/2/3). Reduce duplicación sin comprometer break-pattern interno (visual signature diferente por mode).
- **Reemplaza `doorway_visualizer` shared** con elevación visual Apple-grade: perspective lines convergiendo, breath orb sincronizado, "DEL OTRO LADO" text emerge.

## Palmas conflict — 11ª resolución consecutiva

Catálogo Phase 4 actualizado:
- "Mantén las palmas presionadas" → "Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón."
- Mechanism string actualizado con atribución a Bryan/Adams/Monin 2013 (sin redundancia).

Patrón consistente cross-protocol: #18 P5, #19 P3, #20 P4, #21 P4.

## Active tier compliance

- ✅ `validate.kind: "chip_selection"` (P1) + `"min_duration"` (P2/P3) + `"hold_press"` (P4) — NO `no_validation` (active tier exige validación)
- ✅ `voice.enabled_default: false` (active tier, default off)
- ✅ `min_hold_ms: 5000` (active tier: hold más largo que crisis cap 3000)
- ✅ Flash 220ms en cross mode (WCAG 2.1 SC 2.3.1 compliant)
- ✅ Safety disclaimer fotosensible preservado
- ✅ **Single-hand phone-friendly** (palmas conflict resuelto P4)

## Calidad Apple-grade aplicada

Todos los 4 primitives reciben **wave 1+2+3 elevadores**:
- ✅ Mount fade-in via `useMountFade` hook (420ms easeOutCubic + rise 8px)
- ✅ Custom SVG glyphs (no emojis, no generic glifos)
- ✅ Idle micro-animations (focal pulse, breath cycle, idle breath en hold buttons)
- ✅ Snap-flash al cruzar minHold (commitment)
- ✅ Body anchor text rotativo por phase state
- ✅ Eyebrow + primary prompt + hint + body anchor 4-capas

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"chip_selector",props:{...}}            // P1
+ ui:{primitive:"load_identification",props:{...}}

- ui:{primitive:"doorway_visualizer",props:{phase:"approach",...}}  // P2
+ ui:{primitive:"threshold_gateway",props:{phase:"approach",...}}

- ui:{primitive:"doorway_visualizer",props:{phase:"cross",...}}     // P3
+ ui:{primitive:"threshold_gateway",props:{phase:"cross",...}}

- ui:{primitive:"hold_press_button",props:{...,min_hold_ms:5000}}   // P4
+ ui:{primitive:"threshold_commitment",props:{...,min_hold_ms:5000}}
```

Mechanism strings preservados/refinados, validate kinds intactos, breath patterns intactos.

## Tests

OR-acceptance pattern aplicado en 4 sitios de `tier-21.test.js`:
- Acto 1: `chip_selector || load_identification`
- Acto 2: `doorway_visualizer || threshold_gateway` (phase: approach)
- Acto 3: `doorway_visualizer || threshold_gateway` (phase: cross)
- Acto 4: `hold_press_button || threshold_commitment`

VALID_PRIMITIVES extendido con 3 nuevos.

### Resultados
- `protocols.tier-21.test.js`: 33/33 ✅
- **Full suite: 4989/4989 verde (251/251 files)**

## Storybook entries
- `LoadIdentification · #21 P1`
- `ThresholdGateway · #21 P2 approach`
- `ThresholdGateway · #21 P3 cross`
- `ThresholdCommitment · #21 P4`

## Screenshots
- `screenshots/sp-t-21-threshold/01-load-identification.png` — 5 chips + weight glyph + focal pulse + dot markers
- `screenshots/sp-t-21-threshold/02-gateway-approach.png` — doorway frame + 8 perspective lines + breath orb + countdown 19s
- `screenshots/sp-t-21-threshold/03-gateway-cross-post-flash.png` — doorway expanded + "DEL OTRO LADO" emerging + body "Lo que cargabas se queda atrás"
- `screenshots/sp-t-21-threshold/04-commitment-pre-fresh.png` — mantra revealed + MANTÉN button + 3 lanes faded + body "Una mano en el pecho"

## Total resumen — 14 primitives dedicated Phase 7

Phase 7 status:
- SP-Q chain (#18): 5 primitives — crisis sensory anchor (triple-mode) + presence_anchor_commitment + physiological_sigh_orb reuse
- SP-R chain (#19): 3 primitives — vagal silent + apnea frontal + panic anchor closure
- SP-S chain (#20): 4 primitives — kinetic release + isometric release + reencuadre choice + micro action momentum
- **SP-T chain (#21): 4 primitives** — load identification + threshold gateway (dual-mode) + threshold commitment

**Total 14 primitives dedicated cross 4 protocolos, 11 resoluciones palmas conflict, 100% suite verde.**

## Next
- **SP-U:** #22 Vagal Hum Reset — humming primitive + counter timed (4 × 10s)
- **SP-V:** #23 Power Pose Activation — postural feedback + isometric core
