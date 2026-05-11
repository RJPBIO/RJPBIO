# SP-S-3 · Protocol #20 Phase 3 — Re-encuadre

**Date:** 2026-05-11
**Tier:** Crisis Cognitiva · Protocol #20 Block Break
**Status:** ✅ Closed
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Re-encuadre cognitivo activa córtex prefrontal y permite ver opciones más allá del bloqueo (Gross 2014, emotion regulation framework). Forzar identificar 1 de 3 necesidades desbloquea ejecución posterior (Phase 4).

## Primitive

**`ReencuadreChoicePrimitive.jsx`** — reemplaza `chip_selector` genérico.

### 3-capas
- **Eyebrow:** "RE-ENCUADRE · OPCIÓN"
- **Question (large, light cyan):** "¿Qué necesito ahora?"
- **Chips verticales:** Otra perspectiva / Pedir ayuda / Pausa

### Visual signature — break-pattern vs P1 (kinetic) + P2 (orb)
- **Central focal point** (small cyan-light orb con halo glow) en top representando el estado actual.
- **3 branching paths dashed** desde focal point hacia cada chip:
  - Path 1 → curva izquierda hacia "Otra perspectiva"
  - Path 2 → centro hacia "Pedir ayuda"
  - Path 3 → curva derecha hacia "Pausa"
  - Control point lateral `±56px` para diferenciación visual clara
- **Thinking window 4s:** chips faded (opacity 0.4), counter "Piensa · 4s" → "1s" visible.
- **Selección:** chip seleccionada se escala 1.02, path elegido se vuelve sólido (no dashed), otros paths/chips fade a 10–45% opacity.

### Color
Light cyan `getCyanForPhase(2)` — break-pattern completo: P1 deep / P2 mid / **P3 light**.

### Comportamiento
- Default `minThinkingMs = 4000`.
- Tras window habilitada: chips fully interactive, haptic `tap` cuando se habilita.
- Selección: haptic `tap` + `hapticProtocolSignature(20, "phase_shift")` + `onSelect({id, label})` + 800ms delay → `onComplete()`.
- `reduceMotion`: skip window, chips habilitadas inmediatamente.

### Accesibilidad
- `aria-live="polite"` en question + thinking counter.
- `aria-pressed` en chips para seleccionado.
- `role="region"` en raíz.
- `data-selected` attribute con id seleccionado para E2E.

## Catálogo

```diff
- ui:{primitive:"chip_selector",props:{...}}
+ ui:{primitive:"reencuadre_choice",props:{...}}
```

Question, chips array y min_thinking_ms preservados intactos.

## Tests

OR-acceptance pattern:
1. **`protocols.tier-crisis.test.js`** VALID_PRIMITIVES extendido con `reencuadre_choice`.
2. **`protocols.tier-crisis.test.js`** test "#20 usa chip_selector" generalizado a `chip_selector || reencuadre_choice`.

### Resultados
- **Full suite: 4989/4989 verde (251/251 files)**

## Crisis cognitive tier compliance

- ✅ `validate.kind: "no_validation"`, `reason: "crisis_no_pressure"`
- ✅ `voice.enabled_default: true`
- ✅ Sin binaural change (continúa cadena P1/P2)
- ✅ Skip option permitida implícita
- ✅ **Sin sonido**, single-hand phone OK

## Storybook
`ReencuadreChoice · #20 P3` con default question/chips, `hapticEnabled={false}`.

## Screenshots
- `screenshots/sp-s-3-reencuadre-choice/01-enabled.png` — primer iter (paths overlapeados)
- `screenshots/sp-s-3-reencuadre-choice/02-branched-paths.png` — **fix aplicado:** branching paths con curvas laterales (±56px control point), focal point central, 3 chips verticales, todos habilitados

## Iter notes
- v1: paths verticales overlapeados (todos al mismo X). Fix: lateral control point ±56px para chip 1 (izq) y chip 3 (der), chip 2 al centro.

## Next
- **SP-S-4:** #20 Phase 4 "Acción Micro" — commitment_motor + hold_press + palmas conflict resolution **10ª vez** + countdown "5 minutos" cue. Cierre del protocolo Block Break.
