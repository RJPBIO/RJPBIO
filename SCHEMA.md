# SCHEMA.md — Extended Act Schema (Phase 4 SP1)

Reference for SP2–SP8. Defines how acts inside a protocol phase carry validation, UI primitive, and media intent. The base file [`src/lib/protocols.js`](src/lib/protocols.js) declares the JSDoc typedefs; this document is the human-readable contract.

---

## Why extend the act schema

Pre-Phase-4, an `iExec` entry was just `{ from, to, text }` — three fields per act. The player rendered text + the breath orb, and that was the whole loop. There was no way to express:

- This act needs **bilateral motor input** (taps, jumping jacks).
- This act needs **eye movement validation** (saccades, fixation).
- This act needs the **TTS off, soundscape minimal**, vs the next act needs voice + heavy haptic.
- The act passes if and only if the user **completed N breath cycles** (not just elapsed time).
- In a **crisis** protocol nothing should validate — credit always.

SP2 builds the new UI primitives. SP3 wires the player. SP4–SP8 hand-migrate each protocol's acts. This file defines the contract those sub-prompts share.

---

## Top-level shape (unchanged)

```js
{
  id: 1,
  n: "Reinicio Parasimpático",
  ct: "Reset",
  d: 120,                  // total seconds
  sb: "...",               // subtitle
  tg: "R1",                // 2-3 char tag
  cl: "#059669",           // brand color
  int: "calma",            // intent: calma | enfoque | energia | reset
  dif: 1,                  // 1..3
  useCase: "active",       // active | training | crisis (default active)
  safety: "...",           // optional, crisis-only
  variants: [...],         // optional, crisis-only
  ph: [...]                // phases
}
```

A phase:

```js
{
  l: "Entrada Vagal",
  r: "0–30s",
  s: 0,                    // start sec
  e: 30,                   // end sec
  k: "...",                // short hook
  i: "...",                // long instruction
  iExec: [ ...acts ],      // sequence of timed acts (extended schema below)
  sc: "...",               // single-sentence science note
  ic: "breath",            // breath | body | mind | focus
  br: { in, h1, ex, h2 }   // breath cycle (or null)
}
```

---

## Extended `IExecAct` shape

```js
{
  // — required (legacy) —
  from: 0,                 // seconds, relative to phase.s = 0
  to: 30,                  // seconds, relative to phase
  text: "Cierra los ojos…",

  // — extended (optional, SP4+) —
  type: "breath",          // ActType
  mechanism: "vagal_brake",// short tag, free-form
  duration: { min_ms, target_ms, max_ms },
  validate: { kind, ...validators },
  ui: { primitive, props },
  media: { voice, breath_ticks, binaural, soundscape, haptic, cue, countdown, signature, silent },
  optional_capture: { ppg, eye_tracking, motion }
}
```

Legacy acts (only `from/to/text`) are still valid — `inferActDefaults(act, phase, protocol)` upgrades them on read with safe defaults.

---

## `ActType` enum

Used by SP3 to pick a UI primitive at runtime.

| Group | Types |
|---|---|
| Breath | `breath` |
| Motor | `motor_bilateral`, `motor_isometric`, `motor_release`, `motor_shake` |
| Eyes / Vision | `oculomotor`, `visual_focus`, `visual_panoramic`, `visual_dual_focus` |
| Body / Self | `interoception`, `proprioception`, `somatic_tactile` |
| Voice / Audio | `vocalization`, `auditory_internal` |
| Vagal | `vagal_facial_cold`, `vagal_chest_percussion`, `vagal_breath_extended` |
| Cognitive | `cognitive_anchor`, `cognitive_visualization`, `cognitive_filter` |
| Commitment | `commitment_motor` |
| Misc | `sensory_grounding`, `transition` |

---

## `ActDuration`

```js
{ min_ms, target_ms, max_ms }
```

- `min_ms` — humanly fast lower bound. Below this, `validate` may reject.
- `target_ms` — average duration we expect.
- `max_ms` — soft cap; SP3 timeouts to next act after `max_ms` regardless.

Default inference: from `(to - from) * 1000`, with `[0.7×, 1.0×, 1.3×]` margins.

---

## `ActValidation` — anti-cheat enforcement

Determines whether the act counts toward credit. SP3's player owns the state machine.

| `kind` | Required fields | Used for |
|---|---|---|
| `min_duration` | `min_ms` | Generic timing-based: act passes iff elapsed ≥ `min_ms` |
| `breath_cycles` | `min_cycles`, `cycle_min_ms` | Breath-orb validation: count completed cycles |
| `tap_count` | `min_taps`, `bilateral?` | Motor bilateral primitives |
| `hold_press` | `min_hold_ms` | Hold-press button (commitment / isometric) |
| `chip_selection` | `required?` | Chip selector (e.g. emotion labelling) |
| `eye_movement` | `min_saccades`, `tolerance_pct` | Oculomotor primitives — **camera opt-in only** |
| `ppg_breath_match` | `tolerance_pct` | PPG-derived breath rate vs target — **camera opt-in only** |
| `visual_completion` | `required_path` | Body silhouette traversal completion |
| `no_validation` | `reason` | Crisis: **always credit**, never gate |

### Validation modes by `useCase`

| useCase | Validation strictness | Bandit weight |
|---|---|---|
| `active` (12 protocols) | **Strict.** Skipping the act → no credit, no UCB1 update. | full |
| `training` (3 protocols) | **Soft.** Pause/resume allowed. Partial credit with `partial: true` + `percentComplete`. | reduced |
| `crisis` (3 protocols) | **None.** "Estoy bien" button always visible. The fact the user opened the protocol is what we record. | excluded from bandit (already) |

---

## `ActUIConfig.primitive`

The component SP3 renders. SP2 builds these. New ones can be added — keep the enum closed in the typedef.

| `primitive` | Built by | Purpose |
|---|---|---|
| `breath_orb` | exists ([`BreathOrb.jsx`](src/components/BreathOrb.jsx)) | Breath cycle visualization |
| `bilateral_tap_targets` | SP2 | Two large tap pads (bilateral motor) |
| `ocular_dots` | SP2 | Two side-anchored dots for saccade target |
| `ocular_horizontal_metronome` | SP2 | Horizontal-moving target |
| `visual_panoramic_prompt` | SP2 | Asks user to look far / panoramic |
| `dual_focus_targets` | SP2 | Near + far focus alternation |
| `body_silhouette_highlight` | SP2 | Scan-trail body silhouette |
| `posture_visual` | SP2 | Posture verification scaffold |
| `isometric_grip_prompt` | SP2 | Hold-press grip strength |
| `chest_percussion_prompt` | SP2 | Visual rhythm + haptic for percussion |
| `facial_cold_prompt` | SP2 | Cold-water/cold-pack instruction overlay |
| `shake_hands_prompt` | SP2 | Shake hands (motor release) |
| `chip_selector` | SP2 | Emotion / decision chip pick |
| `hold_press_button` | SP2 | Generic hold to commit |
| `text_emphasis_voice` | SP2 | Plain text + optional TTS (default for unknown types) |
| `silence_cyan_minimal` | SP2 | Quiet fill — ambient only |
| `object_anchor_prompt` | SP2 | "Find an object, name it" sensory grounding |
| `vocal_with_haptic` | SP2 | Vocalization with haptic resonance trace |
| `transition_dots` | SP2 | Pulse-dot transition between acts |

---

## `ActMediaConfig`

Each sub-key is independent. SP3 dispatches each to the corresponding [`audio.js`](src/lib/audio.js) API.

```js
media: {
  voice:        { enabled_default, lines, rate, locale_override }, // → speak / speakNow
  breath_ticks: { enabled, auto_sync },                            // → playBreathTick / hapticBreath
  binaural:     { action: "start" | "stop" | "continue", type },   // → startBinaural / stopBinaural
  soundscape:   { type | null },                                   // → startSoundscape / stopSoundscape
  haptic:       { phase | breath | signature | preShift | countdown | custom }, // → hap / hapticPhase / etc.
  cue:          { spark, chord, ignition },                        // → playSpark / playChord / playIgnition
  countdown:    { steps, audio, haptic },                          // → playCountdownTick / hapticCountdown
  signature:    { kind },                                          // → hapticSignature
  silent:       true                                               // ambient + voice forced off
}
```

### TTS default OFF — opt-in by user

Decision lock #2 in SP1 prompt. The base default is `voice.enabled_default = false` for non-crisis protocols. The user opts in via Profile/Settings (SP2/SP3 wire this). For crisis protocols, `voice.enabled_default = true` regardless of user preference — runtime override, **not persisted**.

The helper in `inferActDefaults()`:

```js
voice: { enabled_default: getUseCase(protocol) === "crisis" }
```

### Camera opt-in (PPG / eye tracking)

Decision lock #3. `optional_capture` is per-act:

```js
optional_capture: {
  ppg: { enabled_if_camera: true, target_breath_rate_bpm: 6 },
  eye_tracking: { enabled_if_camera: true },
  motion: { enabled_if_motion: true }
}
```

Camera off → validation falls back to timing-based. Credit is never gated by camera availability.

---

## `inferActDefaults(act, phase, protocol)` — backwards-safe upgrader

Idempotent: respects all fields already present, fills only what's missing.

| Field | Default rule |
|---|---|
| `type` | from `phase.ic` (breath→`breath`, body→`proprioception`, mind→`cognitive_anchor`, focus→`visual_focus`) |
| `duration` | derived from `(to - from)` in ms with ±30% margin |
| `validate.kind` | `no_validation` if `useCase === "crisis"` · `breath_cycles` if breath + `phase.br` · else `min_duration` (70%) |
| `ui.primitive` | `breath_orb` if breath · else `text_emphasis_voice` |
| `media.voice.enabled_default` | `useCase === "crisis"` |
| `media.breath_ticks.enabled` | breath + `phase.br` truthy |
| `media.binaural.action` | `"start"` if `phase.s === 0` else `"continue"` |
| `media.binaural.type` | `protocol.int` |

---

## Use-case helpers (centralized filters)

```js
import { getActiveProtocols, getCrisisProtocols, getTrainingProtocols } from "@/lib/protocols";
```

- `getActiveProtocols()` — 12 protocols, the recommendation pool. **Excludes** `useCase: training | crisis` and `deprecated: true`.
- `getCrisisProtocols()` — 3 protocols (#18, #19, #20). Explicit user invocation only.
- `getTrainingProtocols()` — 3 protocols (#15 Suspiro Fisiológico is `active` so excluded; #16 Resonancia Vagal + #17 NSDR are training).

---

## Migration sequencing (SP2 → SP8)

1. **SP2** — Build the UI primitives in `src/components/protocol/`. Each consumes [`audio.js`](src/lib/audio.js) APIs. No new audio helpers.
2. **SP3** — `useProtocolPlayer(protocol, opts)` hook + `<ProtocolPlayer>` component. Reads acts; if act has explicit `ui.primitive`, render it; else `inferActDefaults()` and render the inferred one.
3. **SP4** — Migrate protocols #1, #2, #3 (active calma + active enfoque base).
4. **SP5** — Migrate protocols #4, #5, #6, #7 (active mid-difficulty).
5. **SP6** — Migrate protocols #8, #9, #10, #11, #12 (active dif≥2 + Body Anchor + new Neural Ascension).
6. **SP7** — Migrate protocols #15, #16, #17 (training).
7. **SP8** — Migrate protocols #18, #19, #20 (crisis). Highest-stakes — voice always-on, no validation.

Each migration replaces inferred defaults with curated `validate`, `ui`, `media`. Once a protocol is migrated, its acts are typed end-to-end.

---
