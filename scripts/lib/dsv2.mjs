/* ═══════════════════════════════════════════════════════════════
   Design System v2 · Apple/Linear-grade
   ────────────────────────────────────────────────────────────────
   Shared across all light theme PDFs. Upgrades v1 with:
     · +30% whitespace (page padding, line-height, margins)
     · Bigger typography hierarchy (h1 64→72, lede 22→26)
     · Refined drop shadows (multi-layer, cyan-tinted)
     · Hero page primitive (single dominant data/statement)
     · Statement page primitive (pull quote large)
     · Card grid primitive (Apple-style cards)
     · BioIcons set (12 custom icons, line-art Linear style)
   ═══════════════════════════════════════════════════════════════ */

export const TOKENS = {
  cyan: "#22D3EE",
  cyanSpark: "#A5F3FC",
  cyanCore: "#ECFEFF",
  cyanInk: "#155E75",
  ink: "#0F172A",
  inkDim: "#475569",
  inkSoft: "#94A3B8",
  inkMute: "#94A3B8",
  hair: "#E2E8F0",
  hairSoft: "#F1F5F9",
  paper0: "#FFFFFF",
  paper1: "#F8FAFC",
  paper2: "#F1F5F9",
  amber: "#FBBF24",
  warm: "#FDE68A",
  red: "#F43F5E",
  bg: "#FFFFFF",
  // physical fallbacks (used by Hardware Design dark pages)
  metal0: "#1A1F26",
  metal1: "#12161C",
  metal2: "#0A0D11",
  metalEdge: "#262E38",
  engraveCyan: "#22D3EE",
};

export const FONTS = "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif";
export const SERIF = "'Newsreader', 'Georgia', 'Source Serif Pro', serif";
export const MONO = "'JetBrains Mono', 'SF Mono', Consolas, monospace";

/* ═══════════════════════════════════════════════════════════════
   CSS v2 · Portrait (1240 × 1640)
   ═══════════════════════════════════════════════════════════════ */

export function portraitCSS(opts = {}) {
  const T = TOKENS;
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: 1240px 1640px; margin: 0; }
    html, body { width: 1240px; background: ${T.bg}; color: ${T.ink}; font-family: ${FONTS}; -webkit-font-smoothing: antialiased; }
    body { font-feature-settings: "ss01", "cv11"; }

    .page {
      width: 1240px;
      height: 1640px;
      padding: 112px 120px 104px 120px;
      position: relative;
      page-break-after: always;
      background: ${T.bg};
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    .page.dark { background: ${T.metal2}; color: #E7ECF3; }

    /* ═══ Header ═══ */
    .ph {
      display: flex; align-items: center; justify-content: space-between;
      padding-bottom: 18px;
      border-bottom: 0.6px solid ${T.hairSoft};
      margin-bottom: 56px;
    }
    .page.dark .ph { border-bottom-color: ${T.metalEdge}; }
    .ph .wm { font-size: 14px; letter-spacing: 0.18em; font-weight: 800; text-transform: uppercase; display: flex; align-items: baseline; gap: 7px; }
    .ph .wm .bio { color: ${T.ink}; opacity: 0.55; font-weight: 400; }
    .page.dark .ph .wm .bio { color: #E7ECF3; opacity: 0.55; }
    .ph .wm .dash { color: ${T.cyan}; font-weight: 700; transform: translateY(-1px); font-size: 16px; }
    .ph .wm .ign { color: ${T.ink}; font-weight: 800; }
    .page.dark .ph .wm .ign { color: #E7ECF3; }
    .ph .docTitle { font-family: ${MONO}; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: ${T.inkDim}; }
    .page.dark .ph .docTitle { color: #94A3B8; }

    /* ═══ Footer ═══ */
    .pf {
      position: absolute; bottom: 42px; left: 120px; right: 120px;
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 18px;
      border-top: 0.6px solid ${T.hairSoft};
      font-family: ${MONO}; font-size: 10px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkSoft};
    }
    .page.dark .pf { border-top-color: ${T.metalEdge}; color: #5F6B7A; }
    .pf .pn { color: ${T.cyanInk}; font-weight: 600; }
    .page.dark .pf .pn { color: ${T.cyan}; }

    /* ═══ Cover ═══ */
    .cover {
      height: 1640px;
      padding: 240px 120px 112px 120px;
      position: relative;
      background: ${T.bg};
      overflow: hidden;
    }
    .cover .vignette {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background:
        radial-gradient(ellipse 65% 50% at 20% 25%, rgba(34, 211, 238, 0.10) 0%, transparent 60%),
        radial-gradient(ellipse 50% 30% at 85% 75%, rgba(34, 211, 238, 0.05) 0%, transparent 65%),
        linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.02) 100%);
      pointer-events: none;
    }
    .cover .wm-big {
      font-size: 36px; letter-spacing: 0.22em; font-weight: 800; text-transform: uppercase;
      display: flex; align-items: baseline; gap: 14px;
    }
    .cover .wm-big .bio { color: ${T.ink}; opacity: 0.55; font-weight: 400; }
    .cover .wm-big .dash { color: ${T.cyan}; font-weight: 700; transform: translateY(-3px); font-size: 40px; }
    .cover .wm-big .ign { color: ${T.ink}; font-weight: 800; }
    .cover .kind {
      margin-top: 124px;
      font-family: ${MONO}; font-size: 13px; letter-spacing: 0.30em;
      text-transform: uppercase; color: ${T.cyanInk};
    }
    .cover h1 {
      margin-top: 22px;
      font-size: 104px; font-weight: 800;
      letter-spacing: -0.042em; line-height: 0.96;
      color: ${T.ink};
      max-width: 980px;
    }
    .cover h1 .accent { color: ${T.cyanInk}; }
    .cover .sub {
      margin-top: 56px; font-size: 24px; color: ${T.inkDim}; line-height: 1.55;
      max-width: 880px; font-weight: 400;
    }
    .cover .pillrow {
      margin-top: 80px; display: flex; gap: 14px; flex-wrap: wrap;
    }
    .cover .pill {
      padding: 11px 20px; border: 1px solid ${T.cyan}; border-radius: 999px;
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.cyanInk};
      background: rgba(34, 211, 238, 0.06);
    }
    .cover .foot {
      position: absolute; bottom: 112px; left: 120px; right: 120px;
      display: flex; justify-content: space-between; align-items: baseline;
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkSoft};
    }
    .cover .foot .v { color: ${T.cyanInk}; font-weight: 600; }

    /* ═══ TOC ═══ */
    .toc-title {
      font-family: ${MONO}; font-size: 12px; letter-spacing: 0.24em;
      text-transform: uppercase; color: ${T.cyanInk}; margin-bottom: 22px;
    }
    .toc h1 {
      font-size: 64px; font-weight: 800;
      letter-spacing: -0.030em; line-height: 1.02;
      color: ${T.ink}; margin-bottom: 72px;
    }
    .toc ul { list-style: none; }
    .toc li {
      display: flex; align-items: baseline; gap: 16px;
      padding: 18px 0;
      border-bottom: 0.6px dashed ${T.hairSoft};
      font-size: 19px; color: ${T.ink};
    }
    .toc li .n {
      font-family: ${MONO}; color: ${T.cyanInk};
      font-size: 13px; letter-spacing: 0.14em; font-weight: 600; min-width: 60px;
    }
    .toc li .t { flex: 1; font-weight: 600; letter-spacing: -0.005em; }
    .toc li .dots {
      flex: 1; border-bottom: 0.6px dotted ${T.hair};
      transform: translateY(-6px); margin: 0 10px;
    }
    .toc li .pn { font-family: ${MONO}; color: ${T.inkDim}; font-size: 13px; }

    /* ═══ Section eyebrow + heading ═══ */
    .eyebrow {
      font-family: ${MONO}; font-size: 12px; letter-spacing: 0.24em;
      text-transform: uppercase; color: ${T.cyanInk};
      margin-bottom: 18px;
      display: inline-flex; align-items: center; gap: 16px;
    }
    .eyebrow::before {
      content: ""; width: 40px; height: 1px; background: ${T.cyan};
      display: inline-block;
    }
    h1.sec-h {
      font-size: 64px; font-weight: 800;
      letter-spacing: -0.030em; line-height: 1.02;
      color: ${T.ink}; margin-bottom: 40px;
      max-width: 980px;
    }
    h1.sec-h .accent { color: ${T.cyanInk}; }
    .page.dark h1.sec-h { color: #E7ECF3; }
    .page.dark h1.sec-h .accent { color: ${T.cyan}; }
    h2.sub-h {
      font-size: 32px; font-weight: 700;
      letter-spacing: -0.018em; line-height: 1.15;
      color: ${T.ink};
      margin-top: 56px; margin-bottom: 22px;
      max-width: 980px;
    }
    .page.dark h2.sub-h { color: #E7ECF3; }
    h3.minor-h {
      font-size: 17px; font-weight: 700; letter-spacing: 0.04em;
      text-transform: uppercase; color: ${T.cyanInk};
      font-family: ${MONO};
      margin-top: 38px; margin-bottom: 16px;
    }
    .page.dark h3.minor-h { color: ${T.cyan}; }

    /* ═══ Body type ═══ */
    p {
      font-size: 18px; color: ${T.ink}; line-height: 1.72;
      margin-bottom: 20px; max-width: 980px;
    }
    .page.dark p { color: #CBD5E1; }
    p.lede {
      font-size: 26px; color: ${T.inkDim}; line-height: 1.48;
      margin-bottom: 36px; max-width: 1020px; font-weight: 400;
    }
    .page.dark p.lede { color: #94A3B8; }
    strong { font-weight: 700; }
    em { color: ${T.cyanInk}; font-style: normal; font-weight: 600; }
    .page.dark em { color: ${T.cyan}; }
    code {
      font-family: ${MONO}; font-size: 0.92em;
      background: ${T.hairSoft}; color: ${T.ink};
      padding: 2px 7px; border-radius: 5px;
    }
    .page.dark code { background: ${T.metalEdge}; color: #E7ECF3; }

    /* ═══ Lists ═══ */
    ul.dense, ol.dense {
      margin: 16px 0 24px 0; padding-left: 0; list-style: none;
      max-width: 1000px;
    }
    ul.dense li, ol.dense li {
      font-size: 17px; color: ${T.ink};
      padding: 12px 0 12px 30px; line-height: 1.65;
      position: relative;
    }
    .page.dark ul.dense li, .page.dark ol.dense li { color: #CBD5E1; }
    ul.dense li::before {
      content: ""; position: absolute; left: 0; top: 22px;
      width: 16px; height: 1px; background: ${T.cyan};
    }
    ol.dense { counter-reset: ol-counter; }
    ol.dense li { counter-increment: ol-counter; padding-left: 44px; }
    ol.dense li::before {
      content: counter(ol-counter, decimal-leading-zero);
      position: absolute; left: 0; top: 12px;
      font-family: ${MONO}; font-size: 13px; color: ${T.cyanInk};
      font-weight: 600; letter-spacing: 0.06em;
    }
    ul.dense li strong, ol.dense li strong { color: ${T.ink}; font-weight: 700; }
    .page.dark ul.dense li strong, .page.dark ol.dense li strong { color: #E7ECF3; }

    /* ═══ Callouts ═══ */
    .callout {
      margin: 32px 0; padding: 26px 30px;
      background: rgba(34, 211, 238, 0.04);
      border-left: 3px solid ${T.cyan};
      border-radius: 0 14px 14px 0;
      font-size: 17px; color: ${T.ink}; line-height: 1.6;
      max-width: 1020px;
    }
    .callout strong {
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.cyanInk};
      display: block; margin-bottom: 8px;
    }
    .page.dark .callout { background: rgba(34, 211, 238, 0.08); color: #CBD5E1; }
    .page.dark .callout strong { color: ${T.cyan}; }
    .warn {
      margin: 32px 0; padding: 26px 30px;
      background: rgba(251, 191, 36, 0.06);
      border-left: 3px solid ${T.amber};
      border-radius: 0 14px 14px 0;
      font-size: 17px; color: ${T.ink}; line-height: 1.6;
      max-width: 1020px;
    }
    .warn strong {
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: #B45309;
      display: block; margin-bottom: 8px;
    }

    /* ═══ Tables ═══ */
    table.t {
      width: 100%; max-width: 1080px;
      border-collapse: collapse; margin: 28px 0;
      font-size: 14.5px;
    }
    table.t thead th {
      text-align: left; font-family: ${MONO};
      font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase;
      color: ${T.inkSoft}; padding: 16px 18px;
      border-bottom: 0.6px solid ${T.hair};
      font-weight: 600;
    }
    table.t tbody td {
      padding: 18px 18px;
      border-bottom: 0.6px solid ${T.hairSoft};
      color: ${T.ink}; vertical-align: top; line-height: 1.55;
    }
    table.t tbody td.mono { font-family: ${MONO}; font-size: 13.5px; color: ${T.cyanInk}; }
    .page.dark table.t thead th { color: #5F6B7A; border-bottom-color: ${T.metalEdge}; }
    .page.dark table.t tbody td { color: #CBD5E1; border-bottom-color: ${T.metalEdge}; }
    .page.dark table.t tbody td.mono { color: ${T.cyan}; }

    /* ═══ Hero pages (Apple/Linear style single dominant) ═══ */
    .hero {
      width: 1240px; height: 1640px;
      padding: 200px 120px;
      position: relative;
      display: flex; flex-direction: column;
      justify-content: center;
      page-break-after: always;
      background: ${T.bg};
      overflow: hidden;
    }
    .hero .vignette {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background:
        radial-gradient(ellipse 55% 45% at 20% 30%, rgba(34, 211, 238, 0.07) 0%, transparent 70%);
      pointer-events: none;
    }
    .hero .hero-eyebrow {
      font-family: ${MONO}; font-size: 13px; letter-spacing: 0.28em;
      text-transform: uppercase; color: ${T.cyanInk};
      margin-bottom: 40px;
      display: inline-flex; align-items: center; gap: 16px;
    }
    .hero .hero-eyebrow::before {
      content: ""; width: 48px; height: 1px; background: ${T.cyan};
    }
    .hero .hero-num {
      font-size: 320px; font-weight: 800;
      letter-spacing: -0.06em; line-height: 0.86;
      color: ${T.ink};
    }
    .hero .hero-num .acc { color: ${T.cyanInk}; }
    .hero .hero-num .u {
      font-size: 88px; color: ${T.inkDim}; font-weight: 700;
      margin-left: 14px; letter-spacing: -0.025em;
    }
    .hero .hero-statement {
      font-size: 92px; font-weight: 800;
      letter-spacing: -0.038em; line-height: 0.98;
      color: ${T.ink}; max-width: 1000px;
    }
    .hero .hero-statement .acc { color: ${T.cyanInk}; }
    .hero .hero-sub {
      font-size: 24px; color: ${T.inkDim};
      line-height: 1.5; max-width: 880px; margin-top: 44px;
    }
    .hero .hero-cite {
      position: absolute; bottom: 96px; left: 120px;
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.inkSoft};
    }

    /* ═══ Card grids ═══ */
    .cards-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 24px; margin: 32px 0;
      max-width: 1080px;
    }
    .cards-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px; margin: 32px 0;
      max-width: 1080px;
    }
    .card {
      padding: 32px 30px;
      border: 0.6px solid ${T.hair};
      border-radius: 18px;
      background: linear-gradient(180deg, #FCFDFE 0%, ${T.paper0} 100%);
      box-shadow: 0 1px 0 ${T.hair} inset;
    }
    .card .label {
      font-family: ${MONO}; font-size: 10px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkSoft};
      margin-bottom: 14px;
    }
    .card .val {
      font-size: 44px; font-weight: 800;
      letter-spacing: -0.025em; color: ${T.ink};
      line-height: 1.05;
    }
    .card .val .acc { color: ${T.cyanInk}; }
    .card .val .u { font-size: 18px; color: ${T.inkDim}; font-weight: 600; margin-left: 4px; }
    .card h3 {
      font-size: 22px; font-weight: 700;
      letter-spacing: -0.012em; color: ${T.ink};
      margin-top: 10px; margin-bottom: 12px;
      line-height: 1.2;
    }
    .card .desc {
      font-size: 14.5px; color: ${T.inkDim};
      line-height: 1.55; margin-top: 12px;
    }

    /* ═══ Drop-shadowed visual hero ═══ */
    .visual-hero {
      display: flex; justify-content: center; align-items: center;
      margin: 40px 0;
    }
    .visual-hero svg, .visual-hero img {
      max-width: 100%;
      filter:
        drop-shadow(0 32px 72px rgba(15, 23, 42, 0.18))
        drop-shadow(0 8px 24px rgba(34, 211, 238, 0.10));
    }
    .page.dark .visual-hero svg, .page.dark .visual-hero img {
      filter:
        drop-shadow(0 36px 80px rgba(0, 0, 0, 0.55))
        drop-shadow(0 8px 24px rgba(34, 211, 238, 0.14));
    }

    /* ═══ Quotes ═══ */
    blockquote {
      margin: 36px 0;
      padding: 8px 36px;
      border-left: 3px solid ${T.cyan};
      font-family: ${SERIF};
      font-style: italic;
      font-size: 28px;
      color: ${T.ink};
      line-height: 1.36;
      max-width: 1000px;
    }
    blockquote cite {
      display: block; margin-top: 18px;
      font-family: ${MONO}; font-style: normal;
      font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.inkDim};
    }

    /* ═══ Separator ═══ */
    hr.sep {
      border: none;
      border-top: 0.6px solid ${T.hairSoft};
      margin: 44px 0;
    }
  `;
}

/* ═══════════════════════════════════════════════════════════════
   CSS v2 · Landscape (1600 × 1000) · for slide decks
   ═══════════════════════════════════════════════════════════════ */

export function landscapeCSS() {
  const T = TOKENS;
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: 1600px 1000px; margin: 0; }
    html, body { width: 1600px; height: 1000px; background: ${T.bg}; color: ${T.ink}; font-family: ${FONTS}; -webkit-font-smoothing: antialiased; }
    body { font-feature-settings: "ss01", "cv11"; }

    .slide {
      width: 1600px;
      height: 1000px;
      padding: 88px 112px;
      position: relative;
      page-break-after: always;
      background: ${T.bg};
      overflow: hidden;
    }
    .slide:last-child { page-break-after: auto; }

    .topbar {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 72px;
    }
    .wordmark {
      font-size: 22px; letter-spacing: 0.18em; font-weight: 800;
      text-transform: uppercase;
      display: flex; align-items: baseline; gap: 10px;
    }
    .wordmark .bio { color: ${T.ink}; opacity: 0.55; font-weight: 400; }
    .wordmark .dash { color: ${T.cyan}; font-weight: 700; transform: translateY(-2px); font-size: 24px; }
    .wordmark .ign { color: ${T.ink}; font-weight: 800; }
    .meta {
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkDim};
      display: flex; gap: 24px; align-items: center;
    }
    .meta .num { color: ${T.cyanInk}; font-weight: 600; }
    .meta .dot { width: 4px; height: 4px; border-radius: 50%; background: ${T.cyan}; }

    .kicker {
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.24em;
      text-transform: uppercase; color: ${T.cyanInk};
      display: inline-flex; align-items: center; gap: 14px;
      margin-bottom: 28px;
    }
    .kicker::before {
      content: ""; width: 32px; height: 1px; background: ${T.cyan};
      display: inline-block;
    }

    h1 {
      font-size: 84px; font-weight: 800;
      letter-spacing: -0.038em; line-height: 1.0;
      color: ${T.ink}; max-width: 1380px;
    }
    h1 .accent { color: ${T.cyanInk}; }
    h2 {
      font-size: 44px; font-weight: 700;
      letter-spacing: -0.025em; line-height: 1.08;
      color: ${T.ink}; margin-bottom: 22px;
      max-width: 1380px;
    }
    h3 {
      font-size: 24px; font-weight: 700;
      letter-spacing: -0.012em; color: ${T.ink};
      margin-bottom: 10px;
    }
    .sub {
      font-size: 24px; color: ${T.inkDim}; line-height: 1.5;
      margin-top: 22px; max-width: 1180px; font-weight: 400;
    }
    .lede {
      font-size: 28px; color: ${T.ink}; line-height: 1.42;
      max-width: 1240px; font-weight: 400; margin-top: 20px;
    }
    p { font-size: 18px; color: ${T.ink}; line-height: 1.7; margin-bottom: 18px; }
    strong { font-weight: 700; }
    em { color: ${T.cyanInk}; font-style: normal; font-weight: 600; }
    code { font-family: ${MONO}; font-size: 0.92em; background: ${T.hairSoft}; color: ${T.ink}; padding: 1px 6px; border-radius: 4px; }

    /* Pill */
    .pill {
      display: inline-flex; align-items: center; gap: 12px;
      padding: 10px 20px; border: 1px solid ${T.cyan}; border-radius: 999px;
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.cyanInk};
      background: rgba(34, 211, 238, 0.06);
    }
    .pill .dot { width: 6px; height: 6px; border-radius: 50%; background: ${T.cyan}; }

    /* Hero treatments */
    .hero-vignette {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background:
        radial-gradient(ellipse 70% 55% at 70% 25%, rgba(34, 211, 238, 0.07) 0%, transparent 60%),
        linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.02) 100%);
      pointer-events: none;
    }
    .scanline {
      position: absolute; top: 50%; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent 0%, ${T.cyan} 40%, ${T.cyan} 60%, transparent 100%);
      opacity: 0.18; pointer-events: none;
    }

    /* Lists */
    ul.bullets { list-style: none; margin-top: 28px; }
    ul.bullets li {
      font-size: 20px; color: ${T.ink};
      padding: 16px 0 16px 40px;
      border-bottom: 0.6px solid ${T.hairSoft};
      position: relative; line-height: 1.5;
    }
    ul.bullets li:last-child { border-bottom: none; }
    ul.bullets li::before {
      content: ""; position: absolute; left: 0; top: 28px;
      width: 22px; height: 1px; background: ${T.cyan};
    }
    ul.bullets li strong { color: ${T.ink}; font-weight: 700; }
    ul.bullets li .em {
      color: ${T.cyanInk}; font-weight: 600;
      font-family: ${MONO}; font-size: 16px; letter-spacing: 0.04em;
    }

    /* Big-stat row */
    .stat-row { display: flex; gap: 64px; margin-top: 64px; }
    .stat-row .stat .num {
      font-size: 72px; font-weight: 800;
      letter-spacing: -0.035em; color: ${T.ink}; line-height: 1;
    }
    .stat-row .stat .num .acc { color: ${T.cyanInk}; }
    .stat-row .stat .lbl {
      font-size: 15px; color: ${T.inkDim};
      margin-top: 16px; max-width: 280px; line-height: 1.45;
    }

    /* Cards grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 56px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 28px; margin-top: 48px; }
    .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 24px; margin-top: 48px; }
    .card {
      padding: 32px 30px;
      border: 0.6px solid ${T.hair};
      border-radius: 18px;
      background: linear-gradient(180deg, #FCFDFE 0%, ${T.paper0} 100%);
    }
    .card .label {
      font-family: ${MONO}; font-size: 10px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkSoft}; margin-bottom: 12px;
    }
    .card .val {
      font-size: 40px; font-weight: 800;
      letter-spacing: -0.022em; color: ${T.ink}; line-height: 1.1;
    }
    .card .val .acc { color: ${T.cyanInk}; }
    .card .val .u { font-size: 18px; color: ${T.inkDim}; font-weight: 600; margin-left: 4px; }
    .card .desc { font-size: 14.5px; color: ${T.inkDim}; line-height: 1.55; margin-top: 12px; }

    /* Tables */
    table.matrix {
      width: 100%; border-collapse: collapse;
      margin-top: 40px; font-size: 16px;
    }
    table.matrix thead th {
      text-align: left; font-family: ${MONO};
      font-size: 10px; letter-spacing: 0.20em; text-transform: uppercase;
      color: ${T.inkSoft}; padding: 14px 20px;
      border-bottom: 0.6px solid ${T.hair}; font-weight: 600;
    }
    table.matrix tbody td {
      padding: 18px 20px;
      border-bottom: 0.6px solid ${T.hairSoft};
      color: ${T.ink}; vertical-align: middle; line-height: 1.5;
    }
    table.matrix tbody tr.us td { background: ${T.hairSoft}; }
    table.matrix tbody tr.us td strong { color: ${T.cyanInk}; }
    table.matrix .price { font-family: ${MONO}; font-weight: 600; color: ${T.ink}; }

    /* Footer */
    .footer {
      position: absolute; bottom: 44px; left: 112px; right: 112px;
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 22px; border-top: 0.6px solid ${T.hairSoft};
      font-family: ${MONO}; font-size: 10px; letter-spacing: 0.20em;
      text-transform: uppercase; color: ${T.inkSoft};
    }
    .footer .cohort { color: ${T.cyanInk}; font-weight: 600; }

    /* Two-column */
    .two-col {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 80px; margin-top: 56px;
    }
    .col h3 {
      font-size: 18px; color: ${T.cyanInk};
      font-family: ${MONO}; letter-spacing: 0.18em;
      text-transform: uppercase; margin-bottom: 22px;
    }
    .col p {
      font-size: 19px; color: ${T.ink};
      line-height: 1.6; margin-bottom: 14px;
    }

    /* Disclaim/callout */
    .disclaim {
      margin-top: 40px; padding: 22px 28px;
      border-left: 3px solid ${T.amber};
      background: rgba(251, 191, 36, 0.05);
      font-size: 15px; color: ${T.ink}; line-height: 1.55;
      max-width: 1180px;
      border-radius: 0 12px 12px 0;
    }
    .disclaim strong {
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.22em;
      text-transform: uppercase; color: ${T.cyanInk};
      display: block; margin-bottom: 6px;
    }

    /* HERO SLIDE (single dominant data) · landscape */
    .hero-slide {
      width: 1600px; height: 1000px;
      padding: 140px 112px;
      position: relative;
      page-break-after: always;
      background: ${T.bg};
      overflow: hidden;
      display: flex; flex-direction: column; justify-content: center;
    }
    .hero-slide .vignette {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse 55% 50% at 25% 30%, rgba(34, 211, 238, 0.10) 0%, transparent 65%);
      pointer-events: none;
    }
    .hero-slide .he {
      font-family: ${MONO}; font-size: 13px; letter-spacing: 0.28em;
      text-transform: uppercase; color: ${T.cyanInk};
      display: inline-flex; align-items: center; gap: 16px;
      margin-bottom: 40px;
    }
    .hero-slide .he::before { content: ""; width: 48px; height: 1px; background: ${T.cyan}; }
    .hero-slide .big-num {
      font-size: 360px; font-weight: 800;
      letter-spacing: -0.065em; line-height: 0.84;
      color: ${T.ink};
    }
    .hero-slide .big-num .acc { color: ${T.cyanInk}; }
    .hero-slide .big-num .u {
      font-size: 96px; color: ${T.inkDim}; font-weight: 700;
      margin-left: 16px;
    }
    .hero-slide .big-stmt {
      font-size: 108px; font-weight: 800;
      letter-spacing: -0.042em; line-height: 0.96;
      color: ${T.ink}; max-width: 1400px;
    }
    .hero-slide .big-stmt .acc { color: ${T.cyanInk}; }
    .hero-slide .big-sub {
      font-size: 26px; color: ${T.inkDim};
      line-height: 1.45; max-width: 1100px; margin-top: 48px;
    }
    .hero-slide .he-cite {
      position: absolute; bottom: 80px; left: 112px;
      font-family: ${MONO}; font-size: 11px; letter-spacing: 0.24em;
      text-transform: uppercase; color: ${T.inkSoft};
    }
  `;
}

/* ═══════════════════════════════════════════════════════════════
   Shared helpers · portrait
   ═══════════════════════════════════════════════════════════════ */

export function wordmarkHTML() {
  return `<span class="bio">BIO</span><span class="dash">—</span><span class="ign">IGNICIÓN</span>`;
}

export function pageHeader(docTitle, secInfo) {
  return `
    <div class="ph">
      <div class="wm">${wordmarkHTML()}</div>
      <div class="docTitle">${docTitle}${secInfo ? " · " + secInfo : ""}</div>
    </div>
  `;
}

export function pageFooter(docTitle, label, pn, total) {
  return `
    <div class="pf">
      <span>${docTitle}</span>
      <span>${label}</span>
      <span class="pn">${pn} / ${total}</span>
    </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════
   Hero/Statement page primitives
   ═══════════════════════════════════════════════════════════════ */

export function heroPagePortrait({ eyebrow, num, unit, statement, sub, cite }) {
  return `
    <section class="hero">
      <div class="vignette"></div>
      ${eyebrow ? `<div class="hero-eyebrow">${eyebrow}</div>` : ""}
      ${num ? `<div class="hero-num">${num}${unit ? `<span class="u">${unit}</span>` : ""}</div>` : ""}
      ${statement ? `<div class="hero-statement">${statement}</div>` : ""}
      ${sub ? `<p class="hero-sub">${sub}</p>` : ""}
      ${cite ? `<div class="hero-cite">${cite}</div>` : ""}
    </section>
  `;
}

export function heroSlideLandscape({ eyebrow, num, unit, statement, sub, cite }) {
  return `
    <section class="hero-slide">
      <div class="vignette"></div>
      ${eyebrow ? `<div class="he">${eyebrow}</div>` : ""}
      ${num ? `<div class="big-num">${num}${unit ? `<span class="u">${unit}</span>` : ""}</div>` : ""}
      ${statement ? `<div class="big-stmt">${statement}</div>` : ""}
      ${sub ? `<div class="big-sub">${sub}</div>` : ""}
      ${cite ? `<div class="he-cite">${cite}</div>` : ""}
    </section>
  `;
}

/* ═══════════════════════════════════════════════════════════════
   BioIcons set · 12 line-art icons (Linear style)
   24×24 viewBox · stroke-only · cyan #22D3EE
   ═══════════════════════════════════════════════════════════════ */

export const BioIcons = {
  // Slot icons
  morning: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="14" r="4"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="6" y1="8" x2="4" y2="6"/><line x1="18" y1="8" x2="20" y2="6"/><line x1="3" y1="14" x2="6" y2="14"/><line x1="18" y1="14" x2="21" y2="14"/></svg>`,
  evening: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18h18"/><circle cx="12" cy="14" r="4" stroke-dasharray="2 2"/><line x1="12" y1="2" x2="12" y2="4"/><line x1="18" y1="6" x2="20" y2="4"/></svg>`,
  adhoc: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l2.5 7L22 11l-7.5 2L12 22l-2.5-9L2 11l7.5-2z"/></svg>`,
  // Protocol icons
  breath: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 6c2-2 4-2 6 0" opacity="0.5"/><path d="M3 18c2-2 4-2 6 0" opacity="0.5"/></svg>`,
  motor: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><polyline points="9,8 5,12 9,16"/><polyline points="15,8 19,12 15,16"/></svg>`,
  cognitive: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/></svg>`,
  // Compliance icons
  nom035: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"/></svg>`,
  gdpr: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2" fill="${TOKENS.cyan}"/><circle cx="12" cy="5" r="0.8" fill="${TOKENS.cyan}"/><circle cx="12" cy="19" r="0.8" fill="${TOKENS.cyan}"/><circle cx="5" cy="12" r="0.8" fill="${TOKENS.cyan}"/><circle cx="19" cy="12" r="0.8" fill="${TOKENS.cyan}"/><circle cx="7" cy="7" r="0.6" fill="${TOKENS.cyan}"/><circle cx="17" cy="7" r="0.6" fill="${TOKENS.cyan}"/><circle cx="7" cy="17" r="0.6" fill="${TOKENS.cyan}"/><circle cx="17" cy="17" r="0.6" fill="${TOKENS.cyan}"/></svg>`,
  hipaa: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><path d="M3 12h18"/><circle cx="12" cy="12" r="9"/></svg>`,
  soc2: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l9 4v6c0 5-4 9-9 10-5-1-9-5-9-10V6l9-4z"/><polyline points="8,12 11,15 16,9"/></svg>`,
  // Misc
  check: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4,12 10,18 20,6"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="${TOKENS.cyan}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14,6 20,12 14,18"/></svg>`,
};

export function bioIconLarge(name, size = 56) {
  const svg = BioIcons[name];
  if (!svg) return "";
  return svg.replace(`width="24" height="24"`, `width="${size}" height="${size}"`).replace(`stroke-width="1.5"`, `stroke-width="${(24 / size) * 1.5 * 2}"`);
}
