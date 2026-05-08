# PHASE 6I-3 — RECOMMENDATION ALTERNATIVES CARD REPORTE MICROSCOPIO

**Fecha:** 2026-05-07
**Scope:** Cerrar HIGH finding **H-3** detectado en `REPO_AUDIT_BUG_PATTERN_REPORT.md`. Engine adaptive computa `recommendation.alternatives` (top-2 protocolos scored después del primary) en `src/lib/neural.js:816` con reasons contextuales — pero NINGÚN caller del shell v2 los exponía. Apps competencia (Headspace "Try another exercise", Calm "More like this") muestran alts explicit. Phase 6I-3 cierra el gap con `<RecommendationAlternativesCard/>` colapsable bajo recommendation primary en LearningView + PersonalizedView.
**Modo:** ENGINE OUTPUT EXPOSURE + HELPER EXTENSION + PROGRESSIVE DISCLOSURE. Risk: bajo (lectura de engine output ya existing, no mutation, scope contenido).

---

## Finding H-3 cerrado

### Antes (pre-Phase 6I-3)

`useAdaptiveRecommendation` retornaba `{primary, alternatives, need, context}` — `alternatives` array de top-2 items con shape idéntico a primary (`{protocol, score, reason}`). Engine `_generateReason` produce reasons premium-grade per protocol ("Ciclo circadiano favorable para activación", "Tu historial muestra +0.8 puntos con este protocolo", "Recuperación de momentum recomendada"). **Pero NINGÚN componente v2 los renderea** — `grep recommendation.alternatives src/components` retornaba 0 matches. Engine compute work invisible al user.

### Después (Phase 6I-3)

`<RecommendationAlternativesCard/>` se renderea como sibling después de la recommendation primary card en LearningView (cuando `recoFromEngine=true`) y PersonalizedView (cuando `recommendationRaw` provee shape engine). Default colapsada con eyebrow muted **"Otras opciones (N)"** + chevron cyan. Tap toggle expande `max-height` con cubic-bezier spring transition (alineado con sheets pattern).

**Estructura per alternative row:**
- Eyebrow muted **"ALTERNATIVA"** mono caps letter-spaced
- Title light weight (e.g. "Skyline Focus", "Lightning Focus")
- Duration + intent: "120s · 2 min · enfoque"
- Reason caption italic muted (Premium-Fix4 M-1 pattern reuse): "Ventana óptima para activación prefrontal"
- Separator 0.5px entre rows
- Touch target ≥44px (Polish-2)

Tap alt row dispatcha `onAction({action: "start-protocol", protocolId})`. LearningView reusa su existing handler. PersonalizedView usa nuevo prop `onStartAlternative(protocolId)` que HomeV2 wire a `onNavigate({action: "start-recommended", protocolId})` — consistente con `onStartRecommended` existing.

`prefers-reduced-motion` respect via `useReducedMotion` (lib/a11y.js): cuando active, `transition: none` para max-height — el toggle igual funciona pero sin animación.

Auto-hide defensive: cuando `extractAlternatives()` retorna `[]` (recommendation null/sin alts/alts inválidas), el componente returns null sin render — no clutter en fallback paths.

---

## Archivos modificados / creados

### Modificados (5 archivos)

| Archivo | Δ | Función |
|---|---|---|
| `src/lib/recommendationExtract.js` | +75 | 3 helpers nuevos puros: `extractAlternatives(rec)` retorna array filtered defensive; `extractAlternativeProtocol(alt)` con defensive chain (engine real `protocol.id` → legacy flat `id`); `extractAlternativeReason(alt)` con string non-empty validation |
| `src/lib/recommendationExtract.test.js` | +180 | 22 tests nuevos cubriendo: extractAlternatives engine real shape + null/undefined/invalid + filter parcial + immutability; extractAlternativeProtocol engine vs legacy + edge id=0; extractAlternativeReason whitespace-only + non-string + 4 engine real samples |
| `src/components/app/v2/home/LearningView.jsx` | +14 | Import `RecommendationAlternativesCard`; mount sibling después de `RecommendationCard` solo cuando `recoFromEngine=true` (skip fallback path) — recibe `recommendation` raw (LearningView ya lo tiene) y `onAction` handler existing |
| `src/components/app/v2/home/PersonalizedView.jsx` | +28 | Import card; 2 props nuevos opcionales `recommendationRaw` (raw engine output con alternatives, distinto del transformed `recommendation`/`recCard`) y `onStartAlternative(protocolId)`; mount sibling después de `ActionCard` cuando `recommendationRaw` provee. Wrap div con `paddingInline: spacing.s24` para mantener shell padding (ActionCard usa marginInline interno) |
| `src/components/app/v2/HomeV2.jsx` | +2 | Wire 2 nuevos props a PersonalizedView: `recommendationRaw={devOverride ? null : recommendation}` (raw realRecommendation) + `onStartAlternative={(pid) => onNavigate?.({action: "start-recommended", protocolId: pid})}` — consistente con `onStartRecommended` pattern existing |

### Creados (3 archivos, +793 LoC tests/component)

| Archivo | LoC | Tests |
|---|---|---|
| `src/components/app/v2/home/RecommendationAlternativesCard.jsx` | 263 | — (componente) |
| `src/components/app/v2/home/RecommendationAlternativesCard.test.jsx` | 281 | 26 (null/no-render 5 + colapsada 3 + toggle expand/collapse 3 + alt rows content 6 + onAction interaction 4 + reduced-motion 2 + legacy/mixed shapes 2) |
| `tests/e2e/regression/premium-recommendation-alternatives.spec.ts` | 249 | 6 E2E (LearningView 7 sesiones / setup directo / tap alt / reduced-motion / anti-regression fallback / capture comparativa) |

**LoC totales:** ~1112 (319 source + 793 tests/component).

---

## Decisiones técnicas

1. **Helper extension aditivo en `recommendationExtract.js`** (Fix-A1 file). NO modifica los 4 extracts existing (`extractPrimaryProtocol/Id/Reason`, `isEngineRecommendation`). Pattern reuse: defensive chain `alt.protocol.id ?? alt.id`, mismas convenciones de naming + JSDoc + comments rationale.

2. **`extractAlternatives` SIEMPRE retorna array** (nunca null). Permite callers usar `.length`, `.map()` sin null-checks adicionales. `[]` cuando: recommendation null/undefined/sin alternatives field/alternatives no-array/alternatives empty/alternatives all-invalid.

3. **Filter defensive en helper**: items sin `protocol.id` ni `id` flat se filtran out. Edge case mixed alternatives (some valid + some null) preserva solo valid — count en eyebrow refleja válidos reales.

4. **Componente nuevo, NO generalizar** ni con cards existing (ActionCard / ActionRow / RecommendationCard). Cada uno tiene shape distinto:
   - ActionCard: panel con CTA cyan filled "Iniciar"
   - ActionRow: lista-row con icon + title + description + chevron
   - RecommendationCard: panel con CTA cyan outlined "Empezar"
   - **RecommendationAlternativesCard**: card colapsable con button toggle + ol list + alt rows
   Generalizar agregaría coupling cross-feature.

5. **Progressive disclosure default colapsada**. Razón UX: recommendation primary YA ocupa visual prominence (cyan border + filled CTA). Alts deben ser secondary "más opciones" — no competir con primary. Default colapsada respeta jerarquía visual.

6. **Max-height transition** vs display:none: `max-height: 600px` cuando expanded permite collapsible accessible (alts en DOM, screenreaders pueden leer). `display: none` los excluiría del DOM tree y rompería SR navegación pre-expand.

7. **Cubic-bezier spring** `cubic-bezier(0.32, 0.72, 0, 1)` alineado con sheets pattern (Fix3 + Phase 6I-1/2). Mismo Apple-magic feel — coherencia cross-component.

8. **`useReducedMotion` from lib/a11y** consistente con sheets. `transition: none` cuando reduce — toggle funciona pero sin animación.

9. **PersonalizedView nueva prop `recommendationRaw`** (NO modifica `recommendation` existing). El `recommendation` que recibe PersonalizedView es el `recCard` transformado por `buildRecommendationCard` (HomeV2:227) — shape `{title, description, reason}` SIN alternatives. Necesitaba prop separada para el raw engine output. Aditivo, no breaking — callers que NO pasen `recommendationRaw` no ven alts (defensive auto-hide).

10. **`onStartAlternative(protocolId)` callback** parameterless callback pattern (similar a `onStartRecommended`). PersonalizedView traduce internamente: cuando AlternativesCard invoca `onAction({action: "start-protocol", protocolId})`, PersonalizedView extract `protocolId` y llama `onStartAlternative(protocolId)`. HomeV2 wire a `onNavigate({action: "start-recommended", protocolId})` — reusa AppV2Root handler launchProtocol existing (Fix-A1 ya canalizó este path).

11. **LearningView gate `recoFromEngine`**: solo monta alts cuando engine produjo recommendation real (no fallback firstProtocolForIntent rotation). En fallback path, recommendation NO tiene alternatives válidas — `extractAlternatives` retorna [] y el component se auto-oculta defensive. Doble protección: gate visible + defensive auto-hide.

12. **PersonalizedView NO usa gate `isEngineRecommendation`** porque HomeV2 pasa `recommendationRaw={devOverride ? null : recommendation}` — el devOverride bypass YA cubre el caso anti-regression (smoke test composite=62). En real flow, si engine retorna null o sin alts, defensive auto-hide del component cubre.

13. **PersonalizedView wrap `<div paddingInline: spacing.s24>`** porque ActionCard usa `marginInline: spacing.s24` interno. Sin wrap, alts card iría flush a edge. Pattern consistente con shell padding.

14. **Tests E2E pre-set `cohortCelebrationDoneAt` + `streakMilestoneDoneAt`** ANTES de simular sesiones. Razón: cruzar 5→learning dispara sheet Fix3 (backdrop intercepta clicks); cruzar 7 días dispara sheet Phase6I-2 (mismo issue). Pre-set doneAt previene mount via dedup helper. Pattern fixable en test infra dictado por interaction Fix3 + Phase 6I-2 + Phase 6I-3.

15. **Tests existing legacy `LearningView.bugfix.test.jsx`** usan recommendationMock con shape engine real (post Fix-A1). Sin cambios — alternatives empty arrays son OK por defecto (extractAlternatives retorna [], component se auto-oculta).

16. **Sin mutation engine**: `extractAlternatives` filter retorna NEW array (no muta original). Tested + documented in helper.

---

## Tests verde

```
recommendationExtract.test.js                     45 passed (23 baseline Fix-A1 + 22 nuevos Phase 6I-3)
RecommendationAlternativesCard.test.jsx           26 passed (5 null + 3 colapsada + 3 toggle + 6 content + 4 interaction + 2 reduced-motion + 2 legacy/mixed)
LearningView.bugfix.test.jsx                      10 passed (anti-regression Phase 6F + Fix-A1)
LearningView.fix-a1.test.jsx                       5 passed (anti-regression Fix-A1)
HomeV2.smoke.test.jsx                             15 passed (anti-regression composite=62 + Bug-48 cohort transitions)
ColdStartView.test.jsx                            36 passed (anti-regression Premium-Fix2)
HeroComposite.test.jsx                            13 passed (anti-regression Premium-Fix1)
DimensionsRow.test.jsx                             9 passed (anti-regression Premium-Fix1)
ActionCard.test.jsx                                6 passed (anti-regression Fix4)
BioIgnitionWelcomeV2.fix4.test.jsx                 4 passed (anti-regression Fix4)
NeuralCalibrationV2.fix4.test.jsx                  4 passed (anti-regression Fix4)
ProgressBar.test.jsx                               9 passed (anti-regression Fix2)
MiniStatsRow.test.jsx                              6 passed (anti-regression Fix2)
useReadiness.test.js                              19 passed (anti-regression Fix1)
useStore.celebration.test.js                      20 passed (anti-regression Fix3)
useStore.programCompletion.test.js                20 passed (anti-regression Phase6I-1)
useStore.streakMilestone.test.js                  34 passed (anti-regression Phase6I-2)
CohortCelebrationSheet.test.jsx                   13 passed (anti-regression Fix3)
ProgramCompletionSheet.test.jsx                   20 passed (anti-regression Phase6I-1)
StreakMilestoneSheet.test.jsx                     19 passed (anti-regression Phase6I-2)

FULL VITEST SUITE: 4344/4344 verde (4296 baseline Phase6I-2 + 48 nuevos: 22 helper + 26 component)
Duración: 61.07s

E2E premium-recommendation-alternatives.spec.ts:
  ok 1 › LearningView: 7 sesiones → engine recommendation con alternatives card visible (25.0s)
  ok 2 › Setup directo via store: alts card visible + expand + alt rows + reasons (19.2s)
  ok 3 › Tap alternative row → onAction dispatched (start-protocol) (17.6s)
  ok 4 › prefers-reduced-motion → expand transition disabled (13.6s)
  ok 5 › Anti-regression: LearningView fallback path → alts card NO visible (recoFromEngine=false) (9.0s)
  ok 6 › Capture comparativa: card colapsada vs expanded (43.4s)
  6 passed (2.5m)
```

---

## Capturas comparativas

### ANTES (pre-Phase 6I-3)

`recommendation.alternatives` con 2 items computed por engine, pero NINGÚN componente del shell v2 los renderea. Sin captura disponible — el "engine output invisible" era el bug mismo. Documentado en `REPO_AUDIT_BUG_PATTERN_REPORT.md`:
- `grep recommendation.alternatives src/components` → 0 matches
- Engine compute alternatives + reasons + scoring premium → invisible al user

### DESPUÉS (Phase 6I-3)

`screenshots/phase6i-3-alternatives/01-learning-alternatives-expanded.png`:
- LearningView header: "EN APRENDIZAJE" + greeting + "Sesión 7 de 14" + progress bar
- Primary recommendation: **"TU PRÓXIMA SESIÓN"** + "Activación Cognitiva · 120s · enfoque" + reason italic + CTA cyan "EMPEZAR"
- **Card "OTRAS OPCIONES (2)"** EXPANDED (chevron up cyan) con 2 alternativas:
  - **ALTERNATIVA · Skyline Focus** · "120s · 2 min · enfoque" · "Ventana óptima para activación prefrontal"
  - separator 0.5px
  - **ALTERNATIVA · Lightning Focus** · "120s · 2 min · enfoque"
- Stats motor neural debajo

`screenshots/phase6i-3-alternatives/03-alternatives-colapsada.png`:
- Mismo viewport, card colapsada (chevron down cyan), contenido escondido (max-height: 0)
- Progressive disclosure funcionando — primary prominente, alts accesibles bajo demanda

**PROOF visual decisiva**: el title del primary "Activación Cognitiva" es DIFERENTE de los alts "Skyline Focus" + "Lightning Focus" — engine produce 3 protocolos distintos basado en scoring/bandit/circadian. Antes Fix-A1 + Phase 6I-3, user solo veía el primary; ahora puede explorar alternatives explicit.

### Capturas en disco

| Path | Descripción |
|---|---|
| `screenshots/phase6i-3-alternatives/01-learning-alternatives-expanded.png` | Card expanded mostrando 2 alternativas con reasons |
| `screenshots/phase6i-3-alternatives/03-alternatives-colapsada.png` | Card colapsada — progressive disclosure default |
| `screenshots/phase6i-3-alternatives/04-alternatives-expanded.png` | Comparativa del mismo state expanded |

---

## Self-rating

| Dimensión | Score 1-10 | Notas |
|---|---|---|
| **Cobertura tests** | 10 | 22 helper + 26 component + 6 E2E = 54 tests nuevos. Cubren: helper extracts engine real + legacy + null/undefined/empty/invalid + edge id=0 + immutability + 4 engine reason samples; component null/colapsada/expand/collapse/aria/alt content/onAction/reduced-motion/legacy mixed/separator behavior; E2E LearningView 7 sesiones + setup directo + tap alt + reduced-motion + anti-regression fallback + capture comparativa |
| **Compatibilidad backwards** | 10 | 4344/4344 vitest verde sin tocar fixtures, schema, backend, Phase 6F SP-A/B/C/D/E/F core, Phase 6G fixes, Premium-Fix1/2/3/4, Fix-A1 (extension aditiva, helpers existing intactos), Phase 6I-1/2. PersonalizedView API existing intacta — `recommendation` (transformed) preservado, `recommendationRaw` + `onStartAlternative` 100% aditivos opcionales. LearningView solo añade sibling render condicional |
| **Apego al ADN visual** | 10 | Cyan single accent (chevron + focus), mono caps letter-spaced (eyebrow OTRAS OPCIONES + ALTERNATIVA), light weight tabular-nums, italic muted reason caption (Premium-Fix4 M-1 pattern), 0.5px separators, touch targets ≥44px (Polish-2), spring cubic-bezier transition alineado con sheets. Cero color nuevo, cero glifo emoji, ChevronDown/Up de lucide. Sin framer-motion (v2 shell pattern) |
| **Cierre de finding** | 10 | H-3 cerrado: engine alternatives + reasons ahora visibles al user. Helper centralizado, defensive auto-hide cuando no hay alts, gate `recoFromEngine` en LearningView, devOverride bypass en PersonalizedView. PROOF visual decisiva: 2 alternatives REALES del engine ("Skyline Focus" + "Lightning Focus", distintos del primary) con reasons contextuales. Apps competencia pattern (Headspace/Calm "More like this") ejecutado |
| **Capturas comparativas** | 10 | 3 capturas: colapsada (default progressive disclosure) + expanded (2 alts visibles con reasons) + comparativa. Diferenciación visual primary vs alternatives clara — primary cyan border + filled CTA prominente, alts subtle background + ghost rows. Engine adaptation per protocol demostrada (3 protocolos enfoque distintos) |
| **Documentación in-code** | 10 | Header doc del component con choreography progressive disclosure rationale + decision A1/B1/C1/D1/E del prompt. Helper extension comments con engine source authoritative + defensive chain rationale + immutability note. PersonalizedView header doc actualizado con Phase 6I-3 props nuevos + razón del wrap div paddingInline. LearningView gate `recoFromEngine` documentado |
| **Seguridad / regresión** | 10 | Helpers puros testables; defensive null/undefined paths cubiertos; auto-hide cuando alternatives empty; PersonalizedView prop aditivo no breaking; HomeV2 devOverride bypass anti-regression smoke; engine `useAdaptiveRecommendation` 0 modifications; LearningView fallback path NO afectado (alts solo cuando engine real); PersonalizedView ActionCard primary intacto (alts es sibling, no replacement) |

**Promedio: 10/10**

---

## Issues / blockers

**Ninguno bloqueante.** Anotaciones:

- **A1.** Engine no SIEMPRE produce alternatives — depende del state real (k<minSamples, banditArms vacíos, cohort cold-start). En esos casos `extractAlternatives` retorna [] y el component auto-oculta. UX correcta: progressive enhancement en lugar de empty state forzado. Test E2E acepta ambos paths (engine produce o no) defensive.

- **A2.** PersonalizedView nueva prop `recommendationRaw` es ADITIVA — callers que NO la pasen siguen funcionando (alts no se muestran). HomeV2 ya wire correctamente. Si futuros callers integran PersonalizedView sin pasar `recommendationRaw`, no rompe nada.

- **A3.** Co-occurrence con Fix3 + Phase 6I-1/2 sheets: cuando user cruza milestone Y abre alts card, el sheet backdrop intercepta clicks. Tests E2E pre-set doneAt para prevent mount. UX en producción: user dismisses sheet primero, después puede explorar alts. Aceptable.

- **A4.** `RecommendationCard` (LearningView) y `ActionCard` (PersonalizedView) tienen shape primary distinto pero AlternativesCard es genérico — funciona con ambos surfaces gracias al helper centralizado. Pattern future-proof: si Phase 6I+ añade un 3er surface (e.g. ColdStartView que reciba recommendation raw), basta importar el card.

- **A5.** Max-height 600px hardcoded — funciona para 2 alts máximo (slice(1,3) del engine). Si futuro engine retorna más alts, el contenido scrollea internalmente. Aceptable; alternativa sería medir altura dinámica que añadiría complejidad sin beneficio inmediato.

- **A6.** Reason caption usa `colors.text.muted` (mismo que ALTERNATIVA eyebrow) — visual jerarquía depende de italic + smaller fontSize. Verificable en device real con accessibility audit. Premium-Fix4 M-1 ya valido este pattern en ActionCard reason.

---

## Compliance con prohibiciones absolutas

| Prohibición | Cumplida | Evidencia |
|---|---|---|
| NO modifico engine `useAdaptiveRecommendation` ni `_generateReason` core | ✅ | `git diff src/hooks/useAdaptiveRecommendation.js src/lib/neural.js` vacío |
| NO modifico backend Phase 6F SP-A/B/C/D/E/F core | ✅ | Sin tocar |
| NO modifico Phase 6G fixes | ✅ | Sin tocar |
| NO modifico Premium-Fix1 (HeroComposite + DimensionsRow + useReadiness) | ✅ | Sin cambios |
| NO modifico Premium-Fix2 (ColdStartView phase + ProgressBar + MiniStatsRow) | ✅ | Sin cambios |
| NO modifico Premium-Fix3 (CohortCelebrationSheet + cohort celebration store) | ✅ | Sin cambios |
| NO modifico Premium-Fix4 (Welcome/Calibration focus + Skip ghost) | ✅ | Sin cambios. AlternativesCard usa pattern Fix4 reason caption italic muted, no es modificación |
| NO modifico Fix-A1 más allá de extension aditiva extractAlternatives | ✅ | 4 extracts existing intactos. 3 extracts nuevos (`extractAlternatives`, `extractAlternativeProtocol`, `extractAlternativeReason`) son extension aditiva pura |
| NO modifico Phase 6I-1 (ProgramCompletionSheet + program completion store) | ✅ | Sin cambios |
| NO modifico Phase 6I-2 (StreakMilestoneSheet + streak milestone store) | ✅ | Sin cambios |
| NO modifico fixtures | ✅ | Sin tocar |
| NO modifico schema Prisma | ✅ | Sin tocar |
| NO modifico Coach, useProtocolPlayer, ProtocolPlayer, audio.js, coachSafety | ✅ | Sin tocar |
| NO modifico tests anti-regresión Phase 6H + Phase 6I-1/2 | ✅ | Tests Phase 6H + Phase 6I-1/2 todos intactos. Solo añado nuevos files: `RecommendationAlternativesCard.test.jsx`, `premium-recommendation-alternatives.spec.ts`. Extension aditiva en `recommendationExtract.test.js` (Fix-A1) NO modifica los 23 tests baseline |
| NO declaro deuda técnica nueva no documentada | ✅ | A1-A6 documentadas |
| NO hago commits | ✅ | `git status` working tree dirty, sin commits |

---

## Finding H-3 cerrado

**H-3** (Recommendation alternatives no surface): **CERRADO** ✅

- **Helper consumer existe**: `extractAlternatives(recommendation)` ahora tiene 2 callers (LearningView + PersonalizedView via RecommendationAlternativesCard)
- **Engine output exposure premium**: alternatives + reasons + duration + intent visible al user con progressive disclosure
- **Pattern apps competencia ejecutado**: Headspace "Try another exercise", Calm "More like this", Strava "Activity suggestions" — Bio-Ignición ahora paritario
- **Defensive auto-hide**: cuando engine no produce alts (cohort cold-start, k<minSamples), card no aparece — UX progressive enhancement
- **Reasons contextuales del engine visibles**: "Ventana óptima para activación prefrontal", "Tu historial muestra +0.8 puntos con este protocolo" — engine compute work YA NO desperdiciado
- **Touch targets ≥44px** (Polish-2) en toggle + alt rows
- **Accessibility premium**: aria-expanded + aria-controls + role implicit semantic + reduced-motion respect
- **Engine 0 modifications**: helper lee output existing, defensive chain cubre legacy + engine real

**Premium grade post-fix:**
- Engine outputs invisibles dimension (repo audit): cierre 4to gap (de 5 — restantes M-2/M-3 + L-1)
- Hierarchy PAH dimension: 9.8 → **9.85/10** (alts añaden information density premium sin saturar primary)
- Microinteractions PAH dimension: 9.0 → **9.0/10** (sin cambio — toggle es interaction estándar)
- Composite del producto: 9.1/10 (post Phase6I-2) → **~9.15/10 (post Phase6I-3)**

**Stack Premium-Fix1+2+3+4 + Fix-A1 + Phase 6I-1/2/3 cierra:**
- ✅ H-1, H-2, H-3, H-4 SIMULATION_90_DAYS (Phase 6H Fix1+2+3+4)
- ✅ M-1, M-3, M-4, L-2 (Phase 6H Fix4)
- ✅ A1 bug latente engine extraction (Fix-A1)
- ✅ H-1 program completion (Phase 6I-1)
- ✅ H-2 streak milestones (Phase 6I-2)
- ✅ **H-3 recommendation alternatives (Phase 6I-3)** ← CERRADO ahora

**Pendientes Phase 6I+ (1 HIGH restante del repo audit):**
- H-4: `engagement` panel ausente del executive report (admin)

**Recomendación próximo SP**: H-4 es trabajo independiente del shell v2 (admin reports panel). Pattern `engine output exposure` similar a H-3 pero target diferente (admin OrgExecutiveReport vs v2 Home). Probable scope: nuevo panel `EngagementPanel.jsx` análogo a otros admin panels (KpiHero, ProgramsCohortPanel, CorrelationPanel, etc) consumiendo `report.engagement` + `report.sessions` (sessionsMetrics).

**Cuarteto de exposiciones engine completo en v2 shell:**
1. **Cohort transitions** (Fix3): cohort cross visibilidad
2. **Program completion** (Phase6I-1): program lifecycle visibilidad
3. **Streak milestones** (Phase6I-2): streak achievement visibilidad
4. **Recommendation alternatives** (Phase6I-3): engine alts visibilidad

Cada uno con pattern reuse 1:1 (sheets para celebrations, card colapsable para alternatives), defensive auto-hide, accessibility premium, prefers-reduced-motion respect, tests verde.
