# FINAL_FRONTEND_REQUIREMENTS.md — Blueprint funcional para reconstrucción frontend

**Fecha:** 2026-05-01.
**Audiencia:** asesor externo + reconstrucción frontend Phase 3.
**Reglas:** este es el blueprint **funcional**, no visual. Lista pantallas, datos que consume, acciones que permite, jerarquía sugerida — sin prescribir layout, color o motion.

---

## 1. Pantallas necesarias (mínimo viable post-Phase 2)

### PWA `/app/*` (B2C operador)

| Pantalla | Pregunta canónica que responde | Audiencia | Datos que consume | Acciones |
|---|---|---|---|---|
| `/app` (home) | "¿Qué hago ahora?" + "¿Cómo está mi sistema?" — DECISIÓN PENDIENTE (DECISION_POINTS.md #1) | B2C | bandit recommendation + engine-health summary + active program | Tap orb, ver coach, ver historial |
| `/app/session/[id]` | "¿Cómo va esta sesión?" | B2C | protocol fases + audio/haptic/voice + timer | Pausar, abandonar, completar |
| `/app/profile` | "¿Quién soy en BIO-IGNICIÓN?" | B2C | V-Cores, level, streak, achievements, baseline, instruments | toggle settings, editar avatar |
| `/app/calibration` | "¿Estoy calibrado?" | B2C | chronotype, resonance, HRV baseline | re-test individual o todo |
| `/app/programs` | "¿Qué journey hago?" | B2C | catálogo + active program | start, complete day, abandon |
| `/app/coach` | "Acompáñame ahora" | B2C | streaming SSE + coach quota status | enviar mensaje, ver quota mensual |
| `/app/history` | "¿Qué ha pasado conmigo?" | B2C | sessions log, mood trend, HRV trend | filtrar por intent/protocolo |
| `/app/instruments` | "Mis evaluaciones" | B2C | PSS-4, SWEMWBS-7, PHQ-2 latest | take new evaluation |
| `/app/nom35` | "Mi NOM-035" | B2C | last response + nivel | start new evaluation |
| `/app/engine-health` | "¿Qué tan inteligente está mi motor?" | B2C | `evaluateEngineHealth` snapshot | n/a (read-only) |
| `/app/notifications` | "Notificaciones" | B2C | Notification inbox + push subs | mark read, manage subs |
| `/app/settings` | "Ajustes" | B2C | preferences | toggle voz/audio/haptic/etc, MFA, sessions, DSAR, export |

### Admin B2B `/admin/*` (24 páginas pre-existentes)

| Pantalla | Pregunta canónica | Audiencia | Datos | Acciones |
|---|---|---|---|---|
| `/admin` (overview) | "¿Cómo está mi org?" | OWNER/ADMIN | counts, ROI estimate, billing status | drill-down |
| `/admin/members` | "Miembros" | OWNER/ADMIN | memberships + roles | invite bulk, remove, change role |
| `/admin/teams` | "Equipos" | OWNER/ADMIN | teams + manager | create/manage |
| `/admin/sso` | "SSO config" | OWNER | provider + ssoDomain + verify | configure, verify domain |
| `/admin/billing` | "Plan + facturas" | OWNER | plan, trial, dunning, invoices | upgrade, portal, cancel |
| `/admin/audit` | "Audit log" | OWNER/ADMIN | rows + verify status + retention | search, export, verify, prune |
| `/admin/security` | "Policies" | OWNER | requireMfa, ipAllowlist, sessionMaxAge | edit policies |
| `/admin/security/sessions` | "Sesiones miembros" | OWNER/ADMIN | UserSession por org | revoke per device |
| `/admin/api-keys` | "API keys" | OWNER/ADMIN | keys con scopes/expiry/lastUsed | create, rotate, revoke |
| `/admin/webhooks` | "Webhooks" | OWNER/ADMIN | hooks + deliveries history | create, rotate secret, test, view deliveries |
| `/admin/integrations` | "Integraciones" | OWNER/ADMIN | Slack/Teams/Okta/Workday config | enable, test |
| `/admin/branding` | "Branding" | OWNER | logo, colors, customDomain, **coachPersona** (NUEVO oportunidad) | upload, verify domain |
| `/admin/stations` | "Stations físicas" | OWNER/ADMIN | Station + StationTap stats | create, rotate signing key |
| `/admin/neural` | "Salud del motor neural org" (NUEVO Phase 2 endpoint) | OWNER/ADMIN/MANAGER | `computeOrgNeuralHealth` + `computeProtocolEffectiveness` | drill-down por protocolo |
| `/admin/compliance` | "Compliance pack" | OWNER/ADMIN | snapshot config + audit verify status + DSAR counts | export pack, resolve DSAR |
| `/admin/compliance/dsar` | "DSAR queue" | OWNER/ADMIN | DsarRequest list por status | approve, reject |
| `/admin/nom35` | "NOM-035 org" | OWNER/ADMIN/MANAGER | aggregate scores + nivel distribution | export CSV, generate documento oficial |
| `/admin/nom35/documento` | "Documento STPS" | OWNER/ADMIN | aggregate + niveles + recomendaciones | download PDF firmado |
| `/admin/health` | "Status interno" | platform admin | health metrics | n/a |
| `/admin/incidents` | "Incidents" | platform admin | Incident list | create, update status |
| `/admin/maintenance` | "Maintenance windows" | platform admin | windows | schedule, complete |
| `/admin/onboarding` | "Onboarding wizard" | OWNER nuevo | step state | next step |
| `/admin/coach-usage` (NUEVO) | "Cuánto coach LLM consumimos" | OWNER/ADMIN | `CoachUsage` agregado | filter month, drill-down user |

### Settings (`/settings/*`)

| Pantalla | Función |
|---|---|
| `/settings/security/mfa` | TOTP setup + backup codes + trusted devices |
| `/settings/sessions` | UserSession list + revoke |
| `/settings/sso` | SSO config (alias del admin para users con permisos) |
| `/settings/data-requests` | DSAR autoservicio |
| `/settings/neural` | preferencias del motor (cohort opt-out, etc) |

### Auth shell
- `/signin` (Phase 1 already 10/10 approved per memory)
- `/signup`
- `/recover`
- `/verify`
- `/mfa`
- `/accept-invite/[token]`
- `/account`

### Marketing (existente, NO reescrito en Phase 3)
- `/`, `/why`, `/pricing`, `/demo`, `/evidencia`, `/trust/*`, `/changelog`, `/status`, `/learn/*`, `/for-*`, `/vs/*`, `/roi-calculator`, `/aup`, `/cookies`, `/privacy`, `/terms`, `/team-preview`, `/kit`, `/docs`, `/share`, `/nom35` (público), `/reporte`

---

## 2. Componentes compartidos (mínimo)

| Componente | Propósito | Notas Phase 2 |
|---|---|---|
| `<Orb>` | core interactivo de la sesión | mantener |
| `<BreathOrb>` | guide visual de respiración | mantener |
| `<ReadinessRing>` | composite 0-100 con sub-rings | mantener |
| `<HRVMonitor>` | live HRV display BLE/PPG | mantener |
| `<NeuralRadar>` | radar chart de dimensiones | mantener |
| `<TemporalCharts>` | sparklines de mood/HRV | mantener |
| `<EngineHealthCard>` (NUEVO) | render del `evaluateEngineHealth` snapshot | **construir** |
| `<ProtocolEffectivenessTable>` (NUEVO) | render con CI95 + Cohen's d para `/admin/neural` | **construir** |
| `<CoachQuotaBadge>` (NUEVO) | "X/100 mensajes este mes" | **construir** |
| `<MfaGateBanner>` (NUEVO) | si endpoint devuelve 403 mfa_required, render banner step-up | **construir** |
| `<NotificationToast>` | display de in-app notifications | mantener |
| `<CommandPalette>` | quick actions cmd+k | mantener |
| `<BookDemoDrawer>` | marketing | mantener |
| `<PartnerApplyModal>` | marketing | mantener |
| `<StreakCalendar>` | mantener |
| `<AchievementBadge>` | mantener |
| `<ProtocolDetail>` | mantener |
| `<ProtocolSelector>` | mantener |
| `<CalibrationPlan>` | mantener |
| `<NeuralCoach>` | mantener; respect coach quota |
| `<SettingsSheet>` | mantener |
| `<HistorySheet>` | mantener |
| `<PostSessionFlow>` | mantener |
| `<NSDR>` | mantener |
| `<InstrumentRunner>` | mantener |
| `<NOM035Questionnaire>` | mantener |
| `<Nom35PersonalReport>` | **AÑADIR** disclaimer "texto pendiente validación legal vs DOF" hasta `nom035TextValidatedByLawyer=true` |

---

## 3. Patrones de interacción

### 3.1 Sync flow (PWA → server)
- **Request:** `POST /api/sync/outbox` con CSRF + idempotency-key opcional.
- **Phase 2 nuevo path:** si MFA gate falla → 403 `mfa_required` + `X-MFA-Required: true`. Frontend muestra step-up MFA dialog, después reintenta. Si user no completa MFA, queue local sigue acumulando (offline-first).
- **Response 5xx:** retry exponencial cliente con cap de 5 intentos.

### 3.2 Coach LLM streaming
- **Request:** `POST /api/coach` con SSE.
- **Pre-check cliente:** evaluar `coachSafety.evaluateSafetySignals(state, {userText})`. Si `level=crisis`, NO mandar al LLM, mostrar resources.
- **Phase 2 path:** si quota agotada → 429 + body `{plan, max, used, period}`. Frontend muestra banner "Has usado X/Y mensajes este mes. Upgrade plan o espera al próximo mes."

### 3.3 Push subscription
- **Cliente:** `Notification.requestPermission()` → `pushManager.subscribe(applicationServerKey)`.
- **Persistencia:** `POST /api/push/subscribe` con endpoint + p256dh + auth keys.
- **Server-side delivery (Phase 2):** server llama `enqueuePush(userId, msg)` → cron drena → web-push real cross-device.

### 3.4 NOM-035 application
- **Cliente:** 72 ítems progress bar.
- **Submit:** `POST /api/v1/nom35/responses` con `{answers}`.
- **Server recompute** de scoring (cliente NO confía en su propio scoring).
- **Response:** nivel + recomendación + porDominio.

---

## 4. Service Worker behaviors esperados

| Comportamiento | Implementado | Phase 2 cambio |
|---|---|---|
| Offline cache de shell + assets | sí | no |
| Offline fallback HTML | sí | no |
| Background sync API | sí | no |
| Periodic Sync API (Chrome) | sí | no |
| Push event handler | sí | **mejorar:** ahora hay sender server-side real, push event handler debe manejar payload `{title, body, href, kind}` y mostrar `Notification.show()` |
| Notification click → open `/app/...` | sí | no |
| SW update notification | sí | no |
| Cache version bump on manifest change | requirement | sin cambio |

---

## 5. Offline capabilities requeridas

| Capacidad | Estado |
|---|---|
| Sesión completa offline | sí (lib + protocols + audio están en cache) |
| Mood/HRV log offline | sí (IDB + outbox) |
| Sesión sync diferida cuando vuelve online | sí |
| Coach LLM offline | NO (require server) — UI muestra "necesitas conexión" |
| Instrumentos offline | sí |
| NOM-035 offline | sí (scoring puede ser local; server recompute al sync) |
| Programs day-tracking offline | sí |
| Notifications inbox offline | parcial (read cached) |

---

## 6. Performance targets (Core Web Vitals)

| Métrica | Target |
|---|---|
| LCP | <2.5s (mobile 4G) |
| FID / INP | <200ms |
| CLS | <0.1 |
| TTI | <3.5s |
| Bundle size /app entry | <200 KB compressed (objetivo, hoy probable >300 KB por monolítico) |

**Phase 2 sin cambios** — performance es trabajo de la reconstrucción frontend.

---

## 7. Accesibilidad targets

- WCAG 2.1 AA mínimo.
- Contraste ratio ≥4.5:1 para texto normal, ≥3:1 para large text.
- Focus visible siempre (no `outline: none` sin alternativa).
- Keyboard nav completa (Tab, Enter, Escape, Arrow keys).
- ARIA labels en componentes custom (Orb, ReadinessRing, etc.).
- `prefers-reduced-motion` respetado (overridable per `reducedMotionOverride`).
- Screen reader friendly transcripts para audio TTS.
- Vibration patterns con fallback a visual feedback.

---

## 8. Internacionalización (i18n)

12 locales soportados: es, en, pt, fr, de, it, nl, ja, ko, zh, ar, he.
- RTL: ar, he.
- Plurales ICU vía `Intl.PluralRules`.
- Fallback chain: locale específico → es → en → key literal.
- Fechas/números/relativas con `Intl.*` helpers (`fmtDate`, `fmtNumber`, `fmtRelative`, `fmtCurrency`).

**Gap:** completitud por locale no auditada — probable es/en completos, otros parciales. Phase 3 follow-up.

---

## 9. Data flows críticos

### 9.1 PWA boot
```
1. SW activa.
2. layout.js → renders <html lang>.
3. /app/page.jsx mount.
4. <ProfilePill> awaits /api/auth/session (cookie cached, no DB).
5. useStore.init({userId}) → loadState() IDB → migrate to v14.
6. If unauthenticated → continue as anonymous (offline-only).
7. If authenticated → fetch /api/sync/state to hydrate (Phase 2: MFA gate may block; UI degrades gracefully).
8. Background: useSync registers wireBackgroundSync listener.
```

### 9.2 Session run
```
1. User taps orb.
2. computeAdaptiveRecommendation(state) → bandit selectArm → protocol.
3. Countdown 3-2-1.
4. Audio engine load + unlock + play.
5. Phase loop 250ms tick.
6. comp() at sec=0 → sessionMetrics + sessionDelta.
7. compositeReward (Phase 2: HRV-only fallback if mood-post absent).
8. recordSessionOutcome → bandit update.
9. PostSessionFlow check-in → outboxAdd.
10. Sync drain → /api/sync/outbox.
```

### 9.3 Coach query
```
1. User types message.
2. coachSafety.evaluateSafetySignals(state, {userText}). If crisis → show resources, abort.
3. Build coachContext from userMemory.
4. POST /api/coach (Phase 2: MFA gate + quota gate).
5. If 403 mfa_required → step-up MFA dialog, then retry.
6. If 429 quota_exceeded → upgrade banner.
7. SSE stream → render incremental.
8. Done → close stream.
```

### 9.4 NOM-035 submit
```
1. User completes 72 items.
2. POST /api/v1/nom35/responses.
3. Server recomputes scoreAnswers.
4. Persist Nom35Response.
5. Return nivel + porDominio + recomendacion.
6. UI shows result + "ver reporte" link.
```

---

## 10. Estado y persistencia

- **Cliente:** Zustand `useStore` (513 lines actualmente, refactor target en Phase 3).
- **IDB encrypted** con AES-GCM 256.
- **Sync server:** `User.neuralState` JSON + `NeuralSession` table.
- **Tablas dedicadas pendientes Sprint 6+:** HrvSample, MoodSample.
- **Cohort prior** consumido vía `/api/v1/me/neural-priors`.

---

## 11. Componentes ya construidos que la reconstrucción puede REUSAR

(Catálogo en `src/components/*` — 141 componentes. Phase 3 NO reescribe lógica de cálculos, solo presentación):

- BioIcons (catálogo de SVG icons custom)
- BioIgnicionMark
- BioIgnitionWelcome (onboarding)
- BioSparkline
- BreathOrb
- CalibrationPlan
- ChronotypeTest
- CommandPalette
- ConsentBanner
- DashboardView
- HRVCameraMeasure
- HRVHistoryPanel
- HRVMonitor
- HRVValidationLab
- HistorySheet
- IgnitionBurst
- InstallBanner
- InstrumentDueCard
- InstrumentRunner
- NOM035Questionnaire
- NSDR
- NeuralCalibration
- NeuralCoach
- NeuralRadar
- Nom35PersonalReport (con disclaimer Phase 2 a añadir)
- OrgDashboard
- PostSessionFlow
- ProgramBrowser
- ProtocolDetail
- ProtocolSelector
- ReadinessRing
- ReadinessScore
- RemindersCard
- ResonanceCalibration
- SessionRunner
- SettingsSheet
- StatusPulse
- StreakCalendar
- StreakShield
- TemporalCharts
- WeeklyReport

---

## 12. Lo que la reconstrucción frontend NO debe hacer

- ❌ Reescribir lógica del motor neural (vive en `lib/neural/*`, ya cubierta por tests).
- ❌ Reescribir scoring NOM-035 (vive en `lib/nom35/*`).
- ❌ Reescribir HRV pipeline (vive en `lib/hrv-camera/*`).
- ❌ Reescribir audio engine (vive en `lib/audio.js`, 1646 líneas).
- ❌ Reescribir storage layer (vive en `lib/storage.js`).
- ❌ Reescribir sync merge (vive en `server/sync-merge.js`).
- ❌ Reescribir coach safety (vive en `lib/coachSafety.js`).
- ❌ Romper API contracts existentes — nuevos endpoints solo aditivos o `/v2/`.

## 13. Lo que la reconstrucción frontend SÍ debe hacer

- ✅ Refactor `useStore.js` (huge, in-progress hooks extraction).
- ✅ Refactor `page.jsx` (58 KB monolítico) en route groups.
- ✅ Build `/app/engine-health` page (NUEVO Phase 2).
- ✅ Build `<EngineHealthCard>`, `<ProtocolEffectivenessTable>`, `<CoachQuotaBadge>`, `<MfaGateBanner>` components.
- ✅ Build `/admin/coach-usage` quota dashboard.
- ✅ Add disclaimer to `<Nom35PersonalReport>` until `nom035TextValidatedByLawyer=true`.
- ✅ Implement step-up MFA dialog flow when endpoints return 403 `mfa_required`.
- ✅ Implement quota-exceeded banner when coach returns 429.
- ✅ Update SW push event handler to handle Phase 2 payload schema.
- ✅ Resolver inconsistencias de naming ("sesión / pulso / ignición / tap" → uno solo).
- ✅ Resolver caos de scores (V-Cores, Mood, Readiness, BioSignal, Composite, etc.) con mental model claro (ver DECISION_POINTS.md #2).
