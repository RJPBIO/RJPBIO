# PROTOCOLS INVENTORY AUDIT — REPORT

**Fecha:** 2026-05-08
**Modo:** READ-ONLY (cero modificaciones a código, tests, fixtures, schema, configs).
**Scope:** Inventario completo data + engine + UI + telemetría + scoring 8 dim + capturas runtime + comparativa + recomendación flagship + roadmap.
**Estado del repo al iniciar:** branch `main`, 4621/4621 Vitest verde (commit `e32801b`).

---

## Resumen ejecutivo

- **Catálogo total:** 23 protocolos en `P[]` ([src/lib/protocols.js:206-2596](src/lib/protocols.js#L206)). IDs 13–14 reservados (OMEGA/OMNIA eliminados Phase 4 SP1).
- **Distribución por `useCase`:** 18 active + 3 crisis (#18–20) + 2 training (#16–17). El número público "18 protocolos" del catálogo es post-filtro `getActiveProtocols()` ([line 2630](src/lib/protocols.js#L2630)). El número real en data layer es 23.
- **Shape consistency:** 100%. Todos los protocolos comparten core schema `{id, n, ct, d, sb, tg, cl, int, dif, ph[]}`. `useCase` y `safety` opcionales bien soportados. Toda fase tiene `iExec[]` con extended act schema (Phase 4 SP1+).
- **Cobertura científica:** 23/23 protocolos con entrada en `SCIENCE_DEEP` ([line 2598](src/lib/protocols.js#L2598)). Mecanismos referenciados (Porges, Lehrer, Khalsa, Carney, Berceli, Bryan-Adams-Monin, Vaschillo, Schandry, Balban, Radvansky, Zacks, Zaccaro, Russo, Lemaitre).
- **Engine adaptativo:** maduro pero **un-shot al inicio**. Sin in-session biofeedback. Consume sólo 5 campos del protocolo (`n`, `int`, `dif`, `useCase`, y referenciados pero **no usado**: `d`).
- **Dead-weight metadata:** `ct`, `sb`, `tg`, `cl`, `ph` (este último consumido sólo en runtime player, no en selección). `d` declarado pero ignorado en filtro por tiempo disponible.
- **UI primitives:** 23 implementadas en `PrimitiveSwitcher`. ~57 % one-handed-friendly; ~22 % office-incompatibles (movimiento visible o vocalización audible).
- **Telemetría:** session-level robusta (mood pre/post, HRV delta, coherencia/resiliencia/capacidad, completion ratio, vCores, streak). **Granularidad act-level perdida** — sólo agregado `interactions`. Cinco gaps subjetivos clave sin captura: efectividad percibida, sensación corporal, will-do-again, time-to-effect, side effects.
- **Top 3 flagship candidates** (justificados §7): #15 Suspiro Fisiológico · #16 Resonancia Vagal · #25 Cardiac Pulse Match.
- **Recomendación final:** **#15 Suspiro Fisiológico** como flagship por 4 razones convergentes (RCT directo Stanford 2023, formato cortísimo 90s = lowest fricción onboarding, 100 % office-friendly, blue-ocean defensible vs Calm/Headspace que no tienen "single-pattern data-backed").
- **Roadmap:** 4 fases secuenciales — flagship primero, core loop después, specialized luego, long-tail al final.

---

## 1. Inventario data layer

### 1.1 Source of truth

- **Archivo único:** [src/lib/protocols.js](src/lib/protocols.js) (2640 líneas).
- **Export principal:** `export const P = [...]` ([line 206](src/lib/protocols.js#L206)).
- **Helpers:** `getUseCase(p)` ([line 16](src/lib/protocols.js#L16)) · `inferActDefaults(act, phase, protocol)` ([line 148](src/lib/protocols.js#L148)) · `getActiveProtocols/getCrisisProtocols/getTrainingProtocols` ([line 2630-2640](src/lib/protocols.js#L2630)).
- **Science:** `SCIENCE_DEEP[id]` ([line 2598](src/lib/protocols.js#L2598)) — 50–250 palabras por protocolo, con citas (autor + año).

### 1.2 Catálogo completo

| ID | n (nombre) | int | dif | d (s) | fases | useCase | safety |
|----|------------|-----|-----|-------|-------|---------|--------|
| 1  | Reinicio Parasimpático | calma | 1 | 120 | 3 (5 actos) | active | — |
| 2  | Activación Cognitiva | enfoque | 1 | 120 | 3 | active | — |
| 3  | Reset Ejecutivo | reset | 1 | 120 | 3 | active | — |
| 4  | Pulse Shift | energia | 2 | 120 | 3 | active | — |
| 5  | Skyline Focus | enfoque | 1 | 120 | 3 | active | — |
| 6  | Grounded Steel | calma | 2 | 120 | 3 | active | — |
| 7  | HyperShift | reset | 2 | 120 | 3 | active | — |
| 8  | Lightning Focus | enfoque | 3 | 120 | 3 | active | — |
| 9  | Steel Core Reset | reset | 3 | 120 | 3 | active | — |
| 10 | Sensory Wake | energia | 2 | 120 | 3 | active | — |
| 11 | Body Anchor | calma | 2 | 120 | 3 | active | — |
| 12 | Neural Ascension | reset | 2 | 120 | 3 | active | — |
| 15 | Suspiro Fisiológico | calma | 1 | 90 | 2 | active | — |
| 16 | Resonancia Vagal | calma | 2 | 600 | 3 | training | — |
| 17 | NSDR 10 min | calma | 1 | 600 | 3 | training | — |
| 18 | Emergency Reset | calma | 1 | 150 | 5 | crisis | sí |
| 19 | Panic Interrupt | calma | 2 | 120 | 3 | crisis | sí |
| 20 | Block Break | energia | 1 | 120 | 3 | crisis | sí |
| 21 | Threshold Crossing | reset | 1 | 120 | 3 | active | sí (fotosensible) |
| 22 | Vagal Hum Reset | calma | 1 | 150 | 3 | active | — |
| 23 | Power Pose Activation | energia | 2 | 120 | 3 | active | — |
| 24 | Bilateral Walking Meditation | reset | 1 | 150 | 3 | active | — |
| 25 | Cardiac Pulse Match | calma | 2 | 150 | 3 | active | — |

**Distribución:**
- Por intent: calma 10, reset 6, energia 4, enfoque 3.
- Por dificultad: dif 1 = 11, dif 2 = 9, dif 3 = 2, dif sin set en crisis (defaults dif 1).
- Por duración: 90 s × 1, 120 s × 15, 150 s × 5, 600 s × 2.
- Por fases: min 2, max 5, mean 3.04.

### 1.3 Shape per protocolo (verbatim, ejemplo #4 Pulse Shift)

```javascript
{
  id: 4,
  n: "Pulse Shift",
  ct: "Activación",
  d: 120,
  sb: "Reset neurocardíaco",
  tg: "PS",
  cl: "#F59E0B",
  int: "energia",
  dif: 2,
  ph: [
    {
      l: "Activación Bilateral",
      r: "0–30s",
      s: 0, e: 30,
      k: "Tap alternado izq-der. Ritmo constante.",
      i: "Tap alternado izquierda y derecha siguiendo el highlight cyan...",
      iExec: [
        {
          from: 0, to: 30,
          text: "Tap izquierda y derecha alternando. Sigue el highlight.",
          type: "motor_bilateral",
          mechanism: "Movimiento bilateral activa coordinación interhemisférica + coherencia atencional sostenida",
          duration: { min_ms: 25000, target_ms: 30000, max_ms: 38000 },
          validate: { kind: "tap_count", min_taps: 24, bilateral: true },
          ui: {
            primitive: "bilateral_tap_targets",
            props: { pattern: "alternate", bpm: 60, target_taps: 30 }
          },
          media: {
            voice: { enabled_default: false },
            breath_ticks: { enabled: false },
            binaural: { action: "start", type: "energia" },
            haptic: { phase: "tap" },
            signature: { kind: "phaseShift", fire_at: "start" }
          }
        }
      ],
      sc: "Activación bilateral coordinación interhemisférica + atención focal sostenida",
      ic: "body",
      br: null
    }
    // ... 2 fases más
  ]
}
```

### 1.4 Step (act) shape — campos observados

- Core: `from`, `to`, `text`, `type`, `mechanism`
- Timing: `duration { min_ms, target_ms, max_ms }`
- Validation: `validate { kind, [props específicos del kind] }` con 11 kinds documentados
- UI: `ui { primitive, props }` — 23 primitivas
- Media: `media { voice, breath_ticks, binaural, haptic, cue, soundscape, signature, countdown, silent }`
- Raras: `optional_capture` (sólo en JSDoc, no observado en data)

### 1.5 Engine-relevant metadata

**Lo que sí existe en data:** `int`, `dif`, `useCase`, `d`.

**Lo que NO existe en data (no hay):**
- ❌ `cohortBias` — no presente
- ❌ `fatigueWeight` — no presente
- ❌ `sensitivity` — no presente (calculado on-demand desde moodLog)
- ❌ `banditPriors` — no presente (tracked en `state.banditArms`)
- ❌ `expectedDelta` por intent — no presente
- ❌ `contextTags` (location/time-of-day affinity) — no presente

**Implicación:** ranking del bandit aprende todo desde cero por sesión. No hay priors codificados en el catálogo.

---

## 2. Inventario engine integration

### 2.1 Entry point

- Función: `adaptiveProtocolEngine(st, options)` en [src/lib/neural.js:684](src/lib/neural.js#L684).
- Hook wrapper: [`useAdaptiveRecommendation`](src/hooks/useAdaptiveRecommendation.js#L20) (memoizado).
- Output: `{ primary, alternatives, need, context }`.

### 2.2 Inputs consumidos por el selector

| Input | Fuente | Uso |
|-------|--------|-----|
| mood (1–5) | `moodLog[]` | trend recent, sensitivity, burnout index |
| HRV / coherence | `readiness` (calibration output) | override primaryNeed → "calma" si recuperación |
| chronotype + hora actual | rMEQ-SA enum + `Date.now()` | baseline circadian, cold-start prior |
| level / cohorte | `totalSessions` + LVL table | level match scoring |
| bandit history | `banditArms{intent:bucket}` | UCB1 contextual con time-decay 30d |
| fatigue | `detectPauseFatigue(history)` | override + penalty alta dificultad |
| NOM-035 | `porDominio` → `protocolBias` | bias intent específico (calma/reset) |

### 2.3 Inputs declarados pero no consumidos

- `currentMood` (mood picker pre-session) — pasado al engine pero efecto débil; no constraint duro.
- `available_time` — **no input al engine.** El field `protocol.d` existe pero no se cruza con disponibilidad del usuario.

### 2.4 Live in-session adaptation

**Verdict:** ninguna. `useProtocolPlayer` no llama al engine durante ejecución. El único parámetro media adaptable es `binaural type` que se fija al inicio.

### 2.5 Post-session loop

- Acción: `recordSessionOutcome` en [src/store/useStore.js:713](src/store/useStore.js#L713).
- Composite reward: mood (×1.0) + energy (×0.3) + HRV lnRMSSD (×1.5) + completion factor (1.0/0.75/0.5).
- Update: actualiza dos arms (`intent:bucket` + `intent` global) con exponential decay 0.97^n y time-decay floor 0.10.
- Calibration: log residuals `{predicted, actual, armId}` para entrenar el cold-start prior blending.

### 2.6 NOM-035 protocol bias

- Archivo: [src/lib/nom35/protocolBias.js](src/lib/nom35/protocolBias.js).
- Threshold: `relativeRisk ≥ 0.3` produce señal.
- Output: `{dominio, relativeRisk, intent, weight, externalReferral, message}`.
- Aplicación: `applyBiasToScore` — `+weight×20` si match intent, `−weight×10` si mismatch.

### 2.7 Rich-metadata gap (dead-weight + under-leveraged)

| Field | Status | Comentario |
|-------|--------|------------|
| `ct` (categoría texto) | dead-weight | UI label only |
| `sb` (subtítulo) | dead-weight | UI description |
| `tg` (tag corto) | dead-weight | UI shortcut |
| `cl` (color hex) | dead-weight | UI color only |
| `d` (duración) | **under-leveraged** | nunca filtra por tiempo disponible del user |
| `ph[]` | runtime-only | usado por player, no por selector |
| `useCase` | well-used | filtro daily ignition vs crisis vs training |

---

## 3. Inventario UI ejecución (ProtocolPlayer)

### 3.1 Component tree

- `ProtocolPlayer.jsx` (shell fullscreen, z-index 1000)
  - ExitButton (`aria-label="Salir"`)
  - PauseButton (training-only)
  - TransitionDots (progress)
  - ProgressIndicator (1 px accent bar)
  - **PrimitiveSwitcher** → 23 primitivas
  - ImOKButton (crisis only)
  - ContinueButton (cyan primary, gated por `validation.canAdvance`)
  - SafetyOverlay (pre-mount si `protocol.safety`)
  - PausedOverlay (training-only)

### 3.2 Primitivas (23)

`breath_orb`, `bilateral_tap_targets`, `ocular_dots`, `ocular_horizontal_metronome`, `visual_panoramic_prompt`, `dual_focus_targets`, `body_silhouette_highlight`, `posture_visual`, `isometric_grip_prompt`, `chest_percussion_prompt`, `facial_cold_prompt` (huérfana, `vagal_facial_cold` retirado), `shake_hands_prompt`, `chip_selector`, `hold_press_button`, `text_emphasis_voice` (fallback), `silence_cyan_minimal`, `object_anchor_prompt`, `vocal_with_haptic`, `doorway_visualizer`, `vocal_resonance_visual`, `power_pose_visual`, `walking_pace_indicator`, `pulse_match_visual`.

### 3.3 Audio (synthesis 100%)

- Archivo: `src/lib/audio.js` (1646 líneas).
- Síntesis Web Audio API — **cero archivos mp3/ogg.**
- Funciones audio: `playBreathTick`, `playSpark`, `playChord`, `playCountdownTick`, `startBinaural` (alpha/theta/delta), `startMusicBed`, `startAmbient`, `startSoundscape`, `speak` (Web Speech API TTS).
- Master bus: soft-saturation → compressor 3:1 → limiter 20:1 → analyser → destination. Sidechain duck −32 % cuando voice activa.
- `voiceOn` default: **false** (excepto crisis donde TTS forzado en ON).

### 3.4 Haptic (patterns globales, no per-protocolo)

- `hapticBreath(label)` — INHALA/EXHALA/MANTÉN gradients (~6 pulsos cada uno)
- `hapticPhase(kind)` — breath/body/mind/focus
- `hapticSignature(kind)` — ignition/checkpoint/phaseShift/award
- `hapticCountdown(step)` — 3/2/1
- Intensity scaling: light (0.6) / normal (1.0) / strong (1.4)
- iOS Safari fallback: visual flash via `setHapticFallback`

**Gap detectado:** patterns son globales, no firmas haptic específicas por protocolo (cada protocolo se siente igual a la piel — pierde diferenciación sensorial entre #1 Reinicio vs #15 Suspiro).

### 3.5 Animations

- Sin framer-motion (memoria operativa cumplida).
- Sin `@keyframes` CSS detectados en `protocol/v2/primitives/`.
- RAF loops manuales: `BreathOrbExtended`, `VocalWithHaptic`, `ShakeHandsPrompt`, `WalkingPaceIndicator`, `PulseMatchVisual`, `ChestPercussionPrompt`.
- CSS transitions inline: resto.
- **prefers-reduced-motion**: NO respetado en primitivas v2 (gap a11y).

### 3.6 Sync canal

`BreathOrbExtended` ([src/components/protocol/v2/primitives/BreathOrbExtended.jsx#L93-L104](src/components/protocol/v2/primitives/BreathOrbExtended.jsx#L93)):
- Audio + haptic disparan en el **mismo `cycle-phaseIdx` key** (same-millisecond sync).
- Visual breathScale interpolado en RAF, alineado a phase boundary.

### 3.7 Pantalla de completion

- "Sesión completa" / "Acreditada parcialmente" / "No acreditada" / "Sesión cancelada"
- vCores award visible si > 0
- **Ausentes en player:** post-mood prompt, coherence delta visible, streak update visible (todo en otro componente `MoodPostSessionSheet`).

### 3.8 One-handed / office-friendly assessment

| Primitiva | One-handed | Office-friendly | Sin volumen |
|-----------|------------|-----------------|-------------|
| breath_orb | ✓ | ✓ | ✓ |
| text_emphasis_voice | ✓ | ✓ | ✓ |
| chip_selector | ✓ | ✓ | ✓ |
| ocular_dots / horizontal_metronome | ✓ | ✓ | ✓ |
| dual_focus_targets / visual_panoramic | ✓ | ✓ | ✓ |
| silence_cyan_minimal | ✓ | ✓ | ✓ |
| object_anchor_prompt | ✓ | ✓ | ✓ |
| body_silhouette_highlight | ✓ | ✓ | ✓ |
| posture_visual | ✓ | ✓ | ✓ |
| doorway_visualizer | ✓ | ✓ | ✓ |
| pulse_match_visual | ✓ | ✓ (palpar pulso radial) | ✓ |
| bilateral_tap_targets | partial | partial (motor visible) | ✓ |
| hold_press_button | ✗ (fatiga thumb) | ✓ | ✓ |
| vocal_with_haptic / vocal_resonance | partial | ✗ (audible) | depende |
| isometric_grip_prompt | ✗ | ✓ | ✓ |
| chest_percussion_prompt | ✗ | ✗ (visible) | ✓ |
| facial_cold_prompt | ✓ | ✗ (requiere agua) | ✓ |
| shake_hands_prompt | ✗ | ✗ (vigorous motion) | ✓ |
| power_pose_visual (con isometric) | ✗ | ✗ (postura visible) | ✓ |
| walking_pace_indicator | partial | ✗ (locomoción) | ✓ |

**Resumen:** ~13/23 fully office-friendly. ~5 incompatibles. ~5 partial.

---

## 4. Inventario telemetría

### 4.1 Pre-session capture

- UI: `MoodPrePicker.jsx` (Phase 6J-1).
- Captura: 1 sola pregunta — chip row con 5 opciones (1 Tensión alta → 5 Óptimo).
- Toggle: re-tap para deselect.
- Pasada como `preMood` a `launchProtocol`.
- **Ausente:** no se captura energía ni intención pre-session.

### 4.2 Post-session capture

- UI: `MoodPostSessionSheet.jsx` (Phase 6J-1 Group A).
- Trigger: cuando `protocol.useCase !== "crisis"` y tiene intent.
- Captura: re-pregunta "¿Cómo te sientes ahora?" 1–5.
- Acciones: REGISTRAR (envía data) | Saltar por ahora (skip).
- **Ausentes:**
  - "¿Te ayudó?" (yes/no/somewhat)
  - "¿Volverías a hacerlo?" (1–5 likelihood)
  - Body sensation report (relaxed/energized/tense/clear)
  - Side effects (dizziness/anxiety/frustration)
  - Time-to-effect ("¿Cuándo lo notaste?")

### 4.3 History entry shape ([src/lib/neural.js:1564-1596](src/lib/neural.js#L1564))

```javascript
{
  p: "Pulse Shift",        // protocol name
  ts: 1715338800000,       // timestamp
  vc: 8,                   // vCores
  c: 72,                   // coherencia 20-100
  r: 65,                   // resiliencia 20-100
  dur: 240,                // duration s
  ctx: "manual",           // context type
  bioQ: 62,                // bioQuality 0-100
  quality: "media",        // tier alta/media/baja/ligera/inválida
  interactions: 3,         // act count aggregate (no per-act flags)
  motionSamples: 0,
  pauses: 0,
  burnoutIdx: 15,
  circadian: "day",
  bioSignal: 58,
  partial: false,          // true si <85% complete o hidden time >30%
  hiddenSec: 12,
  completeness: 0.96,
  dimensions: { foco: 72, calma: 65, energia: 71 },
  coherenceLive: { score, amplitude, phaseLock, n }  // optional
}
```

### 4.4 Computed metrics post-session

- mood delta = post − pre
- HRV delta = lnRMSSD post − pre (window-based)
- coherencia / resiliencia / capacidad (formulas en `calcSessionCompletion`)
- completion ratio (completedActs / totalActs)
- composite reward (mood + energy + HRV + completion factor)
- per-protocol sensitivity recomputed on-demand desde moodLog (no persisted column)

### 4.5 Granularity gaps

- ❌ Per-act validation failures (cuál acto falló por timeout, skip, validación)
- ❌ Per-act duration vs target_ms
- ❌ Per-act mood/HRV delta
- ❌ Sequence patterns (cuáles actos típicamente skipped)

---

## 5. Score baseline 8 dimensiones × 23 protocolos

### 5.1 Definición operativa de cada dimensión

- **D1 Sustancia científica** — ¿múltiples referencias peer-reviewed citadas + mecanismo explícito en SCIENCE_DEEP?
- **D2 Riqueza instruccional** — cues simultáneos por step (breath + cognitive + somatic + intent).
- **D3 Multi-modalidad** — visual + audio + haptic + cognitive sincronizados.
- **D4 Inmersión** — *inferido por estructura* (cantidad de actos, RAF visual sostenido, ausencia de waits estáticos). No tenemos user-data real.
- **D5 Adaptabilidad** — adapta real-time / entre sessions / sólo selección / lineal. Dado el engine es one-shot, todos los protocolos son 4–5 max en D5 (adapta sólo selección).
- **D6 Fricción ejecución** — office/sentado/una-mano/sin-volumen.
- **D7 Payoff sensorial** — *inferido por mecanismo documentado* (qué tan fuerte es el mecanismo neuro reportado en literatura). No tenemos user-feedback real.
- **D8 Defensibilidad / moat** — pattern único vs copiable trivialmente con apps existentes.

> **Caveat metodológico:** D4 y D7 requieren user-feedback longitudinal que la app no captura. Scores son **inferidos por proxy estructural y científico**, no medidos. Marcado con `~` cuando es inferred.

### 5.2 Matrix scoring (1–10 por celda)

| ID | Nombre | D1 ciencia | D2 instruct | D3 multi-modal | D4 inmersión~ | D5 adapt | D6 fricción | D7 payoff~ | D8 moat | **Σ avg** |
|----|--------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | Reinicio Parasimpático | 8 | 9 | 8 | 8 | 4 | 10 | 7 | 6 | **7.5** |
| 2 | Activación Cognitiva | 8 | 8 | 7 | 7 | 4 | 10 | 7 | 5 | **7.0** |
| 3 | Reset Ejecutivo | 7 | 7 | 7 | 6 | 4 | 10 | 6 | 5 | **6.5** |
| 4 | Pulse Shift | 7 | 8 | 8 | 7 | 4 | 6 | 7 | 7 | **6.75** |
| 5 | Skyline Focus | 7 | 7 | 7 | 6 | 4 | 9 | 6 | 6 | **6.5** |
| 6 | Grounded Steel | 8 | 8 | 8 | 7 | 4 | 8 | 7 | 7 | **7.13** |
| 7 | HyperShift | 6 | 7 | 7 | 6 | 4 | 5 | 7 | 6 | **6.0** |
| 8 | Lightning Focus | 6 | 6 | 6 | 6 | 4 | 9 | 6 | 5 | **6.0** |
| 9 | Steel Core Reset | 7 | 7 | 8 | 7 | 4 | 6 | 7 | 6 | **6.5** |
| 10 | Sensory Wake | 7 | 8 | 8 | 7 | 4 | 7 | 7 | 7 | **6.88** |
| 11 | Body Anchor | 8 | 8 | 7 | 7 | 4 | 7 | 7 | 6 | **6.75** |
| 12 | Neural Ascension | 9 | 9 | 8 | 8 | 4 | 9 | 8 | 7 | **7.75** |
| 15 | **Suspiro Fisiológico** | **10** | 7 | 8 | 7 | 4 | **10** | **9** | **9** | **8.0** |
| 16 | **Resonancia Vagal** | **10** | 7 | 8 | 9 | 4 | 9 | **9** | **8** | **8.0** |
| 17 | NSDR 10 min | 9 | 7 | 7 | 9 | 4 | 4 | 8 | 6 | **6.75** |
| 18 | Emergency Reset | 9 | 9 | 9 | 8 | 4 | 5 | 8 | 8 | **7.5** |
| 19 | Panic Interrupt | 9 | 9 | 9 | 8 | 4 | 4 | 8 | 8 | **7.38** |
| 20 | Block Break | 8 | 8 | 8 | 8 | 4 | 3 | 8 | 7 | **6.75** |
| 21 | Threshold Crossing | 9 | 8 | 7 | 6 | 4 | 9 | 6 | 8 | **7.13** |
| 22 | Vagal Hum Reset | 9 | 8 | 8 | 7 | 4 | 4 | 8 | 8 | **7.0** |
| 23 | Power Pose Activation | 7 | 7 | 7 | 6 | 4 | 4 | 6 | 6 | **5.88** |
| 24 | Bilateral Walking | 7 | 7 | 7 | 6 | 4 | 2 | 7 | 6 | **5.75** |
| 25 | **Cardiac Pulse Match** | **10** | 9 | 8 | 8 | 4 | 9 | **9** | **9** | **8.25** |

### 5.3 Notas a la matrix

- **D1 = 10** sólo donde hay múltiples RCTs / citas explícitas en SCIENCE_DEEP con autores y revistas: #15 (Balban Stanford 2023 Cell Reports), #16 (Vaschillo 2006 + Lehrer-Gevirtz 2014 + Goessl meta-análisis 2017 N=1868 d=0.83), #25 (Schandry 1981 + Garfinkel 2015 + Lehrer-Vaschillo).
- **D5** está techado a 4 globalmente porque el engine **no adapta in-session**. No hay forma de que un protocolo individual marque > 4 en esta dimensión bajo la implementación actual. Esto es un **problema sistémico, no per-protocolo**.
- **D6 = 2-4** para #20 #23 #24 por movimiento visible obligatorio o postura llamativa en oficina.
- **D8** alto donde el patrón es proprietary (5.5 rpm timed con interocepción cardíaca = #25), o donde el formato "60–90s data-backed single-pattern" carece de competidor directo (#15).

### 5.4 Top 5 ranking (Σ avg desc)

1. **#25 Cardiac Pulse Match — 8.25**
2. **#15 Suspiro Fisiológico — 8.00**
3. **#16 Resonancia Vagal — 8.00**
4. #12 Neural Ascension — 7.75
5. #1 Reinicio Parasimpático & #18 Emergency Reset (tied) — 7.50

---

## 6. Capturas runtime estado actual

Capturadas en localhost:3000, viewport mobile 390×844, perfil Playwright limpio (cold start, post-onboarding skip):

- [01-app-home.png](screenshots/protocols-inventory-baseline/01-app-home.png) — home cold-start con CTA "Tu primera sesión: Reinicio Parasimpático".
- [02-reinicio-parasimpatico-step1.png](screenshots/protocols-inventory-baseline/02-reinicio-parasimpatico-step1.png) — #1 Step 1 BreathOrb activo, "Inhala 3s" countdown.
- [03-reinicio-parasimpatico-mid.png](screenshots/protocols-inventory-baseline/03-reinicio-parasimpatico-mid.png) — #1 fase cognitiva, prompt "Identifica el peso. El pensamiento que más pesa ahora." (text_emphasis_voice primitive).
- [04-datos-tab.png](screenshots/protocols-inventory-baseline/04-datos-tab.png) — Catálogo "18 de 18 mostrados" con filtros INTENT + DIFICULTAD y 18 cards (R1, AC, RE, PS, SF, GS, HS, LF, SC, AP, BA, NA, SF, TC, VH, PP, BW, CP).
- [05-activacion-cognitiva-step1.png](screenshots/protocols-inventory-baseline/05-activacion-cognitiva-step1.png) — #2 Step 1 BreathOrb (intent=enfoque, color cyan).
- [06-activacion-cognitiva-mid.png](screenshots/protocols-inventory-baseline/06-activacion-cognitiva-mid.png) — #2 estado intermedio.
- [07-pulse-shift-step1-bilateral-tap.png](screenshots/protocols-inventory-baseline/07-pulse-shift-step1-bilateral-tap.png) — intento de #4 Pulse Shift; el player permanece en BreathOrb por race condition de relaunch (no fue capturado el bilateral_tap_targets primitive en este run; documentado como gap §10).

**Notas observadas en runtime:**

1. ProtocolPlayer monta como dialog overlay; no oculta el background (visible blur del home detrás).
2. Sin pre-mood picker en cold-start (primera sesión arranca directa sin Mood pre-pick — solo aplica en sesiones subsecuentes via HomeV2 layout completo).
3. Tipografía en player: `font-weight: light; letter-spacing: -0.02em` (consistente con DNA marca).
4. BreathOrb verde (#059669) para calma, cyan (#22D3EE) para enfoque — confirma palette canon.
5. Cero emojis en UI (cumple memoria operativa).
6. Header con eyebrow "REINICIO PARASIMPÁTICO" en mono caps — patrón repetitivo (memoria operativa: break patterns siempre, gap a explorar en redesign).

---

## 7. Comparativa competidores

> Datos competidores de conocimiento general (no web search en este SP).

| App | Protocolos count | Multi-modal sync | Adaptive engine | Science citations | Office constraints | Format característico |
|-----|------------------|------------------|-----------------|-------------------|--------------------|----------------------|
| Calm | 100+ | Audio narration + visual loop | Curated, no engine | Limited (mostly anecdotal) | Pasivo OK (escuchar) | Long-form audio meditation |
| Headspace | 500+ | Audio + simple animation | Curated by category | Some (e.g., MBSR adapted) | Pasivo OK | Animated character + voice narration |
| Othership | 30 | Audio + visual breathwork | Static playlists | None visible | Activo, breathwork visible | Group breathwork sessions |
| Wim Hof Method | 1 (variants) | Audio + breath count visual | Static | Author-led research (validated by Kox 2014) | Activo intenso | Round-based breathing + cold |
| Insight Timer | 10000+ | Audio meditation | None | Variable per teacher | Pasivo OK | UGC marketplace |
| Apple Mindfulness | 1 | Visual orb + haptic | None | Apple Health research | Pasivo OK | Single 1-min visual breath |
| **Bio-Ignición (current)** | **23 (18 active)** | **Visual + audio synth + haptic + cognitive sync** | **Yes (UCB1 contextual + circadian + NOM-035 + sensitivity)** | **23/23 protocolos con SCIENCE_DEEP** | **~13/23 office-friendly** | **2-min sensorial + adaptive engine + multi-protocol cohort progression** |

### 7.1 Donde Bio-Ignición ya supera

- **Multi-modal sync con tactile haptic real**: Calm/Headspace son audio-primary. Apple Mindfulness tiene haptic pero sólo en 1 ejercicio. Bio cubre 23 primitivas con haptic sincronizado millisecond-level a phase audio.
- **Adaptive engine con NOM-035 bias**: ningún competidor usa workplace-stress signals para sesgar selección.
- **Catálogo curado científicamente**: 23/23 protocolos con SCIENCE_DEEP citado vs Calm/Headspace mostly anecdotal.
- **Crisis-tier dedicado**: #18 #19 #20 con `useCase:"crisis"` excluidos del bandit. Othership/Calm no distinguen crisis vs daily.
- **Privacy-first / local-first PWA**: ningún competidor lo hace.

### 7.2 Donde Bio-Ignición está debajo

- **Long-form library**: 600s training sólo 2 protocolos (#16 #17). Calm/Headspace tienen catálogos de 10–60 min.
- **Voice quality**: TTS Web Speech API vs Calm con voice actors profesionales. Audio quality gap.
- **Onboarding storytelling**: Calm/Headspace tienen 7-day intro programs. Bio onboarding es funcional pero no narrativo.
- **Group / social**: Othership tiene live group sessions. Bio es solo individual.
- **Curated music**: Calm/Headspace bibliotecas musicales licensed. Bio tiene synthesized binaural/musicBed only.

### 7.3 Blue ocean (lo que ningún competidor hace)

- **Single-pattern data-backed bursts (60–90s)**: Calm minimum 3 min. Headspace daily 3-10 min. Apple Mindfulness 1 min pero sin science layer. Bio #15 (90s) con RCT Stanford = único en mercado.
- **Per-NOM035-domain protocol bias**: nadie cruza compliance laboral con recomendación de práctica.
- **Crisis tier excluido del bandit + safety overlay obligatorio**: ningún competidor lo separa formalmente.
- **Adaptive engine con bandit + circadian + cohort + sensitivity per-user**: combinación única.
- **Local-first PWA con IDB cifrado**: privacy moat.

---

## 8. Top 3 flagship candidates (justified)

### Candidato 1: #15 Suspiro Fisiológico

- **Score baseline:** 8.00/10 (D1=10, D6=10, D7=9, D8=9).
- **Uso real previsto:** alto. Es el patrón con menor barrier-to-entry (90s, dif 1, calma). Ideal cold-start cohort onboarding.
- **Constraints fit (D6):** 10/10 — cero movimiento, cero vocalización, una-mano, sin-volumen, eyes-open. Office-safe por excelencia.
- **Moat potential (D8):** 9/10 — Balban et al. 2023 Stanford Cell Reports Medicine es **single-RCT directo más fuerte** del catálogo. Ningún competidor explota este pattern como producto-flagship dedicado. Calm tiene "physiological sigh" como técnica embebida pero no como ritual standalone con timing exact.
- **Effort estimated:** S–M (3–5 días eng). Sólo 2 fases, primitivas existentes (`breath_orb` + `silence_cyan_minimal`/`text_emphasis_voice`). Posible upgrade: visual-first orb con doble-inhalación visualizada explícitamente + closure pulse afterwave.
- **Risk:** bajo. Patrón ampliamente comprendido, fácil de demostrar.

### Candidato 2: #25 Cardiac Pulse Match

- **Score baseline:** 8.25/10 (líder absoluto del catálogo).
- **Uso real previsto:** medio. Requiere palpar pulso radial — barrier moderado, pero novel y satisfying.
- **Constraints fit (D6):** 9/10 — sentado, una-mano (palpar pulso con índice + medio), eyes-open, sin volumen.
- **Moat potential (D8):** 9/10 — combinación instrumentada de heartbeat detection task (Schandry/Garfinkel) + resonance breathing 5.5 rpm (Lehrer-Vaschillo) en serie con interocepción cardíaca timed. **Ningún competidor lo hace.** Apple Watch tiene "Mindfulness Breathe" pero no integra interocepción.
- **Effort estimated:** M (5–8 días eng). Primitiva `pulse_match_visual` ya existe pero puede iterarse. Posible upgrade: feedback visual del HR detectado (si user permite cam-PPG) como "tu corazón está sincronizando".
- **Risk:** medio. ~10% de población no detecta pulso radial fácilmente — necesita variant carotídeo / cuello.

### Candidato 3: #16 Resonancia Vagal

- **Score baseline:** 8.00/10 (D1=10, D7=9, D8=8).
- **Uso real previsto:** baja-frecuencia, alta-fidelidad. Es 600s = no daily ignition, es sesión deep training. Dirigido a power users / cohorte avanzada.
- **Constraints fit (D6):** 9/10 — silencioso, sentado, no-movimiento. Long-duration es el único drawback (10 min en oficina).
- **Moat potential (D8):** 8/10 — Lehrer-Gevirtz 2014 + Goessl 2017 meta-análisis N=1868 d=0.83 es uno de los efect-sizes más grandes documentados para intervención no-farmacológica. Pocos competidores tienen "resonance breathing 5.5 rpm" como sesión dedicada con timing científico exacto. Inner Balance / HeartMath son competidores pero hardware-locked.
- **Effort estimated:** M–L (8–12 días eng). Requiere precision timing (5.5 rpm = 11s ciclo) sostenida 600s. Visualización immersive sin fatigue es el reto UX.
- **Risk:** medio-alto. Largo formato es fricción onboarding — solo conviertes a usuarios que ya están en cohorte avanzada.

### Recomendación final: **Flagship = #15 Suspiro Fisiológico**

**Razones convergentes:**

1. **Substancia científica máxima con narrativa accesible**: RCT directo Stanford 2023 con resultado superior a meditación de atención focalizada en ansiedad. Es el "single-paper hook" más fácil de comunicar a B2B + B2C ("respaldado por Stanford 2023").
2. **Format cortísimo = lowest fricción onboarding**: 90s vs 600s de #16. Es el momento "dame uno que funcione antes de mi siguiente call". Es el formato que demuestra el producto sin compromiso.
3. **100% office-friendly**: D6=10, máximo del catálogo. Cero motion visible, cero vocalización, eyes-open. Único protocolo que cumple los 4 constraints duros del user simultáneamente.
4. **Blue-ocean defensible**: ningún competidor (Calm, Headspace, Apple, Othership, Insight Timer) lo tiene como flagship dedicado con timing exacto y branding propio. Bio puede claim ownership del ritual.

**Por qué no #25 (técnicamente líder):** D6 menor (palpar pulso es barrier), uso real más bajo, risk medio (no-detect-pulse population). Mejor posicionado como "advanced flagship" en Phase 3.

**Por qué no #16:** 600s = session-time gate. No es momento "first impression". Mejor positioned como "training tier marquee".

---

## 9. Roadmap secuencia redesign

### Phase 1 (Months 1–2): Flagship redesign — #15 Suspiro Fisiológico

- Objetivo: llevar #15 de 8.0 → 9.5+ baseline.
- Trabajo:
  - Visual-first orb dedicado (fuera del genérico `breath_orb`) — single-fixation pattern.
  - Doble-inhalación visualizada explícitamente (animation primitive nuevo `physiological_sigh_orb`).
  - Closure pulse afterwave — visualización del descenso parasimpático sostenido.
  - Voice-off-by-default con TTS opcional muy minimal (solo "uno", "dos", "exhala").
  - Haptic signature **única para #15** (no `hapticBreath` global).
  - Science-narrative onboarding: "Stanford 2023, 28 días, ansiedad −X %".
  - Post-session: HR delta visible con framing "tu corazón se ralentizó N bpm en 90s" (si HRV captured).
- Métrica de éxito: completion rate ≥85 %, mood delta promedio ≥0.5, NPS-like rating "would do again ≥4/5".

### Phase 2 (Months 3–4): Core loop redesign — top-3 más usados (post-data)

Sin uso real Phase 6 disponible en este audit. Recomendación operativa:

- Análisis: extraer top-3 más-usados de moodLog real una vez deployado #15 redesign (≥30 días data).
- Candidatos a priori (probable top-3 por D6 + diversidad intent): **#1 Reinicio Parasimpático** (calma daily anchor), **#2 Activación Cognitiva** (enfoque morning), **#3 Reset Ejecutivo** (reset transition).
- Trabajo: aplicar pattern flagship #15 a estos tres (signature haptic propia, primitives diferenciadas, science-citation prominente, post-session visualización delta).
- Métrica: average score baseline 7.0 → 8.5+ por protocolo.

### Phase 3 (Months 5–6): Specialized redesign

- Targets: **#25 Cardiac Pulse Match** (advanced flagship), **#16 Resonancia Vagal** (training marquee), **#12 Neural Ascension** (already 7.75, polish to 9.0).
- Trabajo:
  - #25: visualization HR live (si cam-PPG permitted) + variant carotídeo.
  - #16: long-form immersive sin fatigue — ambient soundscape + minimal visual + interactive checkpoint cada 2 min.
  - #12: refine existing strong substance, add proprietary haptic signature.
- Métrica: scores 8.0 → 9.0+, cohort progression "advanced unlock" funnel ≥30 %.

### Phase 4 (Months 7+): Long tail + crisis + retire decisions

- **Crisis tier (#18 #19 #20):** mantener as-is. Funcional, low-frequency-use, alto-stakes. Solo iterate safety overlay y improve `facial_cold_prompt` huérfana.
- **Office-incompatible review (#23 #24):** decisión de portfolio — ¿retirar o pivot a "home/gym mode" toggle explícito?
  - #24 Bilateral Walking puede pivot a "lunch-walk companion mode" (separated UX).
  - #23 Power Pose puede pivot a "pre-meeting amp mode" (private space framing).
- **Low-score retire candidates:** #8 Lightning Focus (6.0), #7 HyperShift (6.0), #5 Skyline Focus (6.5) — review para consolidar en variantes de los flagship si overlap mecanístico alto.
- Métrica: portfolio average ≥8.5, zero <7.0.

### Roadmap dependencies

- Phase 1 establece pattern primitivas + haptic-signature propias. Phases 2–3 heredan. Sin Phase 1, las siguientes no tienen baseline para comparar.
- Phase 2 requiere data real ≥30 días post-Phase-1 deploy (no inventar prioridades sin telemetría).
- Phase 3 requiere infra cam-PPG live (#25) o ambient soundscape mejorado (#16) — verificar capability en `audio.js` antes.
- Phase 4 requiere portfolio governance decision (retire/pivot) — bloqueante humano, no técnico.

---

## 10. Self-rating del audit

### 10.1 Cobertura conseguida

- ✓ Task 0 data layer — exhaustivo, shape verbatim, distribución, science.
- ✓ Task 1 engine integration — entry point, inputs, scoring weights, post-loop, NOM-035 bias, dead-weight identificado.
- ✓ Task 2 UI ejecución — 23 primitivas listadas, sync canal explicado, haptic patterns inventoried, accessibility gaps marcados.
- ✓ Task 3 telemetría — pre/post capture, history shape, computed metrics, 5 gaps subjetivos clave nombrados.
- ✓ Task 4 scoring matrix 23 × 8 — todas las celdas pobladas, caveats metodológicos explicitados.
- ⚠ Task 5 capturas runtime — 6 screenshots capturados, **falta uno**: bilateral_tap_targets primitive en runtime no fue capturado por race condition al relaunch en mismo session. Documentado como gap.
- ✓ Task 6 comparativa competidores — 6 apps + Bio, blue ocean explicitado.
- ✓ Task 7 flagship recommendation — top 3 con scoring + razones convergentes + final pick justificado.
- ✓ Task 8 roadmap 4 phases — secuencia priorizada, dependencias marcadas.

### 10.2 Gaps en información

1. **Sin user-data real Phase 6**: D4 Inmersión y D7 Payoff sensorial son **inferred por proxy estructural**, no medidos. Para hard-science scoring, falta acceso a moodLog history (protocols.use frequency, mood delta avg per protocolo, completion rates). El reporte explicita estos como `~`.
2. **Captura primitiva bilateral_tap_targets faltante**: el relaunch desde catálogo no resultó en mount de la primitiva esperada en este run. No bloquea conclusiones (la primitiva está en código y otros screenshots Phase 6 la documentan).
3. **No web search permitido en SP**: comparativa competidores depende de conocimiento general (Calm/Headspace/Othership/Wim Hof/Insight Timer/Apple). Cifras precisas (catalog count Calm) son aproximadas.
4. **Estimación effort es ballpark**: días-eng son educated guesses, no cuantificados con sprint planning real.
5. **Sin instrumentación A/B real**: el roadmap asume measurement stack futuro. Si la app no instrumenta completion-rate / mood-delta per protocolo via dashboard, las métricas de éxito Phase 1-4 no son directamente accionables.

### 10.3 Áreas que un follow-up SP cubriría mejor

- **Quantify per-protocol usage**: extraer histograma de moodLog real (necesita seed data o datos production).
- **D5 systemic uplift**: rediseñar engine para in-session adaptation (HRV-driven phase skip, haptic intensity ramp). Esto es el techo D5 actual = 4 — gap más grande del catálogo.
- **D7 user-perceived effectiveness**: agregar pregunta "¿Te ayudó? 1–5" + "¿Volverías?" en MoodPostSessionSheet → entrenar engine con esta señal.
- **Per-act granularity capture**: instrumentar `interactions` para emitir per-act `{actId, status, durationMs, validationOutcome}` instead of aggregate count → habilita act-level redesign decisions.

### 10.4 Honest score del audit

**8.5/10** — sólido en data + engine + UI + telemetría + scoring + comparativa + recommendation. Restricciones honestas: scoring D4/D7 inferred no medido; 1 captura runtime faltante; sin user-data real para validar prioridades Phase 2.

---

**Fin del reporte. Modo READ-ONLY cumplido. Cero modificaciones de código, tests, fixtures, schema, configs. Cero commits. Cero sub-prompts encadenados de fix.**
