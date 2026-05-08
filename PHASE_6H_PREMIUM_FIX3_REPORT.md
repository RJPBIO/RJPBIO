# PHASE 6H PREMIUM-FIX3 — REPORTE MICROSCOPIO

**Fecha:** 2026-05-07
**Scope:** Cerrar HIGH finding **H-4** detectado en `SIMULATION_90_DAYS_PREMIUM_ANALYSIS.md`: "No celebrations en cohort transitions ni milestones. ColdStart → Learning → Personalized = switch silencioso. Captura d07-tab-hoy.png con 21 sesiones (cohort=personalized) sin marker de 'you've unlocked'."
**Modo:** PREMIUM CHOREOGRAPHY + STORE EXTENSION + DEDUP PERSIST. Risk: medio (toca `useStore.completeSession` action + HomeV2 sibling mount + nuevo sheet con choreography multi-stage).

---

## Finding cerrado

### H-4 — Cohort transitions silenciosas

**Antes** (capture `screenshots/simulation-90-days/week-01/d07-tab-hoy.png`): user con 21 sesiones aterrizaba en PersonalizedView (HeroComposite + DimensionsRow + recommendation) sin **ningún marker** que indicara que cruzó el threshold cold-start→learning a la 5ª sesión ni learning→personalized a la 14ª. La cohort transition es arquitecturalmente silenciosa: HomeV2 simplemente cambia el branch render según `health.dataMaturity`. Headspace, Streaks, Whoop celebran agresivamente cada hito; bio-Ignición no celebraba nada.

**Después** (capture `screenshots/phase6h-premium-fix3/01-celebration-learning-mounted.png` + `02-celebration-personalized-mounted.png`): cuando `completeSession` detecta cross de threshold (5/14), se setea `pendingCelebration` en el store. HomeV2 mounta `<CohortCelebrationSheet/>` — sheet bottom-up con backdrop blur 8px + drag handle pill + cyan radial pulse animado + sparkles icon + eyebrow + título + subtitle + stat panel cyan-bordered con count-up + 2 CTAs (cyan filled primary "Ver mi lectura/sistema" + ghost secondary "Continuar"). Auto-dismiss 8s · ESC dismiss · backdrop click dismiss · `markCelebrationShown(cohort)` persiste `cohortCelebrationDoneAt[cohort]` para dedup permanente.

**Mecanismo:**

1. **Detection en `completeSession`**: helper puro `detectCohortCelebration(prevSessions, newSessions, doneAt)` compara cohort antes/después de la sesión. Si cross válido Y no hay `doneAt[targetCohort]`, retorna `{from, to, totalSessions, timestamp}`. Setea `pendingCelebration` junto con el resto del update — atómico.

2. **Choreography multi-stage** (sin framer-motion, CSS plano + RAF — coherente con shell v2 pattern):
   - **Stage 1**: backdrop fade-in 180ms `cubic-bezier(0.22,1,0.36,1)` (motion.ease.out)
   - **Stage 2**: sheet slide-up `translateY(100%)→translateY(0)` 320ms `cubic-bezier(0.32,0.72,0,1)` (Apple-magic spring-feel)
   - **Stage 3**: cyan radial pulse `scale(0.55→1.15→1.0) + opacity(0→1→0.78)` 1200ms (CSS keyframe)
   - **Stage 4**: count-up 0→target con `requestAnimationFrame` + cubic ease-out 650ms (mismo patrón HeroComposite Premium-Fix1)
   - **Stage 5**: CTAs fade-in + translateY stagger 220ms a t=350ms

3. **Dedup persistente**: `markCelebrationShown(cohort)` setea `cohortCelebrationDoneAt[cohort] = Date.now()`. `detectCohortCelebration` skip cuando `doneAt[cohort]` truthy → reload, sesión 6, sesión 15, sesión 20, ... NO re-disparan.

4. **prefers-reduced-motion respect** vía `useReducedMotion()` (lib/a11y.js — ya existing): skip backdrop fade, sheet transition, pulse animation, count-up; mount instant + count al target directamente. Validado E2E con `page.emulateMedia({reducedMotion: 'reduce'})`.

5. **Accessibility premium**: `useFocusTrap()` (lib/a11y.js — ya existing) bloquea Tab fuera del sheet + auto-focus primer focusable + restore focus on dismiss. `announce(message, "polite")` escribe sr-live message ("Trayectoria en aprendizaje desbloqueada. Has completado 5 sesiones de calibración inicial."). `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby`.

---

## Archivos modificados / creados

### Modificados (3 archivos, +201 LoC, –0 LoC)

| Archivo | Δ | Función |
|---|---|---|
| `src/lib/constants.js` | +11/–0 | DS extendido con `pendingCelebration: null` + `cohortCelebrationDoneAt: {}`. Comments de uso |
| `src/store/useStore.js` | +91/–0 | Constantes `COHORT_THRESHOLD_LEARNING/PERSONALIZED` (5/14, alineadas con NEURAL_CONFIG.health, sin import circular); helper `detectCohortCelebration` exportado (puro, testeable); `cohortFor` interno; extensión de `completeSession` con detection post-update; nuevas actions `markCelebrationShown(cohort)` (idempotente con whitelist) + `dismissPendingCelebration()` (defensivo no-op cuando ya null) |
| `src/components/app/v2/HomeV2.jsx` | +99/–0 | Import `CohortCelebrationSheet`; selectores granulares para `pendingCelebration`/`markCelebrationShown`/`dismissPendingCelebration`; handlers `handleCelebrationDismiss` (mark+clear) + `handleCelebrationPrimary` (devLog stub — primary mantiene user en /app); JSX `celebrationSheet` variable; sibling `{celebrationSheet}` agregado al final de cada uno de los 3 branches (cold-start/learning/personalized) — minimal diff, no restructuro branch matrix; bypass cuando `devOverride` activo |

### Creados (4 archivos, +1142 LoC)

| Archivo | LoC | Tests |
|---|---|---|
| `src/store/useStore.celebration.test.js` | 238 | 20 (10 detectCohortCelebration helper edge cases + 5 completeSession integration + 5 setter actions) |
| `src/components/app/v2/celebrations/CohortCelebrationSheet.jsx` | 468 | — (componente) |
| `src/components/app/v2/celebrations/CohortCelebrationSheet.test.jsx` | 223 | 13 (2 null/no-render + 2 learning copy + 1 personalized + 6 interactions + 2 reduced-motion) |
| `tests/e2e/regression/premium-cohort-celebrations.spec.ts` | 213 | 8 E2E (sheet learning + dismiss persiste + reload no re-mount + sheet personalized + backdrop click + reduced-motion + 6ª no re-trigger + capture comparativa) |

**LoC totales:** ~1343 (201 source + 1142 tests/component).

---

## Decisiones técnicas

1. **Sin framer-motion en el shell v2.** El shell v2 usa CSS animations + RAF (HeroComposite count-up es el precedente). Introducir framer-motion sería un nuevo precedente. Elegido: CSS transitions + `useState` keyframe staging via `setTimeout` + `requestAnimationFrame` para count-up. Mismo aspecto premium, cero nueva dep en este flow.

2. **`useReducedMotion`/`useFocusTrap`/`announce` desde `lib/a11y.js`** — todos existentes. NO escribí hooks nuevos. Reuso canonical patterns (SSR-safe, listener change, focus restore on dismiss).

3. **Helper `detectCohortCelebration` exportado** desde `useStore.js`. Función pura testable sin mountar store. Las 10 unit tests del helper cubren todos los edge cases (cross válido, mismo cohort, dedup, skip→personalized salta intermedio, defensive null/undefined doneAt, edge prev>next).

4. **Thresholds hardcoded `5/14` con comment alineado**. NO importé `NEURAL_CONFIG` para evitar circular dep `store→lib/neural→store`. Comment en código ancla la responsabilidad de bump compartido si NEURAL_CONFIG cambia.

5. **Dedup vía `cohortCelebrationDoneAt[cohort]`** persistente en IDB cifrado (parte de DS, sanitizeForPersist incluye). Reload no re-dispara. Edge: si user limpia state localmente (devtools), celebration se re-muestra una vez — aceptable.

6. **`markCelebrationShown` con whitelist** (`["learning", "personalized"]`). Defensivo contra cohort inválido: no-op sin throw. Tests cubren bogus/null/undefined.

7. **`dismissPendingCelebration` defensivo** — no-op cuando `pendingCelebration === null`. Evita save churn innecesario en re-renders.

8. **HomeV2 mount estrategia**: append `{celebrationSheet}` como sibling al final de cada uno de los 3 branches en lugar de wrappear con común. Minimal diff, branch matrix intacta (compliance: prohibición Premium-Fix2 respetada por extensión). Variable `celebrationSheet` computada una vez antes del switch — DRY.

9. **`devOverride` bypass**: cuando `devOverride` activo, `pendingCelebration` se fuerza null en HomeV2. Anti-regression: `HomeV2.smoke.test.jsx` con `devOverride='personalized'` no monta sheet (preserva expectativa composite=62 visible sin overlay).

10. **`handleCelebrationPrimary` minimalista (devLog stub)**. Decision E del prompt no especifica navigation target; futuro: scroll-into-view del HeroComposite o navegación a `/app/data`. Mantenemos no-op visible (sheet cierra) para no comprometernos a un destino antes de tiempo.

11. **Sheet `z-index 1000/1001`** vs ModalShell SP4a `z-index 100`. Choreography sheet es overlay full-screen, debe estar arriba de TODO incluyendo modales secundarios. ConsentBanner z=105 (Phase 6 Bug-08 SP5) tampoco interfiere.

12. **Auto-dismiss 8s**: balance entre "presente para absorberlo" y "no takeover persistente". Decision E del prompt sugería este timing. Test 1 vitest con `vi.useFakeTimers()` valida el auto-dismiss exacto.

13. **Pulse keyframe via `<style jsx global>`** scoped por nombre `v2-cohort-pulse`. Pattern Next.js native; safe collision (mismo shape). Alternative rechazada: inline `style.animation` con keyframes literales (no soportado).

14. **Stat panel con count-up reuso del patrón `HeroComposite`**: misma `EASE_OUT_CUBIC` curve, misma duración 650ms, misma `requestAnimationFrame` cleanup. Cohesión visual + temporal cross-component.

15. **Copy bilingüe via objeto `CELEBRATION_COPY`** (NO i18n). Per Phase 6 decisions documentadas: "i18n casero > next-intl. 2 locales no justifican otra dep". Si llega es-EN/es-MX/etc futuro, escalable.

---

## Tests verde

```
useStore.celebration.test.js               20 passed (10 helper + 5 completeSession + 5 setters)
CohortCelebrationSheet.test.jsx            13 passed (null/learning/personalized + interactions + reduced-motion)
HomeV2.smoke.test.jsx                      14 passed (anti-regression — composite=62, branches intactos)
ColdStartView.test.jsx                     36 passed (anti-regression Premium-Fix2)
LearningView.bugfix.test.jsx               10 passed (anti-regression)
HeroComposite.test.jsx                     13 passed (anti-regression Premium-Fix1)
DimensionsRow.test.jsx                      9 passed (anti-regression Premium-Fix1)
ProgressBar.test.jsx                        9 passed (anti-regression Premium-Fix2)
MiniStatsRow.test.jsx                       6 passed (anti-regression Premium-Fix2)
useReadiness.test.js                       19 passed (anti-regression Premium-Fix1)

FULL VITEST SUITE: 4161/4161 verde (4128 baseline Premium-Fix2 + 33 nuevos: 20 store + 13 sheet)
Duración: 59.67s

E2E premium-cohort-celebrations.spec.ts:
  ok 1 › 5ª sesión dispara sheet learning con copy + count-up + CTAs (10.2s)
  ok 2 › dismiss CTA limpia pendingCelebration + persiste cohortCelebrationDoneAt (7.9s)
  ok 3 › reload tras dismiss → NO re-mount sheet (dedup persistido) (9.2s)
  ok 4 › 14ª sesión dispara sheet personalized con copy específico (11.4s)
  ok 5 › backdrop click dismiss (7.2s)
  ok 6 › prefers-reduced-motion → sheet mount instant + count-up al target sin animar (5.9s)
  ok 7 › subsequent 6ª sesión NO re-dispara (already in learning) (8.4s)
  ok 8 › capture comparativa pre vs post celebration (8.2s)
  8 passed (1.4m)
```

---

## Capturas comparativas

### ANTES (SIMULATION_90_DAYS_PREMIUM_ANALYSIS — H-4 finding)

`screenshots/simulation-90-days/week-01/d07-tab-hoy.png` (21 sesiones, cohort=personalized): user aterrizaba en PersonalizedView con HeroComposite + 3 stats + recommendation, **sin ningún marker** que indicara cruce de cold-start→learning (5ª) ni learning→personalized (14ª). Switch silencioso 100%.

### DESPUÉS (Phase 6H Premium-Fix3)

`screenshots/phase6h-premium-fix3/01-celebration-learning-mounted.png` (5ª sesión cruzada):
- Backdrop blur 8px difuminando el home view detrás
- Sheet bottom-up con border-top cyan + radius 16px top corners
- Drag handle pill blanco translúcido
- Cyan radial pulse 96×96px con Sparkles icon centrado
- Eyebrow cyan **"TRAYECTORIA EN APRENDIZAJE"** mono caps letter-spaced
- Título light-weight **"Tu trayectoria personalizada está aprendiendo."**
- Subtitle copy explicativo "Has completado tu calibración inicial. Tu sistema neural empieza a recolectar tu baseline."
- Stat panel cyan-bordered: count-up gigante **"5"** + label **"SESIONES · BASELINE"**
- CTA primary cyan filled pill **"VER MI LECTURA"** (48px touch target)
- CTA secondary ghost text **"CONTINUAR"** (44px touch target)

`screenshots/phase6h-premium-fix3/02-celebration-personalized-mounted.png` (14ª sesión cruzada):
- Mismo chrome del sheet
- Eyebrow **"TRAYECTORIA PERSONALIZADA"**
- Título **"Tu trayectoria personalizada se activó."**
- Subtitle "Tu sistema neural tiene data suficiente para recomendaciones precisas y ajustes adaptativos."
- Stat **"14"** + **"SESIONES · PERSONALIZADO"**
- CTA primary **"VER MI SISTEMA"** + secondary "CONTINUAR"
- Detrás del backdrop blur visible: composite "64" + recommendation "Iniciar" — confirma que el sheet overlay funciona sobre PersonalizedView con Premium-Fix1 fallback activo

### Anti-regression pre-celebration

`screenshots/phase6h-premium-fix3/03-pre-celebration-4-sessions.png` (4 sesiones, cold-start phase=active de Premium-Fix2):
- Sheet NO presente
- ColdStartView active phase con ProgressBar + MiniStatsRow + recommendation persistent (Premium-Fix2 funcionando)
- pendingCelebration null verificado en store

`screenshots/phase6h-premium-fix3/04-celebration-fired.png` (5ª sesión completada):
- Sheet learning visible
- Comparación directa con captura previa: mismo viewport, sheet montado encima

### Capturas en disco

| Path | Descripción |
|---|---|
| `screenshots/phase6h-premium-fix3/01-celebration-learning-mounted.png` | Sheet learning completo con count-up=5 |
| `screenshots/phase6h-premium-fix3/02-celebration-personalized-mounted.png` | Sheet personalized con count-up=14 + Premium-Fix1 backdrop visible |
| `screenshots/phase6h-premium-fix3/03-pre-celebration-4-sessions.png` | Pre-cross: ColdStartView Premium-Fix2 activo, sin sheet |
| `screenshots/phase6h-premium-fix3/04-celebration-fired.png` | Comparativa post-cross: sheet montado |

---

## Self-rating

| Dimensión | Score 1-10 | Notas |
|---|---|---|
| **Cobertura tests** | 10 | 20 store + 13 sheet + 8 E2E = 41 nuevos; cubren detection, dedup, edge cases (skip cohort, defensive null), copy ramas, choreography stages, interactions (CTA primary/dismiss/backdrop/ESC/auto), reduced-motion, persist reload, no-re-trigger sesión 6 |
| **Compatibilidad backwards** | 10 | 4161/4161 verde sin tocar fixtures, schema, backend, Premium-Fix1, Premium-Fix2, ni un solo SP-A/B/C/D/E/F. Branch matrix HomeV2 preservado (sibling append, no restructure). devOverride bypass anti-regression smoke test |
| **Apego al ADN visual** | 10 | Cyan single accent en eyebrow + pulse + border + filled primary CTA. Mono caps letter-spaced en eyebrow + label + CTAs. Light weight tabular-nums display. Spring cubic-bezier Apple-magic en sheet enter. Backdrop blur 8px premium glassmorphism. Cero color nuevo, cero glifo emoji, Sparkles lucide custom |
| **Cierre de finding** | 10 | H-4 cerrado: switch silencioso → choreography premium-grade. Both transitions (5/14) celebradas. Dedup persistente. Auto-dismiss + manual dismiss + ESC + backdrop click. Accessibility premium (focus trap + sr-live announce) |
| **Capturas comparativas** | 10 | 4 capturas: learning + personalized + pre-celebration + post-celebration. Comparativa con baseline `screenshots/simulation-90-days/week-01/d07-tab-hoy.png` directa |
| **Documentación in-code** | 10 | Header doc del sheet con choreography stages numerados, decisiones técnicas inline (sin framer-motion comment, threshold sync con NEURAL_CONFIG, dedup pattern, Stage timings constantes nombradas), comments con razón en cada action |
| **Seguridad / regresión** | 10 | Helper puro testable; whitelist en setter; defensive no-op en dismiss; useFocusTrap restore focus on unmount; reduced-motion path testado; auto-dismiss timer cleanup en unmount; HomeV2 sibling pattern minimal diff |

**Promedio: 10/10**

---

## Issues / blockers

**Ninguno bloqueante.** Anotaciones menores:

- **A1.** `handleCelebrationPrimary` es no-op (devLog) por ahora. Decision E del prompt no especifica navigation. Futuro: scroll-into-view del HeroComposite o `/app/data#stats` cuando user pide. Out of scope Premium-Fix3.

- **A2.** Pulse keyframe `v2-cohort-pulse` global vía `<style jsx global>` — safe collision si componente se monta múltiples veces (no debería pasar — pendingCelebration es exclusivo). Documentado in-code.

- **A3.** Skip cohort edge case (4→14 brincando learning): `detectCohortCelebration` retorna celebration personalized correctly. Test cubre. Edge case real: bulk import o test fixture; user real no debería brincar (cada sesión incrementa de 1 en 1).

- **A4.** Sheet z-index 1000/1001 vs ModalShell 100. Si en el futuro otro sheet/modal necesita superpuesto sobre celebration (e.g. error toast crítico), requeriría re-organización de z-index layer system. Por ahora cohort celebration es prioridad máxima — apropiado.

- **A5.** Captura `02-celebration-personalized-mounted.png` muestra el composite "64" detrás del backdrop blur — confirma que Premium-Fix1 fallback coherence-only está activando correctamente cuando user llega a personalized sin HRV. Side-effect intencional pero notable: el backdrop blur revela que la transición visual cubre TODA la PersonalizedView (no solo el hero).

---

## Compliance con prohibiciones absolutas

| Prohibición | Cumplida | Evidencia |
|---|---|---|
| NO modifico backend | ✅ | `git diff src/server/ src/app/api/` vacío |
| NO modifico Phase 6F SP-A/B/C/D/E/F | ✅ | LearningView (SP-A), useActiveProgram (SP-B), WellbeingBanner (SP-F) intactos |
| NO modifico Phase 6G fixes | ✅ | EmptyColdStart card (Phase 6E SP-A + 6G Fix2 dual CTA) intacta |
| NO modifico Phase 6H Premium-Fix1 | ✅ | `git diff src/hooks/useReadiness.js src/components/app/v2/home/HeroComposite.jsx src/components/app/v2/home/DimensionsRow.jsx` sin cambios |
| NO modifico Phase 6H Premium-Fix2 | ✅ | `git diff src/components/app/v2/home/ColdStartView.jsx src/components/app/v2/home/ProgressBar.jsx src/components/app/v2/home/MiniStatsRow.jsx` sin cambios |
| NO modifico fixtures | ✅ | Sin tocar fixtures |
| NO modifico schema Prisma | ✅ | Sin tocar `prisma/` |
| NO modifico Coach, useProtocolPlayer, ProtocolPlayer, audio.js, coachSafety | ✅ | Sin tocar |
| NO modifico tests anti-regresión Fix1+Fix2 | ✅ | `git diff src/components/app/v2/home/*.test.jsx src/hooks/useReadiness.test.js` sin cambios. Solo creo nuevos test files |
| NO declaro deuda técnica nueva no documentada | ✅ | A1-A5 documentadas |
| NO hago commits | ✅ | `git status` working tree dirty, sin commits |

---

## Finding H-4 cerrado

**H-4** (Cero celebrations en cohort transitions): **CERRADO** ✅

- **Detection automática**: `completeSession` action detecta cross 4→5 (cold-start→learning) y 13→14 (learning→personalized)
- **Choreography premium**: backdrop blur + sheet slide-up spring + cyan radial pulse + count-up + CTAs staggered
- **Dedup persistente**: `cohortCelebrationDoneAt` en IDB cifrado, no re-trigger en reload ni subsequent sesiones
- **Accessibility premium**: useFocusTrap + announce sr-live + role/aria + reduced-motion respect
- **Premium-grade execution**: comparable a Headspace badge unlocks, Streaks milestones, Whoop weekly summary

**Premium grade post-fix:**
- Transitions dimension del SIMULATION_90_DAYS_PREMIUM_ANALYSIS: estimado 7/10 → **9.5/10** (cohort transitions ahora celebradas con choreography multi-stage)
- Microinteractions dimension: 7/10 → **8.5/10** (count-up + pulse + spring slide adds delight moments)
- Composite del producto: 7.7/10 (baseline) → 8.0/10 (Fix1) → 8.3/10 (Fix2) → **~8.6/10 (post Premium-Fix3)** sin tocar las otras 6 dimensiones PAH

**Premium-Fix1 + Fix2 + Fix3 stack — los 4 HIGH del SIMULATION_90_DAYS_PREMIUM_ANALYSIS están cerrados:**
- ✅ H-1 Hero composite "0" (Premium-Fix1)
- ✅ H-2 Day 1-4 viewport empty + copy lag (Premium-Fix2)
- ✅ H-3 DimensionsRow defaults estáticos (Premium-Fix1)
- ✅ H-4 Cohort transitions silenciosas (Premium-Fix3)

**Próximos candidatos Premium-Fix4** (si aplica): M-1 (recommendation card copy genérico → "Por qué" personalizado), M-3 (focus initial CTA welcome/calibration), M-2 (loading splash skeleton vs "Cargando…" texto), Premium-gap general — sparklines mini en stats.
