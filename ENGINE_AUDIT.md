# ENGINE AUDIT — Sub-prompt 3

Forensic audit of the current protocol-execution engine before refactoring.

---

## 1. Where the engine lives today

The engine is **distributed across 6 files** (~5,000 LoC of state machine + UI mixed):

| File | LoC | Role |
|---|---|---|
| [`src/app/app/page.jsx`](src/app/app/page.jsx) | 2625 | State machine. Owns `pr/pi/sec/ts/bL/bS/bCnt/countdown/postStep`. Wires the timer + audio + voice + haptics. Mounts `<SessionRunner>`. Owns `comp()`, `submitCheckin()`, `shipSessionToOutbox()`. |
| [`src/components/SessionRunner.jsx`](src/components/SessionRunner.jsx) | 1462 | UI shell. Receives 20+ props, renders breath orb, biofeedback overlay, science panel, checkpoints, ignition flash. |
| [`src/hooks/useSessionTimer.js`](src/hooks/useSessionTimer.js) | 91 | Wall-clock countdown timer. Status `idle/running/paused/done`. Used in tests but NOT actually consumed by `page.jsx` (the page implements its own timer interval at line 598). |
| [`src/hooks/useSessionAudio.js`](src/hooks/useSessionAudio.js) | 51 | Reactive audio orchestrator. Watches `timerStatus`; starts/stops `startAmbient/startSoundscape/startBinaural`. |
| [`src/lib/phaseEngine.js`](src/lib/phaseEngine.js) | 40 | Pure functions: `computePhaseIndex(elapsedSec, phases, scale)`, `timeToNextPhase(...)`. Pure math, no React. |
| [`src/lib/breathCycle.js`](src/lib/breathCycle.js) | 38 | Pure: `computeBreathFrame(t, br) → {label, scale, countdown}`. Drives the orb visualization. |

---

## 2. Lifecycle today

### 2.1 Entry point — protocol selection

When the user picks a protocol (from home, daily ignition card, command palette, or program card), [`sp(p)`](src/app/app/page.jsx#L611-L631) fires:

```js
function sp(p){
  releaseWakeLock();              // leftover from previous run
  // … cancel all interval refs (iR, bR, tR, cdR, cdVisualTOs) …
  setTs("idle"); setPi(0); setBL(""); setBS(1); setBCnt(0);
  setPostStep("none"); setCheckMood(0); setCheckEnergy(0); setCheckTag("");
  setPreMood(0); setCountdown(0); setCompFlash(false); stopVoice();
  setPr(p); setSl(false); setShowIntent(false);
  setSec(Math.round(p.d*durMult));
  setShowScience(false);
}
```

Then `go()` is called when user taps the timer/start button:

```js
function go(){
  if(actLockRef.current || ts!=="idle" || countdown>0) return;
  unlockVoice();
  if(st.wakeLockEnabled!==false) requestWakeLock();
  document.documentElement.requestFullscreen?.();
  setPostStep("none");
  setPi(0);
  setSec(Math.round(pr.d*durMult));
  setSessionData({...initial counters...});
  startCountdown();   // 3-2-1 ceremony with audio/haptic/voice leads
}
```

After 3-second countdown ([line 583-596](src/app/app/page.jsx#L583-L596)): `setTs("running")` + `sessionStartedAtRef = Date.now()` + `speakNow("Comenzamos. {firstKicker}.")`.

### 2.2 State transitions during running

The interval [`iR`](src/app/app/page.jsx#L444-L470) ticks every second:
- Decrements `sec`.
- Computes `idx = computePhaseIndex(elapsedSec, pr.ph, durMult)` from `phaseEngine`.
- If phase changed (`idx !== pi`): `setPi(idx)` + `speak(phaseKicker)` + `hap("phase")`.
- Computes `nextPhaseInSec = timeToNextPhase(...)` for UI.

A separate interval [`bR`](src/app/app/page.jsx) drives the breath cycle:
- `frame = computeBreathFrame(t, ph.br)`.
- `setBL(frame.label)` + `setBS(frame.scale)` + `setBCnt(frame.countdown)`.
- Triggers `playBreathTick(label, intent)` + `hapticBreath(label)` at phase transitions.

When `sec` reaches 0: `setTs("done")` + `comp()` is invoked.

### 2.3 Audio orchestration

| Trigger | API | Source |
|---|---|---|
| Mount running session | `unlockAudio()`, `requestWakeLock()` | `go()` |
| Running enter | `startAmbient()` or `startSoundscape(ss)`, `startBinaural(intent)` | [`useSessionAudio`](src/hooks/useSessionAudio.js) |
| Running exit | `stopAmbient()`, `stopSoundscape()`, `stopBinaural()` | `useSessionAudio` cleanup |
| Phase change | `speak(kicker, circadian, voiceOn)`, `hap("phase")` | `iR` interval in `page.jsx` |
| Breath tick | `playBreathTick(label, intent)`, `hapticBreath(label)` | `bR` interval in `page.jsx` |
| Pause | `stopVoice()`, `stopBinaural()`, `releaseWakeLock()` | `pa()` |
| Resume | `requestWakeLock()`, `startBinaural(intent)`, `speakNow("continúa")` | `resume()` |
| Reset/cancel | `releaseWakeLock()`, `stopVoice()`, intervals cleared | `rs()` |
| Completion | `playIgnition()`, `hapticSignature("ignition")`, orb collapse | `comp()` |

### 2.4 UI rendering

`<SessionRunner>` at [`page.jsx:917-968`](src/app/app/page.jsx#L917-L968) receives:
```js
<SessionRunner
  show={countdown>0||ts==="running"||ts==="paused"||orbDoneFlash}
  countdown, ts, sec, totalDur, pr, ph, pi, bL, bS, bCnt, isBr, ac,
  totalSessions, sealing, scienceDeep,
  onBiofeedback, onPause, onResume, onReset,
  onCheckpointOpen, onCheckpointResolve, onCheckpointTimeout, onVisibilityLoss,
  reducedMotion, onSparkHit
/>
```

The component renders:
- Countdown ceremony (3-2-1 forming ring + numeral with spring physics).
- BreathOrb (existing) for breath phases.
- Phase kicker text + science note.
- Biofeedback overlay (camera-based PPG via `<SessionBiofeedback>`).
- Anti-cheat checkpoints (hold-press, tap-on-exhale, presence-confirm) at fixed timestamps.
- Pause/Reset controls.
- Ignition flash (post-completion).

### 2.5 Completion path

`comp()` at [`page.jsx:661-726`](src/app/app/page.jsx#L661-L726):
1. Cancel pause timer + cleanup motion detection.
2. `sessionEndedAtRef = Date.now()`.
3. `result = calcSessionCompletion(st, {protocol, durMult, sessionData, nfcCtx, circadian})` — computes vCores, coherence delta, achievement awards.
4. `delta0 = buildSessionDelta(...)` — pre-mood evidence snapshot.
5. `playIgnition()` + `hapticSignature("ignition")` + orb collapse 1600ms.
6. `setSt({...st, ...result.newState})` — merges the completion payload into the store via `setSt` (which schedules persistence and triggers `pushHistory` implicitly via store internals).
7. **Programs check:** if `activeProgram` matches today + protocolId, calls `store.completeProgramDay(...)` and possibly `store.finalizeProgram(...)`.
8. Sets `postStep="breathe"` after the 1.6s orb collapse — opens the post-session check-in flow (mood/energy capture, summary screen).

`submitCheckin()` then ships the session to outbox via `shipSessionToOutbox()` (idempotent guard via `sessionShippedRef`).

### 2.6 Cancellation path

`rs()` at [`page.jsx:610`](src/app/app/page.jsx#L610) is `Reset`:
- Releases wake lock, exits fullscreen.
- Clears all intervals + timeouts.
- Resets all state (`ts=idle`, `pi=0`, `bL=""`, `bS=1`, `bCnt=0`, `postStep=none`, `checkMood/Energy/Tag=0/0/""`, `preMood=0`, `countdown=0`, `compFlash=false`).
- `stopVoice()`, `setPostDelta(null)`, `sessionShippedRef=false`.

A user-initiated cancel during running typically goes through `rs()` directly.

### 2.7 Anti-cheat checkpoints (existing)

The current `SessionRunner` has 3 checkpoint types fired at fixed timestamps per protocol:
- **hold-press:** user holds a button for N seconds.
- **tapExhale:** user taps when on exhale.
- **presence:** user confirms presence (single tap).

Failure → `interactions += 0.25`; success → `interactions += 1`. No gating on session credit — the checkpoints feed `sessionData.interactions` which influences the post-session quality score (`bioQ.quality`) but the session always credits.

---

## 3. Reusable vs Replace

| Module | Verdict | Why |
|---|---|---|
| `phaseEngine.computePhaseIndex` / `timeToNextPhase` | **REUSE** | Pure math. Phase-index logic is unchanged. |
| `breathCycle.computeBreathFrame` / `breathCycleLength` | **REUSE** | Pure math. Used by `BreathOrbExtended` (SP2) internally already. |
| `useSessionTimer` | **REPLACE** | Countdown semantics; SP3 owns time at the act level, not protocol level. |
| `useSessionAudio` | **REPLACE** | Reactive on `timerStatus`; SP3 needs per-act media orchestration. |
| `SessionRunner.jsx` | **REPLACE** | UI shell coupled to the legacy state shape (`bL/bS/bCnt/pi/sec/totalDur`). The SP2 primitives are the new vocabulary. |
| `audio.js` API surface | **REUSE** | All 47 exports remain stable; new hook calls them. |
| `comp()` / `submitCheckin()` / `shipSessionToOutbox()` | **REUSE** | Post-session flow is sound. SP3 just needs to invoke `comp()` at completion. |
| `rs()` reset | **REUSE** | Cancel path is sound. SP3's `onCancel` invokes it. |

---

## 4. Integration plan for SP3

The cleanest integration:

1. Build `useProtocolPlayer(protocol, opts)` hook that owns: act-level state machine, validation, internal time, audio orchestration, signal collection from primitives.
2. Build `<ProtocolPlayer protocol={...} onComplete={...} onCancel={...} />` component that mounts the hook and renders the active primitive via `PrimitiveSwitcher`.
3. In `page.jsx`, replace the `<SessionRunner>` mount with `<ProtocolPlayer>`. The mount condition `countdown>0||ts==="running"||ts==="paused"||orbDoneFlash` becomes simpler: mount when `ts==="running"||ts==="paused"`. The countdown ceremony moves INSIDE the player as an internal pre-start phase (or remains in `go()` upstream and the player starts directly).
4. `onComplete(sessionData)` from the player → `comp()` runs, with `sessionData` augmenting the existing `sessionData` state for downstream evidence + bandit weighting.
5. `onCancel()` → `rs()`.
6. Mark `SessionRunner.jsx`, `useSessionAudio.js`, `useSessionTimer.js` deprecated — keep file present, comment header marks @deprecated, removed in cleanup post-Phase-4.

The countdown ceremony (3-2-1) lives in `go()` in `page.jsx` today. SP3 keeps that there (it's protocol-agnostic ritual). After countdown, `setTs("running")` triggers the `<ProtocolPlayer>` to mount and `start()` the player.

The post-session flow (`postStep="breathe"` → mood check-in → `submitCheckin()` → `shipSessionToOutbox()`) remains in `page.jsx`. SP3 doesn't touch it.

---

## 5. Risk register

| Risk | Mitigation |
|---|---|
| Breaking the protocol path = breaking the entire app's primary feature | Build `<ProtocolPlayer>` first, smoke-test in isolation, only then swap the SessionRunner mount. |
| Existing `pr/pi/sec/ts/bL/bS/bCnt` state references in 30+ places in page.jsx | Keep that legacy state alive (so sibling components keep working). The player consumes `pr` for the protocol identity. The other fields stop being authoritative for the running-session UI but remain populated for backward compat with mood-halo, theme triggers, etc. |
| Anti-cheat checkpoints + biofeedback overlay (in current SessionRunner) | These are not migrated in SP3. Documented as scope-deferred. The new validation is **per-act** via primitives (HoldPressButton, BilateralTapTargets, etc.), which is a stronger replacement. |
| Tests that reference `useSessionTimer` and `useSessionAudio` | Tests stay green because the hooks remain exported (just deprecated). |
| Audio start/stop ordering during transitions | Hook orchestrates strictly: `start()` → unlock + wakelock + binaural; act transitions → per-act media; `stop()` → release wakelock + stop binaural. Same as today, just centralized. |

---

## 6. What's NOT in SP3 (deferred)

- Migrating individual protocols to multi-act `iExec` schemas with `validate/ui/media` (SP4-SP8).
- Camera-based PPG biofeedback overlay (currently in `<SessionBiofeedback>`). The `optional_capture.ppg` hook exists in the schema; integration is post-Phase-4.
- The post-session breathe / mood-summary flow in `page.jsx` (already works).
- Anti-cheat checkpoint timing system from the legacy `SessionRunner` (replaced by per-act primitive validation).
