# SP-S-1 · Protocol #20 Phase 1 — Sacudida Física

**Date:** 2026-05-11
**Tier:** Crisis Cognitiva · Protocol #20 Block Break
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Sacudida motora vigorosa interrumpe parálisis cognitiva y eleva circulación cerebral inmediata. Re-arranca activación motora bilateral acelerada (TRE/Levine somatic experiencing) que descarga tensión muscular acumulada y reactiva córtex prefrontal post-bloqueo.

## Single-hand phone resolución

Catálogo original pedía "Sacude las manos" (plural) + "Levántate si puedes". Reframe phone-friendly:
- Instrucción primaria: **"Sacude la mano libre vigorosamente"** (no fuerza dejar el teléfono).
- Opcional: "Si puedes, levántate y sacude ambos brazos."

## Primitive

**`KineticReleasePrimitive.jsx`** — reemplaza `shake_hands_prompt` genérico.

### 3-capas
- **Eyebrow:** "SACUDIDA · ROMPER INERCIA"
- **Primary prompt:** "Sacude vigorosamente" (deep cyan, weight medium)
- **Hint:** "Como si tiraras agua de las manos"
- **Body anchor:** "Mano libre · Brazo suelto"

### Visual signature — break-pattern vs #19 chain (vagal orbs)
- **Energy core central** (radial aura + 12px filled dot) con halo blur.
- **Jitter de alta frecuencia** sobre el SVG entero (`translate` random ±8/±6 px cada frame) — visualiza la sacudida.
- **8 radial energy lines** pulsando outward, opacity oscilante senoidal 6 Hz.
- **14 bursting particles** que vuelan radialmente hacia afuera con recycling (re-emerge en radio inicial cuando salen del campo).
- **Countdown prominente** "25s" → "0s" mono cyan en parte inferior.
- Intensity decay suave: ratio 0→1 reduce intensity 1.0→0.5 (calma hacia el final).

Distinto a #19 chain: no usa orb central inhalación/exhalación; no usa rings concentric; usa pattern de **emisión radial caótica** (energy release).

### Comportamiento
- Duration default 25s (`durationMs` prop).
- Haptic `tap` cada 2s durante el ejercicio.
- `hapticProtocolSignature(20, "phase_shift")` al cerrar.
- `reduceMotion` honrado: skip directo a completed sin jitter ni particle anim.

## Catálogo

```diff
- ui:{primitive:"shake_hands_prompt",props:{duration_ms:25000}}
+ ui:{primitive:"kinetic_release",props:{duration_ms:25000}}

- k:"Sacude las manos vigorosamente. Romper la inercia."
- i:"Levántate si puedes. Sacude las manos vigorosamente..."
+ k:"Sacude vigorosamente. Romper la inercia."
+ i:"Sacude la mano libre vigorosamente, como si tiraras agua. Si puedes, levántate y sacude ambos brazos. Sigue 25 segundos."
+ text:"Sacude vigorosamente la mano libre. Como si tiraras agua."
```

Mechanism string preservado.

## Tests

OR-acceptance pattern aplicado:
1. **`protocols.tier-crisis.test.js`** — VALID_PRIMITIVES extendido con `kinetic_release`.
2. **`protocols.tier-crisis.test.js`** — test "#20 Block Break usa shake_hands_prompt" generalizado a `shake_hands_prompt || kinetic_release`.

### Resultados
- `protocols.tier-crisis.test.js`: 58/58 ✅
- **Full suite: 4989/4989 verde (251/251 files)**

## Crisis tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true`
- ✅ `binaural.action: "start", type: "energia"` (inicia audio bed)
- ✅ `signature.kind: "phaseShift", fire_at: "start"`
- ✅ **Single-hand phone-friendly** (sacude mano libre)
- ✅ **Sin sonido** emitido por el primitive

## Storybook
`PrimitivePreview.jsx`: `KineticRelease · #20 P1` con `durationMs={25000}`, `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-s-1-kinetic-release/01-active.png` — energy core + radial lines + particles + countdown 6s + "Mano libre · Brazo suelto"

## Next
- **SP-S-2:** #20 Phase 2 "Descarga Isométrica" — tension/release contrast (10s clench + 10s release), single-hand fist
