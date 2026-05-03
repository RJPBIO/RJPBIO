# ANALYSIS_INNOVATION_OPPORTUNITIES.md — Oportunidades de innovación real

**Fecha:** 2026-05-01 · **Reglas:** valor real al usuario · datos que YA existen · cero humo.

> **Filtro de calibración del dueño:** "una mejora bonita en código pero sin valor real al usuario no se implementa". Cada item aquí está justificado por **(a)** datos disponibles en backend HOY y **(b)** valor explícito al usuario o al operador B2B.

---

## A. Mejoras de algoritmo / lógica del motor

### A.1 — Reward inferencia desde Δ HRV cuando mood-post falta `[S]`
**Qué hace:** si `mood_post` es null pero hay HRV pre/post, calcula reward parcial = `1.5 × Δ lnRMSSD × completionRatio`. Sin esto, sesiones HRV-only se pierden para el bandit.

**Por qué es innovación:** hoy el bandit pierde ~30-50% de las sesiones (estimado: muchos usuarios skipean post-mood). Esto duplica la señal disponible.

**Datos:** `hrvLog`, `history` con HRV pre/post — ya existen.

**Riesgo de humo:** ninguno — es bias correction.

**Esfuerzo:** S (`bandit.js compositeReward` + `useStore.recordSessionOutcome`).

### A.2 — Cohort prior endpoint expuesto + consumido `[M]`
**Qué hace:** `GET /api/v1/me/neural-priors?orgId=...` devuelve `computeCohortPrior(sessions)` para que el cliente lo blendee. Hoy `computeCohortPrior` está construido pero **inerte si la PWA no lo consume**.

**Por qué es innovación:** transforma "predicción según literatura genérica" en "predicción según ritmo real de tu equipo". Es la pieza que justifica el pricing B2B en serio.

**Datos:** sesiones agregadas con k-anon ≥5 — ya existen.

**Esfuerzo:** M (handler + query org-sessions con date filter + cliente blend).

### A.3 — Promote `HrvSample` y `MoodSample` a tablas dedicadas `[L]`
**Qué hace:** migración append-only crea `HrvSample` (userId, ts, rmssd, sdnn, lnRmssd, source, sqi) y `MoodSample` (userId, ts, mood, energy, tag). Dual-write desde sync handler. Backfill desde `User.neuralState`.

**Por qué es innovación:** desbloquea queries SQL eficientes para B2B agregados ("avg RMSSD del equipo last 30d", "mood trajectory por team"). HOY estos cálculos requieren `findMany users` + parsear JSON `neuralState` por user → no escala.

**Datos:** ya en `neuralState` JSON, solo migración.

**Esfuerzo:** L (migration + dual-write + backfill script).

### A.4 — Calibración global con drift detection `[M]`
**Qué hace:** cuando el bias global de residuales cambia de signo o supera threshold (`driftThreshold=0.8` ya en config), surface alerta al usuario "el motor está recalibrando".

**Por qué:** transparency + trust. Hoy el bias se aplica silenciosamente.

**Esfuerzo:** S — surface flag `calibrating: true` + UI banner.

### A.5 — Multi-intent programs `[M]`
**Qué hace:** crear 1-2 programs nuevos que mezclan intents (ej: "Cognitive Resilience" 7d con reset → enfoque → calma rotando). Hoy todos los programs son monolíticos por intent.

**Por qué:** datos de bandit muestran que orgs B2B no tienen un único "intent ganador" — el equipo varía. Programs mixtos cubren mejor.

**Datos:** Solo composición curada — sin datos nuevos.

**Esfuerzo:** M — extender `programs.js`, requerirá UI cambios mínimos en `ActiveProgramCard`.

### A.6 — Anti-gaming v2 acción visible `[S]`
**Qué hace:** cuando `gamingV2 ≥ 60` por una semana, mostrar al admin (org) un "X% de señales sospechosas en el equipo" agregado k-anon ≥5. Y mostrar al usuario individual "asegúrate de que las sesiones reales cuenten" — sin acusar.

**Por qué:** hoy detectamos gaming pero la consecuencia es silenciosa (penalty al brazo). Para B2B serio, el operador necesita visibilidad.

**Esfuerzo:** S — endpoint org + UI surface.

### A.7 — `selectArm` fallback bug fix `[S]`
**Qué hace:** corregir el fallback que puede saltear intent-matching cuando bucket vacío.

**Esfuerzo:** S.

---

## B. Features nuevas para B2C

### B.1 — "Estado de tu motor" en home `[M]`
**Qué hace:** widget que llama `/api/v1/me/neural-health` y muestra:
- "Cold-start" / "Aprendiendo" / "Personalizado" según `dataMaturity`.
- `predictionAccuracy.hitRate` % visible.
- Acción si `staleness ≥ cooling`: "han pasado X días, recalibremos con sesión corta".
- Acción si `fatigue.severe`: "noto fatiga, hagamos calma 60s".

**Por qué:** la inteligencia del motor está calculada en `evaluateEngineHealth` pero **no se le muestra al usuario**. Esto convierte un motor "mágico" en un motor **transparente y confiable**.

**Datos:** ya en `health.js` evaluateEngineHealth.

**Riesgo de humo:** bajo si el copy es honesto ("hit rate 67%" no "AI con 99% accuracy").

**Esfuerzo:** M — endpoint + componente UI (post-reconstrucción frontend).

### B.2 — "Calibración del motor" — gráfica predicho vs observado `[M]`
**Qué hace:** muestra `calibrationByArm` por intent. "Para calma predijo +0.6, observó +0.4 (n=12)". Comprueba al usuario que el motor aprende.

**Datos:** `predictionResiduals.history` ya existe.

**Esfuerzo:** M.

### B.3 — "Tu intent ganador" semanal `[S]`
**Qué hace:** weekly digest in-app + push: "Esta semana, calma:morning te subió mood +0.9 (n=4). Sigue así."

**Datos:** `topArms` con `armCI` ya existe.

**Esfuerzo:** S — weekly cron + push delivery.

### B.4 — "Lo que tu coach sabe de ti" `[S]`
**Qué hace:** vista que muestra `buildCoachContext` raw — favorite protocols, mood trajectory, instruments scores. Build trust + control.

**Esfuerzo:** S — endpoint + read-only view.

### B.5 — Quarterly report PDF firmado `[M]`
**Qué hace:** `lib/quarterlyReport.js` ya existe. Generar PDF firmado SHA-256 con `topArms`, mood trajectory, HRV trend, cumulative sessions. Usuario lo puede compartir con su médico.

**Datos:** todo ya existe.

**Esfuerzo:** M — PDF rendering + signing.

### B.6 — HRV trend con normas poblacionales `[M]`
**Qué hace:** mostrar lnRMSSD trajectory + banda poblacional (Shaffer & Ginsberg 2017 data por edad). Hoy se muestra solo el número absoluto.

**Datos:** `hrvLog` ya existe.

**Esfuerzo:** M — agregar tabla de normas + percentile compute.

---

## C. Features nuevas para B2B

### C.1 — Org neural health dashboard `[M]`
**Qué hace:** `/admin/neural` consume `computeOrgNeuralHealth` + `computeProtocolEffectiveness`:
- Verdict (`at-risk / mature / early / developing`).
- Maturity distribution (cold-start / learning / personalized %).
- Top protocols con Cohen's d + CI95 + significant flag.
- Actions sugeridas accionables.

**Datos:** ya en `orgHealth.js`. Falta el endpoint + UI.

**Riesgo:** k-anon ≥5 protege individuos.

**Esfuerzo:** M — endpoint + dashboard.

### C.2 — Protocol effectiveness reporte CSV `[S]`
**Qué hace:** export CSV con cada protocolo + mood Δ + Cohen's d + CI95 + significant. Para que People Ops/CHRO los presente al CFO.

**Datos:** `computeProtocolEffectiveness` ya existe.

**Esfuerzo:** S.

### C.3 — Engagement funnel report `[M]`
**Qué hace:** muestra cuántos miembros llegaron a cada hito (signup → primera sesión → 5 sesiones → 20 sesiones → 90d active). Hoy `staleness distribution` se calcula pero no se reporta así.

**Datos:** `NeuralSession` agregado por user.

**Esfuerzo:** M.

### C.4 — Wearable OAuth user-flow real `[XL]`
**Qué hace:** implementar OAuth para Whoop / Oura / Fitbit. Usuario autoriza en su admin de PWA, se persiste el `external_id`, los webhooks ingest se reconcilian con `User.id`.

**Por qué:** la feature está prometida en marketing y construida a medias (HMAC ingress sí, OAuth no). Para enterprise convertir es esto o quitar el claim.

**Esfuerzo:** XL — OAuth per provider + reconciliation job.

### C.5 — Coach LLM persona custom UI `[S]`
**Qué hace:** form en `/admin/branding` para editar `org.branding.coachPersona` (texto). El coach tiene tono personalizado "habla como CHRO veterano de finanzas".

**Datos:** el campo se usa en `buildSystemPrompt`, falta UI.

**Esfuerzo:** S.

### C.6 — Coach quota mensual por plan `[M]`
**Qué hace:** tabla `CoachUsage(orgId, userId, month, tokensIn, tokensOut, requests)`. Plan determina cap. UI dashboard `/admin/billing` muestra consumo.

**Por qué:** evita costo runaway si user/org abusa del LLM.

**Esfuerzo:** M.

---

## D. Mejoras de integraciones existentes

### D.1 — Slack dispatcher real `[M]`
**Qué hace:** server lib `dispatchToSlack(orgId, event, payload)` que postea via Slack incoming webhook configurado. Subscribir a eventos: `org.member.added`, `nom35.aggregate.completed`, `incident.published`.

**Datos:** `Integration.config.webhookUrl` ya en schema.

**Esfuerzo:** M.

### D.2 — Microsoft Teams dispatcher `[M]`
**Qué hace:** lo mismo para Teams (Adaptive Cards JSON).

### D.3 — Webhook event versioning `[S]`
**Qué hace:** header `webhook-event-version: 1` + backwards-compat schema. Hoy un cambio de payload rompe clientes silenciosamente.

**Esfuerzo:** S.

### D.4 — Webhook delivery analytics `[M]`
**Qué hace:** `/admin/webhooks/[id]` muestra histograma retry, failure rate, avg latency. Datos en `WebhookDelivery` rows ya existen.

**Esfuerzo:** M — UI.

---

## E. Features de IA real con `ANTHROPIC_API_KEY`

### E.1 — Coach LLM con tool-use `[L]`
**Qué hace:** migrar coach a Anthropic tool-use. Tools: `getProtocols(intent)`, `getUserContext(userId)`, `getPredictionForProtocol(protoId)`, `startSession(protoId)`.

**Por qué:** hoy el coach genera texto. Con tool-use puede **ejecutar** acciones: "te recomiendo Pulse Shift, ¿la inicio?" → tool call → server inicia sesión → user hace tap.

**Riesgo:** alto de humo si no hay guardrails — el coach NO debe iniciar sesiones unilateralmente. Approval flow obligatorio.

**Esfuerzo:** L.

### E.2 — Weekly summary generado por LLM `[M]`
**Qué hace:** cron weekly llama Claude Haiku 4.5 con `coachContext` agregado, genera resumen 3-frases personalizado. Email + push.

**Por qué:** hoy quarterlyReport es estructurado, no narrativo. El usuario lee mejor "Esta semana, tu enfoque mejoró 15%, calma se mantuvo, exhortarías una sesión de reset el viernes" que un PDF.

**Datos:** todo ya existe.

**Esfuerzo:** M — cron + Haiku prompt + delivery.

### E.3 — Org pulse summary LLM `[M]`
**Qué hace:** lo mismo a nivel org B2B: "Tu equipo hizo 142 sesiones esta semana, dominante calma 18-21h, 8% señales de fatiga. Sugerencia: campaña ‘Recovery Day Friday’."

**Datos:** `computeOrgNeuralHealth` + `computeProtocolEffectiveness`.

**Esfuerzo:** M.

### E.4 — NOM-035 narrative report `[M]`
**Qué hace:** además del PDF estructurado actual, agregar página "Análisis ejecutivo" generada por LLM con `aggregateScores` + `topRiskDomain`.

**Esfuerzo:** M.

### E.5 — Coach prompt cache 1h en lugar de ephemeral `[S]`
**Qué hace:** cambiar `cache_control: ephemeral` a `cache_control: { type: "ephemeral", ttl: "1h" }` para reducir costos en sesiones de coach largas.

**Esfuerzo:** S.

### E.6 — Coach con prompt-caching del contexto del user `[S]`
**Qué hace:** el `coachContext` (mood trajectory, top protocols, etc) es estable cross-turn pero se reenvía. Marcarlo cacheable.

**Esfuerzo:** S.

---

## F. Capacidades nuevas que el backend YA soporta pero no se exponen

### F.1 — Job queue + crons (desbloquea 8 features) `[L]`
**Qué hace:** Vercel Cron + `/api/cron/[task]` con secret header. Tasks:
- `audit-prune` (semanal, retention).
- `audit-verify-sweep` (semanal, marca `auditLastVerifiedAt`).
- `dsar-expiry` (diario, EXPIRED para PENDING vencidas).
- `dsar-hard-delete` (diario, `User.deletedAt > 30d`).
- `maintenance-notify-t24` / `t0` (cada 5min).
- `incident-broadcast` (al insertar IncidentUpdate, fan-out a subscribers).
- `trial-end-reminder` (diario).
- `webhook-delivery-retry-sweep` (cada minuto).
- `dunning-state-check` (diario).
- `push-delivery-send` (cada minuto, drena cola).

**Por qué:** el backend tiene los hooks; el queue es el bottleneck. Esta es **la oportunidad #1 de Fase 2** por ROI.

**Esfuerzo:** L — Vercel Cron es trivial; el handler dispatcher + lock + idempotency es el trabajo.

### F.2 — `audit-export.js` arreglar bug + implementar S3 Object Lock `[M]`
**Qué hace:**
1. Fix `await db()` (bug latente).
2. Implementar `AWS SDK S3 PutObject` con `x-amz-object-lock-mode: COMPLIANCE` headers.
3. Daily cron que llama `exportChain(orgId, sinceId)` para cada org, ship a S3.
4. Persiste cursor `Org.auditLastExportedId`.

**Por qué:** habilita el claim "WORM offsite + SOC2 evidence pack" del marketing. Hoy es placeholder explícito.

**Esfuerzo:** M.

### F.3 — `verifyChain` streaming/batched `[M]`
**Qué hace:** cursor por chunks de 1K rows. Permite verify en orgs con 100K+ entries sin OOM.

**Esfuerzo:** M.

### F.4 — `MfaPolicy` enforcement en `/app` y `/api/sync/*` `[M]`
**Qué hace:** layer middleware que para sessions con `securityPolicies.requireMfa=true` y `mfaVerifiedAt` ausente o > 24h, redirige a step-up MFA.

**Por qué:** cierra el gap de policy enforcement actual.

**Esfuerzo:** M — middleware + UX para step-up.

### F.5 — Engine health + cohort prior endpoints expuestos `[S]`
**Qué hace:** `/api/v1/me/neural-health`, `/api/v1/me/neural-priors`, `/api/v1/orgs/[orgId]/neural-health`. Cada uno consume libs ya existentes.

**Esfuerzo:** S — wiring puro.

### F.6 — `User.deletedAt` index + GDPR cascade real `[S]`
**Qué hace:** migración añade índice + función `eraseUserData(userId)` que borra: sessions, API keys (orgs personales), webhooks (orgs personales), wearable events del user, coach memory, push subscriptions.

**Esfuerzo:** S.

### F.7 — `StripeEvent` tabla para idempotencia explícita `[S]`
**Qué hace:** persiste `(eventId, processedAt)`. Webhook handler chequea antes de aplicar `orgUpdate`.

**Esfuerzo:** S.

### F.8 — `coach.usage` quota + tracking `[M]`
**Qué hace:** persiste tokens consumidos por org/user/mes. Cap por plan. Endpoint quota status.

**Esfuerzo:** M.

### F.9 — IPv6 IP allowlist `[M]`
**Qué hace:** extender `org-security.js` con `parseIpv6` + `parseCidrV6` + `isIpv6InCidr`. CIDR parsing v6 es más complejo pero documented (RFC 4291).

**Esfuerzo:** M.

### F.10 — SCIM bulk operations + sortBy + paginación standard `[M]`
**Qué hace:**
- Bulk endpoint `/api/scim/v2/Bulk`.
- `?sortBy=` + `?sortOrder=` en GET Users/Groups.
- Asegurar `?count=` + `?startIndex=` correctos por defecto.

**Esfuerzo:** M — SCIM spec compliance.

### F.11 — SAML signed assertion validation `[L]`
**Qué hace:** verifica `xmldsig` de las assertions SAML (firma + ExpiresAt + AttributeMapping). Hoy SSO via NextAuth para SAML estándar pasa, pero la **validación crítica de assertions** no está visible en código (a confirmar leyendo NextAuth SAML provider config). Si está delegado al provider lib, OK; si no, vulnerabilidad alta para SAML.

**Esfuerzo:** L (depende de qué SAML lib se use).

### F.12 — Push delivery server-side real `[M]`
**Qué hace:** `lib/push-server.js` con `webpush` lib. Cron drena cola `PushOutbox` (nuevo modelo). Endpoints para encolar push.

**Esfuerzo:** M.

### F.13 — `process.env.COACH_MODEL` honored + plan-gate `[S]`
**Qué hace:** lee env, no hardcode. Plan FREE → Haiku 4.5 (más barato), PRO+ → Sonnet 4.6. Plan-gate al `coach.query` policy.

**Esfuerzo:** S.

---

## G. Innovación de producto que sale de mejorar lo existente

### G.1 — "Programa adaptativo" generado por bandit `[L]`
**Qué hace:** en lugar de programs curados estáticos, generar trayectorias 7-14d basadas en `topArms` del user + cohort prior. "Tu programa personalizado: día 1-3 reset 12-15h, día 4-7 calma 18-21h" según lo que el motor sabe que funciona.

**Por qué innovación:** los curated programs son competencia con Calm/Headspace. Programas **generados por motor** según cohort + bandit es diferenciador real.

**Esfuerzo:** L.

### G.2 — Burnout MBI real (3 sub-escalas) `[M]`
**Qué hace:** reemplazar el proxy 1D por escala MBI-GS validada (16 ítems). Aplicar quincenal o mensual. Reportes B2B "exhaustion / disengagement / efficacy" separados.

**Por qué:** valida científicamente el claim "burnout detection". Hoy es heurística.

**Esfuerzo:** M.

### G.3 — Cohort prior con drift detection org-level `[M]`
**Qué hace:** detectar cuando el cohort prior de un org se aleja significativamente de literatura baseline. Reportar al admin: "tu equipo responde **inversamente** a calma morning vs literatura — es probable que tengan turnos rotativos".

**Esfuerzo:** M.

### G.4 — "What changed?" — change detection en la UX `[M]`
**Qué hace:** cuando el motor decide algo distinto a la sesión pasada, mostrar al usuario el motivo: "hoy te recomiendo reset (no enfoque) porque acumulaste 3 sesiones de enfoque sin pausa".

**Por qué:** transparency es retention. Calm/Headspace son cajas negras — esto es un diferenciador.

**Datos:** decision rationale ya se calcula (`reason: "explorando — pocas observaciones"`).

**Esfuerzo:** M.

### G.5 — "Sleep integration" (Whoop/Oura) `[M, depende de C.4]`
**Qué hace:** una vez OAuth flow real, usar `WearableEvent kind=sleep` para alimentar `cogLoad.sleepDebt` automáticamente. Hoy el user lo introduce manual.

**Esfuerzo:** M (post C.4).

### G.6 — Coach memoria longitudinal cifrada `[L]`
**Qué hace:** persiste resúmenes de conversaciones en server (encriptado per-user con DEK envuelto en KMS). El coach puede retomar conversaciones cross-device. Hoy memoria es solo cliente.

**Riesgo:** PII storage server. Requiere consent explícito + DSAR cascade.

**Esfuerzo:** L.

---

## H. Resumen — agrupado por ROI

### Quick wins (S, alto valor)
- A.1 reward inferencia HRV
- A.7 selectArm fallback fix
- F.5 endpoints engine-health + cohort + neural-priors
- F.6 User.deletedAt index + cascade
- F.7 StripeEvent tabla idempotencia
- F.13 COACH_MODEL env + plan-gate
- B.4 "lo que el coach sabe"
- B.3 weekly intent ganador
- D.3 webhook event versioning
- E.5/E.6 coach cache 1h + context cache

### Plays grandes (M-L, alto valor)
- F.1 **job queue + crons** (#1 ROI — desbloquea 8 features)
- C.1 org neural health dashboard
- B.1 estado de tu motor en home
- A.2 cohort prior wired
- F.2 audit S3 Object Lock real
- A.3 HrvSample / MoodSample tablas
- F.4 MfaPolicy enforcement /app
- F.8 coach quota
- E.2 weekly LLM summary
- F.12 push delivery server

### Apuestas (XL, valor estratégico pero riesgo)
- C.4 wearable OAuth real
- G.1 programa adaptativo bandit-generado
- E.1 coach tool-use
- G.6 coach memoria longitudinal cifrada

### NO recomiendo en Fase 2
- Migrar a deep learning del bandit (over-engineering, los datos no lo justifican).
- Eleven Labs / Cartesia TTS server-streamed (latencia + costo + privacy tradeoffs serios).
- Audiogram pre-binaural (out of scope, low ROI).

---

**Fin de ANALYSIS_INNOVATION_OPPORTUNITIES.md.**
