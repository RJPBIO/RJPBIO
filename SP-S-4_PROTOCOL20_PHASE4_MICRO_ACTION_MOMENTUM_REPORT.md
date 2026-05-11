# SP-S-4 · Protocol #20 Phase 4 — Acción Micro (Cierre)

**Date:** 2026-05-11
**Tier:** Crisis Cognitiva · Protocol #20 Block Break · Cierre del protocolo
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Palmas conflict — 10ª resolución consecutiva

Catálogo original: "Mantén las palmas presionadas. UNA acción de 5 minutos al volver."
- **Mano libre** descansa contra el pecho (auto-soothe + anclaje propioceptivo).
- **Pulgar** de la mano que sostiene el teléfono mantiene firme el botón hold.

Idéntica resolución que #19 P3, #18 P5 — patrón consistente cross-protocolo crisis.

## Mecanismo

Commitment motor a micro-acción concreta + hold press sostenido + identificación verbal de UNA acción específica de 5 minutos crea momentum y rompe parálisis residual (Bryan/Adams/Monin 2013, implementation intentions).

## Primitive

**`MicroActionMomentumPrimitive.jsx`** — reemplaza `hold_press_button` shared.

### 3-capas
- **Eyebrow:** "ACCIÓN · MOMENTUM"
- **Top label:** **"5 MIN"** mono cyan grande (32px, weight light, letter-spacing 0.10em) — prominent commitment.
- **Primary prompt (rotativo):**
  - pre → "Mano libre al pecho · Pulgar firme"
  - hold → "Mantén. UNA acción concreta."
  - release → "5 minutos. Concreto."
- **Body anchor:**
  - pre → "Una mano en el pecho"
  - hold → "Identifica la acción"
  - release → "Adelante"

### Visual signature — break-pattern total

| #18 P5 | #19 P3 | #20 P4 |
|---|---|---|
| Concentric rings | 4 cardinal arcs (halo escudo) | **5 momentum chevrons → derecha** |
| Round button | Round button | **Pill-shape button (rounded rect)** |
| Mid cyan | Light cyan | **Light cyan + mono "5 MIN" label** |
| Word-by-word mantra | Word-by-word mantra | **Numeric label "5 MIN" prominente** |

### 5 momentum chevrons
- 5 chevrons `>` horizontales abajo del botón.
- Durante hold sostenido: se iluminan secuencialmente según `holdRatio` (chevron i lit cuando ratio ≥ (i+1)/5).
- En release: todos completamente lit (opacity 0.95).
- En pre: faded a 0.18.
- Representan los 5 minutos comprometidos + dirección de movimiento (forward).

### Pill button distintivo
- 92×60px rounded rect (`borderRadius: 30`) — break-pattern vs todos los círculos previos.
- Press feedback: scale 1.04, border 1.6→2.5px, bg `${color}14`→`${color}30`.
- Halo circular SVG detrás del pill + progress ring acumulando holdRatio.

### Comportamiento
- `min_hold_ms: 3000` (≤3000 crisis cap).
- Si user suelta antes: phase vuelve a "pre", holdProgressMs=0, sin sanción.
- Al completar: haptic `tap` + `hapticProtocolSignature(20, "phase_shift")` + `onComplete()`.
- `reduceMotion` skip-friendly.

## Catálogo

```diff
- ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"5 minutos. Concreto."}}
+ ui:{primitive:"micro_action_momentum",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"5 minutos. Concreto."}}

- i:"Mantén las palmas presionadas. Identifica UNA acción concreta de 5 minutos..."
+ i:"Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón. Identifica UNA acción concreta de 5 minutos..."

- text:"Mantén las palmas presionadas. UNA acción de 5 minutos al volver."
+ text:"Mano libre al pecho. Pulgar firme en el botón. UNA acción de 5 minutos al volver."

- mechanism:"Commitment motor a micro-acción rompe parálisis y crea momentum (Bryan, Adams, Monin 2013)"
+ mechanism:"Commitment motor a micro-acción + pulgar firme sostenido rompe parálisis y crea momentum (Bryan, Adams, Monin 2013 implementation intentions)"
```

`binaural.action: "stop"` y `cue.type: "ok"` preservados.

## Tests

1. **`protocols.tier-crisis.test.js`** VALID_PRIMITIVES extendido con `micro_action_momentum`.
2. **`protocols.tier-crisis.test.js`** `expectedMap[20] = "micro_action_momentum"` añadido al last-acto check.

### Resultados
- **Full suite: 4989/4989 verde (251/251 files)**

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true`
- ✅ `binaural.action: "stop"` (fin del audio bed)
- ✅ `cue.type: "ok"` al cerrar
- ✅ `min_hold_ms: 3000` (≤3000 crisis cap)
- ✅ **Single-hand phone-friendly** (palmas conflict 10ª resolución)
- ✅ **Sin sonido**

## Storybook
`MicroActionMomentum · #20 P4` con `minHoldMs={3000}`, `releaseMessage="5 minutos. Concreto."`, `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-s-4-micro-action-momentum/01-pre.png` — pre state: "5 MIN" + "Mano libre al pecho · Pulgar firme" + pill button "MANTÉN" + 5 chevrons faded + "Una mano en el pecho"
- `screenshots/sp-s-4-micro-action-momentum/02-completed.png` — completed: pill "OK" con glow intenso + 5 chevrons fully lit + "5 minutos. Concreto." + "Adelante"

## Cadena #20 completa — break-pattern total

4 primitives dedicated, 4 visual signatures distintos cruzando 3 cyans:

| Phase | Mecanismo | Primitive | Cyan | Visual signature |
|---|---|---|---|---|
| P1 | Motor release (sacudida) | `kinetic_release` | deep | Energy core + jitter + bursting particles |
| P2 | Isométrica (clench/release) | `isometric_release` | mid | Orb compress 10s → burst 10s + step dots |
| P3 | Re-encuadre cognitivo | `reencuadre_choice` | light | Focal point + 3 branching paths + chips |
| P4 | Commitment motor cierre | `micro_action_momentum` | light | "5 MIN" + pill button + 5 momentum chevrons |

**Protocolo #20 Block Break 100% single-hand phone-friendly, palmas conflict resuelto, cognitive crisis-ready.**

## Next
- SP-T chain o resumen — restan #21, #22, #23 según roadmap Phase 7 (Threshold Crossing, Vagal Hum Reset, Power Pose Activation).
