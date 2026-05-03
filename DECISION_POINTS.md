# DECISION_POINTS.md — Decisiones que SOLO el dueño puede tomar antes de Phase 3

**Fecha:** 2026-05-01.

> Estas son decisiones de producto, identidad o estrategia que el código no puede tomar por sí mismo. Phase 3 (reconstrucción frontend) las requiere resueltas para arrancar con dirección clara.

---

## 1. ¿La home `/app` responde "qué hago ahora" o "cómo está mi sistema"?

**Contexto:** la PWA tiene componentes para ambas narrativas:
- "Qué hago ahora" → orb gigante, recommendation del día, ignition al tap.
- "Cómo está mi sistema" → ReadinessRing + NeuralRadar + sparklines + coachContext.

Hoy ambas conviven en `DashboardView.jsx` (92 KB) y compiten por jerarquía visual.

**Trade-offs:**
- **A. "Qué hago ahora"** → cero fricción, retention activa, Calm/Headspace pattern. Risk: subestima el operador serio que quiere "instrumento con recibos".
- **B. "Cómo está mi sistema"** → diferenciador B2B-grade, transparency, data-rich. Risk: paraliza al usuario casual que solo quiere reset de 60s.
- **C. Híbrido** → orb dominante + cards secundarias contraíbles. Default = A, expandible a B.

**Recomendación técnica:** opción C es lo que el backend Phase 2 mejor soporta — `/api/v1/me/neural-health` desbloquea B sin sacrificar A. Pero la decisión es de producto.

**Decisión necesaria:** A / B / C / otra.

---

## 2. Mental model de scores — cuál es la verdad primaria

Hoy el usuario ve simultáneamente:

| Score | Origen | Rango |
|---|---|---|
| V-Cores | gamification | 0..∞ |
| Mood | usuario reporta | 1..5 |
| Readiness | composite coherencia/calma/energía | 0..100 |
| BioSignal | unclear (revisar UI) | 0..100 |
| Estado neural | unclear | 0..100 |
| Composite | unclear | 0..100 |
| Variabilidad Neural | bandit-derived | 0..100 |
| Rendimiento Neural | unclear | 0..100 |
| Coherencia / Resiliencia / Capacidad / Foco / Calma / Energía | radar dimensiones | 0..100 |

**El número 57 aparece en 6 etiquetas distintas en una sola pantalla.** Esto es caos UX.

**Trade-offs:**
- **A. Reducir a 1 score primario "Readiness 0-100"** + radar dimensiones secundarias. Simplicidad.
- **B. Reducir a 2 scores: "Readiness ahora" + "Trayectoria semanal"** (delta + dirección).
- **C. Mantener 3-4 scores con jerarquía clara** (Readiness primario, V-Cores secundario gamification, mood log 3rd).
- **D. Otro framework propio** (e.g. "Pulse" como score único, "Edge" como historial).

**Recomendación técnica:** A o C. El backend tiene los cálculos para todos, el frontend decide cuál es el primary. El usuario actual NO TIENE mental model claro; cualquier reducción es ganancia.

**Decisión necesaria:** A / B / C / D + qué nombrar como primary.

---

## 3. ¿B2B y B2C comparten 100% UI o se diferencian por contexto org?

**Contexto:** un usuario puede ser miembro de varios orgs (personal-org + B2B org). El código actual:
- `/admin/*` requiere role OWNER/ADMIN/MANAGER en algún B2B org no-personal.
- `/app/*` es siempre el mismo, sin distinción.

**Trade-offs:**
- **A. UI idéntica** → simple para construir, pero un employee de un B2B org puede no entender que tiene estado personal + estado en su equipo.
- **B. Org switcher visible siempre** → como Slack/Notion. Cambia el contexto de toda la PWA.
- **C. PWA siempre personal-org, admin separado solo** → `/app` es B2C, `/admin` es B2B. Si el user es OWNER de B2B + OWNER de personal, ve dos surfaces distintas.

**Recomendación técnica:** opción C ya está en el backend (org switching es schema-level vía `Membership`). Mantener separation simplifica reconstrucción.

**Decisión necesaria:** A / B / C.

---

## 4. ¿El glosario técnico se mantiene o se humaniza?

Términos actualmente expuestos al usuario:
- "coherencia", "resiliencia", "capacidad", "intent", "bandit", "cohort prior", "calibración", "ignición", "operador neural", "sesión vs ignición vs pulso vs tap".

Memory note del user: "user text natural language — strings visibles sin 'circadiano/prior/blend/scope/z='; reservar términos técnicos para nombres internos".

**Trade-offs:**
- **A. Humanizar todo** → "tu calma", "tu enfoque", "tu reset" (vs "intent calma/enfoque/reset"). "El motor aprende" (vs "bandit"). "Tu equipo" (vs "cohort"). Risk: pierde la diferenciación "instrumento con recibos".
- **B. Mantener jerga técnica** → comunicación seria, científica. Risk: alienar al usuario casual.
- **C. Doble layer** → primario humanizado, hover/expand muestra término técnico. Risk: complejidad UI.

**Recomendación técnica:** A con tooltips opcionales (subset de C). El motor sigue siendo serio internamente; el usuario no necesita entender bandit UCB1-Normal para que funcione.

**Decisión necesaria:** A / B / C + glosario específico (lista de términos a humanizar).

---

## 5. Identidad estética post-reconstrucción

Memorias del user dicen:
- "PWA visual DNA canonical" — sweep cosmético E1-E21 + cascade global.
- "Cinematic treatment is brand DNA" — lattice + vignette + scanline.
- "Polish standard non-negotiable ≥9.0/10".
- "phosphorCyan #22D3EE es la signal-defining color".
- "BioGlyph as logo, AuthHero antes de inventar".
- "Cero emojis, cero glifos genéricos".
- "FOMO Instagram — vendible B2B+B2C".

**Trade-offs entre estilos referencias:**
- **Apollo / Whoop / Strava** → FOMO duro, números fríos, athletic.
- **Headspace / Calm** → FOMO suave, pastel, mindful.
- **Linear / Vercel / Stripe** → polish minimalista, precision SaaS.
- **Vision Pro / Apple Fitness** → glassmorphism + light, premium.

El sweep cosmético E1-E21 y los memos del user apuntan a **híbrido Vision Pro + Linear + Whoop**: glassmorphism + dark + athletic precision + FOMO suave.

**Decisión necesaria:** confirmar el híbrido o redirigir a uno específico.

---

## 6. ¿FOMO suave Apollo, FOMO duro Whoop, o cero FOMO?

**Definición:** FOMO en la PWA = banners "no rompiste racha", "tu equipo te está adelantando", "han pasado 3 días sin sesión", etc.

**Trade-offs:**
- **A. FOMO duro** (Whoop) → "Strain bajo. Hoy llevas 0 sesiones. Tu equipo lleva 4." Aumenta engagement. Risk: ansiedad.
- **B. FOMO suave** (Apollo / Headspace) → "Han pasado 3 días, ¿retomamos con un reset corto?" Aumenta retention sin ansiedad.
- **C. Cero FOMO** → "Estás aquí cuando quieres. Sin presión." Risk: bajo engagement, alta retention solo en usuarios self-driven.

**Recomendación técnica:** B alinea mejor con el coach safety library (NO push agresivo si user en `level=soft`).

**Decisión necesaria:** A / B / C.

---

## 7. ¿Coach LLM plan-gate aceptado o más generoso para conversión?

Phase 2 ejecutó:
- FREE: 5 msgs/mes (Haiku)
- PRO: 100 msgs/mes (Sonnet)
- STARTER: 500 msgs/mes (Sonnet)
- GROWTH/ENTERPRISE: ∞ (Sonnet, Opus opt-in Enterprise)

**Posibles ajustes:**
- ¿FREE 5 es muy bajo? El user podría no enganchar antes de upgrade. ¿10? ¿20?
- ¿Hard cap o soft (warn al 80%, block al 100%)?
- ¿ENTERPRISE Opus default vs opt-in?

**Decisión necesaria:** confirmar caps o ajustar.

---

## 8. Wearable OAuth providers — ¿Whoop + Oura suficiente, o priorizar Apple Health?

Sprint 6 deferred. Cuando se implemente:

- **Whoop** — clientela premium, ARR alto, membresía cara. Stripe-friendly demographic.
- **Oura** — popularidad creciente, ring-only, foco en sleep + readiness.
- **Apple Health** — masivo, pero requiere iOS app companion (mucha más fricción que webhook ingress de Whoop/Oura).
- **Garmin** — atlético específico.
- **Fitbit** — declining popularity.

**Decisión necesaria:** prioridad de orden + alcance Whoop+Oura (decision Sprint 6 was 2 providers max).

---

## 9. RLS Postgres — fecha objetivo

Phase 2 difirió RLS. Compromiso documentado en `ROADMAP.md`: implementar antes de Enterprise tier >$50K/año contract value.

**Decisión necesaria:**
- ¿Fase 3 lo incluye o es Fase 4?
- ¿Cuál es la primera org Enterprise prevista? Eso fija deadline.

---

## 10. NOM-035 validación legal del texto vs DOF oficial

`nom035TextValidatedByLawyer=false` activo. Reportes oficiales DEBEN mostrar disclaimer hasta que un humano con review legal lo flippee.

**Decisión necesaria:**
- ¿Quién hace el review legal? Abogado interno, externo, STPS-certificado.
- ¿Tiempo objetivo? Antes de primer cliente B2B mexicano que necesite imprimir actas firmables.

---

## 11. ¿`/admin/neural` muestra Cohen's d / CI95 o solo "trends"?

`/api/v1/orgs/[orgId]/neural-health` (Phase 2 NUEVO) devuelve `protocolEffectiveness[]` con stats de inferencia (Cohen's d, CI95, hitRate, significant flag, effectSize label).

**Trade-offs UI:**
- **A. Mostrar todo** → CHRO con background analytics ama esto. Risk: alienar a CHRO sin background.
- **B. Mostrar solo "alto/medio/bajo impacto"** (effectSize label) y esconder números → más accesible.
- **C. Toggle modo "técnico" / "ejecutivo"** → ambos públicos.

**Decisión necesaria:** A / B / C.

---

## 12. ¿Slack/Teams dispatcher es Sprint 6+ o se pospone más?

**Hoy:** `Integration` config table sí, dispatcher real no. Marketing menciona "conecta Slack" sin código que sostenga.

**Decisión necesaria:**
- Implementar Slack en Sprint 6+ (junto con Whoop/Oura).
- O quitar el claim de marketing hasta que se implemente.

---

## 13. ¿Reconstrucción frontend Phase 3 — un solo asesor o múltiples?

El sistema actual fue refactorizado por sweeps cosméticos iterativos. La reconstrucción Phase 3 puede ser:

- **A. Single sweep** → un agente + tu approval iterativo.
- **B. Múltiples agentes especializados** → uno para `/app`, uno para `/admin`, uno para marketing-no-tocar pero auditar.
- **C. Tier-by-tier** → primero `/app/engine-health` (NUEVO), después core sesión, después admin coach-usage, etc.

**Decisión necesaria:** approach.

---

## 14. ¿Migrar `User.neuralState` JSON a tablas dedicadas en Sprint 6+?

`HrvSample`, `MoodSample` tablas dedicadas desbloquean queries B2B agregadas eficientes. Sin ellas, `/admin/neural` agregados son lentos a escala org-grande (≥1000 members).

**Decisión necesaria:**
- ¿Sprint 6 prioriza esto sobre Whoop/Oura OAuth?
- ¿O ambos en paralelo?

Mi análisis Phase 1 sugirió este es leverage 10× (esa fue mi recomendación implícita).

---

## Resumen de decisiones (mínimo necesario antes de Phase 3)

**Críticas para arrancar Phase 3:**
1. Identidad de la home `/app` (DECISION_POINTS #1)
2. Mental model de scores (#2)
3. B2B vs B2C separation (#3)
4. Glosario técnico vs humanizado (#4)
5. Identidad estética (#5)
6. FOMO level (#6)

**Importantes pero pueden iterarse durante Phase 3:**
7. Coach plan-gate (#7) — defaults activos, ajustables.
8. Wearable priority (#8) — Sprint 6+, no bloquea Phase 3.
9. RLS deadline (#9) — Fase 4 likely.
10. NOM-035 legal review (#10) — proceso legal paralelo.
11. `/admin/neural` UI complexity level (#11)
12. Slack/Teams claim removal vs implement (#12)
13. Phase 3 approach (#13)
14. HrvSample tables (#14) — Sprint 6+, no bloquea Phase 3.

---

**Acción recomendada:** dueño responde puntos 1-6 antes de arrancar reconstrucción frontend. Resto se itera durante Phase 3 sin bloquear el inicio.
