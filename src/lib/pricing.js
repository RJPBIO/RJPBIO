/* ═══════════════════════════════════════════════════════════════
   Pricing — single source of truth.
   Consumed by /home (peek) and /pricing (full). Change once here.
   ═══════════════════════════════════════════════════════════════ */

export const DESIGN_PARTNER = {
  slotsTotal: 10,
  discountPct: 50,
  termMonths: 24,
  stationsIncluded: 5,
  minTeamSize: 20,
  maxTeamSize: 500,
};

export const PRICE_PEEK = {
  es: [
    { name: "Starter",    price: "$15",    unit: "/usuario · mes",    featured: false },
    { name: "Growth",     price: "$39",    unit: "/usuario · mes",    featured: true  },
    { name: "Enterprise", price: "Custom", unit: "Desde $30K ARR",    featured: false },
  ],
  en: [
    { name: "Starter",    price: "$15",    unit: "/user · mo",   featured: false },
    { name: "Growth",     price: "$39",    unit: "/user · mo",   featured: true  },
    { name: "Enterprise", price: "Custom", unit: "From $30K ARR",featured: false },
  ],
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
