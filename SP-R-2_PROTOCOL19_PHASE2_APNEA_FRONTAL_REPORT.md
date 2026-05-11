# SP-R-2 · Protocol #19 Phase 2 — Apnea + Presión Frente

**Date:** 2026-05-11
**Tier:** Crisis · Protocol #19 Panic Interrupt
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Mecanismo (preservado, ahora dedicated visual)

Doble activación vagal silenciosa:
- **Apnea voluntaria 4–6 s** → reflejo barorreceptor durante pausa inspiratoria (Lemaitre 2008 documentó patrón en breath-hold divers; en no-divers magnitud menor pero medible en HRV).
- **Presión frontal con 3 dedos** durante la apnea → estimula nervio trigémino sin estrés térmico (Russo 2017 extensión exhalatoria parasimpática).

Ambos mecanismos ejecutables sin sonido, sin equipo, con teléfono en una mano (la otra presiona frente).

## Primitive nueva

**`ApneaFrontalPressPrimitive.jsx`** — reemplaza `breath_orb` genérico para Phase 2.

### Cadencia
- **in:** 3 s (inhala suave por nariz)
- **hold:** 5 s (sostén + 3 dedos en frente)
- **ex:** 6 s (exhala largo + suelta)
- **h2:** 0
- **3 ciclos × 14 s = 42 s** (dentro del target 30–45 s)

### 3-capas semántica
- **Eyebrow:** "APNEA · PRESIÓN FRENTE"
- **Primary prompt (rotativo):**
  - in → "Inhala suave por la nariz"
  - hold → "Sostén · Dedos firmes en frente" (mid-cyan, weight medium)
  - ex → "Exhala largo · Suelta"
- **Body anchor:**
  - in → "Por la nariz, sin fuerza"
  - hold → "3 dedos en la frente"
  - ex → "Boca relajada"

### Visual signature — break-pattern vs Phase 1
| Phase 1 (silent breath) | Phase 2 (apnea + frontal) |
|---|---|
| Cyan-deep `getCyanForPhase(0)` | **Cyan-mid `getCyanForPhase(1)`** |
| 3 anillos emanando outward | **3 satélites trigeminales en arco superior** |
| Orb pulse cosenoidal lento | **Orb scale 3-fase (crece → sostiene → contrae)** |
| Mecanismo silencioso laríngeo | Mecanismo silencioso trigeminal-vagal |

### 3 satélites trigeminales
- Posicionados en arco arriba del orb central (-108°, -90°, -72°) representando los 3 dedos sobre la frente.
- Sólo visibles durante apnea (`isHold === true`).
- Pulso 2 Hz subtil sincronizado entre ellos durante la apnea (representa estímulo trigeminal sostenido).
- Arc dashed sutil conectándolos para unificar el grupo.

### Comportamiento técnico
- RAF tick con fase derivada de `cycleMs` (0-3s in / 3-8s hold / 8-14s ex).
- Haptic `tap` al entrar a hold (`isHold` transition).
- `hapticProtocolSignature(19, "phase_shift")` al cerrar.
- `reduceMotion` honrado (skip directo a completed).
- Particles ambient `setPhase("hold")` durante todo el ejercicio.

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"breath_orb",props:{cadence:{in:3,h1:5,ex:6,h2:0}}}
+ ui:{primitive:"apnea_frontal_press",props:{cycleCountTarget:3,cadence:{in:3,h1:5,ex:6,h2:0}}}
```

Mechanism string + safety + science deep entry preservados intactos (mecanismo no cambió).

## Tests

OR-acceptance pattern aplicado en 3 sitios:

1. **`protocols.refactor19.test.js`** — `acto 2` ahora acepta `breath_orb || apnea_frontal_press`. Cadencia `{in:3,h1:5,ex:6,h2:0}` sigue requerida.
2. **`protocols.tier-crisis.test.js`** — `VALID_PRIMITIVES` set incluye `apnea_frontal_press`.
3. **`protocols.tier-crisis.test.js`** — test "#19 Panic Interrupt usa breath_orb" generalizado a `breath_orb || apnea_frontal_press`.

### Resultados
| Suite | Tests | Status |
|---|---|---|
| `protocols.refactor19.test.js` | 18 | ✅ |
| `protocols.tier-crisis.test.js` | 58 | ✅ |
| **Full suite** | **4989** | **✅ 251/251 files** |

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true` (crisis voice override)
- ✅ `binaural.action: "continue"` (cadena calma de Phase 1)
- ✅ `breath_ticks.auto_sync: true` (sincronía con cadencia)
- ✅ Single-hand phone OK (teléfono en una mano, dedos en frente con la otra)
- ✅ **Sin sonido** ni del primitive ni requerido al user

## Storybook
`PrimitivePreview.jsx`: `ApneaFrontalPress · #19 P2` con `cycleCountTarget={3}` y `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-r-2-apnea-frontal/01-inhale.png` — phase ex (orb pequeño, "Boca relajada")
- `screenshots/sp-r-2-apnea-frontal/02-hold-frontal-press.png` — captura cercana a final de hold
- `screenshots/sp-r-2-apnea-frontal/03-attempt-hold.png` — **HOLD perfecta**: orb central + 3 satélites trigeminales en arco superior + arc dashed + "Sostén · Dedos firmes en frente" + "3 dedos en la frente"

## Next
- **SP-R-3:** #19 Phase 3 "Estás Aquí" — commitment_motor + palmas conflict prevention (9ª vez consecutiva) + mantra word-by-word "Estoy aquí. Estoy a salvo." + hold-press 3s + binaural stop. Cierre del protocolo crisis.
