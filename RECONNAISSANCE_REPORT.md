# RECONNAISSANCE REPORT — Sub-prompt 1

Forensic audit of the protocol execution stack before extending the schema. All paths verified.

---

## 1.1 UI Components Inventory

**No dedicated `src/components/protocol/` or `src/components/breath/` directories exist.** Components live flat under `src/components/`:

| File | Role | LoC |
|---|---|---|
| `src/components/SessionRunner.jsx` | **Fullscreen executor.** Renders running session, breath orb, instructions, scanline, countdown ceremony, biofeedback overlay. Receives the active protocol + phase index from `page.jsx` and renders. **It is the UI player but not the engine.** | 1462 |
| `src/components/ProtocolDetail.jsx` | Modal sheet that previews a protocol (phases, science, start button). Reads `SCIENCE_DEEP`. | 449 |
| `src/components/ProtocolSelector.jsx` | Pre-session picker (catalog grid). | 482 |
| `src/components/BreathOrb.jsx` | Breath visual primitive (animated orb synced to breath cycle). Already used as the breathing primitive. | 165 |
| `src/components/PhysiologicalSigh.jsx` | Standalone widget (not the main player). | — |
| `src/components/NSDR.jsx` | Standalone widget for NSDR sessions. | — |
| `src/components/SessionBiofeedback.jsx` | Overlay during running session. | — |
| `src/components/PostSessionFlow.jsx` | Post-session check-in flow. | — |

**No `ProtocolPlayer`, `ProtocolView`, or `ProtocolExecutor` exist.** The executor is split:
- **State + timer + audio orchestration** lives in `src/app/app/page.jsx` (2625 LoC).
- **Visual rendering** lives in `src/components/SessionRunner.jsx`.
- **Phase index math** lives in `src/lib/phaseEngine.js`.
- **Breath frame math** lives in `src/lib/breathCycle.js`.

---

## 1.2 Execution Engine

The "engine" is **distributed across `page.jsx` + hooks + lib helpers**, not centralized. Trace:

1. **`src/app/app/page.jsx`** holds the execution state machine (`ts` = timer status: `idle | running | paused | done`), timer countdown (`sec`), current protocol (`pr`), phase index (`pi`), breath cycle frame (`bS`).
2. **`useSessionTimer(initialSeconds)`** at [`src/hooks/useSessionTimer.js`](src/hooks/useSessionTimer.js) handles seconds-based countdown.
3. **`useSessionAudio({ timerStatus, soundOn, soundscape, intent })`** at [`src/hooks/useSessionAudio.js`](src/hooks/useSessionAudio.js) starts/stops ambient + soundscape + binaural based on `intent`.
4. **`computePhaseIndex(elapsedSec, ph, durMult)`** + **`timeToNextPhase(...)`** at [`src/lib/phaseEngine.js`](src/lib/phaseEngine.js) compute current phase from elapsed time.
5. **`computeBreathFrame(...)`** at [`src/lib/breathCycle.js`](src/lib/breathCycle.js) computes the orb scale per frame.
6. **`SessionRunner`** at [`src/components/SessionRunner.jsx`](src/components/SessionRunner.jsx) consumes all of the above as props and renders.

**No `useProtocol` or `useProtocolPlayer` hook exists.** SP3 will need to consolidate this into a real player.

There is no "press timer to skip" pattern visible in the executor — the timer is monotone-decreasing per second; phase advances are derived from elapsed seconds via `phaseEngine`. Validation hooks exist in `page.jsx` (commented "Anti-trampa checkpoints — ahora viven dentro del SessionRunner (ver onCheckpoint* props)" at line 2344). Anti-cheat enforcement is currently checkpoint-based, not validation-mode-based.

---

## 1.3 protocols.js Consumers

15 import sites resolved. Two import patterns: `import { P }` and `import { P as PROTOCOLS }`.

**Lib/server consumers (logic):**
- [`src/lib/neural.js:6`](src/lib/neural.js#L6) — `import { P, getUseCase }`. Uses `P.find()` for recommendation + diversification.
- [`src/lib/prescriber.js:9`](src/lib/prescriber.js#L9) — `import { P, getUseCase }`. Filters pool excluding crisis/training.
- [`src/lib/programs.js:41`](src/lib/programs.js#L41) — `import { P as PROTOCOLS }`. `getProtocolById(id)` resolves by `.id`.
- [`src/lib/neural/coldStart.js:28`](src/lib/neural/coldStart.js#L28) — `import { P }`. Resolves protocol **by name** (`p.n === s.protocolId`) — server-side session aggregation.
- [`src/app/api/v1/orgs/[orgId]/neural-health/route.js`](src/app/api/v1/orgs/[orgId]/neural-health/route.js) — uses protocols indirectly.

**UI consumers:**
- [`src/app/app/page.jsx:21`](src/app/app/page.jsx#L21) — `P, SCIENCE_DEEP`.
- [`src/components/DashboardView.jsx:21`](src/components/DashboardView.jsx#L21) — `P`.
- [`src/components/CorrelationMatrix.jsx:15`](src/components/CorrelationMatrix.jsx#L15) — `P`.
- [`src/components/EvidenceStrip.jsx:27`](src/components/EvidenceStrip.jsx#L27) — `P as PROTOCOLS`.
- [`src/components/ProtocolDetail.jsx:12`](src/components/ProtocolDetail.jsx#L12) — `SCIENCE_DEEP`.
- [`src/components/app/v2/HomeV2.jsx:7`](src/components/app/v2/HomeV2.jsx#L7) — `P as PROTOCOLS`.
- [`src/components/app/v2/data/SessionsRecent.jsx:3`](src/components/app/v2/data/SessionsRecent.jsx#L3) — `P as PROTOCOLS`.

**Tests:**
- [`src/lib/protocols.shape.test.js`](src/lib/protocols.shape.test.js) — shape contract.
- [`src/lib/protocols.useCase.test.js`](src/lib/protocols.useCase.test.js) — useCase contract.
- [`src/lib/localize.test.js:11`](src/lib/localize.test.js#L11) — locale display names.
- [`src/lib/neural/coldStart.test.js:189`](src/lib/neural/coldStart.test.js#L189).

**Locale overrides (i18n keys to keep in sync):**
- [`src/lib/locales/es.js`](src/lib/locales/es.js) lines 315–335 — display names per id.
- [`src/lib/locales/en.js`](src/lib/locales/en.js) lines 315–335 — same.

---

## 1.4 Bandit Integration

[`src/lib/neural/bandit.js`](src/lib/neural/bandit.js) is **not coupled to protocol IDs.** Arms are keyed by `intent + bucket`:

```js
armKey(intent, bucket) → "calma:morning"
```

In `selectArm(armsState, candidates, ...)`:
```js
const intent = cand.int ?? cand.id ?? cand.n;
const key = armKey(intent, bucket);
```

Candidates are protocol objects passed in; the bandit only reads `cand.int`. **Removing OMEGA (#13, int="reset") and OMNIA (#14, int="energia") does not break the bandit** — those arms exist anyway via other protocols (e.g. #3 is also reset, #4 is also energia). At most, the recommendation pool shrinks by 2.

**No hardcoded references to id 13 or 14 in `bandit.js` or `neural.js`** (other than the recommendation TEXT in `neural.js:411` mentioning "Protocolo OMEGA para la tarde" — a string literal, not a behavioural reference).

---

## 1.5 Programs Dependencies

`programs.js` references OMEGA (id 13) and OMNIA (id 14) in **6 days across 4 programs**:

| Program | Day | protocolId | Note |
|---|---|---|---|
| `neural-baseline` | 12 | **13** | `síntesis · OMEGA` |
| `neural-baseline` | 13 | **14** | `síntesis · OMNIA` |
| `recovery-week` | 7 | **13** | `OMEGA · realineación completa` |
| `focus-sprint` | 5 | **14** | `activación humana total` |
| `burnout-recovery` | 23 | **13** | `semana 4 · OMEGA` |
| `executive-presence` | 9 | **13** | `OMEGA · síntesis` |
| `executive-presence` | 10 | **14** | `OMNIA · sello encendido` |

Plus `rationale` strings in `focus-sprint` and `executive-presence` mentioning OMEGA/OMNIA narratively.

**Plus `src/lib/constants.js:121–122`** — legacy 7-day program (`PROG_7`) references pid:13 + pid:14 for days 6 and 7.

**Plus `src/lib/locales/{es,en}.js`** — "13" and "14" entries in the protocol display-name override map and rationale strings of focus-sprint + executive-presence.

**Plus `src/lib/neural.js:411`** — hardcoded string "Protocolo OMEGA para la tarde" in the recommendation copy.

**Substitution plan (intent-preserving):**
- OMEGA (reset/calma synthesis) → substitute with **#3 Reset Ejecutivo** (reset) or **#1 Reinicio Parasimpático** (deeper reset).
- OMNIA (energia/synthesis) → substitute with **#4 Pulse Shift** (energia) or **#10 Sensory Wake** (energia).
- For "synthesis" days (final day of a program), prefer the protocol that closes the arc cleanly.

---

## 1.6 Audio Engine APIs

[`src/lib/audio.js`](src/lib/audio.js) — 1646 LoC. Verified exports relevant to protocols:

| Export | Line | Signature |
|---|---|---|
| `gAC()` | 8 | get/create AudioContext |
| `unlockAudio()` | 24 | iOS/Safari unlock |
| `wireAudioUnlock()` | 42 | one-time unlock listener wiring |
| `setUserVoiceRate(rate)` | 74 | TTS rate setter |
| `getUserVoiceRate()` | 77 | getter |
| `setUserVoicePreference(name)` | 80 | TTS voice picker |
| `getUserVoicePreference()` | 83 | getter |
| `setHapticIntensity(level)` | 89 | "low"/"medium"/"high" |
| `setBinauralEnabled(flag)` | 97 | global gate |
| `setMusicBedEnabled(flag)` | 103 | global gate |
| `setHapticEnabled(flag)` | 112 | global gate |
| `setHapticFallback(fn)` | 122 | inject fallback haptic impl |
| `diagnoseHaptic()` | 171 | UA + capability probe |
| `setMasterVolume(v)` | 191 | 0..1 |
| `getMasterLevel()` | 411 | current level |
| `playChord(f, d, v)` | 804 | synth chord |
| `playSpark(freq, volume)` | 833 | spark tone |
| `playBreathTick(label, intent)` | 875 | breath tick (label = "in"/"hold1"/"out"/"hold2") |
| `startAmbient()` / `stopAmbient()` | 990 / 1006 | ambient bed |
| `startSoundscape(type)` / `stopSoundscape()` | 1018 / 1052 | typed soundscape |
| `startBinaural(type)` / `stopBinaural()` | 1067 / 1153 | typed binaural (intent-aware) |
| `hap(t, sO, hO)` | 1181 | core haptic |
| `hapticPhase(type)` | 1202 | phase haptic |
| `hapticBreath(label)` | 1224 | breath label haptic |
| `hapticSignature(kind)` | 1243 | signature pulse |
| `hapticPreShift()` | 1252 | pre-shift cue |
| `hapticCountdown(step)` | 1263 | countdown haptic |
| `playCountdownTick(step)` | 1274 | countdown audio |
| `playIgnition()` | 1286 | ceremonial ignition |
| `setupMotionDetection(cb)` | 1300 | motion sensor wiring |
| `requestWakeLock()` / `releaseWakeLock()` | 1321 / 1324 | screen wake lock |
| `listAvailableVoices(locale)` | 1335 | TTS catalog |
| `loadVoices()` | 1364 | warm voices cache |
| `unlockVoice()` | 1494 | TTS unlock |
| `isSpeaking()` | 1517 | TTS busy probe |
| `speak(text, circadian, voiceOn, locale)` | 1593 | TTS queue |
| `speakNow(text, circadian, voiceOn, locale)` | 1609 | TTS bypass queue |
| `stopVoice()` | 1625 | TTS abort |
| `exportData(st)` | 1639 | unrelated, ignore |

**SP2–SP8 must consume these. No parallel APIs.**

---

## 1.7 State Management

[`src/store/useStore.js`](src/store/useStore.js) — Zustand store, `STORE_VERSION = 14`.

**Session recording flow:**
- `completeSession(r)` at line 150 records a finished session. `r` carries: `eVC, nC, nR, nE, ns, nsk, nw, newHist, ach, totalT`.
- `newHist` is built upstream in `page.jsx` and pushed to `st.history`.
- Bandit arm update happens via `recordSessionOutcome(...)` at line 341 (separate path, called from `page.jsx` after a session completes).

**`history[]` shape (from `page.jsx:760`):**
```js
{ ts, p (proto.n), c, m, ms, sec, intent, dif, protocolId, completedAt, ... }
```
History uses `p` (protocol name) as primary identifier — **renames will orphan historical sessions for `coldStart` resolution by name**, but spec confirms "sin users actuales", so OK.

**No `partial: true` flag** anywhere in the current store. Validation states (`active`/`training`/`crisis`) are not currently surfaced in the session record. SP4–SP8 will add these.

**Audio settings persist:** `voiceOn` (default true), `voiceRate`, `masterVolume`, `musicBedOn`, `binauralOn`, `hapticIntensity`, `voicePreference`. Sprint 1 schema decision says **TTS default OFF** — that conflicts with the current persistent default `voiceOn: true`. Out of scope for SP1 (SP2 will surface the toggle), but flagged.

---

## 1.8 Critical Issues / Blockers

### 🔴 BLOCKER 1 — `protocols.shape.test.js` will fail when removing #13/#14

The test asserts:
- Line 24: `P.length >= 20` → with 18 protocols, **fails**.
- Lines 27–32: ids unique AND consecutive from 1, no gaps → with 13/14 missing, **fails**.

**Resolution applied (in Phase 7):** Update the existing shape test to:
- Expect `>= 18` protocols.
- Allow gaps in IDs (replace consecutive-from-1 invariant with: ids are positive integers, unique, in `[1, 20]`).

Contract clarification: spec mandates "IDs se mantienen para integridad histórica" — so we keep 13/14 as a permanent gap.

### 🔴 BLOCKER 2 — `programs.js` references id 13 and 14 in 7 sessions

Per Phase 1.5. Resolved by substitution in Phase 3.4:
- `neural-baseline` day 12 → **3** (Reset Ejecutivo, intent=reset).
- `neural-baseline` day 13 → **4** (Pulse Shift, intent=energia).
- `recovery-week` day 7 → **1** (Reinicio Parasimpático, deepest reset close).
- `focus-sprint` day 5 → **8** (Lightning Focus already day 4 — substitute with **10 Sensory Wake**, intent=energia, peak energy close).
- `burnout-recovery` day 23 → **3** (Reset Ejecutivo for week-4 reset opener).
- `executive-presence` day 9 → **3** (Reset Ejecutivo synthesis).
- `executive-presence` day 10 → **9** (Steel Core Reset — closes Steel arc cleanly with steel-themed seal).

### 🟡 ISSUE 3 — `constants.js PROG_7` references id 13/14

Legacy 7-day program with `pid:13` (day 6) + `pid:14` (day 7). Replace with id 9 (Steel Core Reset) + id 12 (Neural Ascension refactored).

### 🟡 ISSUE 4 — `locales/{es,en}.js` overrides display names for id 13 and 14

Drop those keys from both locale maps. Update rationale strings in `focus-sprint` and `executive-presence` to remove "OMNIA"/"OMEGA" references.

### 🟡 ISSUE 5 — `neural.js:411` hardcoded string mentions "Protocolo OMEGA para la tarde"

Replace with a generic reset protocol mention (e.g. "Reset Ejecutivo para la tarde").

### 🟡 ISSUE 6 — `Nom35PersonalReport.jsx:71` hardcodes "Quantum Grounding"

After Phase 5 rename: change `protocolName: "Quantum Grounding"` → `protocolName: "Body Anchor"`.

### 🟡 ISSUE 7 — Locale display names for #10 and #11 will diverge after rename

`locales/{es,en}.js` lines 324–325 hardcode "Atomic Pulse" and "Quantum Grounding". Update to "Sensory Wake" and "Body Anchor".

### 🟢 NON-ISSUE — Bandit will not break

Confirmed in Phase 1.4. Bandit arms are intent-keyed, not id-keyed.

### 🟢 NON-ISSUE — `coldStart.js` resolves by NAME

Renames orphan historical sessions for that resolver, but spec says "sin users actuales — refactor libre". OK.

---

## 1.9 Recommendations Before Continuing

1. **SP2 (UI primitives):** consume `audio.js` APIs as listed in §1.6. Do **not** create parallel TTS/haptic helpers. Build new primitives (`bilateral_tap_targets`, `ocular_horizontal_metronome`, `chest_percussion_prompt`, etc.) as React components that internally call the existing `hap`, `hapticBreath`, `playBreathTick`, `speak` APIs.
2. **SP3 (ProtocolPlayer refactor):** the engine is currently distributed across `page.jsx` + 3 hooks + 2 lib helpers. SP3 should consolidate into a single `useProtocolPlayer(protocol, opts)` hook that owns timer, phase-index, validation state, and audio orchestration — and a `<ProtocolPlayer>` component that swaps in the right primitive based on `act.ui.primitive`. SessionRunner can become a thin wrapper or be replaced.
3. **SP4–SP8 (per-protocol migration):** each protocol's `iExec` array gets per-act `type`, `validate`, `ui`, `media`. Use `inferActDefaults()` (this SP) for backwards-safe upgrades when a protocol hasn't been hand-migrated yet. Hand-migration replaces inferred defaults with curated values.
4. **TTS-default-OFF decision:** `useStore` defaults `voiceOn: true`. SP2 must update the migration in `useStore.js` to default-OFF, with an opt-in toggle. EXCEPTION must be implemented in SP3: when entering a crisis-useCase protocol, the player **temporarily overrides** voiceOn=true at runtime without persisting. A `voiceOnEffective(protocol, userPref)` helper belongs in `protocols.js` or a dedicated module — out of scope for SP1.
5. **Validation modes:** SP1 introduces `validate.kind` in the schema but enforcement is SP3+. Suggest a `useValidation(protocol, validate)` hook in SP3 that exposes `{ canFinish, partial, percentComplete, failureReason }`.
6. **Camera opt-in (PPG/eye tracking):** out of scope for SP1. SP3 should expose a `cameraEnabled` flag from store; primitives that benefit (PPG-breath, eye-tracking) read it but never block credit.

---
