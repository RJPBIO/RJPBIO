# SP-S-2 · Protocol #20 Phase 2 — Descarga Isométrica

**Date:** 2026-05-11
**Tier:** Crisis Cognitiva · Protocol #20 Block Break
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Tensión isométrica máxima (10s puño máxima fuerza) + relajación completa (10s suelta) → contraste somático que descarga frustración acumulada (Jacobson 1938 PMR — Progressive Muscle Relaxation). El tense-release pattern reduce tensión muscular crónica y activa parasympathetic post-tense.

## Single-hand resolución

Catálogo original: "Aprieta **los puños**" (plural). Reframe:
- **"Aprieta el puño de la mano libre"** (singular). Teléfono sigue en la otra mano.

## Primitive

**`IsometricReleasePrimitive.jsx`** — reemplaza `isometric_grip_prompt` shared.

### 3-capas
- **Eyebrow:** "DESCARGA · TENSIÓN / SUELTA"
- **Primary prompt (rotativo):**
  - tense → "Aprieta · Máxima fuerza"
  - release → "Suelta · Siente la pesadez"
- **Body anchor:**
  - tense → "Una mano · Puño firme"
  - release → "Mano abierta · Pesadez"

### Visual signature — 2 fases A→B distintas

**Fase A "TENSE" (10s):**
- Orb central **comprime**: scale 1.0 → 0.60 (ease-in cubic)
- 4 **density rings interiores** que intensifican durante tense (representa tensión acumulándose)
- Halo blur 7px (stdDeviation), opacity sutilmente sube
- Sin partículas

**Fase B "RELEASE" (10s):**
- Orb **explota outward**: scale 0.60 → 1.40 → settle 1.0 (burst phase 1.5s + settle 2s)
- **16 burst particles** vuelan radialmente outward (visibles sólo durante release)
- Halo blur 14px (más diffuse, expansión)
- Density rings desaparecen rápido
- Haptic `tap` al iniciar release

**Step indicator:** 2 dots minúsculos abajo (tense/release con highlight en current).

### Color
Mid cyan `getCyanForPhase(1)` — break-pattern vs Phase 1 deep cyan.

### Comportamiento
- 20s total (10s tense + 10s release).
- `hapticProtocolSignature(20, "phase_shift")` al cerrar.
- `reduceMotion`: skip directo a completed.

## Catálogo

```diff
- ui:{primitive:"isometric_grip_prompt",props:{...}}
+ ui:{primitive:"isometric_release",props:{target_holds:1,hold_duration_ms:10000,release_duration_ms:10000}}

- k:"Aprieta puños 10s. Suelta."
- i:"Aprieta los puños con todas tus fuerzas durante 10 segundos..."
+ k:"Aprieta el puño 10s. Suelta."
+ i:"Aprieta el puño de la mano libre con todas tus fuerzas durante 10 segundos..."
+ text:"Aprieta el puño de la mano libre 10 segundos. Suelta. Siente la diferencia."
```

Mechanism + sc + safety preservados.

## Tests

OR-acceptance pattern:
1. **`protocols.tier-crisis.test.js`** VALID_PRIMITIVES extendido con `isometric_release`.
2. **`protocols.tier-crisis.test.js`** test "#20 usa isometric_grip_prompt" generalizado a `isometric_grip_prompt || isometric_release`.

### Resultados
- `protocols.tier-crisis.test.js`: 58/58 ✅
- **Full suite: 4989/4989 verde (251/251 files)**

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true`
- ✅ `binaural.action: "continue"` (cadena audio de Phase 1)
- ✅ **Single-hand phone-friendly** (puño mano libre)
- ✅ **Sin sonido**

## Storybook
`IsometricRelease · #20 P2` con `holdDurationMs={10000}`, `releaseDurationMs={10000}`, `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-s-2-isometric-release/01-tense-compress.png` — race-condition con release (timing)
- `screenshots/sp-s-2-isometric-release/02-release-burst.png` — release fase final: orb settled, burst particles dispersos, "Suelta · Siente la pesadez", "Mano abierta · Pesadez", step 2 active

## Next
- **SP-S-3:** #20 Phase 3 "Re-encuadre" — cognitive choice, 3 chips (Otra perspectiva / Pedir ayuda / Pausa). Dedicated primitive: paths branching out from focal point.
