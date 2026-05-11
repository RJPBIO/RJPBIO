# SP-#16-O-1 PHASE 1 "CALIBRACIÓN" — REPORTE (v2 pure orb)

**Fecha:** 2026-05-10
**Modo:** Phase 1 #16 dedicated (VagalResonanceCalibrationPrimitive — pure breath orb meditation-app style + coherence sine wave + cadence 5.5-5.5). **PRIMER protocolo Training tier dedicated.**
**Estado del repo:** baseline post SP-N-2 (4989 verde) → post-SP-O-1 (4989 verde, cero regresiones).

---

## v2 elevation post feedback "hazlo diferente, no siempre el mismo dibujo, puede ir el orbe de respiración ahí"

**v1 (rechazado):** body silhouette + heart zone halo + coherence wave. Repite el pattern del Tier 2 #11/#12/#15.

**v2 (final):** **PURE BREATH ORB** central — estilo Calm / Headspace / Apple Mindfulness:
- ❌ NO body silhouette (break the pattern)
- ✅ Outer halo soft (100px blur)
- ✅ Middle halo primary (70px aura)
- ✅ Main breath orb (42px radial gradient)
- ✅ Inner bright core (14px solid)
- ✅ Dashed outline ring (80px subtle)
- ✅ Coherence sine wave bottom

Lesson aplicada (PWA — break patterns siempre): cada módulo nuevo debe divergir del baseline. Para HRV training (10 min sesión sostenida), el orb puro es el approach correcto — meditation-app feel, no fitness app feel.

---

## Cambios concretos

### Archivo creado (1)

1. **[src/components/protocol/v2/primitives/VagalResonanceCalibrationPrimitive.jsx](src/components/protocol/v2/primitives/VagalResonanceCalibrationPrimitive.jsx)** — ~410 LOC.

   **Visual signature unique #16 Phase 1:**
   - Cinematic vignette ellipse (140cy radial gradient).
   - **Outer halo** (100px, blur stdDeviation 12, scale sync orb).
   - **Middle halo aura** (70px, opacity 0.55-0.85 per breath phase).
   - **Main breath orb** (42px radial gradient, scale 1.0 ↔ 1.30 smooth ease).
   - **Inner bright core** (14px solid cyan-deep).
   - **Dashed outline ring** (80px stroke subtle dashed).
   - **Coherence sine wave** (240×30px viewbox bottom) — amplitude grows 8→22px con coherenceProgress (cycles completed).
   - **Countdown chip** top-right (32px mono tabular-nums per breath phase).
   - **"COHERENCIA"** label below wave.

   **Phase tracking dinámico:**

   | Phase | Primary (uppercase cyan) | Body anchor |
   |-------|--------------------------|-------------|
   | Inhale 5.5s | "INHALA · Suave por la nariz" | "Calmo" |
   | Exhale 5.5s | "EXHALA · Deja salir" | "Calmo · Sostenido" |

   Cadence: smooth ease-in-out cosine (vs sharp ease-out previo) — 5.5-5.5 muy lento, restful.

### Archivos modificados (4)

1. **[src/lib/protocols.js](src/lib/protocols.js)** — Phase 1 #16 acto migrated `breath_orb` → `vagal_resonance_calibration` props {cadence:{in:5.5,h1:0,ex:5.5,h2:0}, cycleCountTarget:5}.
2. **[src/components/protocol/v2/PrimitiveSwitcher.jsx](src/components/protocol/v2/PrimitiveSwitcher.jsx)** — registry add.
3. **[src/lib/protocols.tier-training.test.js](src/lib/protocols.tier-training.test.js)** — VALID_PRIMITIVES extended con `vagal_resonance_calibration`.
4. **[src/components/protocol/v2/PrimitivePreview.jsx](src/components/protocol/v2/PrimitivePreview.jsx)** — storybook entry.

---

## Razonamiento human-functional

**Lógica clara:**
- Catálogo: 5 ciclos calibración 5.5s in + 5.5s ex = 55s.
- Primitive ENTREGA: orb central limpio respirando smooth + coherence wave growing visualmente per ciclo completed.

**Función biohacking:**
- Respiración a 5.5rpm maximiza HRV vía resonancia barorrefleja (Lehrer & Gevirtz 2014).
- 5 ciclos calibración prepara para sostenimiento 8min (Phase 2).
- Visual orb meditation-app + coherence wave = clear progress feedback.

**Lenguaje común:**
- "INHALA · Suave por la nariz" — concrete.
- "EXHALA · Deja salir" — verb + result.
- "Calmo · Sostenido" — sensation.
- ZERO jerga ("HRV", "barorrefleja", "5.5rpm" relegated a mechanism field).

---

## Anti-regression total

```
Test Files  251 passed (251)
Tests       4989 passed (4989)
Duration    75.65s
```

Cero regresiones.

---

## Captura runtime entregada (1)

- [01-exhale-coherence-wave.png](screenshots/sp-o-1-calibracion-16/01-exhale-coherence-wave.png) — Phase EXHALE: "CALIBRACIÓN" + "EXHALA · DEJA SALIR" + **pure breath orb central** (multi-layer halos) + coherence sine wave abajo + "COHERENCIA" label + countdown "4" + body anchor "Calmo · Sostenido".

---

## Estado #16 Resonancia Vagal (post SP-O-1)

| Phase | Status | Primitive | Score |
|-------|--------|-----------|:-----:|
| 1 Calibración (5 ciclos) | ✅ DEDICATED v2 pure orb | VagalResonanceCalibrationPrimitive | **~9.2** |
| 2 Sostenimiento (4 blocks × 120s) | ⏳ shared (4 actos × `breath_orb`) | — | — |
| 3 Cierre Reflexivo | ⏳ shared `silence_cyan_minimal` | — | — |

Phase 2 #16 tiene 4 actos diferentes (bloque 1, 2, 3, 4) — considerar si Phase 2 dedicated debe ser un primitive ÚNICO compartido por los 4 bloques o si tiene variación visual per bloque (cohesión grows). Decisión al iniciar SP-O-2.

---

## Estado Tier acumulado

| Tier | Phases dedicated | Status |
|------|:---------------:|--------|
| 1A | 9/9 | ✅ |
| 1B | 9/9 | ✅ |
| 2 | 19/19 | ✅ |
| #15 Active | 3/3 | ✅ |
| **#16 Training** | **1/3** | 🟡 Phase 1 |
| Resto Training/Crisis | 0/? | ⏳ |

---

**Fin del reporte SP-O-1. 4989/4989 verde. Phase 1 #16 dedicated v2 pure orb consolidated. Próximo SP-O-2 listo (#16 Phase 2 "Sostenimiento" — 4 actos × 120s × 2 minutos = 8 minutos sostenimiento, decisión sobre primitive único o variación per bloque).**
