# SP-#17-P-4 PHASE 4 "RETORNO GRADUAL" — REPORTE · CIERRE #17 + EYES LOGIC REMOVAL

**Fecha:** 2026-05-11
**Modo:** Phase 4 #17 dedicated (NSDRReturnPrimitive — 3-stage gradual return + progressive brightness sleep→awake). + Eyes logic transversal REMOVIDA del protocolo #17 completo.
**Estado del repo:** baseline post SP-P-3 (4989 verde) → post-SP-P-4 (4989 verde, cero regresiones).

---

## Resumen ejecutivo

| Item | Estado |
|------|--------|
| **Capa 1** NSDRReturnPrimitive (3-stage gradual return + brightness progression) | ✅ creado |
| **Capa 2** Catalog #17 Phase 4 acto migrate `silence_cyan_minimal` → `nsdr_return` | ✅ wired |
| **Capa 3** PrimitiveSwitcher + tier-training VALID_PRIMITIVES + storybook | ✅ |
| **Eyes logic removal transversal** post feedback | ✅ aplicada |
| **Capa 4** Anti-regression total + 1 captura runtime + reporte | ✅ **4989/4989 verde** |
| Score #17 Phase 4 | baseline 8.5 → ~9.2/10 (estimate) |
| **Protocolo #17 cierre** | ✅ **4/4 phases dedicated** |

---

## Eyes logic removal (post user feedback "puede causar confusion")

Removida lógica explícita "cierra/abre ojos" del protocolo #17 completo. Estado eyes deja de ser un cue verbal — user puede tener ojos cerrados o abiertos naturalmente en cualquier momento. Voice-led guidance maneja contexto implícitamente.

**Cambios aplicados:**

| Phase | Antes | Después |
|-------|-------|---------|
| Phase 1 stage 3 | "Cuando estés listo · Cierra los ojos" + "La voz te guía" | "Deja que la atención se calme" + "La voz te guía" |
| Phase 4 stage 1 | "Atención vuelve poco a poco" + "Aún con los ojos cerrados" | "Atención vuelve poco a poco" + "Sin prisa" |
| Phase 4 stage 3 | "Abre los ojos cuando estés listo" + "Bienvenido de vuelta" | "Toma tu tiempo · Bienvenido" + "Cuerpo descansado" |

Catalog `i` y `text` también limpiados (Phase 1: "Cierra los ojos" removido; Phase 4: "Abre los ojos cuando estés listo" → "Toma tu tiempo").

Visual progression sleep→awake brightness MANTENIDA (no requiere instrucciones eyes explícitas).

---

## Cambios concretos

### Archivo creado (1)

1. **[src/components/protocol/v2/primitives/NSDRReturnPrimitive.jsx](src/components/protocol/v2/primitives/NSDRReturnPrimitive.jsx)** — ~360 LOC.

   **3-stage gradual return (90s = 30s/stage):**

   | Stage | Primary | Subtitle | Body anchor | Brightness |
   |-------|---------|----------|-------------|:--:|
   | 1 attention | "Atención vuelve poco a poco" | "Sin prisa" | "Nota dónde estás" | 0.45 |
   | 2 move | "Mueve los dedos · Estírate" | "Suave · Despierto" | "Dedos de manos y pies" | 0.70 |
   | 3 back | "Toma tu tiempo · Bienvenido" | "Cuerpo descansado" | "Mente clara · Listo para seguir" | 0.95 |

   **Visual progression sleep→awake:**
   - Vignette opacity: 0.06 → 0.08 → 0.10
   - Particle field: 0.08 → 0.13 → 0.18
   - Ambient point: 38px → 44px → 50px
   - Inner core: 4px → 5.5px → 7px
   - Phase color opacity: 0.55 → 0.70 → 0.85
   - Body anchor opacity: 0.60 → 0.70 → 0.80
   - Breath cycle period: 7s → 6s → 5s (slowly accelerating)
   - Countdown visible ONLY en last stage (awake mode time-aware)

### Archivos modificados (6)

1. **[src/lib/protocols.js](src/lib/protocols.js)** — Phase 4 #17 acto migrated + Phase 1 + Phase 4 catalog textos limpiados (eyes removed).
2. **[src/components/protocol/v2/PrimitiveSwitcher.jsx](src/components/protocol/v2/PrimitiveSwitcher.jsx)** — registry add.
3. **[src/lib/protocols.tier-training.test.js](src/lib/protocols.tier-training.test.js)** — VALID_PRIMITIVES extended con `nsdr_return`.
4. **[src/components/protocol/v2/PrimitivePreview.jsx](src/components/protocol/v2/PrimitivePreview.jsx)** — storybook entry.
5. **[src/components/protocol/v2/primitives/NSDRConfigurationPrimitive.jsx](src/components/protocol/v2/primitives/NSDRConfigurationPrimitive.jsx)** — STAGES eyes stage replaced con "calm" stage neutral.
6. **[src/components/protocol/v2/primitives/NSDRReturnPrimitive.jsx](src/components/protocol/v2/primitives/NSDRReturnPrimitive.jsx)** — STAGES eyes stage replaced con "back" stage neutral.

---

## Anti-regression total

```
Test Files  251 passed (251)
Tests       4989 passed (4989)
Duration    81.78s
```

Cero regresiones.

---

## Captura runtime entregada (1)

- [01-stage-3-back-bienvenido.png](screenshots/sp-p-4-nsdr-return/01-stage-3-back-bienvenido.png) — Stage 3 back: "RETORNO GRADUAL" full brightness + "Toma tu tiempo · Bienvenido" + "CUERPO DESCANSADO" + 3 stage dots (2 passed + 3 active) + larger pulsing point awake mode + body anchor "Mente clara · Listo para seguir" — sin mención de ojos.

---

## Estado #17 NSDR 10 min (post SP-P-4) — **CIERRE 4/4 + EYES LOGIC LIMPIA**

| Phase | Status | Primitive | Score |
|-------|--------|-----------|:-----:|
| 1 Configuración | ✅ DEDICATED + eyes-removed | NSDRConfigurationPrimitive | **~9.2** |
| 2 Body Scan (4 zonas) | ✅ DEDICATED 4 sub-actos | NSDRBodyScanPrimitive | **~9.2** |
| 3 Respiración Pasiva | ✅ DEDICATED ultra-minimal | NSDRPassiveBreathPrimitive | **~9.2** |
| 4 Retorno Gradual | ✅ DEDICATED + eyes-removed | NSDRReturnPrimitive | **~9.2** |

Score #17 promedio post SP-P-4 estimate **~9.2/10**.

---

## Estado Tier acumulado

| Tier | Phases dedicated | Status |
|------|:---------------:|--------|
| 1A | 9/9 | ✅ |
| 1B | 9/9 | ✅ |
| 2 | 19/19 | ✅ |
| #15 Active | 3/3 | ✅ |
| #16 Training | 3/3 | ✅ |
| **#17 Training** | **4/4** | ✅ **CIERRE** |

**TOTAL phases dedicated = 47/47** (4989/4989 tests verde).

---

**Fin del reporte SP-P-4. 4989/4989 verde. Protocolo #17 cierre 4/4 + eyes logic removida transversalmente. Próximo SP-Q-1 listo (#18 Emergency Reset — primer Crisis tier protocol).**
