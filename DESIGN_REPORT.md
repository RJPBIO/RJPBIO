# BIO-IGNICIÓN — Clinical Precision Redesign

**Generated:** 2026-04-16
**Branch:** edicion-pwa-anterior
**Scope:** Full UI pivot from wellness-app aesthetic (Calm/Headspace lineage) to clinical instrument aesthetic (Withings tensiometer / Tesla dash / NEJM lab report).

---

## 1. Intent

Transform the visual and interaction language from *friendly meditation companion* to *precision instrument for high-performance operators*. The product still does the same thing (neural calibration via guided protocols); the tone, hierarchy, and restraint were rebuilt.

Reference anchors carried through every decision:
- Withings BPM on white marble (cold, quiet, numeric)
- Tesla dashboard dark mode (near-black, monochrome, no chrome)
- NEJM typography (weight-300 metrics, caps labels, tabular numerals)
- Elite private-clinic lab reports (hairlines, no shadows, no fills)
- EEG / clinical-grade interfaces (single-channel signal color)

---

## 2. Findings — what was removed

| Old pattern | Why it was wrong | Replaced with |
|---|---|---|
| Linear gradients on CTAs, cards, headers | Gradients read as "consumer wellness" | Solid teal CTA + 1px teal border |
| Multi-color chart palettes (6 channels per radar) | Polychromatic data reads as marketing | Single teal channel across every chart |
| Drop shadows on cards | Shadows = consumer UI elevation | Contrast + hairlines for elevation |
| Colored pill backgrounds on badges | Fills compete with data | Outline caps labels (0.12em tracking) |
| Breathing-ring avatar on profile | Decorative animation, not data | Removed entirely |
| Rotating SVG orb on calibration | Decorative motion | Border-color state change on a static circle |
| Scale animations on data entry | Numbers "bouncing in" is marketing polish | Fade + 4px translate only |
| Weight-black (900) hero numbers | Heavy = loud = anti-clinical | Weight-300 metrics ("lightness = precision") |
| Rounded display font | Softness reads as wellness | Inter (hairline geometric) |
| Beige/warm whites, pure black | Warmth reads as hospitality | Cold white #F8F9FB / cold dark #0C0F14–#141820 |
| Colored phase-type backgrounds | Rainbow phase strip broke typography hierarchy | Hairline-separated numbered rows |
| Icon default stroke 1.8 | Too heavy against hairlines | 1px stroke, 18px default |

---

## 3. Decisions — the clinical system

### Color discipline
- **Teal #0F766E** — the *only* action color. Used for: primary CTAs, active metrics, live session state, success deltas, on-track indicators. Never decorative, never background fill except at ≤8% opacity.
- **Cold white #F8F9FB** / **cold dark #0C0F14** page / **#141820** card — never beige, never pure black.
- **Amber #B45309** — warning only. Never informational.
- **Desaturated red #B91C1C** — danger only. Never destructive fill.
- **Hairline #E5E7EB / #232836** at 0.5px — for every divider, every border.

### Typography
- **Inter** via Google Fonts, `font-feature-settings: "tnum", "cv11"`. Never rounded.
- **Two weights per screen max.** Metrics at 300, body at 400, caps labels at 600. Nothing at 500 unless it's a row title next to weight-300 data.
- **Metrics**: 28–56px, weight 300, `letter-spacing: -0.01em`, `font-variant-numeric: tabular-nums`. Minimum one 48px+ primary per screen.
- **Caps labels**: 10–11px, weight 600, `letter-spacing: 0.12em`, UPPERCASE. This is the *only* place caps are allowed.
- **Body**: 15px, weight 400, `line-height: 1.6`.
- **Instructions**: 20–24px, weight 300, centered.

### Layout & spacing
- Card padding 24px, section gap 32px, lateral 20px, tap target 52px min.
- Card radius 12px, button radius 10px.
- Hairlines at 0.5px, CTAs get 1px borders.
- No shadows anywhere. Elevation is pure contrast.

### Motion
- 280ms ease-out for everything.
- Only the breath indicator gets a long pulse animation.
- Data transitions: fade + 4px translate. No scale on numbers.

---

## 4. Installations

None. The pivot was a *subtraction* exercise — existing stack was already sufficient:

- `framer-motion` — used more restrainedly (no scale on data)
- `recharts` — rewritten to single-channel teal
- `lucide-react` — defaults tightened (1px stroke, 18px)
- `zustand` + localStorage — unchanged
- `next` 16.2.1 / `react` 19.2.4 — unchanged

Google Fonts **Inter** was already wired via `globals.css`. No new dependencies added.

---

## 5. Screens & components evolved

Full rewrites (clinical pivot complete):

| File | What changed |
|---|---|
| [src/lib/tokens.js](src/lib/tokens.js) | Cold palette, Inter primary, two-weight system, 280ms motion tokens |
| [src/lib/theme.js](src/lib/theme.js) | `resolveTheme`, `hairline()` helper, `semantic`, typography presets |
| [src/app/globals.css](src/app/globals.css) | Inter import, tabular-nums body default, cold base colors |
| [src/app/page.jsx](src/app/page.jsx) | Shell wrapper, clinical header bar, segmented nav |
| [src/components/AnimatedNumber.jsx](src/components/AnimatedNumber.jsx) | Weight 300 + tabular-nums (was weight-black) |
| [src/components/BreathOrb.jsx](src/components/BreathOrb.jsx) | Hairline ring + tabular counter, no gradient aura |
| [src/components/DashboardView.jsx](src/components/DashboardView.jsx) | NEJM-style header, 3-col metrics, hairline section rows |
| [src/components/ProfileView.jsx](src/components/ProfileView.jsx) | Removed breathing-ring avatar, hairline row list structure |
| [src/components/NeuralRadar.jsx](src/components/NeuralRadar.jsx) | Single teal channel, hairline grid, 3-col dimension buttons |
| [src/components/NeuralCoach.jsx](src/components/NeuralCoach.jsx) | Hairline insight rows, teal priority dot |
| [src/components/StreakShield.jsx](src/components/StreakShield.jsx) | 2px left border urgency, no gradient |
| [src/components/CorrelationMatrix.jsx](src/components/CorrelationMatrix.jsx) | Ranked rows, single-channel 2px bar |
| [src/components/WeeklyReport.jsx](src/components/WeeklyReport.jsx) | Teal-vs-hairline comparison, tabular deltas |
| [src/components/ProtocolSelector.jsx](src/components/ProtocolSelector.jsx) | Hairline rows, teal left-border selection, outline tag letters |
| [src/components/ProtocolDetail.jsx](src/components/ProtocolDetail.jsx) | Numbered phase timeline, teal CTA, weight-300 deltas |
| [src/components/SettingsSheet.jsx](src/components/SettingsSheet.jsx) | Toggle primitive, segmented theme control, hairline NOM-035 export |
| [src/components/HistorySheet.jsx](src/components/HistorySheet.jsx) | Group caps headers, hairline session rows |
| [src/components/PostSessionFlow.jsx](src/components/PostSessionFlow.jsx) | Clinical summary, weight-300 delta, single teal CTA |
| [src/components/NeuralCalibration.jsx](src/components/NeuralCalibration.jsx) | Hairline onboarding, 200px border-state circles, numbered list |
| [src/components/TemporalCharts.jsx](src/components/TemporalCharts.jsx) | Single-channel teal charts, hairline grid, no gradients |
| [src/components/Icon.jsx](src/components/Icon.jsx) | Default stroke 1px, default size 18px |

---

## 6. Next iteration items

1. **Build verification** — run `pnpm build` (or npm/yarn equivalent) in a clean environment and resolve any TS/lint surprises from the aggressive rewrite.
2. **Dark/light visual QA pass** — walk every screen in both themes; contrast audit against WCAG AA for the weight-300 numerics at 56px (thin weights at large sizes can fail contrast on soft grays).
3. **a11y focus-visible** — every new hairline button needs a visible teal focus ring; audit keyboard traversal on ProtocolSelector, SettingsSheet, HistorySheet.
4. **Mobile Lighthouse** — confirm the removal of gradients/shadows improved CLS/LCP; verify tabular numerals don't affect text reflow.
5. **Motion reduced-motion media query** — honor `prefers-reduced-motion` on the remaining 280ms transitions and the breath pulse.
6. **SVG icon audit** — confirm every `<Icon>` call respects the new 1px/18px defaults; a few legacy call-sites may still pass `size={16}` or `strokeWidth={2}`.
7. **NOM-035 export HTML** — the clinical template in `SettingsSheet` was rewritten, but it should be rendered + printed once to verify paper output fidelity.
8. **Removed files** — working tree has tombstones for `eslint.config.mjs`, `src/app/page (1).jsx`, `src/app/page (3).jsx`, `src/app/page.js`. Confirm these deletions are intentional and commit them.
9. **Session-level telemetry screen** — not yet pivoted; if it exists elsewhere, it needs the same treatment (hairlines, weight-300, tabular-nums).
10. **Design-tokens freeze** — once QA is clean, lock `tokens.js` and document it so future screens don't drift back to gradients.

---

## 7. Guiding principle — one line

> Lightness is precision. Color is a verb. Everything else is a hairline.
