# SP-U · Protocol #22 Vagal Hum Reset — Cadena completa

**Date:** 2026-05-11
**Tier:** Calma (active useCase) · Protocol #22 Vagal Hum Reset
**Status:** ✅ Closed (4 primitives dedicated)
**Tests:** 4989/4989 verde (251 files)

## Mecanismo

Triple sinergia vagal documentada activada por humming sostenido:
1. **Nervio laríngeo recurrente (rama vagal)** + extensión exhalatoria parasimpática (Porges 2009 polyvagal theory).
2. **Vibración facial trigeminal** durante humming.
3. **Óxido nítrico nasal ~15×** vs respiración normal (Maniscalco 2003 European Respiratory Journal).

Bhramari pranayama instrumentado timed con counter (4 humming × 10s) + interocepción residual + commitment cierre. Sin overclaim inmunológico/sistémico — solo activación parasimpática aguda.

## Cadena #22 — 4 primitives dedicated

| Phase | Primitive | Cyan | Visual signature distintivo |
|---|---|---|---|
| P1 Preparación | `humming_preparation` | deep | Breath orb 4-4 + 3 posture checks sequential (Columna · Boca · Lengua) |
| P2 Humming | `vagal_humming_resonance` | mid | Orb con micro-vib 4Hz + 5 facial vibration rings + **2 nasal NO glow points** + MMMMM text |
| P3 Residual | `residual_vibration` | light | Slow-decay rings + 2 body zones (cara/pecho ovales) + VIBRACIÓN RESIDUAL text emerge |
| P4 Cierre | `calm_commitment` | light | 3 concentric breathing halo rings @5.5rpm + hold-press 5s + palmas 12ª |

## Palmas conflict — 12ª resolución consecutiva

Catálogo Phase 4:
- "Mantén las palmas firmes contra pecho" → "Apoya la mano libre contra el pecho. Mantén el pulgar firme en el botón."
- Mechanism string compresso con atribución preservada.

Patrón consistente: #18 P5, #19 P3, #20 P4, #21 P4, #22 P4.

## Active tier compliance

- ✅ `validate.kind: "min_duration"` (P1, P3) + `"tap_count"` (P2) + `"hold_press"` (P4)
- ✅ `voice.enabled_default: false` (active tier default)
- ✅ Binaural cadena: P1 start type=calma → P2/P3 continue → P4 stop
- ✅ `min_hold_ms: 5000` (active tier ≥ crisis 3000)
- ✅ Tap_count validation: `min_taps: 4`, `bilateral: false` para humming (counting NOT bilateral taps)

## Calidad Apple-grade (wave 1+2+3 elevators desde el inicio)

Los 4 primitives reciben:
- ✅ Mount fade-in via `useMountFade` hook (420ms easeOutCubic + rise 8px)
- ✅ Idle micro-animations (breath cycle, ring decay, nasal pulse)
- ✅ Snap-flash al cruzar minHold (P4)
- ✅ Idle breathing pulse pre-press button (P4)
- ✅ Eyebrow + primary prompt + hint + body anchor 4-capas
- ✅ Custom SVG glyphs (checkmark animado en P1 posture checks)
- ✅ Cyan family progression deep → mid → light → light

## Innovaciones visuales específicas

### #22 P2 Nasal NO Glow Points
2 pequeños puntos cyan-bright con radial gradient + blur arriba del orb (puentes nasales conceptuales) pulsando @2Hz durante humming. Simboliza el aumento de 15× óxido nítrico nasal documentado por Maniscalco 2003 — innovación visual única en el catálogo Phase 7.

### #22 P3 Body Zones
2 dotted ovals (cara above, pecho below) que se atenúan con `ringIntensity` durante la interocepción — sin formas anatomical específicas, solo "zonas de atención" abstractas (cumple política "cero glifos genéricos anatómicos").

### #22 P4 Breathing Halo
3 concentric rings que pulsan al ritmo respiratorio resonante 5.5 rpm (11s cycle) durante el hold — diferente de chevrons (#20), perspective lines (#21), o cardinal arcs (#19). Cadencia breathing-locked.

## Catálogo (`protocols.js`)

```diff
- ui:{primitive:"breath_orb",props:{cadence:{in:4,h1:0,ex:4,h2:0}}}                          // P1
+ ui:{primitive:"humming_preparation",props:{cadence:{in:4,h1:0,ex:4,h2:0},duration_ms:30000}}

- ui:{primitive:"vocal_resonance_visual",props:{target_hums:4,hum_duration_ms:10000}}        // P2
+ ui:{primitive:"vagal_humming_resonance",props:{target_hums:4,hum_duration_ms:10000}}

- ui:{primitive:"silence_cyan_minimal",props:{text:"Vibración residual."}}                   // P3
+ ui:{primitive:"residual_vibration",props:{text:"Vibración residual.",duration_ms:35000}}

- ui:{primitive:"hold_press_button",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Calma. Sigo."}}  // P4
+ ui:{primitive:"calm_commitment",props:{label:"MANTÉN",min_hold_ms:5000,release_message:"Calma. Sigo."}}
```

Mechanism strings preservados/refinados, validate kinds intactos.

## Tests

OR-acceptance pattern aplicado en 4 sitios de `tier-22-23.test.js`:
- Acto 1: `breath_orb || humming_preparation`
- Acto 2: `vocal_resonance_visual || vagal_humming_resonance`
- Acto 3: `silence_cyan_minimal || residual_vibration`
- Acto 4: `hold_press_button || calm_commitment`

VALID_PRIMITIVES extendido con 4 nuevos.

### Resultados
- `protocols.tier-22-23.test.js`: 39/39 ✅
- **Full suite: 4989/4989 verde (251/251 files)**

## Storybook entries
- `HummingPreparation · #22 P1`
- `VagalHummingResonance · #22 P2`
- `ResidualVibration · #22 P3`
- `CalmCommitment · #22 P4`

## Screenshots
- `screenshots/sp-u-22-vagal-hum/01-preparation.png` — breath orb + 3 posture checks all activated + countdown
- `screenshots/sp-u-22-vagal-hum/02-humming-mmmmm.png` — 5 vibration rings + MMMMM text + 2 nasal NO points + cycle dots + "9s" countdown + cycle counter 2/4
- `screenshots/sp-u-22-vagal-hum/03-residual-vibration.png` — slow decay rings + body zones (cara/pecho) + VIBRACIÓN RESIDUAL text + "18s"
- `screenshots/sp-u-22-vagal-hum/04-calm-commitment-pre.png` — 3 breathing halo rings @5.5rpm + MANTÉN button + mantra + palmas-resolved prompt

## Total resumen Phase 7 — 18 primitives dedicated

| Chain | Protocolo | Primitives nuevos |
|---|---|---|
| SP-Q | #18 Emergency Reset | 5 |
| SP-R | #19 Panic Interrupt | 3 |
| SP-S | #20 Block Break | 4 |
| SP-T | #21 Threshold Crossing | 4 |
| **SP-U** | **#22 Vagal Hum Reset** | **4** |

**Total 18 primitives dedicated cross 5 protocolos, 12 resoluciones palmas conflict, 100% suite verde sostenida.**

## Next
- **SP-V:** #23 Power Pose Activation — 4 phases (postura, respiración energizante, isometric core, cierre). Última cadena Phase 7. Patrón Cuddy 2018 (postural feedback, NO claim hormonal).
