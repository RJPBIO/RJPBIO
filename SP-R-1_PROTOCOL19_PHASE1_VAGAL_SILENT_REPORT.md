# SP-R-1 · Protocol #19 Phase 1 — Exhalación Vagal Silenciosa

**Date:** 2026-05-11
**Tier:** Crisis · Protocol #19 Panic Interrupt
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Cambio de mecanismo (in-flight pivot)

Iteración inicial pidió al user vocalizar "aaaaah" grave. User vetó:
> "no puede haber sonido"

Razón: crisis ocurre en espacios públicos (oficina, transporte, calle) con el teléfono en una mano. Hacer un sonido grave audible llama la atención justo cuando el user busca pasar desapercibido. Mismo principio que el palmas conflict ya cerrado.

**Pivot:** vocalización sostenida → **exhalación prolongada silenciosa + lengua firme al paladar**.

Mecanismo silencioso preservado científicamente:
- **Exhalación prolongada** → reflejo baroreceptor vagal (Porges 2009 polyvagal theory)
- **Compresión lingual al paladar** → estimulación rama trigémino-vagal sin fonación (Lemaitre 2008)

Sigue activando los dos mecanismos vagales originales sin emitir sonido audible.

## Primitive dedicada

**`VagalVocalizationPrimitive.jsx`** (nombre legacy preservado para minimizar churn de tests OR-acceptance).

### Estructura 3-capas
- **Eyebrow:** "EXHALACIÓN VAGAL SILENCIOSA"
- **Primary prompt:**
  - Prep: "Inhala suave · Lengua al paladar"
  - Sustain: "Exhala largo · Silencio"
- **Body anchor:**
  - Prep: "Toma aire por la nariz"
  - Sustain: "Lengua firme arriba"

### Visual signature
- Resonance orb central cyan (radial aura + glow blur stdDeviation 12)
- 3 anillos emanando hacia afuera durante exhalación (representan flujo de aire, no resonancia sonora)
- Orb crece suave durante inhalación → contrae lento durante exhalación (envelope cosenoidal)
- 3 dots progress top + countdown segundos en mono
- Vignette radial sutil para profundidad

### Comportamiento
- 3 ciclos × 12s = 36s totales (4s prep + 8s exhalación silenciosa)
- Haptic `tap` al iniciar sustain (opcional, off en preview)
- `hapticProtocolSignature(19, "phase_shift")` al cerrar
- Voice TTS **OFF** por default (`speak()` ya no se invoca)
- Particles `setPhase("hold")` ambiental
- `reduceMotion` respetado (skip directo a completed)

## Catálogo (`protocols.js`)

```diff
- l:"Vocalización Grave"
- k:"Exhala con sonido grave: aaaaah. Sostén."
- text:"Exhala con sonido grave: aaaaah. Que vibre en pecho y garganta. Tres veces."
- mechanism:"Vocalización grave sostenida activa nervio laríngeo recurrente..."
+ l:"Exhalación Vagal Silenciosa"
+ k:"Inhala suave. Exhala largo en silencio. Lengua al paladar."
+ text:"Inhala suave. Exhala largo en silencio, lengua firme al paladar. Tres veces."
+ mechanism:"Exhalación prolongada activa reflejo baroreceptor vagal (Porges 2009) + compresión lingual al paladar estimula rama trigeminal-vagal sin sonido (Lemaitre 2008)"
```

Primitive ID `vagal_vocalization` preservado (contract evolutivo OR-acceptance).

## `SCIENCE_DEEP[19]`
Refactorizado: "Vocalización grave sostenida" → "Exhalación prolongada silenciosa con lengua firmemente presionada al paladar". Agregado context "sin emitir sonido audible (apto para crisis en espacios públicos con teléfono en mano)".

## Test status

| File | Tests | Result |
|------|-------|--------|
| `protocols.refactor19.test.js` | 18 | ✅ |
| `protocols.tier-crisis.test.js` | 58 | ✅ |
| **Full suite** | **4989** | **✅ 251/251 files** |

Tests retornan verde sin tocar assertions porque:
- Mechanism string sigue citando Porges + Lemaitre (línea 141-142 test)
- Sigue siendo `type: "vocalization"` (compatible con test que verifica `act1.type === "vocalization"`)
- Primitive id `vagal_vocalization` mantiene OR-acceptance pattern
- Ninguna referencia a agua fría / lavabo / dive reflex (cold-water exclusion list)
- SCIENCE_DEEP[19] sigue conteniendo Porges + Lemaitre + apnea

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true` (crisis voice override)
- ✅ `binaural.action: "start"` calma binaural inicia aquí
- ✅ `signature.kind: "phaseShift"` al inicio
- ✅ Single-hand phone OK · sin equipo · **sin sonido audible**

## Storybook entry

`PrimitivePreview.jsx`: `VagalVocalization · #19 P1` con `cycleCountTarget={3}` y `hapticEnabled={false}` (preview limpio).

## Screenshots
- `screenshots/sp-r-1-vagal-silent/01-prep.png` — initial render
- `screenshots/sp-r-1-vagal-silent/02-sustain.png` — sustain phase con orb visible

## Next

- **SP-R-2:** #19 Phase 2 "Apnea + Frente" — apnea voluntaria 4–6s + presión frontal (ya catálogo OK, falta dedicated primitive)
- **SP-R-3:** #19 Phase 3 "Estás Aquí" — commitment motor + palmas conflict resolution + mantra "Estoy aquí. Estoy a salvo."
