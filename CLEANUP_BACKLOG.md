# CLEANUP_BACKLOG.md

> Items deferred during Phase 4 (refactor del motor de ejecución de protocolos).
> Cada entrada incluye: por qué se difirió, blast radius si se ataca, y disparador de prioridad.
> Todo lo aquí listado está documentado pero NO requerido para shipping de Phase 4.

---

## 1. ~~Eliminación de archivos legacy~~ — **RESUELTO Phase 6 SP5**

**Estado**: ✅ RESUELTO 2026-05-03 (Phase 6 SP5).

- `src/components/SessionRunner.jsx` eliminado (era el único archivo huérfano restante; las variantes en `src/components/protocol/` nunca existieron).
- `src/app/app/page.jsx` reducido de 2619 LoC → 20 LoC (sólo wrapper que monta `<AppV2Root />`).
- Feature flag `PROTOTYPE_V2` eliminado.
- Todas las funciones legacy del flow (`comp()`, `submitCheckin`, mount inline de `<ProtocolPlayer>`, `BioIgnitionWelcome` mount inline, `NeuralCalibration` mount inline) reemplazadas por:
  - `closeSession()` puro en `lib/sessionFlow.js` (Phase 6 SP3).
  - State lifted en `AppV2Root.jsx` para player overlay (Phase 6 SP3).
  - Onboarding mount en `AppV2Root.jsx` (Phase 6 SP5).
- Suite global verde post-cleanup: 3362 / 3362 passing en 137 archivos.
- Build verde: EXITCODE=0.

Histórico del legacy preservado en git history (commits anteriores a Phase 6 SP5).

---

## 2. PPG (photoplethysmography) breath-match real

**Qué**: la primitiva `ppg_breath_match` está enumerada en `VALID_PRIMITIVES` y referenciada por `validate.kind: "ppg_breath_match"`, pero no hay implementación de captura de señal vía cámara/sensor; los protocolos que la mencionan (#16 Resonancia Vagal en `validate`) hacen fallback a `breath_cycles` hasta que exista la primitiva real.

**Por qué se difirió**: Phase 4 era engine + UX; PPG requiere:
- Permiso de cámara con UX de onboarding propio.
- Worker/WASM para procesar señal en tiempo real.
- Calibración por usuario (offset cardíaco, ruido ambiental).
- Test bench con señales sintéticas.

**Blast radius**: medio. Una vez que existe, tres protocolos (#15, #16, #17 en variantes "Pro") ganarían validación más rigurosa pero el catálogo no lo requiere para shipping.

**Disparador de prioridad**: solicitudes B2B Enterprise que pidan métricas HRV reales, o cuando la integración Whoop/Oura del Sprint 6 (deferido) se reactive.

---

## 3. Pacing reviews por protocolo

**Qué**: revisión humana del `duration.target_ms` de cada acto contra la coreografía sentida. Phase 4 usó valores derivados del `phase.duration` original dividido por # de actos, ajustados por intuición clínica.

**Por qué se difirió**: requiere sesiones reales con sujetos beta (al menos 3 corridas por protocolo, n=5 sujetos cada una) y telemetría de "cuánto antes del max_ms el usuario quiso avanzar". No se puede hacer sin tracking real ni base de usuarios.

**Blast radius**: bajo. Cada ajuste es una sola línea en `protocols.js`. Sin riesgo de regresión: todos los actos ya respetan invariantes de shape (`min_ms ≤ target_ms ≤ max_ms`, suma de actos = `phase.e - phase.s`).

**Disparador de prioridad**: cuando los logs de completion (`flow.partial_credit_indicator`) muestren clusters de exit prematuro en actos específicos, o cuando un coach humano pida ajustes basados en uso clínico.

---

## 4. NSDR (#17) extensión a 20/30 min

**Qué**: NSDR actualmente migrado para 10 min (4 fases × 1 acto = 4 actos). Variantes 20 min y 30 min existen como protocolos diferentes en backlog pero no migradas.

**Por qué se difirió**: la migración 10 min cubre el caso clínico canónico (Walker 2017, Huberman); 20/30 min son extensiones para usuarios avanzados, no parte del MVP.

**Blast radius**: nulo si se hace como protocolos #21 y #22 nuevos (gap actual permite IDs hasta 20). Cuidado: superar #20 implica revisar `RESERVED_IDS` y bandas de los reportes oficiales.

**Disparador de prioridad**: cuando NPS o telemetría muestre que el 10 min es insuficiente para subgrupo significativo de usuarios power.

---

## 5. Partial credit threshold tuning

**Qué**: el umbral actual para `flow.partial_credit_indicator = true` (acto pause >2 actos completos en training) es heurístico. Phase 4 SP7 dejó constante hardcodeada en `useProtocolPlayer`.

**Por qué se difirió**: requiere data real de qué % de completitud "se siente como progreso" para los usuarios; no hay analytics todavía. Cualquier valor entre 33 % y 66 % es defensible clínicamente.

**Blast radius**: bajo, una constante. Riesgo cero si se mueve dentro del rango defensible.

**Disparador de prioridad**: post-Phase 5, cuando el dashboard de coach muestre tasa de partial-credit y se pueda calibrar contra retención.

---

## 6. Audio doble-orquestación (binaural + voice + ticks)

**Qué**: actualmente cada `act.media` declara `binaural`, `voice` y `breath_ticks` independientemente; el orden de inicio no está estrictamente garantizado en transiciones rápidas (<150 ms entre actos consecutivos con diferentes streams).

**Por qué se difirió**: en pruebas e2e (SP3-SP8) no se observó audible glitch; sólo aparece en perfiles de dispositivos low-end que no son target prioritario.

**Blast radius**: bajo. Solución probable es un small `audio-orchestrator.js` que serialice start/stop con `Promise.all` y un debounce de 50 ms. Nada en `audio.js` requiere cambio de API.

**Disparador de prioridad**: si soporte usuario reporta "se cortó el binaural a la mitad" en un protocolo migrado.

---

## 7. comp() bridge — aproximación de validación legacy

**Qué**: la función `comp()` legacy en el motor anterior recompensaba completitud parcial con `vCoresAward` proporcional; el nuevo `useProtocolPlayer` aplica reglas distintas por `useCase` (crisis: full credit siempre, training: skip permitido, active: cancel limpio). No hay paridad bit-exacta.

**Por qué se difirió**: las reglas nuevas son conscientes y mejores que las legacy (training con `partial_credit_indicator` es nuevo y deseable). Re-implementar la fórmula vieja sería regresión.

**Blast radius**: nulo si se acepta la divergencia. Riesgo si algún test de `bandit.js` o `neural.js` espera el shape viejo (verificar — los tests de neural ya fueron actualizados).

**Disparador de prioridad**: si análisis post-mortem detecta que la métrica de "valor percibido por sesión" se rompió (improbable; los nuevos cores son consistentes).

---

## 8. Stories / Storybook coverage para primitivas crisis-específicas

**Qué**: las primitivas `object_anchor_prompt`, `vocal_with_haptic`, `facial_cold_prompt`, `shake_hands_prompt`, `isometric_grip_prompt` ganaron stories básicas en SP2; las variantes "auditiva" / "tactile" / "with-cold-water" sólo se ven mounteadas dentro del player, no en Storybook aislado.

**Por qué se difirió**: el harness `/dev/protocol-player` cumple el rol de preview e2e y los tests unitarios cubren los casos. Storybook fue inicialmente para las 19 primitivas, no para variantes prop-driven.

**Blast radius**: nulo. Pure addition, no riesgo de regresión.

**Disparador de prioridad**: cuando un nuevo dev necesite iterar sobre estas variantes sin ejecutar protocolo completo.

---

## 9. Validación legal NOM-035 ítems (tracking en ROADMAP)

**Qué**: hash SHA-256 de los ítems en `src/lib/nom35/integrity.js` está ratificado, pero `nom035TextValidatedByLawyer = false`. Reportes oficiales muestran disclaimer hasta review humano.

**Por qué se difirió**: tema fuera del scope de Phase 4 (engine refactor). Item ya existe en `ROADMAP.md` pero replicado aquí para ownership consolidado.

**Blast radius**: bajo en código (flag a true). Alto en producto: una vez validado por abogado, los reportes pueden vendarse oficialmente como instrumento de cumplimiento NOM-035.

**Disparador de prioridad**: contrato Enterprise que requiera reporte certificado, o auditoría DOF próxima.

---

## 10. RLS Postgres deferred to Phase 4 cierre Enterprise

**Qué**: documentado en `ROADMAP.md` y `CLAUDE.md`. Compromiso: implementar RLS antes de cerrar deal Enterprise tier (>$50K USD/año).

**Por qué se difirió**: defensa actual via `requireMembership` opt-in en handlers + audit log es suficiente para tiers FREE/STARTER/PRO/GROWTH.

**Blast radius**: alto. Requiere migración de schema, policies por tabla, tests de aislamiento entre orgs.

**Disparador de prioridad**: pipeline de ventas Enterprise activado.

---

## 11. PulseMatchVisual contract limitation — extender callback

**Qué**: `PulseMatchVisual.jsx` (primitiva SP2 Phase 5) emite `onPulseTap({at: timestamp})` sin contador acumulado. Esto significa que `validate.kind: "tap_count"` no funciona con esta primitiva — el engine necesita la señal `tapsCompleted: N` y la primitiva sólo manda timestamps.

Workaround aplicado en Phase 5 SP5 para `#25 Cardiac Pulse Match` actos 2 y 3: cambiar `validate.kind` a `"min_duration"`. Aprovecha que la primitiva tiene su propia lógica de completion timing-based:
- Acto 2 (count_only): `min_duration: 30000` matches `interval_ms` de la primitiva.
- Acto 3 (match_breathing): `min_duration: 50000` matches 5 ciclos × 10s.

Outcome equivalente al spec original. Mecanismo y citas peer-reviewed (Garfinkel 2015 + Lehrer 2014 + Khalsa 2018) intactos.

**Por qué se difirió**: el workaround min_duration es funcional, defensible y no rompe la integración. Cambiar la primitiva (~10 LoC + 1 test smoke) es bajo coste pero requiere coordinación con cualquier consumer que use PulseMatchVisual. Hoy sólo #25 lo usa.

**Blast radius**: bajo. Cambio sería:
- `PulseMatchVisual.jsx`: agregar parámetro `count` al callback `onPulseTap({at, count})`. Backwards compatible (consumers que ignoraban count siguen funcionando).
- `PrimitiveSwitcher.jsx`: actualizar mapeo `onPulseTap={(s) => onSignal({tapsCompleted: s.count})}`.
- `protocols.tier-24-25.test.js`: opcional revertir #25 actos 2/3 a `tap_count` si se prefiere.
- 1 smoke test nuevo verificando count emitido.

**Disparador de prioridad**: cuando otro protocolo (#26+, futuros) requiera `tap_count` validation con PulseMatchVisual. Mientras sólo #25 lo use con min_duration funcional, no hay ROI suficiente.

**Detectado en**: SP5 Phase 5 reporte de migración #25.

---

## 12. Vercel crons downgraded a daily (Hobby plan workaround)

**Qué**: 4 crons en `vercel.json` fueron bajados de sub-daily a daily para que el deployment pase en plan Hobby de Vercel:

| Cron | Schedule original | Schedule actual (Hobby) |
|---|---|---|
| `maintenance-notify` | `*/5 * * * *` | `0 8 * * *` |
| `incident-broadcast` | `* * * * *` | `15 9 * * *` |
| `webhook-retry` | `* * * * *` | `30 10 * * *` |
| `push-deliver` | `* * * * *` | `0 11 * * *` |

**Por qué se difirió**: el plan Hobby de Vercel solo permite `Once per day` por cron (cron expressions sub-daily fallan durante deployment). El producto fue diseñado asumiendo plan Pro (CLAUDE.md: "11 jobs, cabe en Pro"). Como aún estamos en preview/dev sin users B2B reales, bajar a daily NO afecta funcionalidad práctica hoy.

**Blast radius si se revierte**: bajo. Solo requiere editar `vercel.json` con los schedules originales + verificar que `CRON_SECRET` esté configurado en Vercel envs. Suite + build no se ven afectados.

**Disparador de prioridad**: cuando upgrades Vercel a Pro plan ($20/mes/user), revertir a los schedules originales para restaurar:
- Real-time push delivery (cada minuto)
- Real-time webhook retry (cada minuto)
- Real-time incident broadcast (cada minuto) — crítico para SLA B2B
- Maintenance notify cada 5 min

**Detectado en**: Phase 6A post-deployment 2026-05-03.

---

## 13. HRV components shim → tokens v2 nativo

**Qué**: durante Phase 6B SP2, los 4 componentes HRV/Instrument (`HRVCameraMeasure`, `HRVMonitor`, `HRVHistoryPanel`, `InstrumentRunner`) fueron refactorizados al ADN v2 vía un **shim de compatibilidad** que mapea los tokens legacy (`brand.primary`, `bioSignal.ignition`, `font.weight.black`) a los nuevos (`colors.accent.phosphorCyan`, `colors.semantic.warning`, `typography.weight.medium`). El shim vive en cada archivo (~12 LoC declarando `const brand`, `const bioSignal`, `const font` con valores derivados de tokens v2).

Esto permitió 0 cambios de lógica + sweep mecánico de pesos `>500 → 500`. Disciplina de hardening Sprints 73-80 preservada.

**Por qué se difirió**: el shim es funcional, idéntico visualmente, y permite migración gradual sin romper el render. Eliminarlo requeriría re-escribir cada uso de `brand.primary` → `colors.accent.phosphorCyan` inline (~250 LoC de touchups) sin ganancia funcional.

**Blast radius**: bajo. Cleanup mecánico via grep+sed. Cero riesgo si tests pasan después.

**Disparador de prioridad**: cuando un componente HRV requiera un cambio de estilo no-trivial y el shim agregue confusion al cambio. O bien, si Phase 7 introduce nuevos design tokens v2 que harían el shim divergir.

**Detectado en**: Phase 6B SP2 reporte 2026-05-03.

---

## 14. HRVHistoryPanel mount strategy en shell v2

**Qué**: `HRVHistoryPanel.jsx` (~530 LoC, refactorizado a ADN v2 en SP2) sigue siendo **huérfano** en shell v2 — no tiene mount path desde ColdStart, Profile/Calibración, ni ningún card. La única ruta que lo usaría era `/app/page.jsx` legacy (eliminada Phase 6 SP5).

Su funcionalidad (sparkline + bucketing 7d/30d + baseline ±SD + export CSV) es valuable diferenciador post-MVP, pero requiere wiring decision:
- Opción A: link "Ver histórico completo" en Profile > Calibración debajo del HRV card cuando `hrvLog.length >= 5`.
- Opción B: nueva ruta `/app/history` con tabs HRV/PSS-4/sesiones.
- Opción C: drawer desde tap en stat card "RMSSD" del Calibration view.

**Por qué se difirió**: SP3 era schema + persistencia + cleanup, NO wiring nuevo. La decisión de mount strategy requiere user research (¿cuántos users quieren ver histórico extendido vs basta con baseline summary?) o decisión producto.

**Blast radius**: bajo. Es agregar 1 mount + 1 ruta o link. Cero riesgo de regresión si está bien gateada.

**Disparador de prioridad**: primer feedback de user que pida "ver mi histórico HRV completo" o "exportar mis mediciones". Telemetría: si `hrvLog.length` >20 en cohort, valuable agregar.

**Detectado en**: Phase 6B SP2 reporte 2026-05-03.

---

## 15. lib/theme.js eliminación completa post-auditoría consumers

**Qué**: `src/lib/theme.js` (legacy resolveTheme + brand + bioSignal + font + withAlpha) **NO fue eliminado** durante Phase 6B SP2 a pesar de que los 4 componentes HRV/Instrument migraron a tokens v2. Razón: otros consumers fuera de scope SP2 todavía dependen del archivo.

Verificación pendiente:
- `src/components/Nom35PersonalReport.jsx` — usa `resolveTheme` para PDF rendering
- `src/app/page.jsx` (legacy 55 KB landing) — uses indirectos
- Otros componentes no auditados aún

**Por qué se difirió**: prohibición explícita SP2 ("NO eliminas lib/theme.js todavía — puede tener otros consumers fuera de scope SP2"). Una eliminación prematura rompería rendering de reportes oficiales y otros componentes.

**Blast radius**: alto si no se audita primero. Cleanup completo requiere:
1. `grep -r "from.*lib/theme"` → lista exhaustiva de consumers
2. Migración 1-by-1 a tokens v2 (similar al patrón shim de SP2)
3. Eliminación final de `lib/theme.js`

**Disparador de prioridad**: cuando se introduzca un nuevo design token v2 que diverja del legacy y cause inconsistencia visual, o cuando un cambio de marketing requiera consolidar el sistema de tokens en una sola fuente de truth.

**Detectado en**: Phase 6B SP2 reporte 2026-05-03.

---

## 16. Server → client hydration flow (B2B cross-device data recovery)

**Qué**: Phase 6B SP1 arregló el bug crítico de `store.init()` ausente en AppV2Root (sin él, /app cargaba con state default cada vez). `init()` lee de IDB local. NO existe flow de "rehidratar desde server" cuando IDB está vacío en device nuevo.

Implicación B2B: user A completa HRV en device 1 → server tiene la entry en `HrvMeasurement` (post SP3). User A login en device 2 (browser fresh sin IDB) → app NO consulta server para popular hrvLog local → user ve empty state aunque tenga datos persistidos.

**Por qué se difirió**: SP3 era schema + outbox writes + cleanup, NO el reverse flow (server → client). El flow de rehidratación requiere:
- Endpoint `/api/sync/pull` que devuelva últimas N entries por user
- Cliente: trigger pull en `init()` cuando `hrvLog.length === 0` AND `_userId !== null` AND `lastSyncedAt > 0` (indicador de que user es returning)
- Conflict resolution si IDB tiene entries más nuevas que server

**Blast radius**: alto. Toca sync.js, useStore init, nuevo endpoint server, casos edge de offline-first reconciliation.

**Disparador de prioridad**: primer reporte de B2B user que cambia de device y "perdió" sus datos. Crítico antes de cerrar deal Enterprise donde users multi-device es norma.

**Detectado en**: Phase 6B SP3 reporte 2026-05-03.

---

## Reglas de uso de este documento

1. Cualquier item agregado debe incluir las 4 secciones: **Qué / Por qué se difirió / Blast radius / Disparador de prioridad**.
2. Items resueltos se mueven a la parte de abajo en una sección `## Resolved (date)`. No se borran.
3. Esta lista NO es backlog de features. Sólo deuda técnica conocida y aceptada.
4. Si un item lleva >3 sprints sin disparador, considerar: ¿realmente vale la pena? Si la respuesta es no, eliminar.
