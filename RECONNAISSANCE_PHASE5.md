# RECONNAISSANCE_PHASE5.md

> SP1 Phase 5 · Estado del repo post-Phase 4 verificado para preparar SP2-SP6.
> Fuente verificada: `src/lib/protocols.js`, `src/components/protocol/v2/PrimitiveSwitcher.jsx`,
> `src/hooks/useProtocolPlayer.js`, archivos en `src/components/protocol/v2/primitives/`.

---

## 1. Catálogo `P[]` actual

### 1.1 IDs presentes (18 protocolos)

| ID | Nombre | useCase | int | Línea |
|---|---|---|---|---|
| 1  | Reinicio Parasimpático | (default → active) | calma | 175 |
| 2  | Activación Cognitiva | (default → active) | enfoque | 287 |
| 3  | Reset Ejecutivo | (default → active) | reset | 411 |
| 4  | Pulse Shift | (default → active) | energia | 517 |
| 5  | Skyline Focus | (default → active) | enfoque | 610 |
| 6  | Grounded Steel | (default → active) | calma | 712 |
| 7  | HyperShift | (default → active) | reset | 801 |
| 8  | Lightning Focus | (default → active) | enfoque | 877 |
| 9  | Steel Core Reset | (default → active) | reset | 964 |
| 10 | Sensory Wake | (default → active) | energia | 1051 |
| 11 | Body Anchor | (default → active) | calma | 1138 |
| 12 | Neural Ascension | (default → active) | reset | 1227 |
| 15 | Suspiro Fisiológico | active | calma | 1325 |
| 16 | Resonancia Vagal | training | calma | 1401 |
| 17 | NSDR 10 min | training | calma | 1506 |
| 18 | Emergency Reset | crisis | calma | 1650 |
| 19 | Panic Interrupt | crisis | calma | 1776 |
| 20 | Block Break | crisis | energia | 1860 |

**Gaps confirmados**: IDs 13 y 14 reservados (OMEGA / OMNIA eliminados Phase 4 SP1, gap permanente — `RESERVED_IDS = new Set([13, 14])` en `protocols.shape.test.js`).

**IDs disponibles para Phase 5 SP3-SP5**: `21, 22, 23, 24, 25` libres y sin conflicto. El test de shape valida `id ≤ 20` (línea 34) → al introducir #21-#25 hay que **subir ese cap a 25** en `protocols.shape.test.js` línea 34. Lo anoto como cambio cascada para SP3.

### 1.2 Shape de `safety` y `variants`

- **`safety`**: string opcional. Tres protocolos lo usan hoy:
  - `#18`: `"Si la angustia es severa o persistente, contacta inmediatamente a un profesional de salud mental o servicio de emergencia (911 en MX)."`
  - `#19`: `"AVISO IMPORTANTE: Este protocolo usa agua fría sobre la cara para activar el reflejo vagal..."` (será refactorizado en Fase 3 de este SP).
  - `#20`: `"Si te encuentras frecuentemente bloqueado/a o experimentas frustración intensa persistente, considera buscar apoyo profesional."`

  El SafetyOverlay (en `ProtocolPlayer.jsx`) se monta sí y sólo sí `useCase === "crisis" && !!protocol.safety`. Validado en SP8.

- **`variants`**: array opcional. Sólo `#19` lo usa hoy:
  ```js
  variants: [
    { id: "with-cold-water",  label: "Con agua fría disponible" },
    { id: "without-cold-water", label: "Sin agua fría disponible" },
  ]
  ```
  Tras refactor de Fase 3 (este SP), `variants` se elimina de #19. Quedará sin protocolos con variants — el test "variants (si existe) tiene shape correcto" (línea 137) sigue válido (rama `if (p.variants !== undefined)` no se ejecuta).

### 1.3 Conteo total de protocolos por useCase

- **active**: 13 (todos los que carecen del campo + #15)
- **training**: 2 (#16, #17)
- **crisis**: 3 (#18, #19, #20)

Tras Phase 5: +5 nuevos en clasificaciones por definir en SP3-SP5 según `PHASE5_CLINICAL_BASIS.md`.

---

## 2. Primitivas existentes — inventario para reuso

### 2.1 Las 19 primitivas en `src/components/protocol/v2/primitives/`

Mapeadas en `PrimitiveSwitcher.jsx`:

| primitive (enum) | Componente | Reusable directo en #21-#25? |
|---|---|---|
| `breath_orb` | BreathOrbExtended | **Sí** — #22 (Vagal Hum: variante con énfasis exhalación), #23 (Power Pose: respiración 4-4), #25 (Cardiac Pulse: 5.5 rpm) |
| `bilateral_tap_targets` | BilateralTapTargets | Sí (cualquier necesidad bilateral) |
| `ocular_dots` | OcularDots | Sí |
| `ocular_horizontal_metronome` | OcularHorizontalMetronome | Sí |
| `visual_panoramic_prompt` | VisualPanoramicPrompt | Sí |
| `dual_focus_targets` | DualFocusTargets | Sí |
| `body_silhouette_highlight` | BodySilhouetteHighlight | Sí |
| `posture_visual` | PostureVisual | **Sí** — base para #23 (Power Pose Activation) |
| `isometric_grip_prompt` | IsometricGripPrompt | **Sí** — combinable en #23 |
| `chest_percussion_prompt` | ChestPercussionPrompt | Sí |
| `facial_cold_prompt` | FacialColdPrompt | **Queda HUÉRFANO** tras refactor #19 (no la usa nadie). Decisión: mantener archivo + entrada en switch para compatibilidad si se reintroduce; agregar a CLEANUP_BACKLOG #11. |
| `shake_hands_prompt` | ShakeHandsPrompt | Sí |
| `chip_selector` | ChipSelector | **Sí** — #21 (Threshold Crossing: "qué dejas atrás" / "qué traes adelante") |
| `hold_press_button` | HoldPressButton | Sí — patrón de cierre commitment |
| `text_emphasis_voice` | TextEmphasisVoice | **FALLBACK universal** (case `default` en switcher) |
| `silence_cyan_minimal` | SilenceCyanMinimal | Sí |
| `object_anchor_prompt` | ObjectAnchorPrompt | Sí |
| `vocal_with_haptic` | VocalWithHaptic | **Sí** — #22 (Vagal Hum: hum sostenido en lugar de "aaaah", requiere prop adaptation no nuevo componente) |
| `transition_dots` | TransitionDots | Componente del shell, no se usa como primitive de acto |

### 2.2 Lo que las primitivas existentes **NO** cubren para #21-#25

Cada una requiere **primitiva NUEVA** (a construir en SP2):

| Protocolo | Primitiva nueva | Por qué no se reusa una existente |
|---|---|---|
| #21 Threshold Crossing | `doorway_visualizer` | Animación de portal/umbral con "antes" / "después" — semánticamente único, no es panoramic ni dual_focus |
| #22 Vagal Hum Reset | `vocal_resonance_visual` | Onda sonora con énfasis humming + indicador de resonancia facial; vocal_with_haptic está pensado para "aaaah" no para hum sostenido con visualización de NO nasal |
| #23 Power Pose Activation | `power_pose_visual` | Postura erguida con isometric core overlay — combina semánticamente posture_visual + isometric pero la composición lateral/temporal es distinta |
| #24 Bilateral Walking Meditation | `walking_pace_indicator` | Pisada izq-der con counter de pasos; bilateral_tap_targets es manos no pies, ritmo distinto |
| #25 Cardiac Coherence Pulse Match | `pulse_match_visual` | Heartbeat dot + breath orb sincronizados; ninguna primitiva existente combina ambos en superposición |

**Total nuevas primitivas SP2**: 5.

---

## 3. Engine support (`useProtocolPlayer` + `PrimitiveSwitcher`)

### 3.1 ActType enum (en `protocols.js` JSDoc línea 30-37)

Tipos actuales (23):
```
breath, motor_bilateral, motor_isometric, motor_release, motor_shake,
oculomotor, visual_focus, visual_panoramic, visual_dual_focus,
interoception, proprioception, somatic_tactile,
vocalization, auditory_internal,
vagal_facial_cold, vagal_chest_percussion, vagal_breath_extended,
cognitive_anchor, cognitive_visualization, cognitive_filter,
commitment_motor, sensory_grounding, transition
```

**Tipos NUEVOS requeridos en Fase 4 (este SP) para #21-#25**:
- `cognitive_segmentation` → #21 (Threshold Crossing — boundary effect)
- `vocal_resonance` → #22 (Vagal Hum — humming sostenido específico, distinto de `vocalization` genérico)
- `power_posture` → #23 (postura expansiva + isometric coordinado)
- `walking_meditation` → #24 (marcha consciente)
- `cardiac_interoception` → #25 (heartbeat detection task)

Como es JSDoc (typing puro, no runtime), **sólo amplío el comentario** — no hay lógica que verificar el enum en runtime. Riesgo cero.

### 3.2 Validation kinds (línea 48-50 JSDoc + 113-149 inferActDefaults)

Kinds actuales (9):
```
min_duration, breath_cycles, tap_count, hold_press, chip_selection,
eye_movement, ppg_breath_match, visual_completion, no_validation
```

**Kinds nuevos requeridos**:
- `pulse_count` → #25 (user cuenta latidos en intervalo, target_pulses + tolerance)
- `pace_count` → #24 (user da N pasos, contador interno o tap-rítmico)

Estos sí se usan en runtime (en `useProtocolPlayer` evaluación de `passed`). Lo añado al JSDoc en SP1 pero la **lógica de evaluación** se implementa en SP2 cuando llegue la primitiva que emite las señales (`stepsCompleted`, `pulsesCounted`).

### 3.3 UI primitive enum (línea 66-72 JSDoc)

Primitivas actuales (19, listadas arriba). **Añadir** las 5 nuevas para SP2:
- `doorway_visualizer`
- `vocal_resonance_visual`
- `power_pose_visual`
- `walking_pace_indicator`
- `pulse_match_visual`

### 3.4 PrimitiveSwitcher fallback

Verificado en `PrimitiveSwitcher.jsx` línea 26 (`const FALLBACK = "text_emphasis_voice"`) y línea 207 (case `default`). Cualquier primitive desconocido cae a `TextEmphasisVoice` con `act.text` y `min_duration_ms` inferido. **No hay risk de crash** si en SP3-SP5 introduzco un protocolo cuya primitiva todavía no existe en el switch — degrada limpio.

### 3.5 inferActDefaults

Actualmente mapea:
- `phase.ic === "breath"` → `type: "breath"` → primitive: `breath_orb`
- `phase.ic === "body"` → `type: "proprioception"` → primitive: `text_emphasis_voice`
- `phase.ic === "mind"` → `type: "cognitive_anchor"` → primitive: `text_emphasis_voice`
- `phase.ic === "focus"` → `type: "visual_focus"` → primitive: `text_emphasis_voice`

**Para SP1 no se modifica**. Los protocolos #21-#25 declararán `type` y `ui.primitive` explícitos en cada acto (no dependen del fallback). Sólo si SP3-SP5 quiere mapping default por `ic` para los nuevos types, se actualiza ahí.

---

## 4. Tests existentes que tocará Phase 5

| Archivo | Cambio esperado | Cuándo |
|---|---|---|
| `protocols.shape.test.js` línea 34 | subir cap a `id ≤ 25` | SP3 (al introducir #21) |
| `protocols.tier-crisis.test.js` | actualizar tests #19 (eliminar variants/dive reflex/facial_cold_prompt) | SP1 Fase 3 (este SP) |
| `protocols.refactor19.test.js` | nuevo, garantías post-refactor | SP1 Fase 5 (este SP) |
| `protocols.tier-active-2.test.js` o similar | nuevo, para #21-#25 | SP3-SP5 |
| `PrimitiveSwitcher.test.jsx` | extender con los 5 nuevos primitives | SP2 |

---

## 5. Riesgos identificados antes de SP2-SP5

1. **Cap de IDs en shape test**: hoy `id ≤ 20`. Hay que subirlo a 25 antes o al introducir #21. Si no, falla suite.
2. **`facial_cold_prompt` huérfana** post-refactor #19: queda en el switch + archivo. Documento en CLEANUP_BACKLOG #11; no se borra en este SP por blast-radius (storybook + tests de la primitiva).
3. **`vagal_facial_cold` ActType** queda sin uso. Mismo trato — JSDoc only, sin coste runtime.
4. **#19 SCIENCE_DEEP** (línea 1987) referencia "Mammalian Dive Reflex, Heath 1992 NEJM" + "frío facial". Hay que **reescribir** la entrada del SCIENCE_DEEP[19] al refactorizar para que coincida con los nuevos mecanismos (vocalización + apnea + presión trigeminal).
5. **Shape test "variants ≥2 en #19"** (en `protocols.shape.test.js` líneas 161-176, ya simplificado en Phase 4 SP8): el bloque actual exige variants ≥2 sólo para #19. Tras refactor, **#19 ya no tendrá variants** → hay que eliminar ese assertion específica para #19.

Mitigación: todos los riesgos cubiertos en las fases 3-5 de este SP.

---

## 6. Listo para Fase 2

Catálogo, primitivas y engine documentados. Procedo a redactar `PHASE5_CLINICAL_BASIS.md` con citas peer-reviewed por protocolo.
