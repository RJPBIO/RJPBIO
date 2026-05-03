# ROADMAP.md — Compromisos post Phase 2

**Fecha:** 2026-05-01.

> Este documento captura compromisos técnicos de Fase 3+ que NO se ejecutaron en Phase 2 pero que requieren ser completados antes de hitos comerciales específicos.

---

## Compromisos hard (bloqueadores comerciales)

### RLS Postgres — antes de cerrar deal Enterprise tier (>$50K/año contract value)

**Estado:** diferido en Phase 2.
**Razón del diferimiento:** XL effort, defensa real pero costoso. Phase 2 priorizó closing 10 compliance gaps con mayor leverage por hora.
**Compromiso:** implementar RLS para tablas críticas:
- `Org`, `Membership`
- `NeuralSession`, `Nom35Response`, `WearableEvent`
- `AuditLog`, `DsarRequest`
- `CoachUsage`, `PushOutbox`, `StripeEvent`
- `ApiKey`, `Webhook`, `WebhookDelivery`
- `Notification`, `Incident`, `IncidentUpdate`, `MaintenanceWindow`, `IncidentSubscriber`

**Patron:** policies SQL `current_setting('app.current_user_id')::text` + `app.current_org_id` set por session config en `db.js` antes de cada request.

**Trigger comercial:** primer cliente Enterprise prospect serio requiriendo "Postgres RLS multi-tenant" en su SOC2 / vendor security questionnaire.

**Estimación:** 5-10 días de trabajo (XL).

### Audit S3 Object Lock — antes de SOC 2 Type II audit

**Estado:** Phase 2 dejó interface lista (S3.2), implementación mock filesystem.
**Compromiso:** activar S3 real cuando AWS bucket esté provisioned:
1. Crear bucket S3 con `--object-lock-enabled-for-bucket`.
2. Default retention COMPLIANCE 2555 días (7 años).
3. Set env vars: `AUDIT_EXPORT_BUCKET`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`.
4. `npm i @aws-sdk/client-s3`.
5. Cron `audit-export` (ya configurado, diario 03:30 UTC) toma over automaticamente.

**Trigger:** SOC 2 Type II auditor requiere offsite immutable audit trail.

**Estimación:** 0.5 día (implementation done, AWS ops + npm install).

### NOM-035 validación legal del texto

**Estado:** Phase 2 agregó hash integrity check + flag `nom035TextValidatedByLawyer = false`.
**Compromiso:** revisión humana legal one-by-one de los 72 ítems vs DOF Anexo III oficial.
**Quién:** abogado externo, STPS-certificado o legal interno con expertise en NOM-035.
**Trigger:** primer cliente B2B mexicano que vaya a imprimir actas firmables para auditoría STPS.
**Estimación:** 1-2 horas de revisión legal externa.

---

## Compromisos blandos (mejoras de capacidad — Sprint 6+)

### Wearable OAuth user-flow (Whoop + Oura mínimo)

**Estado:** webhook ingress completo (HMAC per-provider), OAuth user-flow no existe.
**Compromiso:** implementar OAuth para Whoop + Oura. Otros providers (Garmin / Apple / Fitbit) según prioridad.
**Estimación:** 2-3 días por provider (XL).
**Decisión pendiente:** prioridad de orden — ver `DECISION_POINTS.md #8`.

### `HrvSample` + `MoodSample` tablas dedicadas

**Estado:** todo HRV / mood vive en `User.neuralState` JSON, no queryable a escala B2B.
**Compromiso:** migración append-only + dual-write desde sync handler + backfill script.
**Estimación:** 2 días (L).
**Trigger:** primer cliente B2B con >500 members donde queries agregadas se vuelven imposibles.

### SAML signed assertion validation

**Estado:** unclear si NextAuth SAML provider lib lo cubre. A confirmar en Sprint 6+ con SAML config real.
**Estimación:** depende del lib usado (1-3 días).
**Trigger:** primer cliente Enterprise con SAML IdP.

### Programa adaptativo bandit-generado

**Estado:** programs son curados estáticos. Oportunidad de generar trayectorias 7-14d por user basadas en `topArms` + cohort prior.
**Estimación:** 3-5 días (L).
**Trigger:** retention metric drop o feature request de cliente.

### Coach memoria longitudinal cifrada

**Estado:** memoria solo cliente.
**Compromiso:** persistir resúmenes en server (encriptado con KMS-wrapped DEK).
**Estimación:** 5-7 días (L). Requiere consent flow + DSAR cascade update.
**Riesgo:** PII storage server. Consent explícito obligatorio.
**Trigger:** demanda de cliente para coach cross-device continuity.

### IPv6 IP allowlist

**Estado:** `parseIpv4` only. IPv6 deferred explícito.
**Estimación:** 1-2 días (M).
**Trigger:** cliente con red IPv6-only que requiere allowlist.

### Slack / Teams dispatchers

**Estado:** `Integration` config table sí, dispatcher no existe.
**Compromiso:** server-side dispatcher con event subscriptions (e.g. `org.member.added`, `nom35.aggregate.completed`, `incident.published`).
**Estimación:** 2 días por integración (M).
**Decisión pendiente:** implementar o quitar claim — ver `DECISION_POINTS.md #12`.

### Burnout MBI real (vs proxy 1D actual)

**Estado:** `burnout.js` cita "MBI-inspired" pero usa proxies 1D (mood trend = exhaustion). Real MBI son 22 ítems multi-scale.
**Compromiso:** reemplazar proxy con escala MBI-GS validada (16 ítems).
**Estimación:** 3-4 días (M). Requiere licencia MBI.
**Trigger:** cliente que pida burnout assessment con rigor científico real.

---

## Compromisos de proceso

### Phase 3 — reconstrucción frontend `/app`

**Estado:** Phase 2 entrega backend listo + 6 documentos finales para asesor externo.
**Compromiso:** Phase 3 reescribe `/app/page.jsx` (58 KB monolítico) + `useStore.js` (refactor a hooks completos) + integra los nuevos endpoints/components Phase 2 (`<EngineHealthCard>`, `<ProtocolEffectivenessTable>`, `<CoachQuotaBadge>`, `<MfaGateBanner>`, etc.).
**Estimación:** 2-4 semanas (XL).
**Pre-requisitos:** decisiones 1-6 de `DECISION_POINTS.md`.

### Test coverage para route handlers

**Estado:** tests cubren `lib/*` (≥70%), no `app/api/*`.
**Compromiso:** agregar tests de integración para handlers críticos (audit, DSAR, billing webhook, coach quota, sync MFA gate, SCIM cascade).
**Estimación:** 4-6 días (L).
**Trigger:** continuous — debería ser parte de cada PR nuevo.

### OpenTelemetry exporter en producción

**Estado:** SDK importado pero `OTEL_EXPORTER_OTLP_ENDPOINT` no configurado en Vercel.
**Compromiso:** configurar Honeycomb / Jaeger / Datadog exporter.
**Estimación:** 0.5 día (S).
**Trigger:** primer cliente con SLA enforcement.

### React Compiler activación

**Estado:** off (TDZ + audit risk documentado).
**Compromiso:** re-evaluar cuando React Compiler estabilice o haya tooling para auditar TDZ issues.
**Estimación:** 1-2 días (M).
**Trigger:** target performance no alcanzable sin auto-memo.

---

## Phase 4 — visión post-reconstrucción frontend

Estos son items de innovación de producto que dependen de Phase 3 estar entregada y métricas reales del producto:

- Programa adaptativo bandit-generado (G.1 del análisis).
- Coach memoria longitudinal.
- "Tu intent ganador semanal" digest.
- Calibration bias gráfica visible.
- Coach con tool-use Anthropic.
- Multi-intent programs.
- Frequency-domain HRV (LF/HF).
- Chronotype drift detection.

Decisión pendiente: cuáles son priority del primer Phase 4 sprint.
