# FINAL_DOMAIN_INTELLIGENCE.md — Inteligencia del motor neural post-Phase 2

**Fecha:** 2026-05-01.

---

## 1. Capacidades del motor — qué decide y cómo

### 1.1 Selección de protocolo (bandit UCB1-Normal contextual)

**Inputs:**
- `intent` deseado (calma/enfoque/energía/reset)
- `timeBucket` actual (morning/afternoon/evening/night)
- Estado del bandit per-user (`banditArms`)
- Cohort prior org-level (k-anon ≥5) — opcional

**Mecanismos:**
- UCB1-Normal con prior poblacional (`priorMean=0.3`, `priorN_virtual=1`) — cold-start no-aleatorio.
- Decay dual:
  - Por observación: factor `0.97` al actualizar (vida media ~33 obs).
  - Por tiempo: half-life 30 días, floor 0.10 (lazy-on-read).
- **NUEVO Phase 2 (S4.3):** tie-breaking diversity — cuando múltiples candidatos empatan en score (cold-start típico), random pick uniforme. Devuelve `tied: N` para observabilidad.

**Reward:**
- `compositeReward({moodDelta, energyDelta, hrvDeltaLnRmssd, completionRatio})`
- Pesos: mood ×1.0, energy ×0.3, HRV ×1.5
- `completionRatio` factor `0.5 + 0.5 × ratio`
- **NUEVO Phase 2 (S4.2):** si `moodDelta` ausente pero HRV válido → infer reward desde HRV. Type-strict para evitar bug `Number(null)===0`.

### 1.2 Calibración predictiva (residuales)

- `logResidual(state, {predicted, actual, armId})` — ventana 100 entries.
- `calibration(state)` — bias/MAE/RMSE global.
- `calibrationByArm(state)` — bias per-protocolo (n≥5).
- `calibratePrediction(state, raw, {armId})` — ajusta predicción restando bias (per-arm si suficiente, else global).
- **NUEVO Phase 2:** residuales solo se loggean si hay mood real (no contaminar con HRV inferido).

### 1.3 Cold-start prior bayesiano

- `getColdStartPrior({chronotype, intent, now, sessionsCount, cohortPrior})`:
  - Hora subjetiva (chronotype-shifted).
  - Bucket 3h × intent → delta literatura.
  - Blend con cohort prior si presente.
  - `priorWeight(sessionsCount)` decay lineal a 0 cuando ≥5 sesiones.
- `BASELINE_BY_BUCKET` con citas Cajochen 2007 / Roenneberg 2007 / Schmidt 2007.

### 1.4 Cohort prior (org-level)

- `computeCohortPrior(sessions, {kmin:5})` agrega sesiones de un org → tabla `bucket × intent → {delta, n, distinctUsers}`.
- `blendBaselineWithCohort(literatureDelta, cohortCell)` — ramp lineal 0..30 muestras.
- Endpoint `/api/v1/me/neural-priors` devuelve para que cliente blendee.

### 1.5 Staleness detection (Sprint 42)

- 5 niveles: `fresh / active / cooling / stale / abandoned`.
- `dataConfidence ∈ [0..1]` por nivel — pondera datos personales viejos.
- `recalibrationGuidance(staleness)` genera copy UX + sugiere intent seguro por hora.
- `sampleAgeWeight(sampleTs)` decay exponencial half-life 21d.

### 1.6 Pause-fatigue (Sprint 50)

- 3 señales en últimas 5 sesiones:
  - Partial ratio (≥0.3 mild, ≥0.5 severe)
  - Avg pauses (≥2 mild, ≥4 severe)
  - Hidden time ratio (≥0.20 mild, ≥0.40 severe)
- Severe → fuerza `primaryNeed` a `["calma", "reset"]`.
- Aplica `difficultyPenalty` a protocolos high-dif.

### 1.7 Anti-gaming v2 (Sprint 45)

- 5 señales con scoring 0-100, thresholds suspicious≥30 / likely≥60:
  - RT variance (CV humano 0.10-0.50)
  - Touch hold uniformity (variance ≤0.005 sec²)
  - Time-of-day entropy (low <0.5 nats, high >2.5)
  - BioQ distribution (variance ≤50 con quality<50)
  - Duration variance (uniformity penalty)
- **Gap conocido (no resuelto Phase 2):** consequence es silent — penalty a credibility del brazo. Para B2B debería notificar al admin agregado k-anon.

### 1.8 Engine health introspección per-user

`evaluateEngineHealth(state)` devuelve snapshot:
- `dataMaturity` (cold-start <5 / learning <20 / personalized).
- `staleness` + `recalibrationNeeded` + `dataConfidence`.
- `fatigue.level` (none/mild/severe).
- `predictionAccuracy` (value, meanError, hitRate, status).
- `recommendationAcceptance` (value, diversity, qualityRate, status).
- `personalizationStrength` (value, signals, weakRisk, status).
- `overall` verdict: `healthy / operational / cold-start / stale / fatigued / calibrating / underperforming`.
- `actions[]` lista de hints accionables.

**NUEVO Phase 2:** ahora expuesto vía `/api/v1/me/neural-health` (antes inerte).

### 1.9 Org neural health agregado

`computeOrgNeuralHealth(users)` (k-anon ≥5):
- Maturity distribution (cold-start / learning / personalized %).
- Staleness distribution (fresh/active/cooling/stale/abandoned).
- Top protocols org-wide.
- Verdict (`at-risk / mature / early / developing`).
- Actions sugeridas accionables.

`computeProtocolEffectiveness(sessions)` (k-anon ≥5 distinct users):
- Por protocolo: count, distinctUsers, moodDelta promedio, stdev, sampleSize, **CI95 lower/upper, Cohen's d con effectSize label, significant flag, hitRate** (Sprint 52).
- Coherencia delta promedio si ≥3 muestras.
- Suprime celdas con k<5.

**NUEVO Phase 2:** ahora expuesto vía `/api/v1/orgs/[orgId]/neural-health` (antes inerte).

---

## 2. Protocolos (20 totales)

**14 active** (recomendación diaria default):
1. Reinicio Parasimpático (calma, 120s) — box breathing 4-4-4-4
2. Activación Cognitiva (enfoque, 120s) — coherencia 6-2-8 + affect labeling
3. Reset Ejecutivo (reset, 120s) — 1:3 ratio + Eisenhower
4. Pulse Shift (energia, 120s) — bilateral motor
5. Skyline Focus (enfoque, 120s) — visión panorámica
6. Grounded Steel (calma, 120s) — postura erguida
7. HyperShift (reset, 120s) — percusión vagal
8. EMDR-style (no detallado en mi audit; protocol 8)
9. Diaphragm Breath (no detallado)
10. Atomic Pulse (energia)
11. Quantum Grounding (integración)
12. Vertical Rise (integración/ascenso)
13. OMEGA (síntesis 6 modalidades)
14. OMNIA (síntesis 3 sistemas sensoriales)

**3 training** (10 min, dentro de programs o elección manual):
15. Suspiro Fisiológico (Stanford 2023 Cell Reports Medicine, Balban et al.)
16. Resonancia Vagal (5.5 rpm, Lehrer & Gevirtz 2014)
17. NSDR/Yoga Nidra (Kjaer 2002 +65% dopamina)

**3 crisis** (acceso explícito botón crisis, NO recomendados automáticamente):
18. Emergency Reset — TRE + vocalización + grounding
19. Panic Interrupt — Mammalian Dive Reflex + jumping jacks + vocalización
20. Block Break — Power Pose + saltos + isometric

Cada protocolo tiene fases con duración, instrucción narrativa, scripts iExec con timestamps, breath cycles configurables, citation científica (`sc` field), seguridad/contraindicaciones (campo `safety`), y variantes contextuales (`variants`: noWater, seated, silent, etc).

---

## 3. HRV pipeline

### Dual-path:
- **BLE strap** (`ble-hrv.js`) — IBIs desde HR monitors estándar.
- **Camera PPG** (`hrv-camera/*`) — video RGB 30FPS:
  - `capture.js` — extrae rojo dedo
  - `filter.js` — bandpass 0.7-4Hz + detrending + z-score
  - `peaks.js` — slope change + prominence + refractory + adaptive threshold
  - `sqi.js` — score 0-100 (periodicity 35% + ectopic 25% + prominence 25% + coverage 15%) → bandas excellent/good/marginal/poor
  - `metrics.js` — RMSSD, SDNN, pNN50, lnRMSSD según Task Force ESC 1996
  - `validation.js` — Malik 20% rule outliers, fisiológico 300-2000ms

### Sólido para HRV daily-use (time-domain). Gaps:
- Sin frequency-domain (LF/HF) — requiere >5min + Welch FFT.
- `expectedHrBpm=70` hardcoded en SQI coverage. Usuario taquicárdico ve mediciones rechazadas falsamente.
- Luz ambiental variable → drift sin re-baseline intra-sesión.

---

## 4. Audio + haptics + voz

### Audio engine (`src/lib/audio.js` 1646 líneas)
- **Binaural beats**: carrier ~200Hz, delta interaural delta/alpha/beta.
- **Music bed** ambient sincronizado con fase.
- **Voice TTS** Web Speech API con preferencia user, rate 0.5-1.5×, modulación circadiana.
- **Haptic patterns** Vibration API con `intensity` multiplier (light 0.6× / strong 1.4×).
- iOS audio unlock helper.

### Limitaciones:
- TTS Web Speech robótica, no cross-browser uniforme. Mejor: Eleven Labs / Cartesia server-streamed (latencia/costo/privacy tradeoff).
- iOS audio unlock falla si primer gesto no es el orb.

---

## 5. NOM-035 STPS Guía III

### Schema:
- 72 ítems Likert 0-4
- 10 dominios (condiciones, carga, falta_control, jornada, interferencia, liderazgo, relaciones, violencia, reconocimiento, pertenencia)
- 5 categorías (ambiente, actividad, tiempo, liderazgo, entorno)
- 5 niveles de riesgo (nulo, bajo, medio, alto, muy_alto)

### Pipeline:
- `scoreAnswers(answers)` puro server-side (Phase 2 confirmado: server recomputa, no acepta cliente).
- `aggregateScores(responses, {minN:5})` k-anon ≥5.
- `protocolBias.js`: cada dominio mapea a intent + weight (e.g., `violencia → calma 1.0 urgent`).
- `applyBiasToScore` inyecta en scoring del bandit.

### **NUEVO Phase 2 (S1.7):**
- `computeNom35ItemsHash()` SHA-256 hash de canonical form (id|text|dominio|reverse).
- `NOM35_ITEMS_HASH_EXPECTED = "70fab3d724534f63f2e2b16717fa4128551586c322a990fe0756fc154e06eb17"`.
- Test asegura match → cualquier edición del texto requiere bumping deliberado.
- `nom035TextValidatedByLawyer = false` exportado constante. Reportes oficiales DEBEN mostrar disclaimer hasta que un humano con review legal lo flippee a `true`.

---

## 6. Audit chain

- `auditLog({orgId, action, ...})` per-row con SHA-256 + HMAC seal usando `AUDIT_HMAC_KEY`.
- Advisory lock per-org `pg_advisory_xact_lock(orgLockKey(orgId))`.
- **NUEVO Phase 2 (S3.4):** `verifyChain` streamed cursor 5K rows — escala a millones de entries sin OOM.
- **NUEVO Phase 2 (S3.2):** `exportChain(orgId, {sinceId, pageSize})` cursor por id, NDJSON serialization (BigInt-safe), SHA-256 manifest, route a S3 Object Lock COMPLIANCE si configurado, fallback filesystem stub. `exportChainAll(orgId)` drena en chunks.
- Cron `audit-export` diario 03:30 UTC.

---

## 7. Storage cliente (PWA)

- IndexedDB AES-GCM 256 + localStorage fallback (Sprint 80 fix: shadow plain eliminado).
- BroadcastChannel cross-tab sync (Sprint 80).
- Outbox UUID-forced.
- Migración versionada (v14 actual).

---

## 8. Sync merge

`mergeNeuralState` (server-side):
- TS_LOGS por `ts` (history, moodLog, hrvLog, etc.).
- MAX_COUNTERS por `Math.max` (totalSessions, vCores, bestStreak, totalTime).
- SET_UNIONS por `new Set` (achievements, favs).
- CAPS por slice.
- Trade-offs documentados (banditArms drift cross-device, counters reconciliados en cliente).

---

## 9. Coach LLM (Anthropic)

### Endpoint vivo `/api/coach`:
- CSRF + auth + **Phase 2 MFA gate** + rate-limit 60/min + **Phase 2 quota mensual hard-cap**.
- 50 messages max, 4000 chars/turn.
- Streaming SSE.
- **Phase 2:** modelo elegido por plan (Haiku FREE, Sonnet PRO+, Opus opt-in ENTERPRISE).
- **Phase 2:** prompt cache `{type: "ephemeral", ttl: "1h"}` (vs 5min antes — ahorro 60-80%).

### Safety library (`coachSafety.js`):
- CRISIS_PATTERNS (suicida, auto-daño, "kill myself", "suicide", etc.)
- SOFT_PATTERNS ("no puedo más", "colapsado", "hopeless", etc.)
- PHQ-2 ≥3 trigger
- PSS-4 sostenido alto trigger
- Mood colapsado (≥3 entradas mood ≤2 en 7 días) trigger
- Resources por locale (es_MX SAPTEL, es Esperanza, en 988 + Crisis Text Line, default findahelpline)
- Levels: `none / soft / crisis` con recommendations `continue / offer_support / refer_human`

### Memory (`coachMemory.js`):
- `buildCoachContext(state)` agrega lastSession, recentIntents, favoriteProtocols, worstProtocols, moodTrajectory, instruments latest, chronotype, resonanceFreq.
- Cliente-only (privacy by design — no se persiste en server).

### Weekly LLM digest (NUEVO Phase 2):
- Cron `weekly-summary` lunes 14:00 UTC.
- Por user activo (sesión ≥1 en 7d), agrega stats agregados (sessionCount, topIntent, avgMoodDelta, totalMinutes).
- Llama Claude Haiku 4.5 con prompt fijo "3 frases, cálido, accionable, micro-acción próxima semana".
- Encola push notification con resumen.

---

## 10. Inteligencia que YA está expuesta al frontend (post-Phase 2)

| Capacidad | Endpoint | Antes Phase 2 | Después |
|---|---|---|---|
| Engine health per-user | `/api/v1/me/neural-health` | ❌ inerte | ✅ vivo |
| Cohort prior org | `/api/v1/me/neural-priors` | ✅ ya existía | ✅ |
| Org neural health agregado | `/api/v1/orgs/[orgId]/neural-health` | ❌ inerte | ✅ con CI95 + Cohen's d |
| Coach LLM streaming | `/api/coach` | ✅ | ✅ + plan-tiered + quota |
| Weekly Haiku digest | push notification | ❌ no existía | ✅ cron lunes |

---

## 11. Datos NO expuestos todavía (Phase 3+ oportunidades)

| Dato | Dónde vive | Oportunidad |
|---|---|---|
| `calibrationByArm` bias per protocolo | `residuals.js` | gráfica "Predicción vs realidad" del motor |
| `topArms` con CI 90% | `bandit.js armCI` | "Tu intent ganador esta semana" reporte |
| `pause-fatigue` + `staleness` recalibration | `pauseFatigue.js`, `staleness.js` | banner home "han pasado X días, recalibrar" |
| `coachContext` raw | `coachMemory.js` | "Lo que el coach sabe de ti" (transparency) |
| `WebhookDelivery` retry histogram | `WebhookDelivery` rows | `/admin/webhooks/[id]` analytics |
| `IncidentSubscriber` reach | `IncidentSubscriber` filtros | preview "esto notificará a N personas" |

---

## 12. Datos de intelligence aún NO capturables (limitaciones)

- HRV/mood/instrumentos viven en `User.neuralState` JSON, no tablas SQL queryables. Esto bloquea queries B2B agregadas eficientes ("avg HRV de tu equipo last 30d"). Solución pendiente: `HrvSample`, `MoodSample` tablas con dual-write (Sprint 6+).
- Sin frequency-domain HRV (LF/HF). Solución pendiente: añadir Welch FFT en hrv-camera/.
- Sin re-test de chronotype por drift. Solución pendiente: detectar respuesta circadiana del user que contradice MEQ-SA declarada.
- Coach memory no longitudinal cross-device. Solución pendiente (Sprint 6+): persistir resúmenes encriptados con KMS-wrapped DEK.

---

## 13. Veredicto inteligencia post-Phase 2

El motor neural era ya rico antes (bandit + cohort + residuals + cold-start + staleness + fatigue + anti-gaming + engine-health). El gap principal era **frontend NO expuesto**. Phase 2 cierra parcialmente:

✅ Engine health + Org health endpoints existen ahora.
✅ Reward inferencia HRV recupera ~30-50% sesiones perdidas para el bandit.
✅ Coach con plan-tiered + quota + cache 1h.
✅ Weekly Haiku narrative summary (LLM real, no marketing).

⚠️ Calibration bias gráfica, top-arms reporte, transparency del coachContext, y otros queries de inteligencia siguen sin UI dedicado — **es el trabajo de la reconstrucción frontend** consumir lo que ya está en libs.

⚠️ Datos en JSON (no SQL tablas) limita B2B agregados eficientes — Sprint 6+.

El motor está listo para ser **expuesto al usuario en una UI honesta y transparente** que lo presente como "instrumento con recibos" en lugar de "caja negra mágica".
