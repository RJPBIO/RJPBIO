# SP-W · Protocol #24 Bilateral Walking Meditation — Cadena completa

**Date:** 2026-05-11
**Tier:** Reset (active useCase) · Protocol #24 Bilateral Walking Meditation
**Status:** ✅ Closed (3 primitives nuevos: P2+P3 dual-mode + P1 + P4)
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Walking meditation tradicional instrumentado con atención unilateral alternante (Teut 2013 RCT distress) + interocepción ambulatoria. Cero overclaim crónico — single session effects modestos pero medibles.

## Cadena #24 — 3 primitives dedicated (4 phases)

| Phase | Primitive | Cyan | Visual signature |
|---|---|---|---|
| P1 Preparación | `preambulatory_prep` | deep | Standing figure abstract + path dashed + 8 footprint dots sequential reveal + step numbers |
| P2 Pie Izquierdo | `walking_unilateral` (left) | mid | 8 protagonist footprints (filled al tap) + 8 ghost footprints other side + pace pulse + IZQ/der labels |
| P3 Pie Derecho | `walking_unilateral` (right) | light | Idéntico a P2 con mode mirror — labels DER/izq + protagonist row |
| P4 Cierre Estable | `stable_closing_commitment` | light | 3 grounding rings contract INWARD + 2 grounded footprints + ground line + palmas 14ª |

## Palmas conflict — 14ª resolución consecutiva

Catálogo P4 actualizado:
- "Mantén las palmas presionadas" → "Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón."

Patrón consistente cross-protocol: #18 P5, #19 P3, #20 P4, #21 P4, #22 P4, #23 P4, **#24 P4**.

## Innovaciones visuales únicas #24

### P1 Preambulatory Prep — Path con footprints alternantes
- Standing figure left side (head + body line + feet pair).
- Path dashed connecting figure → 8 footprint dots.
- Footprints alternate top/bottom offset (suggests real foot pattern).
- Sequential reveal indicating "ruta visualizada".

### P2/P3 Walking Unilateral — Dual-mode con protagonist + ghost rows
- **Pace pulse central** glowing @ paceBpm (60 bpm = 1Hz cycle).
- **Protagonist row (8 footprints)** se llenan con cada tap del lado atendido.
- **Ghost row (8 footprints)** del lado opuesto, faded — indica contraste lateral.
- IZQ/der labels mono cyan/muted respectivamente.
- **Current step glow** aura subtle alrededor del siguiente footprint a tap.
- Mode mirror simétrico (left ↔ right) via mode prop.

### P4 Stable Closing — Inward grounding rings (anti-pattern)
- **3 rings que se contraen INWARD** (92→58 radius over 3.5s cycle), opuesto al chain previo donde halos expandían outward.
- Simboliza "anclar aquí, no proyectar fuera" — coherente con la naturaleza de detención post-ambulatoria.
- 2 grounded footprints estáticos abajo del button + ground line dashed.

## Active tier compliance

- ✅ `validate.kind: "min_duration"` (P1) + `"tap_count"` x2 (P2, P3) + `"hold_press"` (P4)
- ✅ `voice.enabled_default: false`
- ✅ Binaural: P1 start type="reset" → P2/P3 continue → P4 stop
- ✅ `min_hold_ms: 5000` (active tier ≥ crisis 3000)
- ✅ Teut 2013 RCT framing preserved, NO overclaim crónico

## Calidad Apple-grade (wave 1+2+3 elevadores desde inicio)

Todos los 3 primitives reciben:
- ✅ Mount fade-in via `useMountFade`
- ✅ Idle micro-animations (pulse pace, ring decay, breath idle)
- ✅ Snap-flash al cruzar minHold (P4)
- ✅ Idle breathing pulse hold buttons (P4)
- ✅ Custom SVG glyphs (footprint ellipses, standing figure abstract, ground line)

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"text_emphasis_voice",props:{text,subtext}}                                  // P1
+ ui:{primitive:"preambulatory_prep",props:{text,subtext,duration_ms:30000}}

- ui:{primitive:"walking_pace_indicator",props:{target_steps:8,pattern:"left_only",pace_bpm:60}}  // P2
+ ui:{primitive:"walking_unilateral",props:{...mismo props}}

- ui:{primitive:"walking_pace_indicator",props:{...,pattern:"right_only"}}                   // P3
+ ui:{primitive:"walking_unilateral",props:{...,pattern:"right_only"}}

- ui:{primitive:"hold_press_button",props:{...,release_message:"Aquí. Reset."}}              // P4
+ ui:{primitive:"stable_closing_commitment",props:{...,release_message:"Aquí. Reset."}}
```

## Tests

OR-acceptance pattern en 4 sitios de `tier-24-25.test.js`:
- Acto 1: `text_emphasis_voice || preambulatory_prep`
- Acto 2: `walking_pace_indicator || walking_unilateral` (pattern: left_only)
- Acto 3: `walking_pace_indicator || walking_unilateral` (pattern: right_only)
- Acto 4: `hold_press_button || stable_closing_commitment`

VALID_PRIMITIVES extendido con 3 nuevos.

### Resultados
- **Full suite: 4989/4989 verde (251/251 files)**

## Storybook entries
- `PreambulatoryPrep · #24 P1`
- `WalkingUnilateral · #24 P2 left`
- `WalkingUnilateral · #24 P3 right`
- `StableClosingCommitment · #24 P4`

## Screenshots
- `screenshots/sp-w-24-walking/01-prep.png` — standing figure + 8 footprint dots + path
- `screenshots/sp-w-24-walking/02b-walking-left-4taps.png` — 8 protagonist (4 filled / 4 outline) + 8 ghost + pace pulse + "4 / 8"
- `screenshots/sp-w-24-walking/04-stable-closing.png` — 3 inward rings + 2 footprints + ground line + MANTÉN

## Phase 7 Total — 28 primitives dedicated cross 7 protocolos

| Chain | Protocol | Phases | Primitives |
|---|---|---|---|
| SP-Q | #18 Emergency Reset | 5 | 5 |
| SP-R | #19 Panic Interrupt | 3 | 3 |
| SP-S | #20 Block Break | 4 | 4 |
| SP-T | #21 Threshold Crossing | 4 | 4 |
| SP-U | #22 Vagal Hum Reset | 4 | 4 |
| SP-V | #23 Power Pose Activation | 4 | 4 |
| **SP-W** | **#24 Bilateral Walking Meditation** | **4** | **3 (P2+P3 dual)** |
| **Total** | **7 protocolos** | **28** | **27 primitives nuevos** |

**Resoluciones palmas conflict:** 14.
**Suite verde sostenida:** 4989/4989 en 27 migraciones consecutivas.

## Next
- **SP-X:** #25 Cardiac Pulse Match — última cadena Phase 7 si extiendes. 4 phases (encontrar pulso → conteo Schandry → sincronía pulso-respiración → cierre coherente). Mecanismos: Lehrer 2014 + Garfinkel 2015 + Khalsa 2018.
