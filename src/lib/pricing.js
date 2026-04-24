/* ═══════════════════════════════════════════════════════════════
   Pricing — single source of truth.
   Consumed by /home (peek) and /pricing (full). Change once here.

   ─── Calibration · 2026-04-22 ──────────────────────────────────
   Market-anchored pricing based on published competitor data:

   · Calm Business / Headspace Teams (content library):   $5–10
   · Unmind (content + self-guided):                      $8–15
   · MODERN HEALTH (clinical therapy + coaching):         $30–60
   · Lyra Health (clinical therapy-heavy):                $100–300+
   · BetterUp (executive coaching):                       $300–500+

   BIO-IGNICIÓN sits between content library and clinical platform:
   measurable instrument + active compliance (NOM-035, SOC 2 in audit,
   HIPAA-ready) + Tap-to-Ignite hardware. We price at a defensible
   3-4× content libraries and at ~half clinical-human platforms.

   Monthly prices are sticker (for month-to-month flexibility). Annual
   billing knocks 20% off — that brings Starter to $15/mo-equivalent
   (the prior sticker) which keeps legacy quotes aligned.

   ROI anchor: @ $49/mo annual = $470/user/year. Per-user lift
   conservatively modeled at $540/year (productivity + absenteeism
   + turnover avoided). Break-even at 1 prevented burnout case per
   32 users (Deloitte MH 2022 range $15K-$45K per case).
   ═══════════════════════════════════════════════════════════════ */

export const DESIGN_PARTNER = {
  slotsTotal: 10,
  discountPct: 50,
  termMonths: 24,
  stationsIncluded: 5,
  minTeamSize: 20,
  maxTeamSize: 500,
};

// Annual savings applied by the ROI calc and cadence toggle — kept here
// so both pages render identical math without duplicating the constant.
export const ANNUAL_DISCOUNT_PCT = 20;

// Enterprise floor raised from $30K → $60K ARR. Under $60K the Growth
// tier with volume discount already covers 100+ seats — anything less
// than 100 seats doesn't need SAML/SCIM/BAA overhead.
export const ENTERPRISE_FLOOR_ARR_USD = 60000;

export const PRICE_PEEK = {
  es: [
    { name: "Starter",    price: "$19",    unit: "/usuario · mes",       featured: false },
    { name: "Growth",     price: "$49",    unit: "/usuario · mes",       featured: true  },
    { name: "Enterprise", price: "Custom", unit: "Desde $60K ARR",       featured: false },
  ],
  en: [
    { name: "Starter",    price: "$19",    unit: "/user · mo",   featured: false },
    { name: "Growth",     price: "$49",    unit: "/user · mo",   featured: true  },
    { name: "Enterprise", price: "Custom", unit: "From $60K ARR",featured: false },
  ],
};

// Annual equivalents (sticker × 0.8) — kept explicit so the /pricing
// cadence toggle and the ROI calculator don't recompute from strings.
export const PRICE_ANNUAL = {
  starter: { monthly: 19, annual: 15 }, // $228 → $180/user/year
  growth:  { monthly: 49, annual: 39 }, // $588 → $468/user/year (break-even ≈ 1 case per 32–96 users)
  // Enterprise: custom.
};

export const PARTNER_COPY = {
  es: {
    title: `Design Partners — ${DESIGN_PARTNER.slotsTotal} cupos`,
    body: `Buscamos ${DESIGN_PARTNER.slotsTotal} organizaciones (${DESIGN_PARTNER.minTeamSize}–${DESIGN_PARTNER.maxTeamSize} personas) para implementar BIO-IGNICIÓN antes del lanzamiento público. A cambio: ${DESIGN_PARTNER.discountPct}% off sobre la tarifa fundacional durante ${DESIGN_PARTNER.termMonths} meses, ${DESIGN_PARTNER.stationsIncluded} estaciones Tap-to-Ignite incluidas, roadmap compartido y Slack directo con el equipo que escribió este código.`,
    cta: "Aplicar como Design Partner",
    chip: `${DESIGN_PARTNER.discountPct}% off · ${DESIGN_PARTNER.termMonths} meses`,
  },
  en: {
    title: `Design Partners — ${DESIGN_PARTNER.slotsTotal} slots`,
    body: `We're taking ${DESIGN_PARTNER.slotsTotal} organizations (${DESIGN_PARTNER.minTeamSize}–${DESIGN_PARTNER.maxTeamSize} people) live with BIO-IGNICIÓN before public launch. In return: ${DESIGN_PARTNER.discountPct}% off founder-tier pricing for ${DESIGN_PARTNER.termMonths} months, ${DESIGN_PARTNER.stationsIncluded} Tap-to-Ignite stations included, shared roadmap and a direct Slack to the team that wrote this code.`,
    cta: "Apply as a Design Partner",
    chip: `${DESIGN_PARTNER.discountPct}% off · ${DESIGN_PARTNER.termMonths} months`,
  },
};
