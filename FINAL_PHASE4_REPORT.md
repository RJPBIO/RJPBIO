# FINAL PHASE 4 REPORT — Refactor del Motor de Protocolos

> Cierre de Phase 4 Bio-Ignición · 8 sub-prompts (SP1–SP8) · 2026-04-XX → 2026-05-01
> Estado: **CONCLUIDA**. Suite global verde, build limpio, 18 protocolos canónicos migrados.

---

## TL;DR

- **Catálogo**: 18 protocolos (IDs 1–12, 15–20; gap permanente en 13/14 por eliminación de OMEGA/OMNIA en SP1).
- **Engine**: `useProtocolPlayer` (hook único, state machine con reducer + ref-based callbacks) + `ProtocolPlayer` (shell) + `PrimitiveSwitcher` (mapper de 19 primitivas).
- **Schema**: multi-acto extendido `{type, duration:{min/target/max}, validate, ui:{primitive,props}, media:{voice,binaural,breath_ticks,signature,cue}, mechanism, safety opcional, variants opcional}`.
- **UX**: 3 useCases con reglas explícitas — `active` (cancel doble-tap), `training` (Pause + Saltar + partial credit), `crisis` (SafetyOverlay + Estoy bien + voice override + sin Pause/Saltar).
- **Tests**: 3088 passing en 127 archivos (39.87s). Cero failures. Cobertura conserva ≥70% línea/función.
- **Build**: EXITCODE=0.
- **Playwright e2e**: #18/#19/#20 capturados en harness `/dev/protocol-player` (mobile 390×844).
- **Docs**: `CLEANUP_BACKLOG.md` creado para deuda diferida.

---

## Sub-prompts ejecutados

### SP1 — Recon + schema extended + framing refactor
- Inventario exhaustivo del catálogo legacy (20 protocolos).
- Eliminación de OMEGA (#13) y OMNIA (#14) por solapamiento conceptual con #1–#12.
- Definición del schema multi-acto extendido (`type/duration/validate/ui/media/mechanism`).
- Refactor de framing: `useCase: "active" | "training" | "crisis"` agregado como discriminador top-level.
- Rename de #10 ("Sensory Wake") y #11 ("Body Anchor") por clarificación clínica.
- Refactor de #12 ("Neural Ascension") con nuevo cierre.
- 12 protocolos definidos en shape extendido (los activos del Tier 1A/1B/2/3 quedaron pendientes para SP4–SP7).

### SP2 — 19 primitivas UI + Storybook + voiceOn migration
- Implementadas 19 primitivas React puras en `src/components/protocol/v2/primitives/`:
  - Respiratorias: `breath_orb`, `silence_cyan_minimal`
  - Tap/Bilateral: `bilateral_tap_targets`, `transition_dots`, `chip_selector`
  - Oculares: `ocular_dots`, `ocular_horizontal_metronome`, `dual_focus_targets`
  - Postural/Corporal: `body_silhouette_highlight`, `posture_visual`, `isometric_grip_prompt`, `chest_percussion_prompt`
  - Crisis-específicas: `facial_cold_prompt`, `shake_hands_prompt`, `vocal_with_haptic`, `object_anchor_prompt`
  - Visual/Cognitivo: `visual_panoramic_prompt`, `text_emphasis_voice`, `hold_press_button`
- Storybook stories básicas para cada primitiva (26 capturas Playwright).
- Migración store v14 → v15: `voiceOn` default `false` (clinic-safety override en crisis sigue activo).

### SP3 — Engine consolidation
- `useProtocolPlayer` hook (state machine completa con reducer): consolidó 5+ archivos legacy.
- `ProtocolPlayer.jsx` shell con dialog fullscreen, header, footer, transition dots.
- `PrimitiveSwitcher.jsx` mapper de `act.ui.primitive` → componente React.
- Reemplazo de `SessionRunner` en harness `/dev/protocol-player` (legacy queda en repo para A/B; ver CLEANUP_BACKLOG #1).
- Quick-fix post-SP3: solapamiento "Estoy bien" / CONTINUAR resuelto via Option B (peer en footer flex).

### SP4 — Tier 1A migration (#1, #2, #3)
- #1 Reinicio Parasimpático (calma) · 4 actos
- #2 Activación Cognitiva (enfoque) · 4 actos
- #3 Reset Ejecutivo (reset) · 4 actos
- Coreografía respiratoria establecida: `breath_orb` + `signature` + binaural calma/enfoque.

### SP5 — Tier 1B migration (#4, #5, #6) + ref-based pattern fix
- #4 Pulse Shift, #5 Skyline Focus, #6 Grounded Steel migrados con primitivas bilaterales/visuales/dual.
- Quick-fix ref-based pattern aplicado a 9 primitivas con `useEffect` que tenía `onComplete` en deps (causaba re-mount loop cada 100 ms bajo el tick del PrimitiveSwitcher).

### SP6 — Tier 2 migration (#7–#12)
- 6 protocolos migrados con primitivas: `chest_percussion_prompt`, `ocular_dots`, `posture_visual`, `body_silhouette_highlight`.
- Cada protocolo: 3–5 actos, validation kinds variados (`breath_cycles`, `tap_count`, `hold_press`, `min_duration`).

### SP7 — Tier 3 migration (#15, #16, #17) + Pause UI + Partial Credit + NSDR override
- #15 Suspiro Fisiológico, #16 Resonancia Vagal, #17 NSDR 10 min migrados.
- Pause UI agregado (training only): botón en header + `PausedOverlay`.
- `PartialCreditIndicator` agregado: muestra estado parcial cuando user sale tras >2 actos completos.
- TTS override extendido a NSDR (#17) por requisito de instrucción guiada continua.
- `forceAdvance` flag refinado (crisis y training pueden saltar; active no).

### SP8 — Tier crisis migration (#18, #19, #20) + SafetyOverlay + UX refinements
- #18 Emergency Reset (5 actos): grounding visual + auditivo + tactile + breath con double-inhale + commitment hold.
- #19 Panic Interrupt (3 actos): facial cold (dive reflex) + vocalization grave + commitment con palmas al pecho. **Variants** retenidos (with/without cold-water).
- #20 Block Break (4 actos): shake hands + isometric grip + chip_selector reframe + commitment.
- SafetyOverlay component: pre-mount `alertdialog` que muestra el `safety` field cuando `useCase==="crisis" && !!protocol.safety`. Botones "ESTOY LISTO" (confirma) / "CANCELAR" (llama onCancel sin start).
- Crisis UX refinements: voice `enabled_default: true` en TODOS los actos crisis (override sobre store), validation `no_validation` con razón `crisis_no_pressure`, hold_press_button con `min_hold_ms ≤ 3000` (sin presión).
- Test suite extendida: `protocols.tier-crisis.test.js` (57 tests), `ProtocolPlayer.test.jsx` (5 tests SafetyOverlay).
- Shape test actualizado para reflejar nueva contract: variants simplificadas a `{id, label}` (when/notes opcionales) y sólo #19 retiene variantes (única crisis con bifurcación material).

---

## Inventario final

### Protocolos migrados al schema multi-acto (18)

| ID | Nombre | useCase | int | # Actos | Primitivas distintivas |
|---|---|---|---|---|---|
| 1 | Reinicio Parasimpático | active | calma | 4 | breath_orb |
| 2 | Activación Cognitiva | active | enfoque | 4 | breath_orb, ocular_dots |
| 3 | Reset Ejecutivo | active | reset | 4 | breath_orb, hold_press_button |
| 4 | Pulse Shift | active | energia | 4 | bilateral_tap_targets |
| 5 | Skyline Focus | active | enfoque | 4 | visual_panoramic_prompt, dual_focus_targets |
| 6 | Grounded Steel | active | calma | 4 | posture_visual, isometric_grip_prompt |
| 7 | HyperShift | training | energia | 4 | chest_percussion_prompt |
| 8 | Lightning Focus | training | enfoque | 4 | ocular_horizontal_metronome |
| 9 | Steel Core Reset | training | reset | 4 | body_silhouette_highlight |
| 10 | Sensory Wake | training | energia | 4 | text_emphasis_voice |
| 11 | Body Anchor | training | calma | 4 | body_silhouette_highlight, posture_visual |
| 12 | Neural Ascension | training | enfoque | 5 | dual_focus_targets, hold_press_button |
| 15 | Suspiro Fisiológico | active | calma | 3 | breath_orb (double_inhale) |
| 16 | Resonancia Vagal | training | calma | 3 | breath_orb |
| 17 | NSDR 10 min | training | calma | 4 | text_emphasis_voice, silence_cyan_minimal |
| 18 | Emergency Reset | crisis | calma | 5 | object_anchor_prompt × 2, breath_orb, hold_press_button |
| 19 | Panic Interrupt | crisis | calma | 3 | facial_cold_prompt, vocal_with_haptic, hold_press_button |
| 20 | Block Break | crisis | energia | 4 | shake_hands_prompt, isometric_grip_prompt, chip_selector |

### Primitivas UI (19)

`breath_orb`, `bilateral_tap_targets`, `ocular_dots`, `ocular_horizontal_metronome`, `visual_panoramic_prompt`, `dual_focus_targets`, `body_silhouette_highlight`, `posture_visual`, `isometric_grip_prompt`, `chest_percussion_prompt`, `facial_cold_prompt`, `shake_hands_prompt`, `chip_selector`, `hold_press_button`, `text_emphasis_voice`, `silence_cyan_minimal`, `object_anchor_prompt`, `vocal_with_haptic`, `transition_dots`.

### Engine consolidado

- `src/hooks/useProtocolPlayer.js` — state machine + reducer + ref-based pattern.
- `src/components/protocol/v2/ProtocolPlayer.jsx` — shell + SafetyOverlay + PausedOverlay + PartialCreditIndicator.
- `src/components/protocol/v2/PrimitiveSwitcher.jsx` — mapper.
- `src/components/protocol/v2/primitives/*` — 19 primitivas puras.

### Tests

- **Total**: 3088 passing en 127 archivos (39.87 s).
- **Nuevos en Phase 4**:
  - `src/hooks/useProtocolPlayer.test.js`
  - `src/components/protocol/v2/ProtocolPlayer.test.jsx`
  - `src/components/protocol/v2/PrimitiveSwitcher.test.jsx`
  - 19 archivos `*.test.jsx` para cada primitiva
  - `src/lib/protocols.tier-1a.test.js`, `tier-1b.test.js`, `tier-2.test.js`, `tier-3.test.js`, `tier-crisis.test.js`
- **Cobertura**: ≥70% línea/función mantenida.

### Build

- `npm run build` → EXITCODE=0.
- Sin warnings nuevos.
- CSP intacta (sin `unsafe-inline` ni `unsafe-eval`).

### Capturas Playwright (Phase 6)

Mobile 390×844 en `/dev/protocol-player`:
- `phase4-sp8-protocol-18-mount.png` — SafetyOverlay #18 con "Aviso Importante" + texto profesional/911.
- `phase4-sp8-protocol-18-act1.png` — Act 1 sensory_grounding visual con input "Un objeto que ves" + 5-dot progress.
- `phase4-sp8-protocol-19-safety.png` — SafetyOverlay #19 con warning arritmia/marcapasos + redirect a #18.
- `phase4-sp8-protocol-19-act1-facialcold.png` — Act 1 facial_cold_prompt con countdown + 3-dot progress.
- `phase4-sp8-protocol-20-safety.png` — SafetyOverlay #20 con apoyo profesional.
- `phase4-sp8-protocol-20-act1-shake.png` — Act 1 shake_hands_prompt con 2 SVG silhouettes + 4-dot progress.

---

## Decisiones consolidadas (no re-litigar sin disparador)

1. **`useProtocolPlayer` único, no múltiples hooks**: la complejidad cabe en una state machine; dividir aumentaba props drilling.
2. **Ref-based callbacks pattern**: necesario para evitar re-mount loop en primitivas con tick interno.
3. **Variants simplificadas a `{id, label}`**: shape original con `when/notes` era over-spec. Sólo #19 retiene variants porque es la única crisis con bifurcación material (con/sin agua fría).
4. **SafetyOverlay como gate pre-mount, no como overlay encima**: clínicamente, el usuario debe leer y aceptar ANTES de que el binaural empiece.
5. **Crisis voice override sobre store**: aunque `voiceOn = false` por default, los actos crisis declaran `media.voice.enabled_default: true` y se respeta en runtime.
6. **No PPG en Phase 4**: deferido a CLEANUP_BACKLOG #2.
7. **Engine legacy `SessionRunner` preservado para A/B**: borrado en CLEANUP_BACKLOG #1, no en Phase 4.
8. **Tests reflejan contract real**: cuando el spec cambia, los tests cambian con justificación documentada (ver `protocols.shape.test.js` línea 160 para justificación de "sólo #19 retiene variants").

---

## Lo que NO se hizo (intencional)

- **No se modificó** `src/lib/audio.js` ni helpers de audio.
- **No se modificaron** primitivas más allá del ref-based fix (SP5).
- **No se migraron** otros protocolos fuera de los 18 listados.
- **No se implementó** PPG (queda en backlog).
- **No se commiteó** nada — todos los cambios quedan staged/untracked para revisión humana.
- **No se declaró** nueva deuda técnica fuera de CLEANUP_BACKLOG.md.

---

## Próximos pasos sugeridos (post-Phase 4)

1. **Adopción de `ProtocolPlayer` en `app/page.jsx`** — reemplazar las llamadas a `SessionRunner` que aún quedan en rutas no migradas.
2. **Rollout silencioso de SafetyOverlay** — observar telemetría de bounce-rate en gate (esperado: <5% si redacción es clara).
3. **Limpieza de legacy** — atacar CLEANUP_BACKLOG #1 cuando dos sprints pasen sin tocarlo.
4. **Pacing review** — CLEANUP_BACKLOG #3 cuando haya datos de exit prematuro por acto.
5. **Phase 5 candidate**: dashboard de coach con métricas por protocolo, partial-credit rate, retention.

---

## Métricas de cierre

| Métrica | Valor |
|---|---|
| Sub-prompts ejecutados | 8/8 |
| Protocolos migrados | 18 |
| Primitivas UI | 19 |
| Tests passing | 3088 / 3088 |
| Test files | 127 |
| Suite duration | 39.87s |
| Build status | EXITCODE=0 |
| Playwright capturas (Phase 6 SP8) | 6 |
| CLEANUP_BACKLOG items | 10 |
| Commits creados | 0 (revisión humana pendiente) |

**Estado final**: Phase 4 cerrada. Listo para review humana → commit → Phase 5.
