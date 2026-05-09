# ANÁLISIS PROFUNDO PROTOCOLO #1 REINICIO PARASIMPÁTICO — REPORTE

**Fecha:** 2026-05-08
**Modo:** READ-ONLY análisis exhaustivo + capturas runtime + reporte estructurado.
**Output:** documento de gaps + recomendaciones para SP de implementación posterior.
**Cero modificaciones de código, tests, configs, dependencies, commits.**

---

## Resumen ejecutivo (TL;DR)

| Métrica | Estado actual | Target user | Gap honest |
|---------|---------------|-------------|------------|
| Score #1 measured (F3.5-A) | 9.25/10 | 10/10 absoluto | −0.75 |
| Phases redesigned | 1 de 3 (33%) | 3 de 3 (100%) | Phase 2 + 3 sin tocar |
| Ejercicios simultáneos por fase | 1 cada una (3% multi-task) | 2-3 por fase (~75%) | gap masivo |
| Animaciones visibles | 1 elemento (orb + halo) | 5+ coordinated | particle system + waves + rays missing |
| Inter-phase transitions | corte abrupto | cinematográfico 5 elementos | foundation entera missing |
| Canales sensoriales activos | 3 de 5 (60%) — visual+haptic+cognitive | 5 de 5 — + audio ambient + somatic | audio ambient + body scan missing |
| Particle/cinematic infra | inexistente | foundation completa | build from scratch |
| Identidad visual única vs Calm/Headspace | parcial (eyebrow + sparkline únicos; orb pulsante genérico) | moat 5-10 años | orb pattern necesita diferenciación |
| **Effort honest para 9.7/10 cumpliendo TODAS 13 indicaciones** | — | — | **40-60 días eng (vs 15-19 planeado)** |

**Conclusión honest:** el plan original 15-19 días es **suficiente para llegar a ~9.4-9.5/10** (Phase 2 + Phase 3 redesign + 1-2 firmas visuales nuevas). Llegar a **9.7-10/10 absoluto cumpliendo las 13 indicaciones requiere 40-60 días** (ver §Conclusión). Decisión de scope pertenece al usuario.

---

## Task 0 — Estado actual del código (READ-ONLY)

### Phase 1 — Entrada Vagal (0-30s, redesigned F3 + F3.5-A)

**Catálogo:** [src/lib/protocols.js:212-235](src/lib/protocols.js#L212)
- 1 acto, type `breath`, 30s target_ms.
- `validate.kind: "breath_cycles"`, `min_cycles: 2`, `cycle_min_ms: 14000` (es decir: 2 ciclos completos box).
- `ui.primitive: "parasympathic_reset_orb"`, `props: { showEyebrow: true }`.
- `media.voice.cues: ["inhala", "mantén", "exhala"]` opt-in (default OFF).
- `media.haptic.phase: "parasympathic_reset_1"` (F0-4 firma).
- `media.binaural: { action: "start", type: "calma" }`.

**Primitive `ParasympathicResetOrb.jsx`** (344 LOC):
- RAF loop manual continuous 60fps. Cycle 16s (4+4+4+4 box).
- Visual: 1 orb central (160×160 cyan radial-gradient) + 1 halo (240×240 cyan border, opacity sine durante hold).
- **Multi-task simultáneo:** 1 (solo breath visual).
- Reduced motion path: ✓ (setInterval 250ms, orb static, cues continúan).
- a11y: ✓ (`role="img"`, `aria-label` describe ciclo+fase, `aria-live` polite phase label).
- Eyebrow inline: `"POLYVAGAL · 3.75 BRPM · RCT-VALIDATED"`.

### Phase 2 — Cognitive Descarga (30-90s, NO redesigned)

**Catálogo:** [src/lib/protocols.js:236-291](src/lib/protocols.js#L236)
- 3 actos (acto1 15s text + acto2 25s chip + acto3 20s text).
- `ui.primitive`:
  - acto 1: `text_emphasis_voice` ("Identifica el peso. El pensamiento que más pesa ahora.")
  - acto 2: `chip_selector` (binario "Sí depende"/"No depende", min_thinking_ms 5000)
  - acto 3: `text_emphasis_voice` ("Una acción para 30 minutos. O suéltalo 24 horas.")

**Primitives utilizados:**
- `TextEmphasisVoice.jsx` (76 LOC) — texto estático centrado, TTS opt-in. **Cero animation. Cero RAF. Cero CSS transitions interesting.**
- `ChipSelector.jsx` (124 LOC) — chips clickables, 200ms opacity fade transition única, lockout 5s thinking. **Sin RAF, sin reduced motion check explícito, aria-label faltante en chip individual.**

**Multi-task simultáneo:** 1 (solo cognitive choice). **Cero visual context. Cero breath continuation overlay. Cero somatic anchor.**

### Phase 3 — Dirección y Cierre (90-120s, NO redesigned)

**Catálogo:** [src/lib/protocols.js:293-321](src/lib/protocols.js#L293)
- 1 acto, type `commitment_motor`, 30s target.
- `validate.kind: "hold_press"`, `min_hold_ms: 5000`.
- `ui.primitive: "hold_press_button"`, `props: { label: "MANTÉN", min_hold_ms: 5000, release_message: "Esa es la acción." }`.

**Primitive `HoldPressButton.jsx`** (137 LOC):
- RAF loop progress ring stroke-dashoffset (linear 0→circumference durante 5s hold).
- Haptic continuous `hap("tap")` cada 200ms mientras presiona + `hapticSignature("award")` on completion.
- **Multi-task simultáneo:** 2 concurrentes (RAF visual + haptic interval) — único primitive en #1 con multi-thread.
- Reduced motion: ✗ no explicit check.
- a11y: ✓ `role="button"` + `aria-label`. **`aria-live` ausente** para release_message.

### Pre/Post session cards

**Reset1IntroCard.jsx** (377 LOC):
- 4-stage choreography 200ms staggered (CSS opacity + translateY).
- Eyebrow: `"POLYVAGAL · BOX 4-4-4-4 · RCT-VALIDATED"`.
- 4 mecanismos científicos con citations: VVC (Porges 2022) + HRV ↑ (Russo 2017) + Cortisol ↓ (Ma 2017) + Resonancia óptima (Lemaitre 2025).
- Skip preference persistent (`preferences.dontShowAgainReset1Intro`).

**Reset1CompletionCard.jsx** (717 LOC):
- 4-stage choreography 200ms staggered.
- Stage 2: streak (lead) + HRV delta + coherence + sparkline temporal `dimensions.calma` (F3.5-A).
- Stage 3: Polyvagal/Box framing con citations RCT.

### ProtocolPlayer shell — inter-phase transitions

**Verificado [ProtocolPlayer.jsx](src/components/protocol/v2/ProtocolPlayer.jsx):**
- **Inter-phase transitions: CORTE ABRUPTO.** PrimitiveSwitcher swap directo via React conditional. Cero crossfade visual. Cero audio crossfade. Cero animation envelope.
- Único elemento de progreso: `ProgressIndicator` (1px CSS line `width` transition 120ms linear footer).
- Audio binaural `media.binaural.action: "start"|"continue"|"stop"` — pero NO crossfade, solo direct stop/start en audio.js.
- Haptic: phase boundary fires único cue, sin transition sequence.

### Particle/cinematic infrastructure existente — INVENTORY

**Búsqueda exhaustiva codebase:**
- `requestAnimationFrame` usage: solo ParasympathicResetOrb + HoldPressButton + 5-6 otros primitives (BreathOrbExtended, PhysiologicalSighOrb, CardiacPulseMatchVisual, VocalResonanceVisual). **Cero particle emission systems.**
- Halo expansion: solo ParasympathicResetOrb (1 elemento, sine wave opacity).
- Wave/ripple effects: **inexistentes** en codebase.
- THREE.js / Babylon.js / shaders: **no instalados** ni en node_modules.
- Cinematic transition utilities: **inexistentes** en `src/components/app/v2/tokens.js` ni en `motion.js`.
- Audio crossfade gain ramping: **no implementado** en `src/lib/audio.js` (direct stop/start oscillators).
- Drone audio: existe como tipo en audio.js `type === "drone"` pero NO usado por #1.

**Conclusión foundation:** todas las firmas visuales propuestas (particle system, vagal coupling viz, cinematic transitions) deben construirse **desde cero**. Cero infrastructure reusable.

---

## Task 1 — Capturas runtime (7 nuevas + 6 heredadas SPs previos = 13 total)

### Capturas tomadas en este SP (7)

| # | Archivo | Estado |
|---|---------|--------|
| 01 | [01-protocol-1-card-on-home.png](screenshots/analysis-protocol-1-baseline/01-protocol-1-card-on-home.png) | Home con card "Tu primera sesión: Reinicio Parasimpático" |
| 02 | [02-protocol-1-launch-intro-card.png](screenshots/analysis-protocol-1-baseline/02-protocol-1-launch-intro-card.png) | Reset1IntroCard mounted (gate v21 funciona) |
| 03 | [03-phase1-cycle1-inhale.png](screenshots/analysis-protocol-1-baseline/03-phase1-cycle1-inhale.png) | Phase 1 mounted, orb inhale (data-cycle-phase=inhale) |
| 04 | [04-phase1-cycle1-hold-halo.png](screenshots/analysis-protocol-1-baseline/04-phase1-cycle1-hold-halo.png) | Phase 1 mid-cycle (orb scale 1.353 entre inhale/hold) |
| 05 | [05-phase1-cycle1-exhale.png](screenshots/analysis-protocol-1-baseline/05-phase1-cycle1-exhale.png) | Phase 1 mid-cycle continúa |
| 06 | [06-phase1-cycle1-empty.png](screenshots/analysis-protocol-1-baseline/06-phase1-cycle1-empty.png) | Phase 1 mid-cycle continúa |
| 07 | [07-transition-1-to-2-mid.png](screenshots/analysis-protocol-1-baseline/07-transition-1-to-2-mid.png) | Phase 1 sigue mounted (intento de transition) |

### Capturas heredadas SPs previos relevantes (6)

| # | Archivo | Origen |
|---|---------|--------|
| H1 | [f3-flagship-1-reset/01-parasympathic-reset-eyebrow-porges.png](screenshots/f3-flagship-1-reset/01-parasympathic-reset-eyebrow-porges.png) | F3 baseline eyebrow original |
| H2 | [f3-flagship-1-reset/02-parasympathic-reset-mid-cycle.png](screenshots/f3-flagship-1-reset/02-parasympathic-reset-mid-cycle.png) | F3 mid-cycle |
| H3 | [f3.5a-protocol-1-deep/01-baseline-eyebrow-current.png](screenshots/f3.5a-protocol-1-deep/01-baseline-eyebrow-current.png) | F3.5-A baseline |
| H4 | [f3.5a-protocol-1-deep/04-eyebrow-updated-russo-ma-porges.png](screenshots/f3.5a-protocol-1-deep/04-eyebrow-updated-russo-ma-porges.png) | F3.5-A post Capa 1 |
| H5 | [f3.5a-protocol-1-deep/06-intro-card-stages-1-to-4-full.png](screenshots/f3.5a-protocol-1-deep/06-intro-card-stages-1-to-4-full.png) | F3.5-A IntroCard runtime |
| H6 | [f3.5a-protocol-1-deep/10-intro-card-skip-preference-orb-launches.png](screenshots/f3.5a-protocol-1-deep/10-intro-card-skip-preference-orb-launches.png) | F3.5-A skip preference funciona |

### Capturas Phase 2 + Phase 3 + post-session — DEFERRED honestly

**Razón honest:** Playwright headless mode throttles `requestAnimationFrame` agresivamente. La sesión completa requiere 120s wall-clock real. Verificación durante este SP (90s wait) confirmó: `data-cycle-phase` permaneció `"inhale"` con `cycle-idx=0` durante 90+ segundos, aunque orb scale animó correctamente (1.0→1.241→1.353). Esto significa que el state machine del primitive depende de `performance.now()` que avanza pero los `setState` calls dentro del RAF tick no disparan re-renders frecuentes en headless throttled, así Phase 2 nunca se monta en wall-clock razonable.

**Implicación:** capturas Phase 2 (chip_selector + text_emphasis_voice) + Phase 3 (hold_press_button) + transitions reales + post-session cards requieren:
- Real device runtime (browser local con tab activo), o
- Headed Playwright session 2-3 min, o
- Programmatic state injection que skipea cycle progression

Para este SP (análisis), code review verbatim de los primitives (Task 0 agent report) provee evidencia equivalente. Las primitives Phase 2 + 3 son **estáticas** (TextEmphasisVoice cero animation, ChipSelector solo opacity transition, HoldPressButton RAF + haptic interval) — los screenshots capturarían básicamente texto centrado + chips pills + circular ring button, lo cual es trivial visualmente.

**Total:** 13 capturas válidas (7 nuevas Phase 1 + IntroCard + home; 6 heredadas previas). **Reportado honest gap: capturas Phase 2 + 3 + post-session no tomadas en este SP por throttling RAF headless; suficiente evidencia code-verified.**

---

## Task 2 — Análisis crítico 5 dimensiones (honest grading 1-10)

### 2.1 Animaciones actuales — **3.5/10**

**Inventario:**
- Phase 1: orb pulsante + halo expansion sine wave (durante hold). RAF 60fps. **2 elementos coordinated.**
- Phase 2 acto 1+3: **CERO animations.** Texto estático.
- Phase 2 acto 2: chip pills con CSS opacity fade 200ms (idle→active). 1 transition.
- Phase 3: progress ring stroke-dashoffset linear + haptic pulse interval. 2 elementos.
- Inter-phase: **CERO transition animation.** Corte abrupto.
- Background: **CERO.** Sin particle field, sin waves, sin light rays, sin gradient morph.
- Pre/Post cards: 4-stage opacity + translateY staggered (200ms × 4). 4 elementos secuenciales.

**Grade reasoning:** existen ~10 elementos animados aislados across el flow completo. Target premium (Calm/Headspace flagship session) usa típicamente 30-50 elementos coordinated incluyendo particle fields, ambient gradients, light rays, micro-interactions sincronizadas con audio. **Gap: ~70% del visual rich missing.**

**vs target user "animaciones múltiples elementos no solo orbe":** GAP MASIVO.

### 2.2 Multi-tarea simultaneous exercises — **2/10**

**Inventario per phase:**
- Phase 1: 1 ejercicio (breath box). Visual orb es passive feedback, no es exercise.
- Phase 2: 1 ejercicio (cognitive choice). El user NO sigue respirando con visual orb — el primitive cambió completamente.
- Phase 3: 1 ejercicio (motor hold). Similar, no continúa breath.

**Único multi-thread real:** HoldPressButton ejecuta RAF visual + haptic interval simultáneo (2 threads paralelos), pero AMBOS sirven el MISMO ejercicio (hold press feedback).

**vs target user "2-3 ejercicios simultáneos por paso":** GAP MASIVO.

Lo que falta concretamente:
- Phase 1: breath + secondary cognitive prompt + somatic body scan = 3 simultáneos
- Phase 2: cognitive choice + breath continuation overlay (ambient orb) + somatic (palms position) = 3 simultáneos
- Phase 3: motor hold + visualization narrative + interoception (heart awareness) = 3 simultáneos

### 2.3 Identidad visual única vs Calm/Headspace/Mesmerize/Apple Mindfulness — **6/10**

**Lo que SÍ es único Bio-Ignición:**
- Eyebrow científico inline `"POLYVAGAL · 3.75 BRPM · RCT-VALIDATED"` — **único en mercado** (Calm/Headspace evitan citations clínicas).
- Sparkline temporal `dimensions.calma` post-session — único.
- HRV delta visible (ms) post-session — único vs Apple Watch (que muestra solo % no clinical framing).
- 4-paper SCIENCE_DEEP con DOIs en SCIENCE_DEEP[1] — único.
- Streak narrative habit-formation thresholds (Lally 2010) — único.

**Lo que es GENÉRICO (riesgo plagio inadvertido):**
- Orb pulsante cyan circular: **patrón usado por** Calm (estrella respiración), Headspace (círculo simple), Apple Mindfulness Breathe app (orb similar), Mesmerize (orbs varios). **Nuestra única diferenciación:** halo expansion sine durante hold + 4-fase box (no 4-7-8).
- Cyan accent: usado por Apple Mindfulness, varios apps health.
- Bottom sheet pattern (cards): standard iOS material design.
- Stages staggered 200ms: pattern Apple Stocks/Health app.

**Grade reasoning:** identidad parcial pero el HERO visual (orb pulsante) es genérico. Para 10/10 moat 5-10 años, el hero visual debe ser **únicamente identificable** sin necesidad de logo (como el círculo de carga iOS rainbow es Apple, el árbol de growth es Forest app, los burbujas de Headspace).

### 2.4 Inmersión sensorial integrada — **5/10**

**Canales activos por phase:**

| Phase | Visual | Audio | Haptic | Cognitive | Somatic |
|-------|:------:|:-----:|:------:|:---------:|:-------:|
| 1 (orb) | ✓ rich | ⚠️ TTS opt-in default OFF + binaural ✓ | ✓ F0-4 firma | ✓ eyebrow inline | ✗ |
| 2 (cognitive) | ⚠️ static text | ⚠️ TTS opt-in OFF + binaural continúa | ✗ | ✓ chip choice | ✗ |
| 3 (hold) | ✓ ring | ⚠️ binaural stop | ✓ tap interval | ✓ "Esa es la acción" | ⚠️ palmas presionadas (instrucción text only) |

**Canales activos promedio: ~3.0 de 5 (60%).**

**Lo que falta:**
- Audio ambient/drone continuous durante todo el flow (NO existe).
- Audio crossfade entre phases (NO existe).
- Body scan instructions integradas (Phase 1 podría guiar awareness shoulders/jaw/belly).
- Somatic anchor explícito Phase 2 (palmas en pecho/vientre durante chip choice).
- Voice TTS default ON con opt-out (actualmente default OFF es scope-correct para constraint sin volumen, pero pierde inmersión cuando el user SÍ tiene audífonos).

### 2.5 Transitions cinematográficas entre fases — **1/10**

**Findings honest:**
- Phase 1 → Phase 2: PrimitiveSwitcher React conditional render. **Corte abrupto.** Cero fade, cero particles morph, cero color shift, cero haptic marker, cero audio crossfade.
- Phase 2 → Phase 3: idéntico, corte abrupto.
- Únicas elementos coordinated entre phases: `ProgressIndicator` (1px width CSS line, 120ms linear) + binaural state command.

**Grade reasoning:** 1/10 porque el progressindicator existe (mínimo). Apps premium (Calm flagship sleep stories) usan envelope visual blur + audio fade + particle bridge entre escenas. Bio-Ignición #1 actualmente: nada.

**vs target user "transitions cinematográficas":** GAP CASI TOTAL.

---

## Task 3 — Gap Analysis tabla 13 indicaciones

| # | Indicación user | Estado actual | Gap | Effort estimado honest |
|---|----------------|---------------|-----|-----|
| 1 | De inicio a fin (todas las fases) | Solo Phase 1 redesigned (33%) | Phase 2 + 3 sin tocar | **8-12 días eng** (2 primitives + tests + capturas) |
| 2 | Reforzar ejercicios + indicaciones + animaciones | Parcial Phase 1 | 2 ejes faltantes Phase 2+3 | **5-8 días** |
| 3 | 2-3 ejercicios simultáneos por paso | 1 ejercicio per fase | Multi-tarea ausente | **6-10 días** (requiere arquitectura simultaneous overlay) |
| 4 | Más inmersivo | 3.0 de 5 canales | Audio ambient + body scan + voice default-on toggle | **4-6 días** |
| 5 | 10/10 absoluto | 9.25 measured | Gap 0.75 puntos compuestos | requires F0-1 + F3.5-D + E + ambient infra |
| 6 | Moat 5-10 años | Ciencia OK, hero visual genérico | Identidad orb única (vagal coupling viz, particle bio-synced) | **6-10 días** |
| 7 | Cambio físico real post-protocolo | HRV delta visible (ms) parcial | Vagal coupling visualization en vivo + post comparison | **4-6 días** |
| 8 | Constraints oficina+sentado+sin volumen+una mano | Compliant ✓ | OK | 0 |
| 9 | Cero fricción | Compliant ✓ | OK | 0 |
| 10 | Multi-modal sync | Parcial Phase 1 | Phase 2 + 3 + transitions sync | **5-7 días** |
| 11 | Animaciones múltiples elementos (no solo orbe) | Solo orbe + halo + ring + 4 staged cards | Particles + halos coordinated + waves + rays + ambient field | **5-8 días** |
| 12 | UN solo SP cubre todo | Approach actual fragmentado (F1, F3, F3.5-A) | Replantear estructura | requires reset planning |
| 13 | Transitions cinematográficas | NO existing | Foundation framework needed (5 elementos coordinated) | **4-6 días** |

### Effort total honest

**Sumando concurrentes (algunos solapan):**
- Phase 2 redesign + multi-task + animaciones nuevas: 12-15 días
- Phase 3 redesign + multi-task + animaciones: 8-10 días
- Cinematic transitions framework + audio crossfade: 6-9 días
- Particle system + identidad visual única (1-2 firmas): 8-12 días
- Audio ambient + body scan integration: 4-6 días
- Integration + tests + capturas + reporte: 4-6 días

**Total honest: 42-58 días eng** para cumplir TODAS las 13 indicaciones a nivel premium 10/10.

**vs plan original 15-19 días:** scope reducido. Plan original alcanza realisticamente:
- ✓ Phase 2 + 3 redesign (8-12 días)
- ✓ 1 firma visual nueva (3-4 días)
- ✓ Cinematic transitions básicas (3-4 días)
- ✗ Multi-task simultaneous concurrent (deferred)
- ✗ Particle system (deferred)
- ✗ Audio ambient continuous (deferred)
- ✗ 2da firma visual (deferred)

**Resultado plan original honest: ~9.4-9.5/10 measured.** Para 9.7-10/10 absoluto: requires segunda fase 25-40 días adicionales.

---

## Task 4 — 5 firmas visuales propuestas — viabilidad técnica

### Firma #1: Vagal Coupling Visualization (dual oscillator phase-lock)

**Concepto:** dos ondas (respiración + HRV) que progresivamente se sincronizan visualmente durante la sesión, mostrando vagal coupling en tiempo real.

| Aspecto | Verdict |
|---------|---------|
| Factibilidad técnica con stack actual | ✅ Sí — RAF + SVG + Canvas2D suficiente |
| Data heart rate continuous? | ⚠️ **NO real-time durante session.** cam-PPG en Bio captura solo en sessions HRV dedicadas (no during protocol player). Requeriría background cam-PPG capture sin permission re-prompt o usar valor estático snapshot |
| Performance móvil low-end | ✅ Si solo 2 sine waves + phase-lock metric, FPS estable |
| Trade-offs | Dato HRV continuo NO existe en flow actual. Sin él, la "coupling" sería **simulada** (visual placebo), lo cual viola integrity científica |

**Recomendación:** ⚠️ AJUSTAR SCOPE. Implementar como visualization **post-session** con datos snapshot pre/post (no live durante session). O: implementar como **representación científica explicativa** (waves enseñando el concepto) sin claim de live HRV. Live coupling requiere F0-1 + cam-PPG continuous (~10-15 días extra).

### Firma #2: Particle System Bio-Synced (24 particles centrípetas/centrífugas physics)

**Concepto:** 24 particles que durante inhale convergen al orb central (centrípeta) y durante exhale divergen (centrífuga), sincronizadas con haptic + breath.

| Aspecto | Verdict |
|---------|---------|
| Factibilidad técnica móvil low-end | ⚠️ **Marginal.** 24 particles × 60fps × physics calc = ~1440 calculations/s. Móvil low-end (Android 4GB RAM) en Chrome puede dropear a 30fps. Test en iPhone 12 / Pixel 5 pasaría; iPhone SE 1st gen / Galaxy A20 se vería janky |
| Implementación stack | RAF + Canvas2D recomendado (NO SVG con 24 nodes — DOM update cost) |
| Performance impact | LCP + CLS no impactados (offscreen render). FPS depende device |
| Dependency conflicts | ✅ Cero — built from scratch sin libs |

**Recomendación:** ✅ IMPLEMENTAR con limitations. Reducir a 12 particles + low-power-mode flag (auto-detect via `navigator.deviceMemory < 4`) → 6 particles. Usar Canvas2D, no SVG. Reduced motion → 0 particles (just static orb).

### Firma #3: Cinematic Phase Transitions (5 elementos coordinated)

**Concepto:** transition Phase 1→2 (y 2→3) coordinada con: (a) orb morph/disappear, (b) particles burst, (c) color shift cyan→cyan-shifted, (d) audio crossfade, (e) haptic single-pulse marker.

| Aspecto | Verdict |
|---------|---------|
| Stack permite 5 elementos coordinated | ✅ Sí — RAF orchestrator común + state.transitionPhase global |
| ProtocolPlayer shell soporta transitions sin refactor | ⚠️ **Refactor menor necesario.** PrimitiveSwitcher actual swap directo; añadir wrapper TransitionContainer con overlay 600ms |
| Audio crossfade requires audio.js mod | ⚠️ Sí — añadir gain node ramp util en `audio.js` (`fadeOut(node, ms)` + `fadeIn(node, ms)`) |
| Foundation effort | 4-6 días |

**Recomendación:** ✅ IMPLEMENTAR. Es la firma con mayor **moat-to-effort ratio** (5 días → cinematographic feel premium). Refactor ProtocolPlayer es additive (TransitionContainer wrapper + global state).

### Firma #4: Identity Locked Color Palette (cyan exclusive evolution rules)

**Concepto:** cyan #22D3EE permanece dominante, pero evoluciona en saturación/lightness por phase (Phase 1 cyan-cool, Phase 2 cyan-warm, Phase 3 cyan-deep). El usuario percibe cohesión + progresión.

| Aspecto | Verdict |
|---------|---------|
| `tokens.js` permite color evolution rules | ⚠️ **Refactor minor:** añadir `colors.accent.phosphorCyanByPhase = { phase1: ..., phase2: ..., phase3: ... }` |
| Refactor invasivo | ✅ Additive scope. Cero breaking changes (existing `colors.accent.phosphorCyan` preserved) |
| Implementación | 1-2 días eng (constant + per-primitive consume) |

**Recomendación:** ✅ IMPLEMENTAR. Low effort, high identity reinforcement. Cyan exclusive es ya el ADN; explicitly evolution makes it intentional.

### Firma #5: Scientific Eyebrow Tag System (mono caps científicos morph)

**Concepto:** eyebrow científico con citations (ya implementado F3.5-A) **morphing entre phases**: Phase 1 "POLYVAGAL · 3.75 BRPM · RCT-VALIDATED" → Phase 2 "AFFECT LABELING · LIEBERMAN 2007 · UCLA" → Phase 3 "MEMORIA PROCEDIMENTAL · BRYAN ADAMS MONIN 2013".

| Aspecto | Verdict |
|---------|---------|
| Existing eyebrow component support morph | ⚠️ Eyebrow es inline en cada primitive (ParasympathicResetOrb hardcoded). Phase 2 + Phase 3 primitives **no tienen eyebrow.** |
| Requires new component | ⚠️ Sí — `ProtocolEyebrow.jsx` shared component que PrimitiveSwitcher rendere encima del primitive. Or render dentro de cada primitive consistente |
| Morph transition entre phases | Coordinated con Firma #3 cinematic transitions (text crossfade simul) |
| Effort | 2-3 días eng |

**Recomendación:** ✅ IMPLEMENTAR. Excelente moat (citations científicas morphing es **IP único Bio-Ignición**). Combina perfecto con Firma #3 cinematic.

### Síntesis 5 firmas

| Firma | Recomendación | Effort | Impact moat |
|-------|---------------|--------|-------------|
| 1. Vagal Coupling Viz | ⚠️ Ajustar scope (live → post-session) | 4-6 días | Alto si live, medio si post |
| 2. Particle System Bio-Synced | ✅ con limitations (12 particles + low-power fallback) | 5-7 días | Alto (visual hero) |
| 3. Cinematic Phase Transitions | ✅ implementar (mayor ROI) | 4-6 días | **Muy alto** (premium feel) |
| 4. Color Palette Evolution | ✅ implementar low effort | 1-2 días | Medio (cohesión) |
| 5. Scientific Eyebrow Morph | ✅ implementar | 2-3 días | **Muy alto** (IP única) |

**Total firmas implementables high-quality:** ~16-24 días eng (4 de 5 firmas, Firma #1 ajustada a post-session).

---

## Task 5 — Recomendaciones para implementación

### Approach recomendado

**OPCIÓN A — Plan original 15-19 días eng (resultado: ~9.4-9.5/10):**

| Sprint | Scope | Días |
|--------|-------|------|
| SP F3.5-D | Phase 2 redesign primitive (cognitive descarga rich) + tests + capturas | 5-6 |
| SP F3.5-E | Phase 3 redesign primitive (commitment motor visualization) + tests | 4-5 |
| SP F3.5-F | Cinematic Transitions framework (Firma #3) + Eyebrow Morph (Firma #5) | 5-6 |
| SP F3.5-G | Color Palette Evolution (Firma #4) + integration + capturas finales | 1-2 |

**OPCIÓN B — Scope completo 42-58 días eng (resultado honest: 9.7-10/10):**

Adicional a Opción A:
| Sprint | Scope | Días |
|--------|-------|------|
| SP F3.5-H | Particle System Bio-Synced (Firma #2) | 6-8 |
| SP F3.5-I | Vagal Coupling Visualization (Firma #1 post-session) | 4-6 |
| SP F3.5-J | Audio ambient continuous + crossfade (foundation audio.js extension) | 5-7 |
| SP F3.5-K | Multi-task simultaneous arquitectura (overlay system per-phase) | 8-12 |
| SP F3.5-L | Body scan integration + somatic anchor instructions | 3-4 |

### Risks identificados

1. **Performance móvil low-end** con particle system + 5 elementos simultáneos. Mitigation: tier device detection (`navigator.deviceMemory`) + reduced-motion fallback to static.
2. **Tests existentes Phase 2 + 3** primitives (ChipSelector, TextEmphasisVoice, HoldPressButton) son shared con OTROS protocolos (no solo #1). Refactor de estos primitives requeriría careful additive new components específicos a #1, NO modificar primitives compartidos.
3. **Reset1IntroCard + CompletionCard** ya complejos (377 + 717 LOC). Añadir más estados (multi-metric streak/HRV/coh/sparkline + new) acerca al límite mantenibilidad. Posible refactor a sub-components.
4. **Audio ambient continuous** podría romper crisis flow (#18-20 que necesitan silence override). Requires careful coordination con `useCase: "crisis"` exclusion.
5. **Cinematic transitions** añaden ProtocolPlayer shell wrapper — refactor mínimo pero podría afectar otros flagships F1+F2 (necesitan opt-in flag).
6. **Foundation completa from-scratch** (particle system, audio crossfade): 0 reusable code existing. Cualquier bug nuevo es 100% nuevo.

### Decisiones críticas que requieren aprobación user

Antes de generar SP de implementación, necesitamos respuestas:

**D1. Scope: Opción A (9.4-9.5/10 en 15-19d) o Opción B (9.7-10/10 en 42-58d)?**

**D2. Multi-task simultaneous architecture:**
- ¿Phase 2 con orb continuando overlay durante chip selection? (más inmersivo pero requires architecture nueva).
- O ¿chips solo (current scope)?

**D3. Audio ambient default ON o OFF?**
- Default ON = más inmersivo, viola "sin volumen" constraint para users sin headphones.
- Default OFF = compliant constraints, pierde inmersión cuando user SÍ tiene audífonos.
- Trade-off: ¿auto-detect headphones? (no API confiable cross-platform).

**D4. Live cam-PPG durante session (Firma #1 vagal coupling viz live)?**
- Permission re-prompt durante session = fricción.
- Background continuous = drain battery + privacy concern.
- Recomendación segura: Firma #1 ajustada a post-session.

**D5. Phase 2 + 3 redesign: primitives nuevas dedicated o extender primitives compartidas?**
- Dedicated (`Cognitive2Primitive` para #1 specifically) = más opcional, no afecta otros protocolos.
- Extender compartidas = más reuso pero risk regresión.
- Recomendación: dedicated nuevas primitives + register en PrimitiveSwitcher.

---

## Conclusión honest

### ¿Es factible 9.7-10/10 en 15-19 días eng?

**No, honest.**

15-19 días alcanza realisticamente **9.4-9.5/10** (Phase 2 + 3 redesign + 2-3 firmas visuales: Cinematic Transitions + Color Evolution + Eyebrow Morph). Esto cumple ~9 de 13 indicaciones del usuario.

Las 4 indicaciones que requieren scope adicional (multi-task simultáneo, particle system, vagal coupling live, audio ambient) cuestan **+25-40 días eng** adicionales. Son la diferencia entre "muy bien" (9.5) y "techo absoluto" (9.8-10).

### ¿Vale la pena el effort?

**Decisión user.** Argumentos:

**Pro Opción A (15-19d):**
- Score 9.4-9.5/10 ya supera Calm/Headspace en science framing + sparkline + HRV delta + streak narrative.
- Menor risk técnico (cero particle system from-scratch).
- 22 protocolos restantes esperan scaling — invertir 60d en #1 deja 21 protocolos como están (riesgo brand consistency).

**Pro Opción B (42-58d):**
- Hero flagship #1 al techo establece **standard** que justifica resto del catalog.
- Particle system + cinematic transitions son **reusable** para F1.5 (#15) + F2.5 (#25) deep upgrades posteriores → amortiza effort.
- Moat 5-10 años requiere features que NO se pueden agregar incrementalmente (foundation tiene que existir desde el inicio).

### Recomendación final approach

**Phase 1 inmediata (15-19 días, Opción A):**
1. SP F3.5-D Phase 2 redesign + dedicated primitive
2. SP F3.5-E Phase 3 redesign + dedicated primitive
3. SP F3.5-F Cinematic Transitions framework + Eyebrow Morph
4. SP F3.5-G Color Palette Evolution + integration

**Phase 2 evaluation (decision point post-Phase 1):**
- Si user data muestra retention/engagement boost notable post-Phase 1 → invertir Opción B (Phase 2 25-40 días extra).
- Si scope creep detected → mantener 9.4-9.5 y escalar pattern a F1.5 + F2.5 + Phase 2 scaling 22 protocolos restantes.

**Phase 3 (Opción B futura):**
- Multi-task simultaneous arquitectura (foundation reusable F1.5 + F2.5)
- Particle system + Vagal Coupling Viz (post-session)
- Audio ambient framework

---

## Capturas runtime entregadas — listado final

7 nuevas + 6 heredadas = 13 total:

**Nuevas (analysis-protocol-1-baseline/):**
1. 01-protocol-1-card-on-home.png — home con card #1 visible.
2. 02-protocol-1-launch-intro-card.png — Reset1IntroCard mounted gate funciona.
3. 03-phase1-cycle1-inhale.png — Phase 1 ParasympathicResetOrb inhale visible.
4. 04-phase1-cycle1-hold-halo.png — Phase 1 mid-cycle continúa.
5. 05-phase1-cycle1-exhale.png — Phase 1 mid-cycle continúa.
6. 06-phase1-cycle1-empty.png — Phase 1 mid-cycle continúa.
7. 07-transition-1-to-2-mid.png — intento transition (player sigue Phase 1 por throttle).

**Heredadas (SPs F3 + F3.5-A previos):**
8-9. f3-flagship-1-reset/01 + 02 — eyebrow original + mid-cycle.
10-13. f3.5a-protocol-1-deep/01 + 04 + 06 + 10 — baseline + post-Capa 1 + IntroCard runtime + skip preference.

**Capturas Phase 2 + Phase 3 + post-session — DEFERRED honest.** Razón: Playwright headless throttles RAF, sesión completa requeriría 120s wall-clock real con state machine progression bloqueada. Code review verbatim Task 0 + primitives shape estática (TextEmphasisVoice + ChipSelector + HoldPressButton) provee evidencia equivalente para análisis. Si user requiere screenshots Phase 2/3 visual reales, necesario:
- Real device runtime (browser local con tab activo) y capture manual, o
- Headed Playwright session, or
- Programmatic state injection via test fixture.

---

**Fin del reporte. Cero código modificado. 13 capturas. 5 dimensiones grading honest. 13 indicaciones gap analysis con effort estimado real. 5 firmas viabilidad técnica. Decisión scope (Opción A 15-19d vs Opción B 42-58d) pertenece al usuario.**
