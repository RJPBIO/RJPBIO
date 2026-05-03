# ANALYSIS_FEATURES_GAPS.md — Features actuales vs prometidas vs oportunidades

**Fecha:** 2026-05-01 · **Reglas:** "construido y conectado" o "construido sin uso real" o "prometido sin código".

> **Confirmaciones que sobreescriben audits previos:** NOM-035 sí recomputa server-side, wearable HMAC sí es per-provider. Estos audits previos pesimistas estaban incorrectos.

---

## 1. PWA / dominio neural — features completas

| Feature | Estado | Evidencia |
|---|---|---|
| 14 protocolos active + 3 training (10 min) + 3 crisis | Completo | `src/lib/protocols.js`, 20 entries con citas científicas, iExec scripts, breath cycles, safety variants |
| Audio engine binaural + chord + music + TTS + haptics | Completo | `src/lib/audio.js` 1646 líneas |
| Bandit UCB contextual + decay dual + cohort prior | Completo | `src/lib/neural/bandit.js`, `coldStart.js` |
| Residuales + bias correction per-arm | Completo | `src/lib/neural/residuals.js` |
| Cold-start prior bayesiano | Completo | `coldStart.js` con BASELINE_BY_BUCKET |
| Staleness detection (5 niveles) + recalibration | Completo | `staleness.js` |
| Pause-fatigue detection | Completo | `pauseFatigue.js` |
| Anti-gaming v2 multi-signal scoring | Completo | `antiGaming.js` |
| Engine health introspección per-user | Completo | `health.js` |
| Org neural health agregado | Completo | `orgHealth.js` |
| HRV BLE strap | Completo | `ble-hrv.js` |
| HRV cámara PPG (filter / peaks / SQI / metrics) | Completo | `hrv-camera/*` |
| NOM-035 STPS Guía III, 72 ítems | Completo, server-recompute | `nom35/*` |
| Cronotipo MEQ-SA | Completo | `chronotype.js` |
| Resonancia respiratoria (5 ensayos BLE) | Completo | `resonance.js` |
| Coach LLM Anthropic streaming | Completo, vivo | `/api/coach/route.js`, `coach-prompts.js`, `coachSafety.js`, `coachMemory.js` |
| Coach safety (crisis/soft + PHQ-2 + PSS-4 + recursos por locale) | Completo | `coachSafety.js` |
| 3 instrumentos psicométricos PSS-4 / SWEMWBS-7 / PHQ-2 | Completo | `instruments.js` |
| Programs multi-día curados | Completo (5+ programas) | `programs.js` (Neural Baseline 14d, Recovery Week 7d, Focus Sprint 5d, Burnout Recovery, Executive Presence) |
| Sync outbox + IDB cifrado + cross-tab broadcast | Completo | `storage.js`, `sync.js`, `useStore.js` |
| `mergeNeuralState` server-side correcto | Completo | `sync-merge.js` |
| Service Worker v6 + offline + background sync | Completo | `public/sw.js` |
| 18 hooks reutilizables con tests | Completo | `src/hooks/*` |
| Tap-to-Ignite NFC/QR + HMAC + replay-guard + slot policy | Completo | `stationSig.js`, `stationSlot.js` |

---

## 2. Auth / sesiones — features completas

| Feature | Estado |
|---|---|
| NextAuth v5 JWT strategy 8h | Completo |
| OIDC Google/Azure/Okta/Apple condicionales | Completo |
| Magic-link via nodemailer + branded emails | Completo (⚠ console fallback en prod = secret leak) |
| Phone SMS-OTP Twilio | Completo |
| WebAuthn / passkeys | Completo |
| TOTP MFA RFC 6238 | Completo |
| Backup codes scrypt | Completo |
| Trusted-device cookie 30d | Completo |
| MFA reset autoservicio + admin resolve | Completo |
| DB-backed UserSession + lazy revoke 60s | Completo |
| sessionEpoch++ logout-all | Completo |
| Personal-org auto-provisioning idempotente | Completo (Sprint 93 race fix) |

---

## 3. B2B / multi-tenant — features completas

| Feature | Estado |
|---|---|
| Multi-org + Membership + 5 roles | Completo |
| Teams dentro de org | Completo |
| Invitations bulk + token + expiry | Completo |
| SCIM 2.0 (Users/Groups/ResourceTypes/Schemas/SPC) | Completo (gap: paginación + bulk + sortBy) |
| SSO/SAML/OIDC por org + ssoDomain unique + discovery | Completo (gap: SAML signed assertion validation **no visible** — riesgo crítico) |
| Branding por org (logo, colors, customDomain, coachPersona) | Schema OK, propagación parcial |
| Custom domain DNS verify (TXT) | Completo, sin re-check automático |
| Audit log hash chain + retention configurable + verify CLI | Completo (S3 export es placeholder) |
| DSAR (Art 15/17/20) | State machine completa, hard-delete grace **no ejecuta** |
| Org security policies (requireMfa / sessionMaxAge / ipAllowlist) | Completo (⚠ requireMfa solo en `/admin`, no `/app` ni `/api/sync/*`) |
| Impersonation HMAC + audit + hard expiry | Completo |
| API keys con scopes + expiry + lastUsedIp + rotación | Completo (gap: scope enforcement runtime no visible) |
| Webhooks HMAC + secret rotation overlap + retry exponencial | Completo |
| Stations físicas HMAC + nonce replay-guard + slot policy | Completo |
| Stripe billing 5 planes + checkout + portal + webhook + dunning + grace | Completo |

---

## 4. Compliance — estado verificado

| Item | Estado real |
|---|---|
| **NOM-035 server-recompute** | ✅ COMPLETO (`responses/route.js:63`) — audit anterior estaba mal |
| **Wearable HMAC per-provider** | ✅ COMPLETO (`wearables.js`, 5 secrets env distintos) — audit anterior estaba mal |
| **K-anonymity ≥5 en agregados** | ✅ COMPLETO (`aggregateScores`, `computeOrgNeuralHealth`, `computeProtocolEffectiveness`) |
| **DSAR auto-resolve ACCESS/PORTABILITY** | ✅ COMPLETO |
| **DSAR ERASURE admin approval + soft-delete** | ⚠ PARCIAL — `User.deletedAt` set, **no hay sweeper que hard-delete tras 30d** |
| **DSAR cascade al revocar** | ❌ INCOMPLETO — borrar user no revoca API keys, webhooks, sessions del user |
| **Audit chain SHA-256 + HMAC seal** | ✅ COMPLETO |
| **Audit retention prune** | ⚠ PARCIAL — función existe, **no hay cron** que la dispare |
| **Audit S3 Object Lock WORM** | ❌ PLACEHOLDER (línea 25-28 `audit-export.js` lo admite) — para SOC2 hay que implementarlo |
| **`audit-export.js` función rota** | ⚠ BUG LATENTE — `db().auditLog` sin `await db()` (línea 13) |
| **`requireMfa` en `/app` PWA** | ❌ NO ENFORCE — solo en `/admin` |
| **IP allowlist IPv4-only** | Decision documentada, IPv6 deferred |
| **Magic-link console fallback en prod** | ⚠ riesgo de secret leak en logs |
| **`User.deletedAt` index** | ❌ FALTANTE |
| **`WearableEvent.userId onDelete:SetNull`** | ❌ Genera huérfanos vs Art 17 |

---

## 5. Marketing / sitio público

- 8 verticales B2B (`/for-aviation` … `/for-tech`).
- 3 versus pages (`/vs/calm`, `/vs/headspace`, `/vs/modern-health`).
- 3 learn articles.
- 4 trust pages (`/trust`, dpa, sso, subprocessors).
- ROI calculator.
- Pricing con `PRICE_PEEK`, partner program.
- BookDemoDrawer + PartnerApplyModal.
- AnnouncementBar + InstallBanner.
- Sitemap + opengraph.

**Completas en código.** Calidad visual está bajo refactor agresivo (cosmética PWA E1-E21 + cascade global completados, marketing reciente).

---

## 6. Status page + incidents + maintenance

- Modelos `Incident`, `IncidentUpdate`, `MaintenanceWindow`, `IncidentSubscriber` completos.
- `/api/v1/incidents`, `/api/v1/maintenance`, `/api/status/{verify,unsubscribe,subscribe}`.
- RSS feed conceptual (`incidentToRssItem` existe pero ruta `/status/feed.xml` a confirmar).

**Gaps:**
- `MaintenanceWindow.notifiedT24` / `notifiedT0` / `notifiedComplete` flags existen pero **nadie los dispara** — sin job queue, las notificaciones T-24/T-0 son aspiracionales.
- `IncidentSubscriber` filtrado por componente correcto, pero broadcast requiere worker que recorre subscribers — sin worker, manual.

---

## 7. Coach LLM — vivo y bien

- Endpoint `/api/coach` activo, streaming SSE Anthropic.
- Modelo `claude-sonnet-4-6` hardcoded (debería leer `process.env.COACH_MODEL`).
- Prompt cache `cache_control: ephemeral`.
- Sanitization input + 50 mensajes max + 4000 chars/turn.
- Safety library con CRISIS_PATTERNS / SOFT_PATTERNS / PHQ-2 / PSS-4 + recursos por locale.
- Memory `coachMemory.buildCoachContext` agrega lastSession, recentIntents, favoriteProtocols, worstProtocols, moodTrajectory, instruments latest, chronotype, resonanceFreq.

**No es feature flag muerta.** Funciona end-to-end si `ANTHROPIC_API_KEY` está set.

**Gaps:**
- No hay quota/budget mensual por org → costo runaway potencial.
- No persiste conversaciones cross-device.
- `org.branding.coachPersona` se usa en system prompt, **pero no hay UI en `/admin/branding` para editarlo** (campo huérfano).
- No está plan-gated — un FREE seat puede usar Coach.

---

## 8. Wearables — webhook ingest sin OAuth user-flow

- Webhook ingress completo para Whoop / Oura / Garmin / Apple / Fitbit con HMAC per-provider.
- Pero **no hay OAuth flow** para que un usuario conecte su cuenta de Whoop/Oura/etc.
- `WearableEvent.userId` queda `null` en mayoría de inserts (no hay matching `userExt → User.id`).
- "Reconciliation job" mencionada en comentarios pero **no existe**.

**Veredicto:** los webhooks reciben datos pero quedan colgados. La feature "conecta tu Whoop" es teatro de marketing — el código no lo soporta. **Brecha vs marketing.**

---

## 9. Integraciones (Slack/Teams/Okta/Workday)

- Modelo `Integration` con `provider` + `config` JSON, endpoint `/api/v1/integrations/test` que dry-run por provider (Slack `/api/auth.test`, Okta `/api/v1/users?limit=1`).
- **Pero:** no hay `dispatchToSlack` / `dispatchToTeams` server-side. No hay event subscriber que postee mensajes a Slack cuando pasa X.
- Slack/Teams notifications mencionadas en marketing → **no implementadas** (aunque webhooks customs sí permiten al cliente hacerlo manualmente).

---

## 10. Push notifications

- `PushSubscription` model, endpoints subscribe/unsubscribe/resubscribe.
- Sprint 91 fix: `subscribePush()` cliente sí postea al server (antes era teatro).
- VAPID keys via env.
- **Gap crítico:** no hay `POST /api/push/send` ni cron que envíe push al server. Reminders son `setTimeout` cliente-only — funcionan solo si la PWA está abierta.
- **Server-side push delivery: NO EXISTE.** El stack de subscriptions está listo, falta el sender + cron.

---

## 11. Email (transactional)

- Postmark/SES via nodemailer, console fallback.
- Branded templates (`renderEmailHTML`, `renderCtaButton`, `escapeHtml`).
- `/admin/dsar/{id}/resolve` notifica al user con email branded.
- Magic-link branded por org si `customDomainVerified`.

**Sólido.** Único riesgo: console fallback en prod → secret leak.

---

## 12. SMS

- `/api/auth/phone/{send,verify,status}` con Twilio.
- Console fallback dev/staging.
- `PhoneOtp` con HMAC hash + TTL + attempts counter.
- Auto-detect: console / Twilio / disabled.

Sólido.

---

## 13. i18n (12 locales)

- `es / en / pt / fr / de / it / nl / ja / ko / zh / ar / he` (12 archivos en `src/lib/locales/`).
- `t(key, vars)` resuelve fallback es → en → key.
- Plurales ICU + Intl helpers (fmtDate, fmtNumber, fmtRelative, fmtCurrency).
- RTL para ar/he.
- `i18n.test.js` cubre resolution básica.

**Gap:** completitud por locale **no auditada** en este analysis. Probable: es/en completos, otros parciales. Revisable contando keys faltantes.

---

## 14. Analytics

- `analytics-anonymize.js` aplica k-anonymity a sesiones agregadas para reportes B2B.
- `/api/v1/analytics` (a confirmar — no leído directamente).
- Sentry instrumentado.
- OpenTelemetry SDK importado pero requiere `OTEL_EXPORTER_OTLP_ENDPOINT` para exportar.
- Custom logger condicional.

---

## 15. Features muertas o fantasma

| Feature | Tipo | Veredicto |
|---|---|---|
| Push notifications server-side | **Muerta** — infra lista, sender no existe | Fácil de wire si hay cron |
| `MaintenanceWindow.notifiedT24/T0` triggers | **Muerta** — flags existen, nadie los flip | Sin queue/cron |
| `IncidentSubscriber` broadcast a webhooks/emails | **Muerta** — schema y validación OK, no hay worker | Sin queue |
| Trial-end reminders | **Muerta** — `trialEndsAt` set, no hay sweeper | Sin cron |
| DSAR expiry sweeper | **Muerta** — función existe, no se llama | Sin cron |
| DSAR hard-delete tras 30d | **Muerta** — soft-delete OK, hard-delete falta | Sin cron + sin lib `eraseUserData(userId)` |
| Audit retention prune sweep | **Muerta** — función existe, no se llama | Sin cron |
| Audit chain verify scheduled | **Muerta** — `verifyChain` callable, no se llama | Sin cron |
| Audit S3 Object Lock | **Placeholder** explícito | Implementar AWS SDK PutObject |
| `src/server/audit-export.js:13` | **Bug** — falta `await db()` | Probablemente roto |
| Wearable OAuth user-flow | **Fantasma** — webhook ingest sí, OAuth no | Implementar OAuth per-provider |
| Slack/Teams dispatcher | **Fantasma** — `Integration` config OK, dispatcher no existe | |
| `org.branding.coachPersona` UI editor | **Fantasma** — campo se usa en prompt, no hay form | |
| `/coach` plan-gating | **Gap** — abierto a FREE | |
| `coach.usage` quota | **Gap** — costos sin límite per org | |
| Coach `COACH_MODEL` env honored | **Gap** — modelo hardcoded | |
| `_preview/welcome` ruta interna | **Muerta** — preview interno no público | |
| `preview-runner.html` archivo en raíz | **Muerta** — preview UI antiguo |
| `progDay` legacy (Sprint 77) | **Deprecada en código**, schema sobrevive |

---

## 16. Features prometidas en marketing pero NO en código

| Claim marketing | Estado código |
|---|---|
| "Connect your Whoop / Oura / Fitbit" | webhook ingest sí, OAuth user-flow NO |
| "Slack & Teams notifications" | Integration config, no dispatcher |
| "Annual pentest + SOC 2 Type II" | claim, no auditable en código (audit-export S3 placeholder) |
| "BAA firmable enterprise" | sin flow de firma |
| "Demo en vivo · 30 min" | `/demo` form sí, integración Calendly no visible |
| "−24h export" | `/api/v1/users/me/export` sí, "<24h" es SLA verbal |
| "IPv6 IP allowlist" | deferred explícitamente |
| "Custom DPA Enterprise" | feature flag, no DPA template system |
| "Multi-language status page" | incidents.js genera labels es/en, status page UI no auditada |
| "Data residency Enterprise" | feature flag, no geo-fencing storage |

---

## 17. Datos disponibles en backend que NO se exponen al frontend

(Críticas para Fase 2/3 sin necesidad de datos nuevos)

| Dato/cálculo | Dónde vive | Oportunidad |
|---|---|---|
| `evaluateEngineHealth` per-user | `lib/neural/health.js` | Endpoint `/api/v1/me/neural-health` + UI "estado de tu motor" |
| `computeOrgNeuralHealth` | `lib/neural/orgHealth.js` | `/admin/neural` — verdict + actions con CI95 |
| `computeProtocolEffectiveness` | `lib/neural/orgHealth.js` | "Qué protocolos funcionan en tu equipo" con Cohen's d |
| `cohort prior` | `coldStart.js` `computeCohortPrior` | `/api/v1/me/neural-priors` y consumir client-side |
| `calibrationByArm` bias | `residuals.js` | Gráfica "Predicción vs realidad" del motor |
| `topArms` con CI 90% | `bandit.js` `armCI` | Reporte "Tu intent ganador esta semana" |
| `pause-fatigue` + `staleness` | `pauseFatigue.js`, `staleness.js` | Banner home "han pasado 14 días, recalibrar" |
| `coachContext` | `coachMemory.js` | Vista "lo que el coach sabe de ti" (transparency) |
| `audit chain verify status` | `Org.auditLastVerified*` | `/admin/audit` "última verificación: hace X días" |
| `webhook delivery histogram` | `WebhookDelivery` rows | `/admin/webhooks/[id]` retry funnel |
| `incident subscriber reach` | `IncidentSubscriber` filtros | `/admin/incidents/[id]/preview` "esto notificará a N personas" |
| `coach.tokensUsed` mtd | NO EXISTE — agregar | quota dashboard |

---

## 18. Veredicto consolidado

**Lo que está vivo y conectado:**
- Auth, multi-tenant, audit chain, NOM-035 (server-recompute), HRV pipeline, motor adaptativo (bandit + cohort + residuals + staleness + pause-fatigue + anti-gaming + engine-health), audio engine, sync, programs, instruments, coach LLM, billing Stripe, SCIM, SSO, branding, magic-link branded, DSAR auto-resolve.

**Lo que está construido pero no se ejecuta sin un job queue:**
- Audit prune, audit verify, DSAR hard-delete + expiry sweep, maintenance T-24/T-0 notifications, incident subscriber broadcast, trial-end reminders, push delivery server-side.

**Lo que está construido pero no expuesto al usuario:**
- Engine health per-user, org neural health agregado, protocol effectiveness con CI95/Cohen's d, cohort prior consumption, coach context transparency, audit verify status, webhook delivery analytics.

**Lo que falta totalmente y es teatro de marketing:**
- Wearable OAuth user-flow.
- Slack/Teams dispatcher.
- Audit S3 Object Lock real.
- IPv6 allowlist.
- Server-side push send.
- Plan-gating del Coach LLM.

**El gap mayor del producto NO es de código de UI, es de:**
1. **Job queue + crons** — desbloquea ~10 features que están construidas pero inertes.
2. **Exponer al frontend lo que ya está calculado** — desbloquea features de inteligencia sin necesidad de datos nuevos.

Estas dos categorías son las que más valor agregan en Fase 2 con esfuerzo medio.

---

**Fin de ANALYSIS_FEATURES_GAPS.md.**
