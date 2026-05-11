# SP-R-3 · Protocol #19 Phase 3 — Estás Aquí (Cierre)

**Date:** 2026-05-11
**Tier:** Crisis · Protocol #19 Panic Interrupt · Cierre del protocolo
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Palmas conflict — 9ª resolución consecutiva

Catálogo original Phase 3 pedía: *"Mantén las palmas firmes contra tu pecho"*. Conflicto: el user está en crisis con el teléfono en una mano; usar **ambas** palmas contra el pecho es físicamente imposible.

**Resolución (9ª vez):**
- Mano **libre** descansa contra el pecho (auto-soothe propioceptivo central).
- **Pulgar** de la mano que sostiene el teléfono mantiene firme el botón hold.
- Single-hand phone-friendly, sin perder anclaje propioceptivo.

Catálogo nuevo:
```diff
- i:"Mantén las palmas firmes contra tu pecho..."
- text:"Mantén las palmas firmes contra el pecho..."
+ i:"Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón..."
+ text:"Mano libre al pecho. Pulgar firme en el botón. 'Estoy aquí. Estoy a salvo.'"
```

Mechanism string ahora cita Bryan/Adams/Monin 2013 (commitment motor + verbal affirmation) explícitamente.

## Primitive nueva

**`PanicAnchorClosurePrimitive.jsx`** — dedicated para Phase 3 de #19. Reemplaza `hold_press_button` shared con visual signature de break-pattern y mantra word-by-word.

### Estructura 3-capas
- **Eyebrow:** "ANCLAJE · CIERRE"
- **Mantra word-by-word (4 palabras, stagger 1.4s):** `Estoy` → `aquí.` → `Estoy` → `a salvo.`
- **Primary prompt (rotativo):**
  - pre → "Mano libre al pecho · Pulgar firme"
  - hold → "Mantén. Estoy aquí. Estoy a salvo."
  - release → "Estás aquí. A salvo."
- **Body anchor:**
  - pre → "Una mano en el pecho"
  - hold → "Pulgar firme en el botón"
  - release → "Pertenece este momento"

### Visual signature — break-pattern vs #18 P5 & #19 P1+P2

| #18 P5 (Presence) | #19 P1 (Vagal silent) | #19 P2 (Apnea + frontal) | **#19 P3 (Closure)** |
|---|---|---|---|
| Concentric rings | Emanating rings | Arc satellites superior | **4 cardinal halo arcs (N, E, S, W)** |
| Mid cyan | Deep cyan | Mid cyan | **Light cyan** `getCyanForPhase(2)` |
| Word-by-word | Resonance orb | Trigeminal pulse | **Mantra reveal + safety halo** |

### Safety halo
4 arcos cardinales (N, E, S, W) que **se expanden** durante el hold:
- Radio: `110 + holdRatio * 30` (110px → 140px al completar).
- Stroke weight: `1.2 + holdRatio * 1.6` (1.2px → 2.8px).
- Opacity: `0.40 → 0.85` durante hold; `0.85` post-release (intenso, sostenido como "escudo").
- Stroke `linecap: round` para terminación suave.

4 satélites diagonales (NE, SE, SW, NW) aparecen durante hold sostenido como puntos de calma orbital.

### Hold mechanics
- `min_hold_ms` = 3000 (crisis: hold corto, sin presión)
- Press feedback: `scale 1.06`, ring weight `1.5px → 2.5px`, aura opacity `0.45 → 0.85`.
- Progress ring (alrededor del botón) acumula `holdRatio` durante press.
- Al completar: phase → "release", botón muestra "OK", binaural cue `phaseShift` + `signature_19` haptic.
- Si user suelta antes de los 3s: phase vuelve a "pre", `holdProgressMs = 0` (sin sanción, crisis).

### Mantra word-by-word
4 palabras revealadas con stagger 1.4s + transform `translateY(6px → 0)` + opacity `0 → 0.95/1.0`.
Total reveal: ~6.2s (600ms initial + 4×1.4s). Una vez revelado se mantiene visible durante todo el ejercicio.

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"hold_press_button",props:{...}}
+ ui:{primitive:"panic_anchor_closure",props:{label:"MANTÉN",min_hold_ms:3000,release_message:"Estás aquí. A salvo."}}

- mechanism:"Anclaje propioceptivo central + afirmación de seguridad consolida estado calmo"
+ mechanism:"Anclaje propioceptivo central (palma libre al pecho) + pulgar firme sostenido en botón (compromiso motor) + afirmación de seguridad consolida estado calmo (Bryan/Adams/Monin 2013)"
```

`binaural.action: "stop"` se preserva (cierre del audio bed iniciado en Phase 1).
`cue.type: "ok", fire_at: "end"` preservado.

## Tests

OR-acceptance aplicado en 3 sitios:
1. **`protocols.refactor19.test.js`** — acto 3 acepta `hold_press_button || panic_anchor_closure`. `min_hold_ms ≤ 3000` preservado.
2. **`protocols.tier-crisis.test.js`** VALID_PRIMITIVES extendido con `panic_anchor_closure`.
3. **`protocols.tier-crisis.test.js`** `expectedMap[19] = "panic_anchor_closure"` añadido al last-acto check.

### Resultados
| Suite | Tests | Status |
|---|---|---|
| `protocols.refactor19.test.js` | 18 | ✅ |
| `protocols.tier-crisis.test.js` | 58 | ✅ |
| **Full suite** | **4989** | **✅ 251/251 files** |

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true`
- ✅ `binaural.action: "stop"` (fin de audio bed)
- ✅ `cue.type: "ok"` al cerrar
- ✅ `min_hold_ms: 3000` (≤3000 crisis cap)
- ✅ **Single-hand phone OK** — palmas conflict resuelto
- ✅ **Sin sonido** ni del primitive ni requerido al user

## Storybook
`PrimitivePreview.jsx`: `PanicAnchorClosure · #19 P3` con `minHoldMs={3000}`, `releaseMessage="Estás aquí. A salvo."`, `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-r-3-panic-anchor-closure/01-mantra-revealed.png` — pre-hold con mantra fully revealed, 4 arcos cardinales suaves, botón MANTÉN
- `screenshots/sp-r-3-panic-anchor-closure/02-pressing.png` — estado release post-completion: safety halo expandido a máximo, botón "OK", 4 satélites diagonales visibles, "Pertenece este momento"

## Cadena #19 completa

Tres primitives dedicated, tres cyans distintos, tres mecanismos vagales silenciosos:
- **P1 (deep cyan):** Exhalación vagal silenciosa con lengua al paladar
- **P2 (mid cyan):** Apnea + presión frontal trigeminal
- **P3 (light cyan):** Anclaje propioceptivo + mantra + safety halo

Protocolo #19 Panic Interrupt **100% sin sonido, single-hand phone-friendly, crisis-no-pressure**.

## Next
- **SP-S chain:** Protocol #20 Block Break (4 phases, crisis cognitiva). Phases: motor → isométrica → re-encuadre → micro-acción.
