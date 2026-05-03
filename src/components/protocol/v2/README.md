# protocol/v2/primitives — Phase 4 SP2

19 primitivas autónomas que el ProtocolPlayer (SP3) y los protocolos migrados (SP4-SP8) van a renderizar a partir de `act.ui.primitive`.

Cada primitiva:

- Hereda el ADN visual `Tactical Premium Dark` definido en `src/components/app/v2/tokens.js`. **Sin glow, sin glassmorphism, sin gradient bg.**
- Consume APIs reales de [`src/lib/audio.js`](../../../lib/audio.js). **Sin paralelas.**
- Self-contained: emite `onComplete` cuando la validación interna pasa. El player decide qué hacer después.
- Storybook dev en [`/dev/protocol-primitives`](../../app/dev/protocol-primitives/page.jsx) (ver `PrimitivePreview.jsx`).

---

## Catálogo

| Primitive | Validación que produce | APIs de `audio.js` consumidas |
|---|---|---|
| `BreathOrbExtended` | `onCycleComplete(n)` por ciclo + `onComplete` cuando `cycleCountTarget` alcanzado | `playBreathTick(label, intent)` + `hapticBreath(label)` |
| `BilateralTapTargets` | `onTap(side)` por tap + `onComplete` cuando `target_taps` alcanzado (con bilateral check via L+R counts) | `hap("tap")` + `hapticSignature("checkpoint")` + `navigator.vibrate(35)` |
| `OcularDots` | `onComplete` post `total_steps × interval_ms` (timing-based) | (none — visual only) |
| `OcularHorizontalMetronome` | `onComplete` post `total_cycles` ciclos | (none — visual only) |
| `VisualPanoramicPrompt` | `onComplete` post `duration_ms` (timing-based) | (none — visual only) |
| `DualFocusTargets` | `onComplete` post `cycles` alternaciones | (none — visual only) |
| `BodySilhouetteHighlight` | `onComplete` cuando termina `highlight_progression` | (none — visual only) |
| `PostureVisual` | `onComplete` cuando termina secuencia de puntos | (none — visual only) |
| `IsometricGripPrompt` | `onHoldComplete(n)` por ciclo + `onComplete` cuando `target_holds` alcanzado | `hap("ok")` + `playChord([432], 0.3, 0.04)` |
| `ChestPercussionPrompt` | `onComplete` post `duration_ms` (timing-based + ritmo háptico/audio) | `playSpark(640, 0.03)` + `navigator.vibrate(35)` cada beat |
| `FacialColdPrompt` | `onCompleted` cuando user tap "Listo" tras `min_duration_ms` (anti-trampa: botón disabled hasta el threshold) | `speakNow(...)` (TTS forzado ON — crisis override) |
| `ShakeHandsPrompt` | `onComplete` post `duration_ms` (timing + ritmo háptico/audio) | `playSpark(440, 0.02)` cada 2s + `navigator.vibrate([60,30,60,30])` |
| `ChipSelector` | `onSelect(id\|ids)` (single o multi) tras `min_thinking_ms` enforced | (none — input only) |
| `HoldPressButton` | `onComplete` cuando hold físico ≥ `min_hold_ms` · `onCancel` si pointer-up antes | `hap("tap")` cada 200ms durante hold + `hapticSignature("award")` al complete + `hap("error")` al cancel |
| `TextEmphasisVoice` | `onComplete` post `min_duration_ms` (timing-based) | `speak(...)` opt-in si `voice_enabled` |
| `SilenceCyanMinimal` | `onComplete` post `duration_ms` | (none) |
| `ObjectAnchorPrompt` | `onComplete(value)` cuando user escribe ≥ `min_chars` y tap "Listo" | `hap("ok")` |
| `VocalWithHaptic` | `onComplete` cuando `target_vocalizations` confirmadas con tap | `playChord([220, 165], 0.5, 0.04)` al completar cada vocalización + `navigator.vibrate(800)` al inicio |
| `TransitionDots` | (none — display only) | (none) |

---

## ADN visual heredado

Todas las primitivas usan exclusivamente:

- **Bg:** `#08080A` (base) o `rgba(255,255,255,0.02-0.06)` para superficies elevadas.
- **Acento:** `#22D3EE` (phosphorCyan), máximo 4 lugares por viewport.
- **Texto:** `rgba(245,245,247,0.92)` primary, `0.62` secondary, `0.38` muted.
- **Borders:** `0.5px solid rgba(255,255,255,0.06)`, radius 14-16 (panel) o 999 (pill).
- **Tipografía:** Inter Tight pesos 200/400/500. **Cero bold 600+.**
- **Iconografía:** SVG inline o `lucide-react` stroke 1.5 size 20-32.
- **Motion:** transiciones cortas (≤240ms), linear o `cubic-bezier(0.22,1,0.36,1)`. Sin easing decorativo.

---

## Validación anti-trampa por primitiva

Mapeo a las decisiones bloqueadas del SP1:

- **active strict:** primitivas con validación física (ej. `BilateralTapTargets`, `HoldPressButton`, `IsometricGripPrompt`, `VocalWithHaptic`, `ObjectAnchorPrompt`) reportan `onComplete` solo si la condición se cumple. Si user salta antes, el player puede registrar `incomplete`.
- **training partial:** primitivas con timing-based (ej. `BodySilhouetteHighlight`, `OcularDots`) — el player puede pausar/resumir y reportar `partial: true` con `percentComplete`.
- **crisis siempre acreditar:** primitivas crisis (`FacialColdPrompt`, `ObjectAnchorPrompt`, `ShakeHandsPrompt`, `VocalWithHaptic`) tienen umbrales bajos y siempre completan tras alcanzarlos. `FacialColdPrompt` usa `speakNow` automático (TTS override).

---

## Cómo se conectan a SP3 (ProtocolPlayer)

```js
// Pseudocódigo SP3
import { inferActDefaults } from "@/lib/protocols";
import * as primitives from "@/components/protocol/v2/primitives";

function ProtocolPlayer({ protocol, phase, act }) {
  const eff = inferActDefaults(act, phase, protocol);
  const Primitive = primitives[primitiveByName[eff.ui.primitive]];
  return <Primitive {...eff.ui.props} {...eff.media} onComplete={advance} />;
}
```

SP3 implementa el mapping completo y la lógica de advance.

---

## Storybook dev

`PrimitivePreview.jsx` se sirve en `/dev/protocol-primitives`. Botón por primitiva → preview en sandbox. Botón "Reset" reinicia con nuevo `key`. Audio/haptic deshabilitados en defaults para no spamear durante el storybooking.

---

## Migración useStore (Phase 4 SP2)

`STORE_VERSION` 14 → 15. Default `voiceOn: false` para nuevos users (TTS opt-in).
- New user (`!data` en migrate) → `voiceOn: false` explícito.
- Existing user → preferencia preservada (no flip).
- DS.voiceOn flipped a `false` para coherencia del baseline.
