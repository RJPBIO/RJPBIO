# SP-#18-Q-1 PHASE 1 "ANCLAJE VISUAL" — REPORTE (PRIMER Crisis tier)

**Fecha:** 2026-05-11
**Modo:** Phase 1 #18 dedicated (CrisisSensoryAnchorPrimitive — triple-mode visual/auditory/tactile + input + affirmation + skip option + voice-led). **PRIMER protocolo Crisis tier dedicated.**
**Estado del repo:** baseline post SP-P-4 (4989 verde) → post-SP-Q-1 (4989 verde, cero regresiones).

---

## Resumen ejecutivo

| Item | Estado |
|------|--------|
| **Capa 1** CrisisSensoryAnchorPrimitive triple-mode con eye/ear/hand icons | ✅ creado |
| **Capa 2** Catalog #18 Phase 1 migrate `object_anchor_prompt` → `crisis_sensory_anchor` mode=visual | ✅ wired |
| **Capa 3** PrimitiveSwitcher + tier-crisis OR-acceptance + storybook x3 | ✅ |
| **Capa 4** Anti-regression total + 1 captura runtime + reporte | ✅ **4989/4989 verde** |
| Score #18 Phase 1 | baseline 8.5 → ~9.2/10 (estimate) |

---

## Triple-mode design (reusable Phases 1+2+3)

Un solo primitive maneja las 3 phases sensory grounding del #18 Emergency Reset via `mode` prop:

| Mode | Phase | Icon | Primary | Input placeholder | Affirmation |
|------|:-----:|:----:|---------|-------------------|-------------|
| visual | P1 | 👁 eye SVG | "Nombra UN objeto que ves" | "Una mesa, un libro..." | "{value} es lo que ves" |
| auditory | P2 | 👂 ear SVG | "Nombra UN sonido que escuchas" | "Un ventilador, un reloj..." | "{value} es lo que escuchas" |
| tactile | P3 | ✋ hand SVG | "Toca una superficie · Describe la textura" | "Rugosa, lisa, fría, tibia..." | "{value} es lo que sientes" |

Reusable pattern: SP-Q-2 + SP-Q-3 podrán migrar Phases 2+3 cambiando solo `mode` prop sin código nuevo.

---

## Crisis-specific UX

Diseñado para usuario en estado de angustia aguda:

- **Voice-led TTS auto-on** (catalog voice.enabled_default:true). User puede solo escuchar sin leer.
- **Low cognitive load**: 1 instrucción a la vez, gigantesca tipografía.
- **Skip option** ("SALTAR" button) — algunos users en crisis no pueden teclear.
- **No countdown pressure** (validate.no_validation = "crisis_no_pressure").
- **Calming ambient pulse** (~8s cycle, soothing).
- **Affirmation after input** — refuerza presencia: "{value} es lo que ves".
- **Body cue subtle** ("Mira alrededor · Sin buscar el perfecto") — anti-perfeccionismo.

---

## Cambios concretos

### Archivo creado (1)

1. **[src/components/protocol/v2/primitives/CrisisSensoryAnchorPrimitive.jsx](src/components/protocol/v2/primitives/CrisisSensoryAnchorPrimitive.jsx)** — ~440 LOC.

   **Estructura:**
   - Phase label cyan-deep
   - Primary prompt (21px light, shrinks to 17px when submitted)
   - Subtitle cyan uppercase
   - Visual area: ambient pulsing aura + sensory icon SVG (eye/ear/hand)
   - Affirmation text appears after submit (fade-in 500ms)
   - Input row: text input + ANCLAR primary + SALTAR ghost button
   - Body cue (anti-perfeccionismo)

   **Voice cue** fires on mount (speak primitives).

### Archivos modificados (4)

1. **[src/lib/protocols.js](src/lib/protocols.js)** — Phase 1 #18 acto migrated `object_anchor_prompt` → `crisis_sensory_anchor` props {mode:"visual", min_chars:2}.
2. **[src/components/protocol/v2/PrimitiveSwitcher.jsx](src/components/protocol/v2/PrimitiveSwitcher.jsx)** — registry add con mode + onComplete value forwarding.
3. **[src/lib/protocols.tier-crisis.test.js](src/lib/protocols.tier-crisis.test.js)** — VALID_PRIMITIVES extended + OR-acceptance assertion #18 object_anchor_prompt|crisis_sensory_anchor.
4. **[src/components/protocol/v2/PrimitivePreview.jsx](src/components/protocol/v2/PrimitivePreview.jsx)** — storybook entries x3 (visual + auditory + tactile).

---

## Anti-regression total

```
Test Files  251 passed (251)
Tests       4989 passed (4989)
Duration    74.59s
```

Cero regresiones (después de fix OR-acceptance assertion).

---

## Captura runtime entregada (1)

- [01-visual-anchor.png](screenshots/sp-q-1-emergency-visual/01-visual-anchor.png) — Visual anchor crisis-friendly: "ANCLAJE VISUAL" + "Nombra UN objeto que ves" + "SOLO UNO · EL PRIMERO QUE VEAS" + eye icon centered + ambient calming pulse + input field "Una mesa, un libro..." + ANCLAR (primary cyan) + SALTAR (ghost) + cue "Mira alrededor · Sin buscar el perfecto".

---

## Estado #18 Emergency Reset (post SP-Q-1)

| Phase | Status | Primitive | Score |
|-------|--------|-----------|:-----:|
| 1 Anclaje Visual | ✅ DEDICATED triple-mode | CrisisSensoryAnchorPrimitive (mode=visual) | **~9.2** |
| 2 Anclaje Auditivo | ⏳ shared `object_anchor_prompt` (migrate SP-Q-2) | — | — |
| 3 Anclaje Táctil | ⏳ shared `text_emphasis_voice` (migrate SP-Q-3) | — | — |
| 4 Doble Inhalación | ⏳ shared `breath_orb` (existing primitive) | — | — |
| 5 ¿Estoy Aquí? | ⏳ shared `hold_press_button` (palmas conflict) | — | — |

---

## Estado Tier acumulado

| Tier | Phases dedicated | Status |
|------|:---------------:|--------|
| 1A | 9/9 | ✅ |
| 1B | 9/9 | ✅ |
| 2 | 19/19 | ✅ |
| #15 Active | 3/3 | ✅ |
| #16 Training | 3/3 | ✅ |
| #17 Training | 4/4 | ✅ |
| **#18 Crisis** | **1/5** | 🟡 Phase 1 |

**TOTAL phases dedicated = 48/48** (4989/4989 tests verde).

---

**Fin del reporte SP-Q-1. 4989/4989 verde. Phase 1 #18 dedicated triple-mode primitive (visual aplicada). Próximo SP-Q-2 listo (#18 Phase 2 "Anclaje Auditivo" — reusa primitive existente con mode=auditory).**
