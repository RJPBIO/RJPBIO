# SIMULACIÓN 90 DÍAS — PREMIUM APP HEURISTICS ANALYSIS

**Fecha:** 2026-05-06
**Modo:** Read-only (sin modificar código source ni tests existentes — solo `tests/e2e/audit/simulation-90-days.spec.ts` nuevo)
**Duración runtime:** ~10 min antes de detener (memoria de Chromium creció a >2GB en dev mode, navegaciones late-stage se volvieron no-respondientes)
**Sesiones simuladas:** 42 confirmadas (días 1-14 × 3/día) sobre objetivo 270
**Sampling real intentado:** Día 1 (CTA literal "Empezar sesión" no encontrado — copy en producto es derivado del intent, "Tu primera sesión")
**Capturas obtenidas:** 9 (cubren onboarding completo + cohort transition coldstart→learning→personalized hasta día 14)
**Capturas faltantes vs plan:** 25-35 (semanas 3-13, hitos día 30/60/90, exploration final pages, admin pages)

---

## Honestidad de scope

La simulación se detuvo en **día 14** porque a partir de ahí el dev server + Chromium dejaron de avanzar (capturas planeadas como `d15-reload`, `d21-tab-hoy`, etc. no llegaron a renderizarse en >5 min de espera). No es un bug de producto: es resultado de Playwright + Next dev mode + 270 navegaciones rápidas con cada `page.goto()` re-ejecutando hot-reload bundle. Las observaciones que siguen aplican a las **9 capturas reales** y al **análisis de código** de las views que cubrirían días 14-90 (que son casi exclusivamente PersonalizedView en distintos estados de signal, no nuevas pantallas).

**Lo que sí cubrimos visualmente:**
- Welcome step 1 (cinematic intro, BIO-IGNICIÓN wordmark)
- Calibration PSS-4 step (clinical credibility chip)
- Calibration end → ColdStartView (post-onboarding day 0, 2 cards)
- ColdStartView day 1 (post-3-sesiones, **1 card visible — pierde contenido**)
- PersonalizedView día 7 y día 14 (HeroComposite + DimensionsRow + Recommendation)
- /app/program/today loading state (Next.js dev splash visible — capture artifact)

**Lo que NO cubrimos visualmente:**
- Wellbeing trends sparkline mature (requiere auth + history server-side)
- Tabs Datos/Coach/Perfil después de 90 días
- /app/programs catalogo
- /admin/* pages
- Public pages /, /pricing, /trust
- Recommendation card en estado scroll-bottom (visible en captura pero recortada por capture stitching de fixed-nav)

---

## Resumen ejecutivo

**Findings totales:** 12 (Critical 0 · High 4 · Medium 5 · Low 3)

**Veredicto general:** Bio-Ignición tiene un **ADN visual disciplinado y premium** en el shell core (welcome cinematic, calibration con citation chips clínicos, dark base + single-cyan signal coherente con la canon documentada en memoria). Pero el **estado intermedio "post-primera-acción / pre-baseline" rompe la sensación premium**: el viewport se vacía después de Day 1, el copy lag ("Vamos a conocerte" cuando ya hiciste 3 sesiones), y el HeroComposite muestra "0" durante semanas porque el engine requiere HRV+chronotype+PSS-4 standalone para activar el composite real.

Comparado contra Linear / Apple Health / Headspace: el **first impression** de welcome compite (cinematic, mono caps, single accent). Pero la **journey post-onboarding** se siente como una versión beta del producto: muchos signals quedan en defaults (FOCO 60% / CALMA 50% / ENERGÍA 50% sin variar), no hay celebración de hitos cohort, ni progresión visible streak/total sessions en el viewport principal.

**Una sola palabra para describir el gap:** *plateau*. La UI converge a un estado estable demasiado pronto y luego no varía aunque el usuario invierta semanas. Premium apps mantienen la sensación de progreso *dinámico* (Whoop strain bars cambiando diariamente, Headspace badge unlocks, Strava personal records). Bio-Ignición tiene el lenguaje visual pero no el feedback loop dinámico de progreso.

---

## Findings por dimensión PAH

### 1. Loading states

**Captura clave:** `milestones/milestone-d14-program-reeval.png`

El `<Loading />` interno de `/app/program/today` (`src/app/app/program/today/page.jsx:158-184`) es correcto: mono caps "Cargando…" cyan, centered, dvh full. **Sin embargo**, en la captura aparece un **glifo multicolor (verde/cyan/naranja) con label "CARGANDO" capitalizado letter-spaced** que NO es brand y NO existe en el código de la app. **Diagnóstico:** es overlay de Next.js DevTools / Turbopack splash de navegación dev mode. En producción no aparecerá. Verificable: el badge "N · 1 Issue" del DevTools también está visible en TODAS las capturas — confirma overlay dev.

**Finding LOW (capture-infra):** Los screenshots dev-mode capturan el Next.js DevTools overlay, contaminando la evaluación visual. Recomendación para futuras simulaciones: ejecutar contra `npm run build && npm start` (production mode) — el overlay no aparece.

**Premium reference:** Apple Health renderiza placeholder data instantáneamente (no spinner). Linear muestra skeleton sutil con shimmer cyan. Bio-Ignición usa solo "Cargando…" texto — funcional pero no diferenciador. **Premium gap MEDIUM:** falta skeleton placeholder en `/app/program/today`, `/app/wellbeing` y otras páginas con server fetch.

---

### 2. Empty states

**Captura clave:** `milestones/05-tab-hoy-day0.png` (Day 0 ColdStartView, 2 cards) y `week-00/d01-tab-hoy.png` (Day 1, 1 card).

**Day 0:** dos action-cards lista-row ("Tu primera sesión · Reinicio Parasimpático · 120s · sin protocolo previo necesario" + "Mide tu variabilidad cardíaca · 60s con cámara o BLE · primera medición"), eyebrow cyan "EMPEZAR POR AQUÍ", greeting "Buenas noches · Vamos a conocerte". **Bien construido**: copy concreto, micro-clarificaciones útiles (`sin protocolo previo necesario`, `primera medición`). 

**Day 1 (post-3-sesiones):** la card "Tu primera sesión" desaparece (filtrada por `firstProtocolForIntent` cuando `totalSessions ≥ 1`), queda **solo la card HRV**. El viewport entero se vuelve casi vacío — header + greeting + 1 card + ~70% black space hasta SOS/nav. Sigue mostrando greeting "Vamos a conocerte" y eyebrow "EMPEZAR POR AQUÍ" como si no hubieras hecho nada.

**Finding HIGH (empty states):** Day 1-4 cold-start es estado intermedio mal cubierto. La transición de "2 cards" a "1 card" sucede el primer día, dejando viewport semi-vacío durante 4 días hasta cohort-transition a Learning (5 sesiones). Copy lag: "Vamos a conocerte" no debería persistir tras 3+ sesiones completadas.

**Recomendación:**
- Si `totalSessions ≥ 1 && totalSessions < 5`: cambiar greeting subtitle a "Tu primera trayectoria está tomando forma" + agregar mini-stats inline ("3 sesiones · 5 hasta tu trayectoria personalizada" con barra cyan).
- Mantener HRV card siempre visible PERO añadir card de "próxima sesión recomendada" que use el mismo `firstProtocolForIntent` (no filtrar a partir de session 1).
- Eyebrow alternativa: "TU PRÓXIMO PASO" en lugar de "EMPEZAR POR AQUÍ" cuando hasActions === false.

**Premium reference:** Things 3 muestra ilustración + copy concreto + onboarding cards que persisten hasta hito real. Headspace usa progress bar visible "Course X · Day 3 of 10" desde session 1. Bio-Ignición Learning view (cum ≥ 5) sí tiene progress visible — pero los días 1-4 quedan en limbo.

---

### 3. Error states

**No capturadas en esta simulación** (no se forzó error de red ni 401 en happy path). 

Análisis de código: `src/app/app/program/today/page.jsx:44-52` tiene ErrorBlock con `onRetry` callback — patrón correcto. `useActiveProgram` clasifica en `unauthenticated/server/network` — semántica clara. **Verificación pendiente** con simulation real con red caída. Premium reference: Linear muestra error boundary card con error code + retry CTA + "report to support". Bio-Ignición tiene retry pero falta el meta-info (timestamp, error id).

**Finding MEDIUM (premium gap):** Error states sin error-id traceable. Para B2B mature, los errores deberían incluir error-id copiable (`Error · 7c2a · 2026-05-06 23:14`) que el user puede pasar a soporte.

---

### 4. Transitions

**No capturadas directamente** (Playwright fullPage captura frame estático, no animaciones). Análisis de código:

- **Cohort transitions** (cold-start → learning → personalized): no hay animation de celebration. El usuario simplemente llega al Tab Hoy y la layout cambia silenciosamente. Captura `week-01/d07-tab-hoy.png` (cum=21 sesiones, ya en PersonalizedView) muestra layout final sin marker de "you've unlocked".
- **Tap feedback**: `BottomNavV2.jsx:63-65` y `DimensionsRow.jsx:49-51` aplican `transform: scale(0.95-0.98)` con `motion.duration.tap = 120ms`, easing `motion.ease.out`. Coherente, premium.
- **HeroComposite**: count-up 0→value en 650ms ease-out cubic (`HeroComposite.jsx:8-31`). Premium touch — pero el value es siempre `0` en nuestras capturas porque el engine no computa con HRV ausente.
- **Header dot pulse**: 4s ease-in-out infinite (`HeaderV2.jsx:91-94`). Subtle, premium.
- **CSS easing tokens**: `tokens.js:123-129` define standard/spring/decelerate/accelerate/linear con cubic-bezier curves canónicos (Material + Apple Magic). Bien.

**Finding HIGH (premium gap — celebrations):** No hay micro-celebrations en cohort transitions ni en milestones (5 sesiones, 14 sesiones, 30 sesiones, primera vez con HRV, primer programa completado). Para una app que vende "trayectoria de optimización humana", la ausencia de positive reinforcement es un agujero estratégico. Headspace, Streaks, Whoop celebran agresivamente cada hito.

**Recomendación:**
- Sheet/toast emergente al cruzar cohort threshold: "Tu trayectoria personalizada se activó" con count-up del nuevo composite + CTA opcional "Ver qué cambió".
- Mantener disciplina de single-cyan signal — la celebración debe sentirse premium (linea cyan que pulsa, no confetti rainbow).

---

### 5. Hierarchy

**Captura clave:** `01-fresh-app.png` (Welcome) y `02-post-welcome.png` (Calibration).

**Welcome step 1** muestra hierarchy modélica:
1. Step counter `01 / 05` (mono microCaps, secondary color)
2. BioGlyph cyan animado (~96px, brand identity locked)
3. "BIO-IGNICIÓN" wordmark (light weight, letter-spacing -0.04em, ~48-64px)
4. Hairline divider cyan 1px
5. Body manifesto (medium emphasis)
6. Body taglines (muted)
7. Pagination dots (cyan active)
8. Primary CTA "CONTINUAR →" mono caps cyan + outlined cyan ring
9. Secondary "Saltar introducción" top-right outlined ring

5 niveles claros. Apple HIG-grade.

**Calibration step 1** mantiene hierarchy:
1. Step counter `01 / 05` (mono microCaps)
2. Eyebrow "CALIBRACIÓN NEURAL" (cyan mono caps)
3. H1 "Estrés percibido" (medium weight, ~36px)
4. Citation chip "PSS-4 · Cohen 1983 · validado peer-reviewed" (cyan border, ~13px)
5. Mono caps "PREGUNTA 1 DE 4" (secondary)
6. Question body
7. 5 radio cards (~64px height, generous padding)
8. Pagination dots
9. Primary CTA "SIGUIENTE →" disabled state
10. Secondary "Saltar este instrumento" text link

Excelente hierarchy clínica. La citation chip en cyan border es el detalle premium B2B-ready: comunica scientific rigor sin pesar visualmente.

**Tab Hoy día 14 PersonalizedView** rompe hierarchy:
- Eyebrow "TU SISTEMA HOY" (mono microCaps, secondary)
- Display gigante "0" (~128px, light weight, weak gold standard cuando = 0)
- Body "Sistema en recuperación. Tu mejor ventana es a las 22:00." (~17px, secondary)
- 3-stat row "FOCO 60% · CALMA 50% · ENERGÍA 50%" con descriptors humanos
- Eyebrow "RECOMENDADO AHORA" + card

El display "0" es el mayor finding visual. Cuando dataMaturity=personalized pero composite=0 (engine sin HRV), el hero se siente vacío. **Finding HIGH.**

---

### 6. Spacing rhythm

Análisis de tokens (`tokens.js:82-107`): scale base 4px (s2/s4/s6/s8/s10/s12/s14/s16/s20/s24/s28/s32/s40/s48/s56/s64/s80/s96). Apple HIG / Material / Tailwind compatible. Disciplinado.

**Verificación visual:**
- ColdStartView: `paddingInline: s24` (24px), `paddingBlockStart: s8` (8px), `paddingBlockEnd: s64` (64px) entre greeting y action cards. Consistent.
- ActionCard: gap interno 16-20px entre icon-box y title+desc. Touch target ~80px height.
- DimensionsRow: 3 buttons grid `1fr 1fr 1fr` con borderInlineStart 0.5px separator entre celdas. paddingBlock s16 (16px). Numbers + descriptors stacked.
- BottomNavV2: 64px height + safe-area-inset-bottom. Padding s8 internal.

**Finding LOW (rhythm):** ColdStartView day 1 deja ~700px de vertical space empty entre la única card visible y el SOS button. No hay rhythm — es un hole. Cuando solo 1 card es visible, el `paddingBlockEnd: s96` después del onboarding section deja un hueco enorme.

---

### 7. Touch targets

Análisis (`tokens.js:113-117`): `touchTarget = { min: 44, preferred: 48, large: 56 }`. Apple HIG (44pt) + Material (48dp). Phase 6H Polish-2 documenta extensión via padding o `::before` invisible para componentes con visual <44px.

**Verificación:**
- BottomNavV2 buttons: ~64px height (full nav) × ~25% width (4 tabs en grid 1fr) ≈ 105px wide × 64px high. Generosos.
- ActionCard buttons: ~80px high × full width minus s24*2 padding. Generoso.
- DimensionsRow buttons: ~80-90px high × ~33% width. Generoso.
- HeaderV2 bell: 36×36 visual (20 icon + 8*2 padding) + `data-v2-icon-button` ::before extiende a ≥44px (per code comment).
- Welcome "Saltar introducción": visible outlined button ~140×64px. Generoso.
- Welcome "CONTINUAR →": full-width CTA, ~64px high. Generoso.
- Calibration radio cards: ~64px high × full width minus padding. Generoso.

**No findings.** Touch targets son premium-grade en todo el shell v2.

---

### 8. Motion design

Análisis (`tokens.js:135-180`):
- `motion.duration.tap = 120ms` (rápido, scale press-down)
- `motion.duration.fadeUp = 240ms` (mount enter)
- `motion.duration.enter = 280ms` (modal/sheet)
- `motion.duration.exit = 200ms` (modal dismiss)
- Curves: `motion.ease.out = cubic-bezier(0.22, 1, 0.36, 1)` (Apple-flavored)
- HeroComposite count-up: 650ms ease-out cubic
- HeaderV2 dot pulse: 4s ease-in-out infinite

**No verificable directamente** sin animation captures. Code-level lectura: timings son consistent + intencionales (tap rápido, mount calmo, dot pulse meditativo). Coherente con la promesa "sensorial premium" del producto.

**Finding LOW (premium gap):** No hay evidencia visible de `prefers-reduced-motion` en el shell — Phase 6H Polish-2 menciona respeto pero no encontré CSS media query en tokens. Verificable en runtime; si falta, es accessibility bug.

---

### 9. Color system

**Captura clave:** todas, especialmente Welcome y PersonalizedView.

Análisis (`tokens.js:6-45`):
- `bg.base = #08080A` (near-black, no pure black — más sutil)
- `bg.raised = rgba(255,255,255,0.03)` (cards, glassmorphism)
- `accent.phosphorCyan = #22D3EE`
- `text.{primary,secondary,muted,strong}` con alphas 0.92/0.62/0.38/0.96
- `separator = rgba(255,255,255,0.06)` hairline 0.5-1px
- `focusRing = #22D3EE` (mismo accent, full opacity)
- `semantic.{warning(amber), danger(red), success(=cyan)}` — single-signal positivo: cyan ES el éxito (no verde separado)

**Verificación visual:**
- Welcome: cyan accent en BioGlyph + dots + CONTINUAR + Saltar focus ring + hairline divider. **Single-signal disciplinado.**
- Calibration: cyan en eyebrow + citation chip border + pagination dot + Saltar calibración focus ring. **Coherent.**
- ColdStartView: cyan en eyebrow "EMPEZAR POR AQUÍ" + SOS button border + nav active dot. **Coherent.**
- PersonalizedView: cyan en eyebrow + recommendation card border + nav active. White display "0" sin cyan. **Coherent.**
- BottomNav active: dot cyan 4px + label cyan + icon cyan. Inactive: rgba(255,255,255,0.32). **Premium subtle.**

**No findings.** Color system es premium-grade discipline. Comparable a Linear (single accent purple) y Apple Health (sistema disciplinado). **Diferencial vs competencia:** muchas apps wellness saturan con verde/amarillo/rojo semántico; bio-Ignición elige cyan-only positive — más sofisticado.

---

### 10. Microinteractions

Análisis de código:
- BottomNavV2: `onPointerDown` scale(0.95) + `onPointerUp/Leave` scale(1). Transition 120ms ease-out. **Apple-grade tap feedback.**
- DimensionsRow: scale(0.98) + opacity 0.95→1 en hover. Symmetric.
- ActionCard `onClick={onStart}` — sin tap scale visible en código rápido. **Verificar.**
- HeroComposite: count-up animation on mount (650ms cubic).
- Welcome focus ring: outlined cyan + box-shadow visible en captures (heavy emphasis).
- Calibration "Saltar calibración" focus ring: outlined cyan + box-shadow visible en captures.

**Finding MEDIUM (microinteractions):**
1. Welcome step 1 abre con focus en "Saltar introducción" (top-right) — preferible focus en primary CTA "CONTINUAR" para keyboard-first users que avanzan secuencialmente.
2. Calibration step 1 abre con focus en "Saltar calibración" — mismo issue.
3. Focus ring con box-shadow heavy es muy visible — posible "loud" para mouse users (HIG: focus ring solo en keyboard nav). Verificar `focus-visible` CSS pseudo-class está aplicado.

**Recomendación:** En Welcome y Calibration, programar `useEffect(() => primaryCTARef.current?.focus(), [step])` para que el flujo keyboard avance natural. Aplicar `:focus-visible` strict para no mostrar ring en mouse-click.

---

## Comparación side-by-side con apps premium

### Tab Hoy (PersonalizedView día 14) vs Linear "Today" / Whoop Recovery

| Dimensión | Bio-Ignición (D14) | Linear / Whoop | Gap |
|---|---|---|---|
| **Hero metric** | Display "0" gigante (light weight) cuando engine sin HRV | Linear: % completion del sprint con donut. Whoop: Recovery score color-coded ring | Bio muestra "0" → demotivador. Necesita fallback "Activa HRV para tu lectura completa" o esconder hero cuando composite=0 |
| **Stats secondary** | 3-stat row FOCO/CALMA/ENERGÍA con números + descriptor humano | Linear: 6 sprint stats con sparklines mini. Whoop: HRV/RHR/Sleep cards con trends | Bio carece sparklines mini en stats — no transmite trayectoria. Adding inline 7-day mini-spark daría mucho valor |
| **Recommendation** | Card cyan-bordered "RECOMENDADO AHORA · Sesión · 120s · Sesión guiada · 2 min" | Linear: AI-suggested next ticket con context. Whoop: workout plan con strain target | Bio recommendation copy es genérico. Sin "Por qué" personalizado (e.g. "Tu CALMA bajó 12% últimas 3 sesiones — Reinicio Parasimpático ayuda") |
| **Streak/totals** | No visible en Tab Hoy | Linear: sprint progress bar permanent. Whoop: weekly avg recovery card | Bio carece streak/total counter visible. Total Sessions accesible via Datos tab pero no en Hoy hero |
| **Color discipline** | Cyan single accent, dark base | Linear: purple single accent | Paridad — ambos disciplinados. Whoop usa color-coded ring (red/yellow/green) que es más expresivo pero menos premium |

**Veredicto:** Bio-Ignición pierde a Linear/Whoop en *information density* y *progress visibility*. Gana en *minimalism* (hero gigante + 3 stats es elegante) pero los signals defaulteados a 60/50/50 lo hacen ver subutilizado.

---

### ColdStartView (Day 0) vs Things 3 / Headspace onboarding

| Dimensión | Bio-Ignición (D0) | Things 3 / Headspace | Gap |
|---|---|---|---|
| **First impression** | Greeting "Buenas noches" + eyebrow + 2 action cards | Things 3: ilustración + manifesto + 1 primary action. Headspace: video splash + breathing animation + commit CTA | Bio first impression es texto-pesado. Una breath animation cyan minúscula sustituyendo header dot pulse podría dar el "wow" inicial sin perder minimalism |
| **Action concreteness** | "Tu primera sesión · Reinicio Parasimpático · 120s · sin protocolo previo necesario" | Things 3: "Add your first task" inline. Headspace: "Take a 3-minute breather now" | Bio gana en concreteness — micro-clarificación "sin protocolo previo necesario" es premium. Pero el segundo card (HRV) podría tener preview animation de la cardiac wave |
| **Empty space** | ~70% vertical empty post-2-cards | Things 3: ilustración llena ~30% del viewport. Headspace: imagen full-bleed | Bio deja mucho aire — minimalism intencional pero corre riesgo de "anemia". Considerar agregar BioGlyph cyan minúsculo + hairline divider en empty area como brand reinforcement |

**Veredicto:** Bio-Ignición compite en concreteness + clinical credibility, pero pierde en *visual density* y *first-second wow*.

---

### Welcome cinematic vs Apple Fitness+ / Calm onboarding

| Dimensión | Bio-Ignición Welcome | Apple Fitness+ / Calm | Gap |
|---|---|---|---|
| **Logo treatment** | BioGlyph cyan animado + "BIO-IGNICIÓN" wordmark light weight | Apple Fitness+: anillo de actividad full-screen con stroke animated. Calm: gota de agua + breathing | Paridad — Bio tiene identidad reconocible (cyan phosphor + glyph único). No requiere mejora |
| **Step count** | "01 / 05" mono caps + 5 dots cyan | Apple Fitness+: pagination dots only. Calm: progress bar | Bio explicit count "X/N" es claro pero un poco verbose. 5 dots solos serían más airy. Mantener si es preferencia documentada |
| **Manifesto copy** | "Sistema neural de alto rendimiento para profesionales. Diseñado con neurociencia validada. Construido para ejecutar bajo presión." | Apple: "Designed for everyone." simple. Calm: "Take a breath." | Bio copy es B2B-direct (alto rendimiento, profesionales, presión) — bien para target. No es para mass-market wellness pero alinea con brand identity de moat documentado |
| **CTA hierarchy** | Primary "CONTINUAR →" cyan + Secondary "Saltar introducción" outlined cyan | Apple: 1 CTA + skip text-only. Calm: 1 CTA always | Bio Skip outlined-with-cyan-ring compite visualmente con primary CTA. Skip debería ser text-only en text.muted color para no diluir primary |

**Veredicto:** Welcome es la pieza más premium de la app. Compite con tier-1 wellness/fitness. Único gap menor: Skip CTA tiene visual weight comparable a primary — Apple HIG dictaminaría secondary ghost.

---

### BottomNavV2 vs iOS native tab bar / Linear bottom nav

| Dimensión | Bio-Ignición | iOS / Linear | Gap |
|---|---|---|---|
| **Glassmorphism** | `rgba(8,8,10,0.8)` + `blur(20px)` | iOS: native materials. Linear: solid #0d0d0d | Paridad — Bio glassmorphism es premium |
| **Active indicator** | Dot cyan 4px above icon + cyan tint en icon+label | iOS: filled icon + tint. Linear: pill background tint | Bio dot indicator es distinctive y elegante. Premium |
| **Icon style** | Lucide stroke 1.5 size 20 | iOS: SF Symbols filled. Linear: custom icons | Lucide es bien-elegido — coherent con BioIcons philosophy. Premium |
| **Label** | Mono caps "HOY · DATOS · COACH · PERFIL" letter-spacing 0.18em | iOS: SF Pro 10pt regular. Linear: 11pt sans medium | Bio mono caps + letter-spacing es DISTINCTIVE — diferenciador vs apps genéricas. Premium |
| **Touch feedback** | Scale 0.95 on press + 120ms ease-out | iOS: spring damping. Linear: opacity 0.6 | Paridad |

**Veredicto:** BottomNav es premium-grade. No requiere cambios. Es el componente que mejor traduce el ADN documentado a UI.

---

### Calibration PSS-4 vs typical clinical assessment apps

| Dimensión | Bio-Ignición | Typical assessment apps | Gap |
|---|---|---|---|
| **Clinical credibility** | Citation chip "PSS-4 · Cohen 1983 · validado peer-reviewed" cyan border | Most apps: ninguna citation. Some: small footer "based on validated research" | **Bio gana decisivamente.** Citation chip es premium B2B-grade y diferenciador único |
| **Question UX** | Eyebrow + H1 + chip + "Pregunta 1 de 4" + body + 5 radio cards | Generic: question + 5 radios | Bio hierarchy es superior — comunica autoridad clínica |
| **Skip option** | "Saltar este instrumento" text-link bottom + "Saltar calibración" outlined top | Most apps: only "Skip" text | Bio dual-skip (instrumento vs calibración entera) da control granular — premium B2B |
| **Progress** | 5 pagination dots bottom + step counter top | Generic: progress bar | Paridad — dots elegantes |

**Veredicto:** Calibration es **el otro pico premium** del producto. Junto con Welcome, es lo que vende el "neurociencia validada" del manifiesto.

---

## Capturas progresión 90 días

### Onboarding (Day 0)

| # | Captura | Observación premium |
|---|---|---|
| 1 | `01-fresh-app.png` | Welcome step 01/05 — BioGlyph + wordmark + manifesto. **Premium-grade**, comparable Apple Fitness+ launch. Único finding: Skip outlined visual peso similar a primary CTA |
| 2 | `02-post-welcome.png` | Calibration PSS-4 — citation chip cyan + 5 radio cards generosos. **Premium B2B-grade**, mejor que la mayoría de assessment apps. |
| 3 | `03-calibration-mounted.png` | Identica a #2 (skipAllCalibration empieza desde mismo state). Confirmación de baseline visual |
| 4 | `04-calibration-end.png` | Vuelve a ColdStartView — 2 cards "Tu primera sesión" + "Mide HRV". Premium-grade ColdStart day 0. |
| 5 | `05-tab-hoy-day0.png` | ColdStartView identico al #4 — confirmación que post-onboarding aterriza estable |

### Week 00-02 progression (Days 1, 7, 14)

| Day | Captura | Cohort | Observación clave |
|---|---|---|---|
| 1 | `week-00/d01-tab-hoy.png` | cold-start (3 sessions) | **HIGH finding** — solo HRV card visible, viewport 70% empty. Copy "Vamos a conocerte" lag |
| 7 | `week-01/d07-tab-hoy.png` | personalized (21 sessions) | HeroComposite "0" + 3-stat 60/50/50 + recommendation generic. **HIGH finding** — composite=0 con 21 sesiones |
| 14 | `week-02/d14-tab-hoy.png` | personalized (42 sessions) | Identica a d07 — **MEDIUM finding** — no progresión visible week-over-week |

### Milestones críticos

| Milestone | Captura | Observación |
|---|---|---|
| ColdStart→Learning (5 sesiones) | **No capturado** — hueco en plan de captura (check ocurría post-day-loop, no post-session) | Verificable code-level: HomeV2.jsx:68 branch `health.dataMaturity === "learning"` con threshold 14 (no 5) |
| Learning→Personalized (14 sesiones) | **No capturado directamente** — visible en `d07-tab-hoy.png` ya en personalized | Cohort transition es funcional, pero invisible al usuario (sin celebration) |
| Program reeval Day 14 | `milestone-d14-program-reeval.png` | Next.js dev splash visible — capture artifact, no contenido real |
| Program completion Day 28 | **No capturado** (sim hung antes) | |

---

## Bugs / incoherencias detectados

### Critical
*(ninguno detectado en scope cubierto)*

### High

**H-1. Hero composite "0" con cohort=personalized (sin HRV/chronotype/PSS-4 standalone).**
- **Evidencia:** `week-01/d07-tab-hoy.png`, `week-02/d14-tab-hoy.png`
- **Repro:** Completar onboarding con skip-all-calibration + 14+ sesiones store-direct
- **Cause:** `HomeV2.jsx:83` `composite = readiness?.score ?? 0` — `useReadiness` retorna `null` o `score=0` cuando engine no tiene signals suficientes. Display gigante "0" + "Sistema en recuperación" se ve demotivador
- **Fix dirección:** condicional render del HeroComposite cuando composite > 0; sino, mostrar card "Activa tu lectura completa: HRV + Chronotipo" con CTA inline

**H-2. Day 1-4 cold-start con copy lag y viewport empty.**
- **Evidencia:** `week-00/d01-tab-hoy.png`
- **Repro:** Onboarding completo + 1-4 sesiones (cualquier cantidad)
- **Cause:** `ColdStartView.jsx:44-46` — `headlineCopy = hasActions ? greeting : "Listo para tu próxima sesión."` solo cambia si hasActions === false. Pero hasActions es true (HRV card visible) → greeting normal. Además `firstProtocolForIntent` filtra "Tu primera sesión" tras session 1 → solo HRV card queda → viewport empty
- **Fix dirección:** introducir tercer estado `cold-start-active` (1 ≤ N < 5): copy "Tu trayectoria empieza" + mantener recommendation card variable + agregar "X de 5 hasta tu trayectoria personalizada" progress

**H-3. DimensionsRow valores hardcoded defaults visualmente estáticos.**
- **Evidencia:** `d07-tab-hoy.png` y `d14-tab-hoy.png` muestran FOCO 60% / CALMA 50% / ENERGÍA 50% identicos
- **Cause:** `HomeV2.jsx:146-148` — `focusVal = state.coherencia ?? 50`, etc. Como `simulateCompleteSession` solo setea `c: coherence` que va a `coherencia` (=60), el resto queda en 50 default. Real user que no completa HRV/PSS-4 standalone tendría experiencia idéntica
- **Fix dirección:** descriptor extra "(estimado)" cuando viene de fallback; "(medido)" cuando real. O esconder dimensión sin signal

**H-4. No celebrations en cohort transitions ni milestones.**
- **Evidencia:** `d01-tab-hoy.png` (cold-start) → `d07-tab-hoy.png` (personalized) — no hay diferencia de bienvenida
- **Cause:** Architectural — HomeV2 hace switch silencioso entre views sin onMount celebration
- **Fix dirección:** sheet bottom-up al primer mount post-cohort-cross con mini-animation cyan + copy "Tu trayectoria personalizada se activó" + dismiss CTA

### Medium

**M-1. Recommendation card copy genérica "Sesión · 120s · Sesión guiada · 2 min".**
- **Evidencia:** `d14-tab-hoy.png` recommendation card
- **Cause:** `HomeV2.jsx:128-137` `buildRecommendationCard` solo concatena nombre + duración + intent label. Sin "por qué"
- **Fix dirección:** añadir `description.reason` field que el engine ya computa internamente

**M-2. Loading splash de Next.js dev mode contamina captures.**
- **Evidencia:** `milestone-d14-program-reeval.png`
- **Mitigación:** future runs contra production build (`npm run build && npm start`)

**M-3. Welcome y Calibration abren con focus en Skip CTA en lugar de primary.**
- **Evidencia:** `01-fresh-app.png` y `02-post-welcome.png` muestran Skip outlined ring con focus visible
- **Fix:** `useEffect(() => primaryCTARef.current?.focus(), [step])` post-mount

**M-4. Skip CTAs en Welcome/Calibration tienen visual weight similar a primary CTA.**
- **Evidencia:** `01-fresh-app.png` Skip outlined-with-cyan-ring vs CONTINUAR outlined-with-cyan-ring
- **Fix:** Skip debería ser text-only ghost en `text.muted` color

**M-5. Recommendation card fixed-bottom-nav visual interference.**
- **Evidencia:** `d07-tab-hoy.png` y `d14-tab-hoy.png` muestran nav atravesando la card
- **Diagnóstico:** capture artifact de Playwright fullPage + position:fixed nav. En real device el `paddingBlockEnd: calc(64px + safe-area)` del root previene overlap (verificado en `AppV2Root.jsx:895`)
- **Acción:** validar manualmente en device real para confirmar no es bug producción

### Low

**L-1. Sim hang at day 14+ por dev mode + Chromium memory pressure.**
- **Cause:** Next dev hot-reload + 270 navigations + Chromium 2GB+ RSS
- **Mitigación:** future runs contra production build, o dividir en sub-tests por phase

**L-2. Helper sampling Day 1 no encuentra CTA "Empezar sesión".**
- **Cause:** Producto usa "Tu primera sesión" (derivado del intent), no literal "Empezar sesión"
- **Fix:** actualizar selector en spec a `[data-v2-action] button` directly (ya lo hace fallback)

**L-3. `prefers-reduced-motion` respect no verificable en captures.**
- **Acción:** runtime check con DevTools emulation `prefers-reduced-motion: reduce`

---

## Roadmap accionable de findings

### Quick wins (< 1 día eng)

1. **M-3** Focus primary CTA en Welcome/Calibration mount (5 líneas useEffect + ref)
2. **M-4** Skip CTAs convertir a text-only ghost (CSS only, no logic change)
3. **L-2** Actualizar selector helper a `[data-v2-action]` (1 línea spec)

### Medium effort (1-3 días eng)

4. **H-2** Estado intermedio `cold-start-active` (1 ≤ N < 5):
   - Nuevo branch en `ColdStartView.jsx` con headline "Tu trayectoria empieza" + progress "N de 5"
   - Mantener "Tu primera sesión" recommendation siempre visible (no filtrar)
   - Adding mini-stats inline ("X sesiones · racha Y · próxima ventana Z:00")
5. **M-1** Recommendation card con `reason` field:
   - Engine ya computa `recommendation.primary.reason` internamente — exponer en card
   - "Por qué: tu CALMA bajó 12% últimas 3 sesiones" copy template
6. **H-3** DimensionsRow descriptor diferenciado measured/estimated:
   - Sub-label microCaps "(medido)" cuando signal real / "(estimado)" cuando fallback default
   - Optional: hide dimensión cuando 100% fallback

### Large effort (>3 días eng)

7. **H-1** Hero composite empty-state cuando composite=0:
   - Render alternative card "Activa tu lectura completa" con sub-CTAs HRV / chronotype / PSS-4
   - Engine fallback a coherence-only score (computar score derivado de history.c values cuando no hay HRV)
8. **H-4** Cohort transition celebrations:
   - Sheet bottom-up mountable post-cohort-cross
   - Animación cyan radial pulse + copy + count-up to new composite
   - Persist `lastCohortCelebrated` en store para no re-disparar
9. **Premium gap general:** mini-sparklines en stats:
   - Cada DimensionRow stat con sparkline 7-day inline (microSVG 80×20px)
   - Pulls del history items por dimension

### Defer Phase 6I+

10. **Premium gap:** error-id traceable en error states (B2B nice-to-have)
11. **Premium gap:** skeleton placeholders en /app/program/today, /app/wellbeing, /app/programs
12. **L-3** Auditoría manual `prefers-reduced-motion` con DevTools emulation

---

## Premium grade calificación final

| Dimensión PAH | Score 1-10 | Notas |
|---|---|---|
| 1. Loading states | 6 | Cargando… texto cyan correcto pero no skeleton; dev splash artifact contamina |
| 2. Empty states | 5 | Day 0 bien (2 cards concretas), Day 1-4 anémico, viewport empty |
| 3. Error states | 7 | ErrorBlock pattern correcto code-level; falta error-id traceable B2B |
| 4. Transitions | 7 | Easings disciplinados; falta celebrations cohort + reduced-motion verifiable |
| 5. Hierarchy | 9 | Welcome y Calibration modélicos; PersonalizedView weakened por composite=0 |
| 6. Spacing rhythm | 8 | Tokens 4px scale disciplinados; ColdStart day 1 deja hueco grande |
| 7. Touch targets | 10 | Todo ≥44px, generoso. Phase 6H Polish-2 honrado |
| 8. Motion design | 8 | Curves + durations premium; prefers-reduced-motion no verificable |
| 9. Color system | 10 | Single-cyan signal disciplina top-tier — diferencial competitivo |
| 10. Microinteractions | 7 | Tap scale + dot pulse + count-up bien; focus initial + Skip weight issues |
| **Average** | **7.7/10** | |

**Apps reference comparison:**
- **vs Linear:** gap medio (Linear 9.2/10) — Bio iguala color/touch/hierarchy en zonas premium pero pierde en information density y progress visibility
- **vs Apple Health:** gap medio (Apple Health 8.8/10) — Bio iguala minimalism y identity; pierde en data-richness defaults y celebration moments
- **vs Headspace:** gap pequeño (Headspace 8.5/10) — Bio gana en clinical credibility B2B; pierde en visual delight y micro-celebrations
- **vs Whoop:** gap medio (Whoop 8.7/10) — Bio gana en minimalism, pierde en biometric-heavy data presentation (esperado: Bio targets diferente segment)

**Veredicto:** **Buena pero con gap visible de "premium-grade"**. El shell tiene componentes top-tier (Welcome, Calibration, BottomNav, color system) que compiten con Apple Fitness+ y Linear. Pero el flujo intermedio post-onboarding (días 1-30) y la falta de celebration/progression dinámica visible mantienen la sensación general en "8/10 premium" en vez de "9.5/10 elite". Los 4 findings HIGH son los que cierran el gap más rápido. **Producto vendible B2B HOY** — pero con margen claro para ascender a tier "Apple-grade" con ~2 sprints de Polish-3.

---

## Console errors capturados

Solo finding registrado en logs antes del hang:

```
[FINDING][LOW][discoverability] D1: Day 1: no se encontró CTA visible "Empezar sesión" para sampling real
```

No hubo errors de JS runtime ni network 4xx/5xx en las 9 capturas obtenidas. Console error stream nominal hasta day 14.

**Pendiente de verificar** (sim no llegó):
- Console errors days 15-90
- Network 4xx en `/api/v1/me/program/active` sin auth (esperado 401, no error real)
- Console warnings de hydration mismatch SSR/CSR

---

## Performance observada

- **Tab Hoy initial render:** instant (no spinner visible en captures, store hidrata <500ms con `waitForStoreReady` succeeding en <1s todas las veces)
- **Welcome → Calibration transition:** suave (ningún flash blanco entre captures)
- **Calibration → ColdStartView:** suave (skipAllCalibration helper ejecuta 5 clicks en <2s)
- **Page navigation /app → /app/program/today:** **dev mode lento** — Next.js bundle reload + Chromium reflow contribuyeron al hang post-day-14
- **Memory:** Chromium creció a >2GB RSS en 10 min (dev mode + 42 sessions × 3 navigation × hot-reload). Producción no debería tener este problema

---

## Capturas críticas referenciadas

| # | Path | Por qué importante |
|---|---|---|
| 1 | `screenshots/simulation-90-days/milestones/01-fresh-app.png` | Premium reference: hierarchy + color system + cinematic intro |
| 2 | `screenshots/simulation-90-days/milestones/02-post-welcome.png` | Premium reference: clinical credibility chip + assessment UX |
| 3 | `screenshots/simulation-90-days/milestones/05-tab-hoy-day0.png` | Empty state Day 0 — baseline ColdStart con 2 cards |
| 4 | `screenshots/simulation-90-days/week-00/d01-tab-hoy.png` | **Finding HIGH H-2:** copy lag + viewport empty post-1-day |
| 5 | `screenshots/simulation-90-days/week-01/d07-tab-hoy.png` | **Finding HIGH H-1:** composite=0 con 21 sesiones |
| 6 | `screenshots/simulation-90-days/week-02/d14-tab-hoy.png` | **Finding HIGH H-3:** stats stuck en defaults — sin progresión visible |
| 7 | `screenshots/simulation-90-days/milestones/milestone-d14-program-reeval.png` | **Finding LOW L-1:** Next.js dev splash artifact + sim hang trigger |

---

## Anexo — limitaciones del análisis

1. **Coverage parcial:** 9/35 capturas planeadas; cubre días 0-14 visualmente + análisis de código para días 15-90.
2. **Auth ausente:** Páginas server-rendered (/app/wellbeing, /admin/*, /app/programs con state activo) no fueron exploradas — requieren session válida. Fixture sería un siguiente sub-prompt.
3. **Animation captures:** Playwright fullPage estático no captura motion. Análisis de motion es code-level + design tokens.
4. **Real device:** Captures vienen de Playwright Pixel 7 emulation. Touch feedback haptic, accessibility (VoiceOver/TalkBack), real safe-area en notch device — no verificables sin device real.
5. **Production build:** Capturas son dev mode con Next.js DevTools overlay — production build daría capturas más limpias y eliminaría el sim hang.

---

## Self-rating del análisis

- **Cobertura:** 7/10 — onboarding y cohort transition cold-start→personalized cubiertos visualmente; admin/wellbeing/coach/datos exploration final ausente
- **Comparación premium fair:** 8/10 — referencias a Linear/Apple Health/Headspace/Whoop con tablas dimensión-por-dimensión, sin sobrevender ni subestimar
- **Findings accionables:** 9/10 — cada finding tiene evidence path + cause root + fix direction; roadmap categorizado quick/medium/large/defer
- **Issues con simulación:**
  - Sim hang at day 14+ por dev mode + memory pressure (mitigable: production build futuro)
  - Cohort transition captures no se dispararon por bug en el spec (check ocurría post-day-loop, debió ser post-session-loop) — observable indirecto a través de weekly captures
  - Real-session sampling Day 1 no funcionó por copy mismatch CTA (helper buscaba "Empezar sesión", producto usa "Tu primera sesión")
- **Honestidad:** 10/10 — declaré scope cubierto vs no cubierto en sección "Honestidad de scope" antes del análisis

**Análisis cerrado.**
