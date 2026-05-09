# PLAN MAESTRO — REDESIGN 23 PROTOCOLOS COHERENT IDENTITY

**Fecha:** 2026-05-08
**Modo:** Plan estratégico de orden + scope honest + decisiones pendientes user.
**Output:** estructura de SPs encadenados con MCP captures + approval gates per-protocolo.
**Cero código modificado en este plan — solo análisis + estrategia.**

---

## 1. Estado actual baseline (post-commit dc06b5e)

### Protocolos con foundation parcial wired (3)

| # | Score | Foundation activa | Pendiente |
|---|:---:|---|---|
| #1 Reinicio Parasimpático | **9.25/10** | ParasympathicResetOrb + Reset1IntroCard + Reset1CompletionCard + sparkline calma + 4 papers DOIs | Phase 2+3 multi-task redesign (SP-B-2/3/4) + vagal coupling viz (SP-B-5) + critical sim (SP-B-6) |
| #15 Suspiro Fisiológico | **9.0/10** (F1) | PhysiologicalSighOrb + Sigh15CompletionCard | Eyebrow morph upgrade + multi-task overlay + sparkline temporal |
| #25 Cardiac Pulse Match | **9.06/10** (F2) | CardiacPulseMatchVisual + Pulse25CompletionCard | Phase 1+2+4 redesign + multi-task |

### Foundation reusable lista (SP-B-1 commit dc06b5e)

| Componente | Estado | Reusabilidad |
|------------|:---:|---|
| `particleSystem.js` Canvas2D 12/6/0 + 4 phase behaviors | ✅ ready | **23 protocolos** |
| `colors.accent.phosphorCyanByPhase` + `getCyanForPhase()` helper | ✅ ready | **23 protocolos** |
| `ScientificEyebrowMorph.jsx` char-tween 600ms | ✅ ready | **23 protocolos** |
| `TransitionContainer.jsx` overlay state machine 5 elementos | ✅ ready | **23 protocolos** |
| `audio.fadeOutNode/fadeInNode/crossfadeNodes` exponential ramp | ✅ ready | **23 protocolos** |

**Crítico:** Foundation 100% additive sin breaking. Wiring per-protocolo es scope additivo (cero modificación primitives existing F1/F2/F3+).

### Protocolos sin foundation (20)

#2-12, 16-24 — usando primitives genéricos (`breath_orb`, `text_emphasis_voice`, `hold_press_button`, etc.) sin eyebrow científico, sin haptic firma F0-4 wired explícito, sin sparkline post-session, sin transition cinematográficas.

---

## 2. Decisión arquitectónica crítica — pivot strategy

### El dilema honest

**OPCIÓN A — Vertical depth (terminar #1 → 9.7-10/10 antes de tocar otros):**
- Sprint: SP-B-2 + SP-B-3 + SP-B-4 + SP-B-5 + SP-B-6 = ~25-40 días eng
- Resultado: #1 en techo absoluto 9.7-10/10
- **Problema:** otros 22 protocolos quedan en 6-7/10 (genéricos shared primitives). Catalog completo se siente inconsistente. **Moat 5-10 años NO se logra con un único flagship excelente y 22 mediocres.**

**OPCIÓN B — Horizontal coherence (lift catalog floor a 8.5+ aplicando Foundation):**
- Sprint: aplicar foundation a 20 protocolos restantes × ~3-4 días eng cada uno = ~60-80 días eng
- Resultado: catalog floor 8.5+ con identidad coherente
- **Ventaja:** identidad sistema visible across todo el catalog → moat real
- **Problema:** #1 queda en 9.25 (no llega a 9.7+ todavía)

**OPCIÓN C — Híbrido secuencial (recomendada):**
- **Phase A (60-80 días eng):** lift catalog floor 8.5+ (todos a foundation activa)
- **Phase B (25-40 días eng):** deep upgrade 5 flagships top (vertical depth)
- **Phase C (5-7 días eng):** Critical Simulation 60d + polish final
- **Total: ~90-130 días eng**

### Mi recomendación: **Opción C — Híbrido secuencial**

**Razón honest:**
- "Identidad única + ventaja 5-10 años + sin plagio" requiere COHERENCIA del catalog completo, no excelencia aislada.
- 23 protocolos compartiendo ParticleSystem + ColorPaletteByPhase + ScientificEyebrowMorph + TransitionContainer + AudioCrossfade = identity visible. Si alguien copia un protocolo, se nota la inconsistencia. Si copian todos, copian la arquitectura entera (más difícil).
- User dijo "todos los protocolos" explícito. Opción A no honra esto.

---

## 3. Order propuesto Phase A (Lift catalog floor a 8.5+)

Priority ranking basado en (a) intent diversity, (b) usage frequency expected, (c) onboarding criticality, (d) science strength, (e) effort-to-impact ratio.

### Tier 1 — Daily anchors (3 SPs, ~12 días eng)

Protocolos que el user toca diariamente. Coherencia aquí es **crítica** porque establecen el "feel" de la app.

| # | Score actual | Citations key | Effort estimate |
|---|:---:|---|:---:|
| #1 Reinicio Parasimpático | 9.25 | Russo + Porges + Ma + Lemaitre | 1-2 días (terminar SP-B-2 phase 1 multi-task primero) |
| #2 Activación Cognitiva | ~7 | Lieberman 2007 affect labeling | 4-5 días |
| #3 Reset Ejecutivo | ~6.5 | Eisenhower matrix + parasimpatic activation | 4-5 días |

### Tier 2 — Crisis intervention (3 SPs, ~10-12 días eng)

Alto-stakes, baja frecuencia de uso pero **crítico** que funcione perfecto cuando se necesita.

| # | Score actual | Citations key | Effort |
|---|:---:|---|:---:|
| #18 Emergency Reset | ~7.5 | Berceli TRE + Levine SE + Porges 2011 | 4 días |
| #19 Panic Interrupt | ~7.4 | Porges polyvagal + Lemaitre 2008 breath-hold | 3-4 días |
| #20 Block Break | ~6.8 | Carney 2010 + Knab-Lightfoot 2010 BDNF + Golgi tendon | 3-4 días |

### Tier 3 — Active core (9 SPs, ~30-35 días eng)

Catalog medio. Aplicar foundation pattern a cada uno.

| # | Score actual | Effort |
|---|:---:|:---:|
| #4 Pulse Shift (energia) | ~6.75 | 3-4 días |
| #5 Skyline Focus (foco) | ~6.5 | 3-4 días |
| #6 Grounded Steel (calma) | ~7.13 | 3-4 días |
| #7 HyperShift (reset) | ~6.0 | 3-4 días |
| #8 Lightning Focus (foco intenso) | ~6.0 | 3-4 días |
| #9 Steel Core Reset (reset profundo) | ~6.5 | 3-4 días |
| #10 Sensory Wake (energia) | ~6.88 | 3-4 días |
| #11 Body Anchor (calma) | ~6.75 | 3-4 días |
| #12 Neural Ascension (reset) | ~7.75 | 3-4 días |

### Tier 4 — Training long-form (2 SPs, ~10 días eng)

Long sessions 600s. Requires sustained engagement.

| # | Score actual | Citations key | Effort |
|---|:---:|---|:---:|
| #16 Resonancia Vagal | ~8.0 | Lehrer-Vaschillo 2014 + Goessl 2017 meta N=1868 d=0.83 | 5 días |
| #17 NSDR 10 min | ~6.75 | Kjaer 2002 PET + Datta 2017 + Huberman | 5 días |

### Tier 5 — Active extras / specialty (5 SPs, ~17-20 días eng)

Situaciones específicas. Lower frequency pero alto valor cuando aplica.

| # | Score actual | Citations key | Effort |
|---|:---:|---|:---:|
| #21 Threshold Crossing | ~7.13 | Radvansky 2006/2010 + Zacks 2007 event segmentation | 3-4 días |
| #22 Vagal Hum Reset | ~7.0 | Maniscalco 2003 NO 15× + Porges + Khalsa 2018 | 3-4 días |
| #23 Power Pose Activation | ~5.88 | Carney 2010 (postural feedback only, no hormonal) | 3-4 días |
| #24 Bilateral Walking | ~5.75 | Teut 2013 RCT + Yang-Conroy 2018 | 3-4 días |
| #25 Cardiac Pulse Match | 9.06 (F2) | Schandry + Garfinkel + Lehrer-Vaschillo (1-2 días refinement) | 1-2 días |

### Phase A total estimate

**22 protocolos × ~3.5 días eng promedio = ~77 días eng** + buffer integration testing 5 días = **~80-85 días eng**.

---

## 4. Phase B — Deep upgrade flagships (top 5)

Después de catalog floor 8.5+, escoger 5 candidatos high-impact para llevar a 9.5-9.8/10.

| Flagship | Razón | Effort post-Phase A |
|----------|-------|:---:|
| **#1 Reinicio Parasimpático** | Daily anchor onboarding cohort cold-start | 5-7 días (multi-task arquitectura + vagal coupling viz) |
| **#15 Suspiro Fisiológico** | Stanford 2023 RCT directo, 90s formato corto | 4-5 días |
| **#25 Cardiac Pulse Match** | Líder técnico catalog (D1=10), única con coherence% Lehrer threshold | 4-5 días |
| **#16 Resonancia Vagal** | D1=10, training tier marquee, meta-análisis N=1868 | 5-6 días |
| **#20 Block Break** | Crisis-energia tier, Carney + Knab-Lightfoot, alto stakes | 4-5 días |

**Phase B total: ~25-30 días eng.**

---

## 5. Phase C — Critical Simulation 60d + polish

- Validate end-to-end con simulación user real 60 días.
- Capturas runtime exhaustive todos los 23 protocolos.
- Anti-regression total final.

**Phase C total: 5-7 días eng.**

---

## 6. Plan estimate consolidated

| Phase | Scope | Effort eng |
|-------|-------|:---:|
| A | 22 protocolos lift to 8.5+ floor | 80-85 días |
| B | 5 flagships deep upgrade to 9.5+ | 25-30 días |
| C | Critical Sim 60d + polish | 5-7 días |
| **TOTAL** | **23 protocolos catalog identity coherent** | **~110-120 días eng** |

---

## 7. SP structure per-protocolo Phase A

Cada protocolo Phase A sigue mismo template (~3-4 días eng):

### Capa 1 — Wire foundation reusable (1 día)
- ProtocolPlayer wrap con TransitionContainer (ya disponible since SP-B-1).
- Eyebrow científico inline en cada primitive consumer (via ScientificEyebrowMorph component).
- Color palette via getCyanForPhase(intent → phase).
- Audio crossfade entre phases via fadeOutNode/fadeInNode.

### Capa 2 — Citations científicas verified (0.5 día)
- Update SCIENCE_DEEP[id] con citations precisas (DOIs cuando posible).
- 1-2 RCT citations + theory paper.
- Fundamentos honest (no overclaim).

### Capa 3 — Multi-task per-fase (donde aplique) (1-2 días)
- Identificar 2-3 ejercicios simultáneos posibles por fase considerando constraint oficina + una mano + sin volumen.
- Refactor primitives consumer SI es factible (algunos protocolos crisis no tienen multi-task viable).

### Capa 4 — Anti-regression + capturas runtime (0.5 día)
- Suite verde + screenshots MCP de cada phase.
- Reporte breve.

### MCP approval gate per protocolo
- Capturas runtime presentadas.
- User aprueba / pide ajustes.
- Procedo siguiente.

---

## 8. Recomendaciones inmediatas — primer SP a ejecutar

### Recomendación: empezar SP-B-2 (cerrar #1 Phase 1 multi-task) — 1-2 días eng

**Razón:** #1 está en 9.25. Cerrar Phase 1 multi-task con foundation activa lo lleva a ~9.4. Esto:
- Demuestra el pattern foundation→protocol wire end-to-end.
- Establece el template para los 22 protocolos siguientes.
- Bajo risk porque foundation ya validated SP-B-1.

**Después SP-B-2:** decidir entre:
- Continuar #1 SP-B-3/4/5/6 (vertical depth) o
- Pivotear a #2 + #3 (Tier 1 daily anchors horizontal) — recomendada

---

## 9. Decisiones que requieren aprobación user

### D1 — Estrategia: A / B / C
- **A** vertical depth (#1 → 9.7+ primero)
- **B** horizontal coherence (catalog floor 8.5+ todos primero)
- **C** híbrido secuencial: SP-B-2 cerrar #1 phase 1, después horizontal Tier 1+2, después back vertical (recomendada)

### D2 — MCP capture cadence
- **D2.A** Capturas + approval gate **per-protocolo** (más control, más latencia)
- **D2.B** Capturas + approval gate **per-tier** (3-9 protocolos/gate, menos control, más velocidad)
- **D2.C** Capturas continuas + approval gate **por phase** (ej. al cerrar Tier 1 daily anchors)

### D3 — Scope multi-task per-fase
Algunos protocolos NO permiten multi-task simultáneo viable (crisis con una sola tarea, training con sustained focus). ¿Aceptas que algunos sean 1-task por fase si es lo correcto pedagógicamente?
- **D3.A** Sí, multi-task solo donde aplica
- **D3.B** Forzar multi-task en todos (riesgo overload cognitivo)

### D4 — Estimate honest 110-120 días eng
- ¿Aceptas el estimate o quieres scope reducido?
- **D4.A** Aceptar scope completo (~4 meses eng)
- **D4.B** Reducir a Phase A only (~80 días, catalog floor 8.5+)
- **D4.C** Reducir a 5 flagships deep upgrade only (~25 días)
- **D4.D** Híbrido: Phase A + 3 flagships top (~100 días)

---

## 10. Risk identificados

1. **Estimate honest 110-120 días eng** — significativo. ¿Roadmap del producto puede absorber?
2. **Scope creep** — cada SP puede revelar findings críticos (como ya pasó en F3, F3.5-A, SP-B-1) que extiendan effort.
3. **MCP approval gate** — 23 gates si per-protocolo añade ~10-20% overhead en latencia.
4. **Anti-regression compounding** — cada nuevo SP debe verificar todos los previos. Suite test grow proportionally (4984 → ~6000+ tests al final).
5. **Performance móvil low-end** — particleSystem activo en 23 protocolos simultáneamente posible? **No, sólo durante session activa de 1 protocolo a la vez.** Verificado.
6. **Identidad visual coherente vs uniforme** — todos los 23 protocolos compartiendo Foundation podría sentirse "uniforme". Mitigation: per-protocolo signature (haptic firma F0-4 única + eyebrow citation única + color phase intent-derived).

---

## 11. Próximo paso concreto

**Espero tu aprobación de:**
- **D1 strategy** (recomendación: C híbrido secuencial)
- **D2 MCP cadence** (recomendación: B per-tier o C per-phase)
- **D3 multi-task scope** (recomendación: A donde aplique)
- **D4 scope total** (recomendación: D híbrido Phase A + 3 flagships top)

**Si apruebas C+B+A+D:** empiezo con SP-B-2 (cerrar #1 phase 1 multi-task, ~1-2 días eng) + capturas MCP, luego Tier 1 daily anchors (#2 + #3, ~8-10 días).

**Si quieres scope diferente:** dime cuál y ajusto plan.

---

**Fin del Plan Maestro. Espero tus respuestas a D1/D2/D3/D4 antes de ejecutar primer SP.**
