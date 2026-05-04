# PHASE 6F RECONNAISSANCE — IDEAS DIFERENCIADORAS B2B

**Fecha:** 2026-05-04
**Modo:** Read-only reconnaissance pre-implementación
**Scope:** 3 ideas (NOM-035 reporte ejecutivo + Burnout prediction temprana + Programas adaptativos personalizados)
**Branch:** main · 1af2e74 (Phase 6E SP-B cerrado)
**Suite:** 3764/3764 verde

---

## TL;DR ejecutivo

> El repo ya tiene ~50–65 % construido de las 3 ideas. La conversación correcta no es "¿cómo construimos esto?" sino **"¿cómo cerramos los huecos específicos y los lanzamos como producto B2B nominal?"**. Los huecos son concretos, no estructurales. Combo total estimado: **$80–140 K USD eng + 4–6 meses**, no $200–260 K como sugería el sub-prompt original.

| Idea | Foundation existente | Falta | Tiempo | Riesgo |
|---|---|---|---|---|
| **1. NOM-035 ejecutivo** | OrgDashboard 8-cards + aggregate API + CSV + documento `window.print()` | trends time-series + auth de sello digital + benchmarks + UI ejecutivo "above the fold" | 3–5 sem | Bajo (legal claro) |
| **2. Burnout temprano** | `burnout.js` Maslach semáforo + 4 instrumentos + chronotype lib | HRV signal integration + `/api/v1/me/burnout` + nightly cron + alert UI + push wiring | 4–6 sem | Medio (claim médico/disclaimer) |
| **3. Programas adaptativos** | 5 programas catalog + `programTodayStatus` + `programLagStatus` + `programSuggestion` | re-evaluación cron + bandit-driven swap mid-program + push reminder de día | 3–4 sem | Bajo (UX-side) |

---

## TASK 1 — Foundation actual (común a las 3 ideas)

### 1.1 Tablas Prisma relevantes (todas existen)

| Modelo | Líneas | Relevancia |
|---|---|---|
| **Org** ([prisma/schema.prisma:16-74](prisma/schema.prisma#L16-L74)) | 58 | tenant raíz · plan · seats · `requireMfa` · `auditRetentionDays` · `personal:bool` distingue B2C de B2B |
| **User** ([prisma/schema.prisma:76-125](prisma/schema.prisma#L76-L125)) | 49 | identity · `neuralState:Json` (Zustand mirror) · `lastSyncedAt` · soft-delete `deletedAt` |
| **Membership** ([prisma/schema.prisma:223-239](prisma/schema.prisma#L223-L239)) | 16 | role · `deactivatedAt` · userId+orgId UNIQUE |
| **NeuralSession** ([prisma/schema.prisma:319-339](prisma/schema.prisma#L319-L339)) | 20 | `orgId+teamId+protocolId+coherenciaDelta+moodPre+moodPost+completedAt` — **base de aggregations** |
| **Nom35Response** ([prisma/schema.prisma:676-692](prisma/schema.prisma#L676-L692)) | 16 | guia · answers:Json · total · nivel (5-band) · `porDominio:Json` · `porCategoria:Json` |
| **HrvMeasurement** ([prisma/schema.prisma:785-814](prisma/schema.prisma#L785-L814)) | 29 | rmssd · lnRmssd · sdnn · pnn50 · meanHr · sqi · sqiBand · source ("camera" \| "ble") |
| **Instrument** ([prisma/schema.prisma:821-840](prisma/schema.prisma#L821-L840)) | 19 | instrumentId ("pss-4" \| "wemwbs-7" \| "phq-2") · score · level · answers:Json |
| **AuditLog** ([prisma/schema.prisma:301-317](prisma/schema.prisma#L301-L317)) | 16 | append-only · hash chain · `prevHash` · indexed `orgId+ts` |
| **CoachUsage** ([prisma/schema.prisma:700-717](prisma/schema.prisma#L700-L717)) | 17 | LLM quota mensual · `tokensIn/tokensOut` · UNIQUE userId+year+month |
| **PushSubscription** ([prisma/schema.prisma:132-144](prisma/schema.prisma#L132-L144)) | 12 | endpoint+keys persistidos · web-push real |
| **PushOutbox** ([prisma/schema.prisma:723-739](prisma/schema.prisma#L723-L739)) | 16 | queue pattern · `status:pending\|sent\|failed\|exhausted` · `attempts` · `nextAttempt` |
| **WearableEvent** ([prisma/schema.prisma:763-777](prisma/schema.prisma#L763-L777)) | 14 | provider+kind 3rd-party (Whoop/Oura/Garmin/Apple) |
| **Team** ([prisma/schema.prisma:241-248](prisma/schema.prisma#L241-L248)) | 7 | sub-grouping dentro de Org (managerId) — **base para "departamento X tiene Y% riesgo"** |

**Total models en schema:** 35. Lista completa: `Org`, `User`, `PushSubscription`, `UserSession`, `TrustedDevice`, `MfaResetRequest`, `PhoneOtp`, `Membership`, `Team`, `Invitation`, `Account`, `Session`, `VerificationToken`, `AuditLog`, `NeuralSession`, `Station`, `StationTap`, `Incident`, `IncidentUpdate`, `Notification`, `MaintenanceWindow`, `IncidentSubscriber`, `DsarRequest`, `Webhook`, `WebhookDelivery`, `ApiKey`, `Integration`, `SupportTicket`, `Impersonation`, `Nom35Response`, `CoachUsage`, `PushOutbox`, `StripeEvent`, `WearableEvent`, `HrvMeasurement`, `Instrument`.

**Modelos NO relevantes pero existentes:** Station/StationTap (Tap-to-Ignite QR/NFC), Incident/IncidentUpdate (status page), Webhook/WebhookDelivery, ApiKey, Integration.

### 1.2 Endpoints existing relevantes (agrupados)

**NOM-035 (existing):**
- `GET /api/v1/nom35/aggregate` ([src/app/api/v1/nom35/aggregate/route.js](src/app/api/v1/nom35/aggregate/route.js)) — JSON con `aggregateScores(rows, { minN: 5 })`
- `GET /api/v1/nom35/aggregate/export` ([src/app/api/v1/nom35/aggregate/export/route.js](src/app/api/v1/nom35/aggregate/export/route.js)) — CSV BOM-prefixed con audit log
- `POST /api/v1/nom35/responses` — submit individual

**Org-level admin:**
- `/api/v1/orgs/[orgId]/audit/{export,verify,retention,count}` — auditoría
- `/api/v1/orgs/[orgId]/compliance/export` — compliance data
- `/api/v1/orgs/[orgId]/sessions` + `[sessionId]` — sessions per org
- `/api/v1/orgs/[orgId]/dsar/*` — GDPR Art-15/17
- `/api/v1/orgs/[orgId]/sso` + `/security` + `/branding` + `/domain/verify`
- `/api/v1/orgs/[orgId]/members/[userId]/revoke-sessions`
- `/api/v1/org/[id]/export` — bulk org export

**User-level:**
- `/api/v1/me/sessions` + `[id]` — listar/revocar
- `/api/v1/me/notifications` + `[id]/read` + `read-all`
- `/api/v1/me/dsar` — request data
- `/api/v1/me/neural-priors` — engine state
- `/api/v1/me/ip` — IP info

**Sessions/sync:**
- `/api/v1/sessions` — sessions ingest
- `/api/sync/state` — Zustand mirror
- `/api/v1/onboarding`

**Push:**
- `/api/push/subscribe` + `/unsubscribe` + `/resubscribe` (server-side wired vía `web-push@3.6.7`)
- `/api/v1/me/notifications/*` (in-app)

**Cron dispatcher único:**
- `/api/cron/[task]/route.js` — TASK_REGISTRY lookup, Bearer CRON_SECRET auth, audit-logged

### 1.3 Componentes existing relevantes

**B2B/admin shell:**
- [src/components/OrgDashboard.jsx](src/components/OrgDashboard.jsx) — **YA EXISTE** dashboard 8-cards (RoiCard, HrvDeltaCard, EffectivenessCard, InstrumentCard×2 PSS/WEMWBS, NOMCard, EngagementCard, CoherenceCard) + ComplianceCard + privacy banner k≥5
- [src/components/admin/PageHeader.jsx](src/components/admin/PageHeader.jsx) — eyebrow + italic + title + subtitle + actions
- [src/components/admin/KPITile.jsx](src/components/admin/KPITile.jsx) — KPI tile con tone (success/warn/danger/signal)
- [src/components/admin/AdminTopbar.jsx](src/components/admin/AdminTopbar.jsx), [AdminSidebar.jsx](src/components/admin/AdminSidebar.jsx), [AdminCommandPalette.jsx](src/components/admin/AdminCommandPalette.jsx) — shell existente
- [src/components/Nom35PersonalReport.jsx](src/components/Nom35PersonalReport.jsx) — **canónico ADN documento oficial** (citado en memoria del usuario)

**Time-series + viz:**
- [src/components/TemporalCharts.jsx](src/components/TemporalCharts.jsx) — recharts wrapper
- [src/components/CorrelationMatrix.jsx](src/components/CorrelationMatrix.jsx)
- [src/components/BioSparkline.jsx](src/components/BioSparkline.jsx)
- [src/components/ReadinessRing.jsx](src/components/ReadinessRing.jsx), [ReadinessScore.jsx](src/components/ReadinessScore.jsx)
- [src/components/WeeklyReport.jsx](src/components/WeeklyReport.jsx) — personal weekly digest UI
- [src/components/StreakCalendar.jsx](src/components/StreakCalendar.jsx)

**HRV / instrumentos / coach:**
- [src/components/HRVValidationLab.jsx](src/components/HRVValidationLab.jsx)
- [src/components/InstrumentRunner.jsx](src/components/InstrumentRunner.jsx)
- [src/components/NeuralCoach.jsx](src/components/NeuralCoach.jsx)
- [src/components/SessionBiofeedback.jsx](src/components/SessionBiofeedback.jsx)

**Admin pages existentes** (`src/app/(admin)/admin/`):
- `page.jsx` (root), `nom35/page.jsx`, `nom35/documento/page.jsx`, `neural/page.jsx`
- `audit/{page,settings}`, `compliance/{page,dsar}`, `security/{page,policies,sessions}`
- `members/page.jsx`, `teams/page.jsx`, `sso/page.jsx`, `branding/page.jsx`
- `incidents`, `maintenance`, `health`, `api-keys`, `integrations`, `webhooks`, `billing`, `stations`, `onboarding`

### 1.4 Libs existing relevantes

**Burnout / instrumentos / programas (núcleo de las 3 ideas):**
- [src/lib/burnout.js](src/lib/burnout.js) — **engine completo** Maslach-aware, semáforo `ok\|watch\|warn\|alert`, signals `freqDrop+moodSlope+effectivenessDrop`, `burnoutCopy()` por nivel, NO usa HRV ni chronotype
- [src/lib/burnout.test.js](src/lib/burnout.test.js) — tests
- [src/lib/instruments.js](src/lib/instruments.js) — PSS-4 Cohen 1983 + SWEMWBS-7 Stewart-Brown 2009 (Rasch metric) + PHQ-2 Kroenke 2003 + rMEQ Adan 1991 + scoring + scheduling (`nextInstrumentDue`) + `aggregateInstrument` k-anon
- [src/lib/programs.js](src/lib/programs.js) — **5 programas** (NB/RW/FS/BR/EP) con sessions detalladas + `currentProgramDay` + `programTodayStatus` + `programProgress` + `programLagStatus` (grace 1 día)
- [src/lib/programSuggestion.js](src/lib/programSuggestion.js) — priority rules: burnout-crítico > recovery > onboarding > weekly-cooldown
- [src/lib/chronotype.js](src/lib/chronotype.js) — MEQ-SA classify + `isInDeepWorkWindow` + `estimateDLMO` + scheduleRecommendation por tipo (sleepWindow, lightExposure, deepWork, exercisePeak, dinnerCutoff)
- [src/lib/quarterlyReport.js](src/lib/quarterlyReport.js) — agregador 90 días: sessions+intent+top-protocols+mood-trend+HRV-trend+instruments+warnings (PHQ-2 ≥3, PSS-4 high, HRV descendente)

**NOM-035 / aggregations / k-anon:**
- [src/lib/nom035.js](src/lib/nom035.js) — wrapper público
- [src/lib/nom35/items.js](src/lib/nom35/items.js) — DOMINIOS + CATEGORIAS items definidos
- [src/lib/nom35/scoring.js](src/lib/nom35/scoring.js) — `aggregateScores(rows, { minN: 5 })` con suppression
- [src/lib/nom35/recommend.js](src/lib/nom35/recommend.js) — recomendaciones por dominio
- [src/lib/nom35/protocolBias.js](src/lib/nom35/protocolBias.js) — bias de protocolos por dominio NOM-035
- [src/lib/nom35-csv.js](src/lib/nom35-csv.js) — CSV BOM-prefixed

**HRV / efectividad / ROI:**
- [src/lib/hrv.js](src/lib/hrv.js), [hrvDelta.js](src/lib/hrvDelta.js) — paired pre/post + MDC95 filter
- [src/lib/hrvLog.js](src/lib/hrvLog.js) — client log + reliability filter (SQI ≥ 60 cámara, BLE siempre)
- [src/lib/hrv-camera/*](src/lib/hrv-camera) — capture + filter + insight + metrics + peaks + sqi + synth + validation
- [src/lib/effectiveness.js](src/lib/effectiveness.js) — Cohen's d con CI95
- [src/lib/coherence.js](src/lib/coherence.js) — phase-lock breath↔HRV
- [src/lib/roi.js](src/lib/roi.js) — `computeRecoveredHours` + `computeRoiValue` USD

**Engine neural:**
- [src/lib/neural/bandit.js](src/lib/neural/bandit.js) — Thompson sampling + `topArms`
- [src/lib/neural/residuals.js](src/lib/neural/residuals.js)
- [src/lib/neural/chronoCircadian.js](src/lib/neural/chronoCircadian.js)
- [src/lib/coachMemory.js](src/lib/coachMemory.js) — context para LLM

**Compliance / audit:**
- [src/lib/audit-chain.js](src/lib/audit-chain.js) — hash chain
- [src/lib/consent.js](src/lib/consent.js)

**Cron infra (`src/server/cron/`):**
- [runner.js](src/server/cron/runner.js) — TASK_REGISTRY + Bearer auth + 50s timeout + audit
- [weekly-summary.js](src/server/cron/weekly-summary.js) — **patrón ya implementado**: foreach activeUser → LLM Haiku narrativa → `enqueuePush` con kind:"weekly-digest"
- [push-deliver.js](src/server/cron/push-deliver.js) — drains PushOutbox vía web-push
- [audit-prune.js](src/server/cron/audit-prune.js), [audit-verify.js](src/server/cron/audit-verify.js), [audit-export.js](src/server/cron/audit-export.js)
- [dsar-sweep.js](src/server/cron/dsar-sweep.js), [dunning-check.js](src/server/cron/dunning-check.js)
- [maintenance-notify.js](src/server/cron/maintenance-notify.js), [incident-broadcast.js](src/server/cron/incident-broadcast.js)
- [trial-end-reminder.js](src/server/cron/trial-end-reminder.js), [webhook-retry.js](src/server/cron/webhook-retry.js)
- [src/server/push-delivery.js](src/server/push-delivery.js) — `enqueuePush()` helper
- [src/server/neural-org-stats.js](src/server/neural-org-stats.js) — `getOrgNeuralHealth(orgId)` agregaciones

**vercel.json crons (11 jobs registrados):**
```
dsar-sweep         0 1 * * *
dunning-check      30 1 * * *
audit-prune        0 3 * * *
audit-export       30 3 * * *
audit-verify       0 4 * * 0
trial-end-reminder 0 9 * * *
maintenance-notify 0 8 * * *
incident-broadcast 15 9 * * *
webhook-retry      30 10 * * *
push-deliver       0 11 * * *
weekly-summary     0 14 * * 1
```

### 1.5 Dependencias relevantes ([package.json](package.json))

| Dep | Versión | Uso |
|---|---|---|
| `@anthropic-ai/sdk` | `^0.90.0` | Coach LLM + weekly-summary narrative |
| `@prisma/client` | `^6.2.1` | DB |
| `recharts` | `^3.8.1` | **Time-series viz disponible** |
| `web-push` | `^3.6.7` | **Push delivery server-side wired** |
| `framer-motion` | `^12.38.0` | UX |
| `next` | `^16.2.4` | App router |
| `next-auth` | `^5.0.0-beta.31` | Auth |
| `nodemailer` | `^8.0.5` | Email transactional |
| `qrcode` | `^1.5.4` | Stations |
| `zustand` | `^5.0.12` | Store |
| `lucide-react` | `^0.577.0` | Icons (uno de varios — la PWA usa BioIcons custom) |

**❌ Sin PDF library** (jsPDF / pdfkit / puppeteer / react-pdf NO instalados). PDF strategy actual = `window.print()` + `@media print` CSS — patrón usado por `Nom35DocumentClient` y aprobado en memoria del usuario como ADN documentos oficiales.

---

## TASK 2 — IDEA 1: Reporte ejecutivo NOM-035 con biometría real

### 2.1 Qué EXISTE hoy (~55 %)

| Capa | Estado | Evidencia |
|---|---|---|
| Aggregations server-side | ✅ Completo | [src/lib/nom35/scoring.js#aggregateScores](src/lib/nom35/scoring.js) k≥5 + suppression |
| Endpoint JSON | ✅ Completo | [/api/v1/nom35/aggregate](src/app/api/v1/nom35/aggregate/route.js) con role gate OWNER/ADMIN/MANAGER |
| Endpoint CSV | ✅ Completo | [/api/v1/nom35/aggregate/export](src/app/api/v1/nom35/aggregate/export/route.js) BOM-prefixed + audit log "nom35.aggregate.exported" |
| Admin dashboard NOM-035 | ✅ Completo | [/admin/nom35/page.jsx](src/app/(admin)/admin/nom35/page.jsx) — KPIs + tabla dominios + distribución niveles |
| Documento oficial NOM-035 | ✅ Completo | [/admin/nom35/documento/page.jsx](src/app/(admin)/admin/nom35/documento/page.jsx) + [Nom35DocumentClient.jsx](src/app/(admin)/admin/nom35/documento/Nom35DocumentClient.jsx) — 3 secciones (política + acta + bitácora) + `window.print()` |
| OrgDashboard 8-cards full | ✅ Completo | [src/components/OrgDashboard.jsx](src/components/OrgDashboard.jsx) — incluye NOMCard + InstrumentCard×2 + HrvDeltaCard + EffectivenessCard + RoiCard + EngagementCard + CoherenceCard + ComplianceCard |
| K-anonymity ≥5 | ✅ Completo | enforced en `aggregateScores`, `aggregateInstrument`, `aggregateHrvDeltas`, `aggregateTeamCoherence`, `computeProtocolEffectiveness` |
| Privacidad LFPDPPP/GDPR | ✅ Completo | banner explicativo + audit logs + ComplianceRow checks |
| Validation flag DOF | ✅ Completo | `NEXT_PUBLIC_NOM35_DOF_VERIFIED` env (alineado con `nom035TextValidatedByLawyer = false` de CLAUDE.md) |

### 2.2 Qué FALTA (~45 %)

| Gap | Severidad | Notas |
|---|---|---|
| **Trends time-series por dominio** | Alta | OrgDashboard muestra point estimates; no hay sparkline 90-d / 365-d por dominio NOM-035. Recharts ya disponible. |
| **Pre/post programa comparativa** | Alta | "Antes de Burnout Recovery: 22 alto-riesgo · Después: 14" — requiere flag de program-cohort en NeuralSession + query temporal |
| **UI ejecutivo "1-page above-the-fold"** | Media | Hoy `OrgDashboard` muestra 8 cards en grid; el "reporte ejecutivo" requiere portada dedicada con headline + 3 KPIs +1 chart + footer compliance. Patrón = `Nom35PersonalReport.jsx` clonado a versión org. |
| **Drill-down por departamento (Team)** | Media | Team table existe en Prisma, NeuralSession tiene `teamId`, pero NO hay query que segmente NOM-035 por team con k≥5. |
| **Comparativas industria/benchmarks** | Media | No hay datos. Requiere o anonymized aggregation cross-org (legalmente complejo) o curated industry stats (e.g. STPS publica medias nacionales). |
| **PDF firmado digitalmente** | Baja-Media | Hoy `window.print()` produce PDF sin firma. Para evidencia STPS formal: o e-firma SAT/PSC integration ($$$ + 6+ semanas) o mantener "borrador" + firma manual del representante legal post-impresión (lo que ya hace Nom35DocumentClient). |
| **HRV correlation ↔ NOM-035 trends** | Media | Card existe (HrvDeltaCard) pero no se cruza temporalmente con NOM-035: "Equipo X bajó 5% riesgo psicosocial en 6 meses, +12 ms HRV en mismo periodo". |
| **Email/Slack delivery automático** | Baja | Hoy descarga manual. RH típico quiere "reporte trimestral llega al inbox automáticamente" — requiere cron `quarterly-org-digest` + email con link al admin. Infra ya existe. |
| **Cohort sizing alert** | Baja | Si 3 de 5 dominios aparecen "Suprimido" por k<5, el dashboard no orienta al RH a reclutar más respuestas activamente. |

### 2.3 Decisión arquitectónica clave: SSR-PDF vs HTML interactivo

**Patrón probado en este repo:** ambos ya conviven.
- `/admin/nom35/documento` = HTML form + `window.print()` → PDF (legal, archivable)
- `/admin/nom35` = HTML interactivo (drill-down, KPIs, table)

**Recomendación:** mantener este split. Para Idea 1:
- **Ruta `/admin/reportes/ejecutivo`** = HTML interactivo (filters, periodo selector, drill-down team)
- **Botón "Generar PDF ejecutivo"** = ruta dedicada con `@media print` CSS, cargada con datos + chart-as-svg-static + estilo `Nom35PersonalReport`
- **No introducir lib PDF** — eso doblaría bundle y rompe el patrón establecido

### 2.4 PDF deps verificadas

```json
// package.json grep "pdf|jspdf|puppeteer" → 0 hits
```
Decisión consistente con la del repo. No reintroducir.

### 2.5 Validación legal NOM-035

- Env flag: `NEXT_PUBLIC_NOM35_DOF_VERIFIED` ([Nom35DocumentClient.jsx:64](src/app/(admin)/admin/nom35/documento/Nom35DocumentClient.jsx#L64))
- Default `false` → muestra alerta "los 72 ítems están alineados estructuralmente con la Guía III, pero su texto literal debe contrastarse contra DOF 23-oct-2018"
- Marca de **"BORRADOR"** se exhibe hasta que abogado verifique
- Esto MATCHEA exactamente con `nom035TextValidatedByLawyer = false` de [CLAUDE.md](CLAUDE.md)

**Para Idea 1:** mantener el mismo flag + extenderlo a reporte ejecutivo. **No exponer "evidencia formal STPS" hasta que un abogado certifique los textos.** Hasta entonces, el reporte se vende como "preview ejecutivo / Q&A interno", no como documento legal.

### 2.6 Estimación

- Reuse OrgDashboard primitivos (~70%) + RH-friendly portada + trends time-series + pre/post cohort + email delivery cron
- **3–5 semanas eng · $25–40 K USD eng + $5–10 K legal review final + $0 diseño (DNA establecido)**

---

## TASK 3 — IDEA 2: Predicción de burnout temprana

### 3.1 Qué EXISTE hoy (~60 %)

| Capa | Estado | Evidencia |
|---|---|---|
| **Engine semáforo Maslach** | ✅ Completo | [src/lib/burnout.js#assessBurnout](src/lib/burnout.js) — 3 señales (freqDrop / moodSlope / effDrop) → ok\|watch\|warn\|alert · 2+ señales WARN → ALERT |
| Tests unidad | ✅ Completo | [src/lib/burnout.test.js](src/lib/burnout.test.js) |
| Copy gentle por nivel | ✅ Completo | `burnoutCopy(level)` — sin diagnóstico, escalable a SAPTEL en ALERT |
| Config tunable | ✅ Completo | `BURNOUT_DEFAULTS` con thresholds (freqDropWarn 0.50, moodSlopeWarn -0.35, effectivenessDropWarn 0.55) |
| Suggestion → Burnout Recovery program | ✅ Completo | [programSuggestion.js#suggestProgram](src/lib/programSuggestion.js) — burnout alto/crítico fuerza Burnout Recovery 4-week |
| **Instrumentos longitudinales** | ✅ Completo | PSS-4 mensual, SWEMWBS-7 trimestral, PHQ-2 screening, rMEQ asNeeded |
| Chronotype + scheduleRecommendation | ✅ Completo | [chronotype.js#scheduleRecommendation](src/lib/chronotype.js) — sleepWindow, deepWork, dinnerCutoff por tipo |
| HRV measurement multi-modalidad | ✅ Completo | HrvMeasurement table + camera+BLE + reliability filter SQI |
| Quarterly report individual | ✅ Completo | [quarterlyReport.js#buildQuarterlyReport](src/lib/quarterlyReport.js) — incluye PHQ-2 positive warning, PSS-4 high warning, HRV descendente warning |
| Push notification infra | ✅ Completo | PushOutbox + web-push@3.6.7 + push-deliver cron + enqueuePush helper |
| Coach safety español SAPTEL | ✅ Completo | mencionado en CLAUDE.md / Phase 6C SP3 |

### 3.2 Qué FALTA (~40 %)

| Gap | Severidad | Notas |
|---|---|---|
| **HRV signal en burnout.js** | Alta | `assessBurnout` consume sólo sessions (pre/mood/coherenciaDelta), NO consume HrvMeasurement.rmssd trends. Adición simple: import hrvSeries → slope per week → 4ª señal "HRV declive >20% baseline 28d". |
| **Chronotype desalineación signal** | Alta | `isInDeepWorkWindow()` existe pero no se cruza con sessionTime patterns. Patrón: si user empieza sesiones consistentemente fuera de su `deepWork` window > 7d → señal "dyssynchrony" (proxy de social jetlag). |
| **`/api/v1/me/burnout` endpoint** | Alta | No existe. Cliente PWA necesita cargar score actual + trend + signals. |
| **Burnout aggregated org endpoint** | Alta | No existe. RH dashboard B2B necesita `/api/v1/orgs/[orgId]/burnout/aggregate` con k≥5 + breakdown por team. |
| **Nightly cron `burnout-scan`** | Alta | No existe. Patrón = clon de `weekly-summary.js`: foreach activeUser → assessBurnout → si nivel ≥ warn-y-cambió → enqueuePush kind:"burnout-alert" + auditLog. |
| **MBI instrument formal** | Media | No implementado. burnout.js *deriva* señales sin pedir MBI directo. Decisión a tomar (ver §8): añadir MBI-9 corto como instrumento opcional o quedarse con derivación heurística. |
| **MAIA-2 (interocepción)** | Baja | No existe. Mencionado en sub-prompt, pero MAIA-2 es 32 ítems — fricción alta para repeat measure. Recomendación: NO añadir; chronotype + HRV cubren la dimensión interoceptiva sin instrumento self-report. |
| **Alert UI in-app cuando level=alert** | Alta | No existe. Patrón = banner top-of-app + drawer con copy de `burnoutCopy(level)` + CTA "Empezar Burnout Recovery". |
| **Disclaimer legal in-product** | Alta | burnout.js comenta "no diagnóstico" pero no hay UI con disclaimer visible al user antes de mostrar nivel "alert". |
| **Threshold de cambio para no spam** | Media | Si user ya recibió alert ayer, no enviar push hoy. Requiere persistir last-burnout-level + delta detection en cron. |
| **30–60 días lookahead claim** | Crítico | El sub-prompt vende "30-60 días anticipación". `burnout.js` actual mira 28d baseline vs 7d recent — mira **al pasado**, no proyecta al futuro. Predicción real (no detección retrospectiva temprana) requiere modelo serie temporal o claim más modesto. |

### 3.3 Engine bandit reusabilidad

`src/lib/neural/bandit.js` es **Thompson sampling para protocol selection**, no predictor temporal de burnout. NO reusable para predicción futura. Lo reusable:
- `topArms` para identificar intent dominante (ya usado en weekly-summary)
- `outcomeResiduals` ([neural/residuals.js](src/lib/neural/residuals.js)) para ver si protocolos pierden efectividad — eso SÍ es señal indirecta de burnout

### 3.4 Decisión arquitectónica predictiva: A vs B vs C

**Recomendación honesta:** **Opción A reformulada como "early-warning detection retrospectiva con horizonte 14d"**, NO "predicción 30-60 días anticipación".

- A. Heurística hand-coded (lo que `burnout.js` ya es) → MVP defensible, audit-able, transparent. **Esto es lo que se debe shippear.**
- B. ML simple (logistic regression con N variables) → requiere N≥1000 users con outcomes etiquetados ("se quemó / no") · Phase 6G+ minimum
- C. Deep learning → no aplica antes de N≥10K · descartar

**Riesgo legal específico:** vender "predicción 30-60 días" cuando la mecánica es retrospective change-detection es claim publicitario que un abogado rechazaría. Reformular marketing como "early-warning" o "detección temprana de patrones consistentes con agotamiento". Disclaimers obligatorios.

### 3.5 Liability concerns

- Burnout = ICD-11 QD85 "fenómeno ocupacional, no condición médica" → semáforo no diagnóstico → defendible
- Pero **alert "consistente con agotamiento" sin profesional consultor del proyecto** = alto riesgo de queja
- **Engagement con psicólogo clínico/ocupacional:** ~$5–15 K USD review + ~$3 K/año retainer — justificable como compliance B2B

### 3.6 Estimación

- Reuse burnout.js (~80 % engine) + HRV+chronotype signals + endpoints + nightly cron + UI alert + push wiring + disclaimer + psicólogo review
- **4–6 semanas eng · $30–50 K eng + $10–15 K validación clínica + $5–10 K legal**

---

## TASK 4 — IDEA 3: Programas adaptativos personalizados

### 4.1 Qué EXISTE hoy (~70 %)

| Capa | Estado | Evidencia |
|---|---|---|
| **5 programas catalog** | ✅ Completo | [programs.js#PROGRAMS](src/lib/programs.js) — Neural Baseline 14d / Recovery Week 7d / Focus Sprint 5d / Burnout Recovery 28d / Executive Presence 10d |
| Sessions con día explícito | ✅ Completo | each program.sessions = `[{ day, protocolId, durMult?, note }]` con días de reposo sparse |
| Rationale + evidence | ✅ Completo | rationale + evidence cita literatura (Maslach&Leiter 2016, Schaufeli 2017, Goessl 2017 RFB meta) |
| State persistido | ✅ Completo | useStore.js — `activeProgram` + `programHistory` + `completedSessionDays` + abandono explícito |
| Helpers de progreso | ✅ Completo | `currentProgramDay`, `programTodayStatus`, `programProgress`, `programLagStatus` (grace 1 día) |
| Suggestion engine | ✅ Completo | priority rules + cooldown weekly Sprint 64 |
| Achievement bonus | ✅ Completo | XP + vCores al completar (mencionado useStore l.624) |

### 4.2 Qué FALTA (~30 %)

| Gap | Severidad | Notas |
|---|---|---|
| **Re-evaluación cada 2 semanas** | Alta | No existe trigger automático. `nextInstrumentDue` en instruments.js scheduling es PSS-4 monthly + WEMWBS quarterly, no cada-2-semanas durante programa. Patrón: añadir en programs.js `program.reEvalEvery: 14` y trigger en `programTodayStatus` cuando `daysSinceLastReEval ≥ 14`. |
| **Push reminder día con sesión** | Alta | No existe cron `program-day-reminder`. PushOutbox + push-deliver listos. Patrón = clon de weekly-summary: foreach userActiveProgram → si shouldSession → enqueuePush kind:"program-reminder" mañana 8am local. |
| **Ajuste automático bandit-driven** | Alta | Programs son catálogo estático. Si user adhiere pero coherence/HRV/efectividad NO mejoran (residuals.js puede medirlo) → no hay swap automático de protocolo. Patrón: en programs.js cada day.protocolId hacerlo `dayN.protocolPool: [primary, alt1, alt2]` y resolverlo runtime con bandit. Cambio mediano de schema. |
| **Re-evaluación copy + UI** | Media | Cuando llega día 14 del Burnout Recovery 28d, prompt "PSS-4 quincenal del programa" es UX nueva. |
| **Adherencia tracking en endpoint** | Media | adherence vive en localStorage/Zustand. Para B2B "manager ve adherencia agregada de su team al programa" requiere endpoint `/api/v1/orgs/[orgId]/programs/adherence` + sync upstream. |
| **Variantes por chronotype** | Media | program.window: "morning" pero NO hay variante per-chronotype. user vespertino con `program.window: "morning"` está condenado. Decisión: aceptar (manual override) o auto-shift a deepWork window del user. |
| **Team-based programs B2B** | Baja | Hoy programas son individuales. "Toda mi área hace Focus Sprint juntos esta semana" = Team-Program coordination — schema nuevo. |
| **Re-engagement cuando lagging** | Media | `programLagStatus` detecta isLagging pero no triggera nada. Patrón: si `isLagging` 2 días → push "estás 2 días atrás, ¿continuar o pausar?". |

### 4.3 Engine bandit ya hace ajuste?

No automáticamente dentro del programa. Bandit selecciona protocolos en sesiones libres (no-program). Para Idea 3 hay que extender:
- Cuando user ejecuta `protocolId X` por estar en day N de program Y, los outcomes (Δ mood, Δ coh) sí alimentan al bandit (correcto)
- Pero el program no consulta bandit para sustituir un protocolo si user no responde — el program impone su catálogo
- **Decisión:** introducir `program.alternates` (array de protocolIds permitidos) por día → bandit elige entre alternates en sesión activa

### 4.4 Push notifications

- ✅ web-push@3.6.7 instalado
- ✅ PushSubscription + PushOutbox modelos
- ✅ push-deliver cron
- ❌ **timezone-aware delivery** no claro — si user está en MX y cron corre a 11 UTC, llega a 5am local. weekly-summary corre lunes 14 UTC = 8am MX (ok). Para program-day-reminder ideal es 8am local del user. User.timezone existe en schema (default America/Mexico_City).

### 4.5 Estimación

- Reuse programs.js (~80%) + re-evaluación schema + program-reminder cron + bandit-alternates per day + adherence agregada B2B + chronotype shift + UI re-engagement
- **3–4 semanas eng · $20–35 K eng + $5–10 K curriculum review (psicólogo opcional para validación clínica del Burnout Recovery 28d)**

---

## TASK 5 — Overlaps + sinergias entre las 3 ideas

### 5.1 Data dependencies compartidas

| Tabla / aggregation | Idea 1 | Idea 2 | Idea 3 |
|---|---|---|---|
| `NeuralSession` (orgId+userId+protocolId+coherenciaDelta+moodPre+moodPost+completedAt) | ✅ | ✅ | ✅ |
| `HrvMeasurement` (rmssd trends 28d/90d) | ✅ correlación | ✅ signal | ⚠️ outcome del programa |
| `Instrument` (PSS-4 + WEMWBS + PHQ-2) | ✅ (cards) | ✅ (re-eval) | ✅ (cada 2 sem) |
| `Nom35Response` (orgId aggregations) | ✅ core | ⚠️ alto-riesgo dominio = signal | ⚠️ dominio alto → suggest program |
| `chronotype` user.neuralState | — | ✅ desalineación | ✅ window match |
| `User.timezone` | — | — | ✅ delivery hora local |

**Sinergia clara:** los 3 ideas necesitan el **mismo "User Wellbeing Snapshot"** server-side (sessions + HRV + instrumentos + NOM-035 + chronotype + active program). Construir UNA función `buildUserSnapshot(userId, { now, days })` reusable por:
- Burnout assessment
- Program suggestion
- Quarterly report org aggregation
- Coach context

Esto consolida 4 queries similares en 1.

### 5.2 UI components compartidos

| Component | Idea 1 | Idea 2 | Idea 3 |
|---|---|---|---|
| `OrgDashboard` (existing 8-cards) | ✅ portada | ✅ +BurnoutCard | ✅ +AdherenceCard |
| `Nom35PersonalReport` clone → `OrgExecutiveReport` | ✅ | — | — |
| `TimeSeriesPanel` (recharts wrapper, 90d/365d) | ✅ trends | ✅ HRV slope | ✅ adherence sparkline |
| `BurnoutBanner` (semáforo → CTA) | — | ✅ | ✅ → suggest Burnout Recovery |
| `ProgramTimeline` (28d gantt) | — | — | ✅ |
| `ExportPdfButton` (`window.print()` ruta dedicada) | ✅ | ⚠️ alert detail | — |
| `KAnonymitySuppression` shell | ✅ | ✅ | ✅ |
| `PageHeader` admin | ✅ | ✅ | ✅ |
| `KPITile` admin | ✅ | ✅ | ✅ |

**Componentes nuevos a construir UNA vez:**
1. `TimeSeriesPanel` — wrapper de recharts con tema bio + tooltip + axis tokens
2. `BurnoutBanner` — semáforo + CTA contextual
3. `ProgramTimeline` — visualización del arco del programa
4. `OrgExecutiveReport` — clone de Nom35PersonalReport con orgs aggregations

### 5.3 Backend infra compartido

| Infra | Estado | Compartido |
|---|---|---|
| Cron infra (TASK_REGISTRY + runner) | ✅ existe | añadir 3 tasks: `burnout-scan`, `program-day-reminder`, `quarterly-org-digest` |
| Push delivery (`enqueuePush` + push-deliver cron) | ✅ existe | reuso directo |
| Audit log (`auditLog()`) | ✅ existe | reuso directo (cada export, cada alert, cada program-start) |
| K-anon aggregation primitives | ✅ existe | `aggregateScores`, `aggregateInstrument`, `aggregateHrvDeltas` — **no reescribir** |
| Role gate (`OWNER\|ADMIN\|MANAGER`) | ✅ existe | reuso pattern |
| Coach LLM (Anthropic Haiku) + quota | ✅ existe | reuso si Idea 2 quiere narrative-summary del burnout-alert |

**Pieza compartida nueva crítica:** `buildUserSnapshot(userId, opts)` server-side function — 1 query Prisma con includes + transforms.

### 5.4 Compliance + safety compartidos

| Item | Estado | Compartido |
|---|---|---|
| K≥5 anonymity | ✅ enforced en libs | aplicar a las 3 |
| LFPDPPP / GDPR Art-89 | ✅ banner OrgDashboard | aplicar a las 3 |
| Audit log cada export | ✅ patrón establecido | cada generación de reporte ejecutivo + cada burnout-alert |
| Disclaimer "no diagnóstico" | ⚠️ inconsistente | falta en Idea 2 UI; redactar **una vez** y reusar |
| `nom035TextValidatedByLawyer` flag | ✅ env-driven | extender a Idea 1 reporte ejecutivo |
| MFA enforce admin endpoints | ✅ existe (Phase 2 sprint 7) | aplicar a `/api/v1/orgs/[orgId]/burnout/*` y `/programs/adherence` |

---

## TASK 6 — Arquitectura consolidada propuesta

### Capa 1 — Data foundation

**Tablas Prisma nuevas (todas opcionales, ninguna bloqueante):**

```prisma
// Idea 2 — burnout score persistido para detección de cambios
model BurnoutScore {
  id          String   @id @default(cuid())
  userId      String
  orgId       String?
  level       String   // "ok"|"watch"|"warn"|"alert"
  signals     Json     // ["frecuencia -50%", "HRV decline -22%", ...]
  metrics     Json     // baselineFreqPerDay, moodSlopePerWeek, etc
  computedAt  DateTime @default(now())
  user        User     @relation(...)
  @@index([userId, computedAt])
  @@index([orgId, level, computedAt])
}

// Idea 3 — adherence per-program tracking server-side (mirror del Zustand)
model ProgramAssignment {
  id              String   @id @default(cuid())
  userId          String
  orgId           String?
  programId       String   // "burnout-recovery" etc
  startedAt       DateTime
  completedAt     DateTime?
  abandonedAt     DateTime?
  completedDays   Json     // [1, 3, 5, 7, ...]
  reEvalAt        DateTime? // próximo PSS-4 mid-program
  source          String   // "suggested-burnout-alert" | "self-selected" | etc
  user            User     @relation(...)
  @@index([userId, startedAt])
  @@index([orgId, programId, startedAt])
}

// Idea 1 (opcional) — snapshot del reporte ejecutivo para serializar trends
model OrgReportSnapshot {
  id          String   @id @default(cuid())
  orgId       String
  periodStart DateTime
  periodEnd   DateTime
  payload     Json     // agg + topProtocols + warnings + comparativasPrePostProgram
  generatedBy String   // userId del admin
  generatedAt DateTime @default(now())
  @@index([orgId, periodEnd])
}
```

**Aggregation views opcionales:** Postgres materialized view `mv_org_nom35_monthly` para no recalcular agregados a cada hit del dashboard. Postergable a Phase 6G si performance OK.

### Capa 2 — Background processing

**3 cron tasks nuevas en TASK_REGISTRY:**

```js
// runner.js
"burnout-scan":          () => import("./burnout-scan.js").then(m => m.runBurnoutScan),       // diario 5 UTC
"program-day-reminder":  () => import("./program-reminder.js").then(m => m.runProgramReminder), // diario 13 UTC (≈8am MX)
"quarterly-org-digest":  () => import("./quarterly-org-digest.js").then(m => m.runQuarterlyOrgDigest), // mensual día 1
```

**vercel.json adiciones:**
```json
{ "path": "/api/cron/burnout-scan",         "schedule": "0 5 * * *" },
{ "path": "/api/cron/program-day-reminder", "schedule": "0 13 * * *" },
{ "path": "/api/cron/quarterly-org-digest", "schedule": "0 16 1 * *" }
```

Cada task = clon estructural de `weekly-summary.js` (loop activeUsers + work + audit).

### Capa 3 — APIs nuevas

| Endpoint | Method | Verb | Notas |
|---|---|---|---|
| `/api/v1/me/burnout` | GET | leer | level + signals + recommended program |
| `/api/v1/me/program/active` | GET | leer | activeProgram + today + lag + adherence |
| `/api/v1/me/program/start` | POST | crear | programId → activeProgram (replace if exists con migration to history) |
| `/api/v1/me/program/abandon` | POST | mutar | move activeProgram → history |
| `/api/v1/me/program/reEval` | POST | crear | submit PSS-4 mid-program → re-evaluate burnout |
| `/api/v1/orgs/[orgId]/burnout/aggregate` | GET | leer | k≥5 aggregated + by team |
| `/api/v1/orgs/[orgId]/programs/adherence` | GET | leer | k≥5 adherence per program |
| `/api/v1/orgs/[orgId]/reports/executive` | GET | leer | OrgReportSnapshot |
| `/api/v1/orgs/[orgId]/reports/executive/render` | GET | leer (HTML) | versión print-ready para `window.print()` |

Todos protected por role gate `OWNER|ADMIN|MANAGER` + audit log en operaciones de export/lectura agregada.

### Capa 4 — UI components

**Nuevos:**
- `OrgExecutiveReport` ([src/components/OrgExecutiveReport.jsx](src/components/OrgExecutiveReport.jsx) propuesto) — clone Nom35PersonalReport DNA
- `BurnoutBanner` (in-app cuando level≥warn)
- `BurnoutAlertDrawer` (detail con disclaimer + CTA Burnout Recovery)
- `ProgramTimeline` (recharts custom — gantt 28d con dots per session day)
- `ProgramReEvalPrompt` (mid-program PSS-4 modal)
- `TimeSeriesPanel` (recharts wrapper)
- `KAnonymitySuppression` (shell shared)

**Reuso directo:**
- OrgDashboard 8-cards
- PageHeader, KPITile, AdminTopbar, AdminSidebar
- Nom35DocumentClient (patrón window.print)
- WeeklyReport (DNA personal weekly)
- TemporalCharts, BioSparkline, ReadinessRing

### Capa 5 — Compliance + safety

**Item global a redactar UNA vez:**

```jsx
// src/components/legal/MedicalDisclaimer.jsx (nuevo)
"BIO-IGNICIÓN no es un dispositivo médico ni sustituye atención
profesional. Las señales de bienestar que muestra son indicadores
sugerentes, no diagnósticos. Si te encuentras en crisis, llama a
SAPTEL 800-290-0024 (México) o a tu profesional de salud mental."
```

Aplicar en:
- Burnout banner (Idea 2)
- Programa Burnout Recovery onboarding (Idea 3)
- Footer de OrgExecutiveReport (Idea 1) — en versión "qué muestra el reporte"

**K-anon enforcement audit:** test suite single test que verifique TODOS los endpoints de aggregation rechazan respuestas con n<5 (fuzz test). Asegura que ningún regresión re-introduzca leak.

**Audit logs nuevos:**
- `burnout.alert.shown` (con userId)
- `burnout.alert.acknowledged`
- `program.started` / `program.abandoned` / `program.completed`
- `org.executive_report.generated`
- `org.burnout_aggregate.viewed`

---

## TASK 7 — Estimación honesta

### 7.1 Por idea (rangos)

**Idea 1 — Reporte ejecutivo NOM-035:**
- Foundation existente: ~55 % (OrgDashboard 8-cards + aggregate API + CSV + Nom35DocumentClient con `window.print()` + Nom35PersonalReport DNA)
- Por construir: trends time-series, OrgExecutiveReport portada, drill-down team, pre/post programa cohort, email delivery cron, optional benchmarks
- **3–5 sem · $25–40 K USD eng + $5–10 K legal review final**

**Idea 2 — Burnout prediction temprana:**
- Foundation existente: ~60 % (burnout.js engine + instruments + chronotype + push infra + cron pattern)
- Por construir: HRV+chronotype signal integration, 2 endpoints `/me` + 1 `/orgs`, nightly cron burnout-scan, alert UI (banner + drawer), disclaimer, persistencia BurnoutScore, threshold-cambio dedup
- **4–6 sem · $30–50 K eng + $10–15 K validación clínica + $5–10 K legal**
- Caveat: bajar el claim de "30-60d anticipación" a "early-warning detection" (defendible)

**Idea 3 — Programas adaptativos:**
- Foundation existente: ~70 % (5 programas + state model + helpers + suggestion + push infra)
- Por construir: re-evaluación cron, program-reminder cron, bandit-alternates per day, adherence agregada B2B, chronotype-shift opcional, ProgramTimeline UI, re-engagement
- **3–4 sem · $20–35 K eng + $5–10 K curriculum review (opcional)**

### 7.2 Combo total estimado

**Si overlap se aprovecha (compartir buildUserSnapshot + cron pattern + UI primitives + disclaimers):**
- **Total eng: $80–125 K USD**
- **Tiempo: 3–4 meses con 1 senior + 1 mid full-time, o 5–6 meses con 1 senior**
- **Legal+clínico: $20–35 K adicional**
- **Total all-in: $100–160 K USD · 4–6 meses**

**Si las ideas se construyen aisladas (sin reuse):**
- $130–200 K eng · 6–9 meses

### 7.3 Order recomendado

| # | Idea | Razón |
|---|---|---|
| **1º** | **Idea 3 — Programas adaptativos** | 70 % foundation + payoff UX inmediato + crea data loop (más programas iniciados = más outcome data → mejor Idea 2 + mejor Idea 1 trends) |
| **2º** | **Idea 1 — Reporte ejecutivo** | OrgDashboard ya existe; 3-5 sem a portada B2B vendible. Es el revenue driver de B2B contracts. |
| **3º** | **Idea 2 — Burnout temprano** | Más complejo legal/clínico. Beneficia que Idea 3 ya esté en producción para que Burnout Recovery suggestion tenga UX completa de programa, no solo "te sugiero un programa que no existe bien" |

**Razonamiento del cambio respecto al sub-prompt original (que sugería 1 → 3 → 2):**
- Idea 1 vende mejor *con* trends pre/post programa
- Trends pre/post programa requieren que Idea 3 esté en producción (cohort de program-completers)
- Idea 2 vende mejor *con* CTA "Empezar Burnout Recovery" funcional → necesita Idea 3 robusta primero

### 7.4 Phase 6F vs 6G split sugerido

**Phase 6F (este trimestre):**
- Idea 3 completa (3–4 sem)
- Idea 1 v1 sin pre/post programa cohort (3 sem)
- Idea 2 backend + engine HRV+chronotype + endpoint /me/burnout (2 sem) — sin alert UI público

**Phase 6G (próximo trimestre):**
- Idea 1 v2 con pre/post programa cohort + benchmarks
- Idea 2 alert UI público + disclaimer + clinical review release
- (opcional) ML simple Phase 6H si N≥1000

---

## TASK 8 — Decisiones críticas pre-implementación (para el usuario)

### Para Idea 1 (NOM-035 ejecutivo)

1. **¿Mantener `nom035TextValidatedByLawyer = false` durante Phase 6F?** Si SÍ → reporte ejecutivo se vende como "preview interno", no evidencia STPS. Si NO → contratar legal review previo (~$5–15 K).
2. **¿PDF firmado digitalmente con e-firma SAT/PSC?** Recomendación: **NO** en Phase 6F — agrega 6+ sem y $$$. Mantener `window.print()` + firma manual del representante. Reabrir en Phase 6G si cliente Enterprise lo pide.
3. **¿K-anon ≥5 o ≥10?** Recomendación: **≥5** (consistente con resto del repo). Subir a ≥10 sólo si abogado lo exige para combinaciones sensibles (e.g. alto-riesgo en team de 10).
4. **¿Retención datos agregados?** Default actual `auditRetentionDays = 365`. NOM-035 STPS recomienda 5 años para evidencias. Decisión: añadir env `NOM35_AGG_RETENTION_DAYS = 1825` (5 años) sin afectar otras audit retentions.
5. **¿Industry benchmarks?** Recomendación: **omitir Phase 6F**. Cross-org aggregation legal complejo; usar solo "tu equipo vs hace 6 meses" como comparativa. Phase 6G evaluar curated stats STPS publicados.

### Para Idea 2 (Burnout temprano)

6. **¿Modelo A heurística vs B ML?** Recomendación firme: **A heurística** Phase 6F. B requiere N≥1000 + outcomes etiquetados. Reformular marketing como "early-warning de patrones" no "predicción 30-60d".
7. **¿Disclaimer requiere validación legal?** **Sí.** Redactar UNA versión estandarizada + lawyer review (~$3–8 K). Reusable en Idea 1 + Idea 3 también.
8. **¿Psicólogo/psiquiatra consultor?** **Sí, recomendado.** Engagement clínico mexicano (psicólogo ocupacional registrado STPS) ~$5–15 K review + $2–5 K/año retainer. Aval profesional reduce riesgo legal y mejora story B2B.
9. **¿Añadir MBI-9 o MBI-16 como instrumento formal?** Recomendación: **MBI-9 corto (Maslach 1996)** como instrumento opcional Phase 6G — durante Phase 6F mantener heurística que ya está. MBI tiene licencia comercial (~$0.50–$2/uso), evaluar costo.
10. **¿MAIA-2?** Recomendación: **NO añadir.** 32 ítems demasiada fricción; HRV+chronotype cubren la dimensión interoceptiva sin self-report.
11. **¿Alert level=alert envía push o solo banner in-app?** Recomendación: **ambos**, pero con throttle 1 push / 7 días para no spam. Banner persiste hasta acknowledgment.
12. **¿`/api/v1/me/burnout` requiere MFA?** Sí (consistente con MFA enforce en `/api/sync/*` + `/api/coach`). Push notification debe linkear a `/app/wellbeing` que requiere session activa.

### Para Idea 3 (Programas adaptativos)

13. **¿5 programas catálogo definitivo o expandir?** Recomendación: **mantener 5** Phase 6F. Catálogo cerrado simplifica QA + curriculum design + onboarding. Expandir a 10–15 en Phase 6G si data pide variedad.
14. **¿Re-evaluación cada 2 sem o cada sesión completada?** Recomendación: **cada 2 sem fija** mid-program para Burnout Recovery 28d (PSS-4 día 14). Programas <14d no necesitan re-eval mid-program.
15. **¿Push reminder PWA web-push o nativa iOS/Android?** Recomendación: **web-push (ya instalado)**. Nativa requiere app store presence — no en roadmap.
16. **¿Programas individuales o team-based B2B?** Recomendación: **individuales Phase 6F.** Team-coordinated programs (Schema nuevo + sync) postergar a Phase 6G+.
17. **¿Bandit-alternates per day o catálogo fijo?** Recomendación: **alternates per day en programs.js v2.** No requiere migración (es campo opcional); bandit elige entre `protocolPool` si está, sino usa el `protocolId` único.
18. **¿Adherence visible al manager B2B?** Solo agregada k≥5. Manager NUNCA debe ver "Juan completó 3/7 días". Solo "65% de tu equipo completó Focus Sprint".

### Globales (cross-idea)

19. **¿buildUserSnapshot() server-side priority?** **Sí construir primero.** Refactor que paga en las 3 ideas.
20. **¿Test E2E Playwright per idea?** Sí — Phase 6E ya estableció infraestructura. Cada idea = 1 spec con flow happy path + 1 con role-gate negativo.
21. **¿Audit-log threshold para alertas internas?** Si burnout-alerts > 100/día se disparan, ops debe saber (posible bug). Patrón: `auditLog.tick` ya existe, agregar dashboard observability.

---

## Compliance & legal posture summary

| Riesgo | Mitigación existente | Mitigación nueva requerida |
|---|---|---|
| Datos sensibles individuales visibles a manager | k≥5 enforced en libs | Test suite k-anon-fuzz |
| Diagnóstico médico implícito | burnout.js comenta "no diagnóstico" | Disclaimer UI + lawyer review |
| Predicción no respalda claim 30-60d | — | Reformular marketing copy |
| NOM-035 evidencia STPS sin DOF verified | flag `nom035TextValidatedByLawyer` | Mantener BORRADOR hasta lawyer review |
| Push spam | — | Throttle 7d burnout-alert dedup |
| Cross-org aggregation (benchmarks) | — | Postergar a Phase 6G post-legal |
| Data moat (anonymized aggregates como activo) | mencionado en memoria del usuario | Documentar en Phase 6F report |

---

## Anti-patterns a evitar (basado en historial del repo)

- ❌ **No introducir lib PDF** — patrón establecido es `window.print()` + `@media print` (Nom35DocumentClient)
- ❌ **No añadir UI inline-script sin nonce** — middleware.js requiere CSP nonce
- ❌ **No olvidar bump CACHE_VERSION** si manifest.json cambia (Idea 3 add program assets)
- ❌ **No olvidar bump STORE_VERSION** si schema activeProgram cambia (Idea 3 alternates)
- ❌ **No reescribir page.jsx** (55 KB legacy) — extraer a hooks
- ❌ **No commit .env*** — `CRON_SECRET`, `ANTHROPIC_API_KEY`, `NOM35_DOF_VERIFIED` deben ir vía Vercel env
- ❌ **No usar emojis ni glifos genéricos** (memoria DNA)
- ❌ **No mockar DB en tests integración** (memoria si aplica)
- ❌ **No re-introducir setTimeout cliente para push** (memoria — Phase 2 estableció PushOutbox)
- ❌ **No prometir "delete all data"** sin caveat (data moat strategy memoria)

---

## Anexo A — Tablas que NO son relevantes para las 3 ideas

Modelos en schema.prisma que pueden ignorarse: `PhoneOtp`, `MfaResetRequest`, `TrustedDevice`, `Account` (NextAuth), `Session` (NextAuth), `VerificationToken`, `Station`, `StationTap`, `Incident`, `IncidentUpdate`, `Notification` (in-app, distinto a PushOutbox), `MaintenanceWindow`, `IncidentSubscriber`, `Webhook`, `WebhookDelivery`, `ApiKey`, `Integration`, `SupportTicket`, `Impersonation`, `StripeEvent`.

## Anexo B — Estimación combo final

| Variante | Eng | Legal+clínico | Total | Tiempo |
|---|---|---|---|---|
| **Recomendada** (1 senior + 1 mid, reuse máximo) | $80–125 K | $20–35 K | **$100–160 K** | **4–6 meses** |
| Conservadora (1 senior solo) | $90–135 K | $20–35 K | $110–170 K | 6–9 meses |
| Pesimista (3 ideas aisladas, poco reuse) | $130–200 K | $25–40 K | $155–240 K | 7–10 meses |

---

## Próximos pasos sugeridos

1. **El usuario revisa este documento y responde §8 decisions** (al menos 1–6, 8, 13, 14, 17, 19).
2. Una vez decidido, abrir **Phase 6F SP-A** = `buildUserSnapshot` server-side + Idea 3 backend (re-eval + program-reminder cron + bandit-alternates schema).
3. **Phase 6F SP-B** = Idea 3 UI (ProgramTimeline + ProgramReEvalPrompt) + adherence agregada B2B.
4. **Phase 6F SP-C** = Idea 1 backend (trends time-series + pre/post cohort) + OrgExecutiveReport portada.
5. **Phase 6F SP-D** = Idea 2 engine (HRV + chronotype signals) + endpoint `/me/burnout` + nightly cron.
6. **Phase 6F SP-E** = Idea 2 UI (banner + drawer + disclaimer) — bloqueado en lawyer + clinical review.

---

**Fin del reconnaissance. Cero líneas de código modificadas.**
