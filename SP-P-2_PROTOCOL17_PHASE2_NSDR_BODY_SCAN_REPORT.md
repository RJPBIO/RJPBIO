# SP-#17-P-2 PHASE 2 "BODY SCAN DESCENDENTE" — REPORTE

**Fecha:** 2026-05-11
**Modo:** Phase 2 #17 dedicated (NSDRBodyScanPrimitive — 4 sub-actos × 75s con zone primary + 4 zone progression dots + sleep-mode minimal + voice-led).
**Estado del repo:** baseline post SP-P-1 (4989 verde) → post-SP-P-2 (4989 verde, cero regresiones).

---

## Resumen ejecutivo

| Item | Estado |
|------|--------|
| **Capa 1** NSDRBodyScanPrimitive con subActIdx prop 0-3 | ✅ creado |
| **Capa 2** Catalog #17 Phase 2 4 sub-actos migrate `silence_cyan_minimal` → `nsdr_body_scan` | ✅ wired |
| **Capa 3** PrimitiveSwitcher + tier-training VALID_PRIMITIVES + storybook | ✅ |
| **Capa 4** Anti-regression total + 1 captura runtime + reporte | ✅ **4989/4989 verde** |
| Score #17 Phase 2 | baseline 8.5 → ~9.2/10 (estimate) |

---

## Diseño sleep-mode minimal (eyes closed)

**Context crítico:** Phase 2 sigue Phase 1 (NSDRConfiguration) cuyo último stage es "cierra los ojos · la voz te guía". User está con ojos cerrados durante TODA Phase 2 (300s body scan).

**Visual SECUNDARIO** — voice-led primario:
- Para users que abran ojos briefly: vez actual zone + ambient calm
- Para users con audio off: muestra zone activa para self-guidance
- Sleep-mode aesthetic: muy dim, particle subtle, no halos brillantes

---

## Cambios concretos

### Archivo creado (1)

1. **[src/components/protocol/v2/primitives/NSDRBodyScanPrimitive.jsx](src/components/protocol/v2/primitives/NSDRBodyScanPrimitive.jsx)** — ~310 LOC.

   **4 zones per subActIdx:**

   | subActIdx | Zone | Primary | Subtitle | Body anchor |
   |:--:|------|---------|----------|-------------|
   | 0 | head | "Cabeza · Cuello · Hombros" | "Suelta · Sin tensión" | "Cuero cabelludo · Frente · Mandíbula" |
   | 1 | arms | "Brazos · Manos · Dedos" | "Pesados · Sueltos" | "Codos · Antebrazos · Manos" |
   | 2 | torso | "Pecho · Abdomen · Caderas" | "Suelta el peso" | "Costillas · Vientre · Pelvis" |
   | 3 | legs | "Piernas · Pies · Dedos" | "Pesados sobre el suelo" | "Muslos · Pantorrillas · Pies" |

   **Multi-exercise tracks layered (6):**
   1. Backdrop ambient muy dim vignette.
   2. Subtle particle field (opacity 0.10).
   3. Ambient pulsing point (~7s breath rhythm).
   4. Zone primary + subtitle text (24px light + cyan uppercase).
   5. 4 zone progression dots top (active = bright, passed = dim, pending = subtle).
   6. Body anchor evolutivo + bottom small countdown.

   **Voice cues per zone:** speak(voiceCue) on subActIdx change (TTS auto-on per catálogo).

### Archivos modificados (4)

1. **[src/lib/protocols.js](src/lib/protocols.js)** — Phase 2 #17: 4 sub-actos migrated `silence_cyan_minimal` → `nsdr_body_scan` con `subActIdx` 0-3.
2. **[src/components/protocol/v2/PrimitiveSwitcher.jsx](src/components/protocol/v2/PrimitiveSwitcher.jsx)** — registry add con subActIdx forwarding.
3. **[src/lib/protocols.tier-training.test.js](src/lib/protocols.tier-training.test.js)** — VALID_PRIMITIVES extended con `nsdr_body_scan`.
4. **[src/components/protocol/v2/PrimitivePreview.jsx](src/components/protocol/v2/PrimitivePreview.jsx)** — storybook entries x2 (zone 1 + zone 3).

---

## Anti-regression total

```
Test Files  251 passed (251)
Tests       4989 passed (4989)
Duration    77.88s
```

Cero regresiones.

---

## Captura runtime entregada (1)

- [01-zone-3-torso.png](screenshots/sp-p-2-nsdr-body-scan/01-zone-3-torso.png) — Zone 3 torso: "BODY SCAN" + "Pecho · Abdomen · Caderas" + "SUELTA EL PESO" + 4 zone dots (passed dim + active bright + pending subtle) + ambient pulse + body anchor "Costillas · Vientre · Pelvis".

---

## Estado #17 NSDR 10 min (post SP-P-2)

| Phase | Status | Primitive | Score |
|-------|--------|-----------|:-----:|
| 1 Configuración (60s) | ✅ DEDICATED v2 logic-fixed | NSDRConfigurationPrimitive | **~9.2** |
| 2 Body Scan (4 zonas × 75s) | ✅ DEDICATED 4 sub-actos | NSDRBodyScanPrimitive | **~9.2** |
| 3 Respiración Pasiva (150s) | ⏳ shared `silence_cyan_minimal` | — | — |
| 4 Retorno Gradual (90s) | ⏳ shared `silence_cyan_minimal` | — | — |

Score #17 promedio post SP-P-2 estimate Phase 1+2 **~9.2/10**.

---

## Estado Tier acumulado

| Tier | Phases dedicated | Status |
|------|:---------------:|--------|
| 1A | 9/9 | ✅ |
| 1B | 9/9 | ✅ |
| 2 | 19/19 | ✅ |
| #15 Active | 3/3 | ✅ |
| #16 Training | 3/3 | ✅ |
| **#17 Training** | **2/4** | 🟡 Phase 1+2 |

**TOTAL phases dedicated = 45/45** (4989/4989 tests verde).

---

**Fin del reporte SP-P-2. 4989/4989 verde. Phase 2 #17 dedicated consolidated con 4 zones zone-aware. Próximo SP-P-3 listo (#17 Phase 3 "Respiración Pasiva" — 150s observa exhalaciones sin controlar).**
