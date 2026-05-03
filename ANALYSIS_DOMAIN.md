# ANALYSIS_DOMAIN.md — Inteligencia del motor neural

**Fecha:** 2026-05-01 · **Reglas:** señal real sobre marketing · honestidad brutal.

---

## 1. Adaptive engine — Bandit UCB1-Normal contextual

**Arquitectura:** UCB1-Normal con contexto `intent × timeBucket`. Cada brazo es una tupla `intent:bucket` con estadísticas incrementales (`n`, `sum`, `sumsq`, `lastUpdatedAt`) de la recompensa observada.

**Mecanismos avanzados:**
- **Prior poblacional** (`src/lib/neural/bandit.js:23-25`): `priorMean=0.3`, `priorN=1`. Brazos cold-start no devuelven `+Infinity` y no son aleatorios.
- **Decay dual** (Sprint 47):
  - Por observación: factor `0.97` al actualizar — vida media ~33 obs.
  - Por tiempo lazy-on-read: half-life 30d, floor 0.10. `decayByTime(arm, now)` aplica al leer; preserva `lastUpdatedAt`.
  - **Sólido:** maneja entornos no-estacionarios + cambio de rutina sin borrar memoria.
- **Recompensa compuesta** (`compositeReward`): `mood × 1.0 + energía × 0.3 + lnRMSSD × 1.5`, multiplicado por `(0.5 + 0.5 × completionRatio)`. Sesiones abandonadas penalizan.
- **Selección contextual** (`selectArm`): busca brazo `intent:bucket`; fallback a brazo sin bucket.
- **Snapshot UI** (`topArms`, `armCI`): top-k brazos con CI 90% (t≈1.86) — explica al usuario qué intent funciona mejor.

**Calidad:** matemática sólida, implementación cuidadosa. Documenta decay con referencias (Auer/Cesa-Bianchi/Fischer 2002, Garivier & Moulines 2008).

**Gaps reales:**
- Si `mood_post` no se reporta → `compositeReward = null` y el brazo no actualiza. Pérdida de señal silenciosa. Podría inferir reward desde Δ HRV cuando hay HRV pre/post pero no mood-post.
- `banditArms` viven solo en `User.neuralState` JSON cliente; el server **no los recompute ni los protege**. Si el cliente envía `banditArms` adversariales, el server los persiste tal cual. Bajo riesgo (per-user, no cross-tenant), pero limita la confianza.
- Buckets temporales son discretos (4 ventanas). Transiciones 11:59→12:00 cambian recomendación.
- No detecta sesiones que el usuario abandona en segundos vs sesiones reales — `completionRatio` mitiga, no resuelve.

---

## 2. Cohort priors (Sprint 48)

**Innovación real:** `computeCohortPrior(sessions, {kmin:5})` agrega sesiones de un org a tabla `bucket × intent → {delta, n, distinctUsers}`. K-anonymity ≥5 usuarios distintos por celda.

`blendBaselineWithCohort(literatureDelta, cohortCell)` mezcla literatura cronobiológica con datos del org via ramp lineal: 0 muestras → 100% literatura, ≥30 muestras → 100% cohort.

**Importancia:** transforma "el motor predice según literatura genérica" en "el motor predice según el ritmo real de tu equipo". Es la pieza que justifica el pricing B2B en serio.

**Gap:** la API que entrega el cohort prior al cliente es `/api/v1/me/neural-priors`. Confirmar (ver agent A) si existe y si está expuesta. Si no, el cohort prior está construido pero **inerte**.

---

## 3. Predicción + residuales (Sprint 41)

**`logResidual` + `calibrationByArm`:** registra `(predicted, actual, armId)` por sesión, ventana 100, calcula bias/MAE/RMSE global y per-arm. **`calibratePrediction(rawPrediction)`** ajusta prediction substraendo bias (per-arm si n≥5, else global). Es real bias-correction online.

**Gap:** los residuales se calculan client-side desde `recordSessionOutcome`. El server NO valida ni recompute. La UI muestra "predictedDelta calibrated" pero el cliente puede falsear residuales para sesgar predicciones futuras (limitado a self-harm).

---

## 4. Cold-start prior bayesiano

`getColdStartPrior({chronotype, intent, now, sessionsCount, cohortPrior})`:
1. Calcula hora subjetiva del usuario (chronotype-shifted).
2. Bucket de 3h → intentMap → delta literatura.
3. Blend con cohort prior si disponible.
4. Pondera con `priorWeight(sessionsCount)` que decae lineal a 0 cuando sessionsCount≥5.

**`BASELINE_BY_BUCKET`** está hardcoded con valores defendibles (energía pico 9-12h subjetivo, calma pico 18-23h, post-prandial dip 12-15h). Citas internas a Cajochen 2007 / Roenneberg 2007 / Schmidt 2007.

**Gap:** los priors son frozen y no se actualizan. Cuando un org acumula data, el cohort prior reemplaza pero la "literatura baseline" no cambia. Si la evidencia clínica evoluciona, hay que editar código.

---

## 5. Staleness detection (Sprint 42)

5 niveles: `fresh / active / cooling / stale / abandoned`. Cada nivel tiene `dataConfidence ∈ [0..1]` que ponderan datos personales viejos vs cold-start prior.

`recalibrationGuidance(staleness)` genera copy UX + sugiere intent seguro por hora. **`sampleAgeWeight(sampleTs, nowMs)`** decay exponencial por muestra con half-life 21d, floor 0.10 — usado en `weightedAvg` para sensibilidad ponderada por antigüedad.

**Sólido.** Cita Lima 2018 (retornos a programas) y Wood & Rünger 2016 (habit theory 21d).

---

## 6. Pause-fatigue detection (Sprint 50)

Detecta tres señales en últimas 5 sesiones:
- Ratio de partial sessions (`mildPartialRatio=0.3`, `severePartialRatio=0.5`).
- Pausas promedio (`avgPausesMild=2`, `avgPausesSevere=4`).
- Hidden time ratio (`hiddenRatioMild=0.20`, `hiddenRatioSevere=0.40`).

Severe → fuerza primaryNeed a `["calma", "reset"]`. Aplica `difficultyPenalty` a protocolos high-dif.

**Bien diseñado** — captura señal de bienestar real (fatiga acumulada, mismatch protocolo-contexto) y responde reduciendo dificultad sin esconder al usuario.

---

## 7. Anti-gaming v2 (Sprint 45) — multi-signal scoring

5 señales con scoring 0-100, thresholds suspicious≥30 / likely-gaming≥60:

| Señal | Mide | Penalty |
|---|---|---|
| RT variance | CV humano 0.10-0.50 | 25 fuera de banda |
| Touch hold | Variance ≤0.005 sec² | 20 si uniforme |
| Time-of-day entropy | Distribución horaria | 15 baja, 10 alta, +5 horarios implausibles 02-04 |
| BioQ distribution | Variance ≤50 con quality<50 | 15 |
| Duration variance | CV<3sec | 15 |

**Gap real:** la consecuencia es **silenciosa** — penalty al credibility del brazo, sin notificar al usuario ni al admin. Detección sofisticada sin escalada accionable. Para B2B serio (compliance) podría:
- Notificar al admin "X% del org muestra señales de gaming" (k-anon ≥5).
- Soft cap en daily reward si gaming detected (vs hard block).

---

## 8. Engine health introspección (Sprint 40)

`evaluateEngineHealth(state)` devuelve snapshot evaluable per-user con:
- `dataMaturity`: cold-start / learning / personalized (5 / 20 sesiones).
- `staleness` + `recalibrationNeeded` + `dataConfidence`.
- `fatigue.level` (none / mild / severe).
- `predictionAccuracy.{value, meanError, hitRate, sampleSize, status}`.
- `recommendationAcceptance.{value, diversity, qualityRate, status}`.
- `personalizationStrength.{value, signals, weakRisk, status}`.
- `overall`: `healthy / operational / cold-start / stale / fatigued / calibrating / underperforming`.
- `actions`: lista de hints accionables al operador.

**Pieza realmente innovadora.** El motor se autoevalúa y emite acciones. Probablemente NO está expuesto al usuario en la UI actual — confirmar en `/admin/neural` y `/settings/neural`.

`computeOrgNeuralHealth` (lib/neural/orgHealth.js) hace lo mismo a nivel org: maturity buckets, staleness distribution, top protocols org-wide, verdict (`at-risk / mature / early / developing`), actions sugeridas (lanzar campaña re-engagement, ajustar reminders push, etc). K-anon ≥5.

---

## 9. NOM-035 STPS — Guía III completa

- **72 ítems** Likert 0-4 (`items.js:5,42`).
- **5 categorías:** ambiente / actividad / tiempo / liderazgo / entorno.
- **10 dominios** mapeados a categorías.
- `scoreAnswers(answers)` puro, suma con reverse weighting; `aggregateScores(responses, {minN:5})` agrega org-wide con k-anon.
- `protocolBias.js`: cada dominio mapea a intent + weight (`condiciones→calma 0.3`, `carga→reset 0.7`, `violencia→calma 1.0 urgent`). `applyBiasToScore` da +bias×20 si protocolo matchea, -bias×10 si no. Se inyecta en el scoring del bandit.

**Server recomputa scoring** (`responses/route.js:63`) ✓. Audit anterior decía cliente — falso.

**Gaps:**
- `aggregate/route.js` sin filtro de fecha → escala mal. Agregar `?from=...&to=...`.
- Texto literal del DOF "debe validarse antes de imprimir actas" (comentario explícito en items.js). Ítems están con redacción razonable pero un audit STPS exigirá copia exacta del DOF — riesgo legal si se imprimen actas oficiales sin verificación.

---

## 10. HRV pipeline (BLE + cámara PPG)

**Dual-path:**
- BLE strap (`ble-hrv.js`): IBIs desde HR monitors estándar.
- Camera PPG (`hrv-camera/*`): video RGB 30FPS, bandpass 0.7-4Hz, peak detection con prominence + refractory period, SQI 0-100 (periodicity + ectopic + prominence + coverage), métricas RMSSD/SDNN/pNN50/lnRMSSD según Task Force ESC 1996, Shaffer & Ginsberg 2017.

**Sólido para HRV daily-use:** time-domain solo, sin LF/HF (requiere >5min + Welch FFT). `lnRMSSD` para inferencia estadística — correcto vs. RMSSD log-normal.

**Gaps científicos:**
- PPG vs ECG referencia: RMSSD de PPG puede subestimar 5-15% (Shaffer 2017). El usuario no ve esto.
- Sin frequency-domain → no diferencia simpático vs parasimpático balance (LF/HF). Útil para readiness/stress; doable con >5min mediciones.
- `expectedHrBpm=70` hardcoded en SQI coverage. Usuario taquicárdico (100 BPM) puede ver mediciones rechazadas falsamente.
- Luz ambiental variable → drift; no hay re-baseline intra-sesión.
- Sin detección de iluminación insuficiente (asume well-lit).

---

## 11. Audio engine

`src/lib/audio.js` (1646 líneas) implementa:
- **Binaural beats** carrier ~200Hz, delta interaural delta/alpha/beta.
- **Music bed** ambient sincronizado con fase.
- **Voice TTS** Web Speech API con preferencia de voz, rate 0.5-1.5×, modulación circadiana de pitch/rate.
- **Haptic patterns** Vibration API con `intensity` multiplier.
- iOS audio unlock helper.

**Gaps documentados:**
- Web Speech API es robótica, no cross-browser uniforme. Mejor: Eleven Labs / Cartesia / OpenAI TTS server-streamed (con tradeoff de latencia + costo + privacy).
- Binaural sin audiogram check — asume normoacusia.
- Music sync con BPM user/coherencia cardíaca **no claro**.
- iOS audio unlock falla si el primer gesto del user no es el orb.

---

## 12. Audit chain — sólido

SHA-256 + HMAC-SHA-256 seal, advisory lock per-org (`pg_advisory_xact_lock(orgLockKey(orgId))`). Hash determinístico de orgId a int64, colisiones despreciables.

**Una nota crítica detectada:** `src/server/audit-export.js:13` hace `db().auditLog.findMany(...)` **sin await** sobre `db()` que retorna Promise. **Probable bug:** el script de export puede que no funcione en runtime. Revisar y arreglar.

S3 Object Lock para WORM **es placeholder explícito** (línea 25-28). En prod requiere AWS SDK PutObject implementado. Comentario lo admite. Para un claim "SOC2 Type II" necesita estar implementado.

---

## 13. Storage cliente

- IndexedDB AES-GCM 256 + localStorage fallback.
- Sprint 80 fix: shadow plain eliminado.
- BroadcastChannel cross-tab.
- Outbox UUID-forced.
- `clearAll` limpia todo + sync-token.

Sólido. Una de las piezas mejor cuidadas.

---

## 14. Sync merge

`mergeNeuralState`: TS_LOGS por `ts`, MAX_COUNTERS por `Math.max`, SET_UNIONS por `new Set`, CAPS por slice. Documenta trade-offs (banditArms drift conocido, counters reconciliados en cliente). Sólido.

---

## 15. Inteligencia que NO está expuesta al usuario

Lista priorizada — **éstas son oportunidades para Fase 2/3 sin necesidad de datos nuevos**:

1. **`evaluateEngineHealth`** per-user — detecta stale, fatigado, underperforming. Probablemente solo expuesto en `/admin/neural` (operador), no al usuario final. Podría dar al usuario un "estado de tu motor" comprensible: "El motor sigue aprendiendo (cold-start, 2/5 sesiones)".
2. **`calibrationByArm`** — bias correction per protocolo. El usuario puede ver "el motor predijo +0.8 pero observó +0.3" como **gráfica de calibración**.
3. **`computeProtocolEffectiveness`** (org-level) — Cohen's d, CI95, hit rate, `effectSize: large/medium/small/trivial`, `significant: true/false`. Reporte "qué protocolos realmente funcionan en tu equipo" con estadística de inferencia. Pieza B2B premium.
4. **Cohort prior** — "Tu equipo responde mejor a calma a las 18-21h (n=42, distinctUsers=7)" sin necesidad de mostrar PII.
5. **`detectGamingV2`** — al admin como "X% señales sospechosas, último episodio: hace N días". Sin nombrar usuarios.
6. **`pauseFatigue`** + `staleness` recalibration — guidance personalizado al usuario en home: "han pasado 14 días, hagamos sesión corta para recalibrar".
7. **`computeOrgNeuralHealth`** + actions — el operador B2B ve verdict + acciones recomendadas (re-engage, ajustar cadencia, etc).
8. **`coachMemory.buildCoachContext`** — todo el contexto rico que se le pasa al LLM nunca se le muestra al usuario. Una vista "lo que el coach sabe de ti" desbloquea trust + control.
9. **Predicted delta + lower/upper band con CI** — ya se calcula en `priorPredictionShape`. Mostrar la banda al usuario: "esperamos +0.6 a +1.8 mejora de mood".

---

## 16. Gaps de inteligencia (oportunidades reales)

**Prioridad alta (datos disponibles, falta wiring):**

A. **Reward inferencia desde Δ HRV cuando mood-post ausente.** Hoy se pierde la sesión entera para el bandit.
B. **Cohort prior endpoint expuesto** (`/api/v1/me/neural-priors`) — confirmar y wire en cliente.
C. **Promote `HrvSample` y `MoodSample` a tablas dedicadas** — desbloquea queries B2B en SQL eficientes.
D. **Engine health al usuario** — exponer el snapshot via `/api/v1/me/neural-health` consumido por la PWA.
E. **Org neural health en `/admin/neural`** — actions + verdict + protocol effectiveness con CI95.

**Prioridad media:**

F. **`coachContext` viewer** para usuario (transparency).
G. **Cohort drift detection** — cuando el cohort prior se aleja significativamente del literature baseline, alertar.
H. **Multi-intent programs** — programas que mezclan intent (reset → enfoque → calma) en una semana, no monolíticos.
I. **Frequency-domain HRV** (LF/HF) en sesiones largas (resonancia >5min).
J. **Chronotype drift** — re-test MEQ-SA si la respuesta circadiana del usuario sostenidamente contradice el chronotype declarado.
K. **HR-aware SQI coverage** — estimar HR mean primero antes de aplicar `expectedHrBpm` threshold.

**Prioridad baja:**

L. **TTS server-streamed** (ElevenLabs/Cartesia) — costo + latencia + privacy tradeoff serio.
M. **Audiogram simple antes de binaural** — gating si no hay percepción audible diferencial.

---

## 17. Bugs latentes / desafíos científicos

**Bugs:**

1. `src/server/audit-export.js:13` — falta `await db()`. Probablemente roto.
2. `BACKEND_AUDIT.md` afirma 46 ítems NOM-035 — falso, son 72.
3. `selectArm` fallback a brazo sin bucket si bucket vacío — puede saltear intent-matching si el fallback es de otro intent.
4. `expectedHrBpm=70` hardcoded en SQI coverage.
5. `compositeReward = null` cuando mood-post ausente → señal perdida.
6. Programs `programDay` legacy (Sprint 77) deprecated pero código sobrevive.

**Desafíos científicos:**

1. **Placebo HRV**: cierre ocular + respiración guiada → mejora subjetiva sin fisiología pura. Mood deltas se confunden con efecto expectativa.
2. **Mood pre captura**: timing imperfecto. EMA random podría ser más limpio.
3. **Burnout MBI mapping**: `burnout.js` cita MBI-GS pero usa proxies 1D (mood trend = exhaustion). No es MBI validado.
4. **HRV norms**: lnRMSSD asume distribución normal — log-normal sería más correcto.
5. **Cold-start priors**: literatura 2007. Evidencia 2020+ podría refinar.

---

## 18. Veredicto

- **Bandit + cohort + residuals + staleness + pause-fatigue + anti-gaming v2 + engine-health = núcleo de IA real**, no es marketing. Es **bandit contextual + heuristics + signal fusion**, no deep learning. Para el sweet spot del producto (sub-200ms decisiones, explicable, defensible) es la elección correcta.
- **Coach LLM** está bien construido (CSRF + rate-limit + safety + prompt cache + streaming).
- **NOM-035** es completo (72 ítems, 10 dominios, 5 categorías, server-recompute, k-anon).
- **HRV pipeline** es clinical-grade time-domain, falta frequency-domain.
- **Inteligencia distribuida en muchos archivos**, pero **inerte si la UI no la consume**. La oportunidad #1 de Fase 2 es **exponer al frontend lo que ya está calculado**.

---

**Fin de ANALYSIS_DOMAIN.md.**
