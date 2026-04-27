/* Outline icon set for admin nav — 18px stroke, currentColor.
   Stroke 1.5 for elite density (Linear/Stripe convention).
   Each icon receives standard SVG props (size, strokeWidth) via render. */
const I = (path, props = {}) => (
  <svg
    width={props.size || 18}
    height={props.size || 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={props.strokeWidth || 1.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ flexShrink: 0 }}
  >
    {path}
  </svg>
);

export const HomeIcon = (p) => I(
  <><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 001 1h12a1 1 0 001-1V9.5" /><path d="M10 21v-6h4v6" /></>, p);

export const SparkIcon = (p) => I(
  <><path d="M12 3v3M12 18v3M21 12h-3M6 12H3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" /><circle cx="12" cy="12" r="3" /></>, p);

export const PeopleIcon = (p) => I(
  <><circle cx="9" cy="8" r="3.5" /><path d="M3 21v-1a6 6 0 0112 0v1" /><circle cx="17" cy="8" r="2.5" /><path d="M21 21v-.5a4 4 0 00-3-3.86" /></>, p);

export const TeamsIcon = (p) => I(
  <><rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" /><rect x="3" y="13" width="7" height="7" rx="1.5" /><rect x="14" y="13" width="7" height="7" rx="1.5" /></>, p);

export const ShieldIcon = (p) => I(
  <><path d="M12 3l8 3v6c0 4.97-3.4 8.5-8 9-4.6-.5-8-4.03-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></>, p);

export const KeyIcon = (p) => I(
  <><circle cx="8" cy="14" r="4" /><path d="M11 11l9-9M17 5l3 3M14 8l3 3" /></>, p);

export const SsoIcon = (p) => I(
  <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></>, p);

export const ScrollIcon = (p) => I(
  <><path d="M5 4h11l3 3v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4z" /><path d="M16 4v3h3M9 12h6M9 16h6M9 8h3" /></>, p);

export const CogIcon = (p) => I(
  <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.04 1.56V21a2 2 0 11-4 0v-.09a1.7 1.7 0 00-1.04-1.56 1.7 1.7 0 00-1.87.34l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.7 1.7 0 005 15a1.7 1.7 0 00-1.56-1.04H3a2 2 0 110-4h.09A1.7 1.7 0 005 9a1.7 1.7 0 00-.34-1.87l-.06-.06a2 2 0 112.83-2.83l.06.06A1.7 1.7 0 009 5a1.7 1.7 0 001.04-1.56V3a2 2 0 114 0v.09c0 .67.41 1.27 1.04 1.56a1.7 1.7 0 001.87-.34l.06-.06a2 2 0 112.83 2.83l-.06.06A1.7 1.7 0 0019 9c.29.62.89 1.04 1.56 1.04H21a2 2 0 110 4h-.09c-.67 0-1.27.41-1.51 1z" /></>, p);

export const PluginIcon = (p) => I(
  <><path d="M9 4v3M15 4v3M4 9h3M4 15h3M21 9h-3M21 15h-3M9 21v-3M15 21v-3" /><rect x="7" y="7" width="10" height="10" rx="2" /></>, p);

export const PaintIcon = (p) => I(
  <><path d="M12 19l7-7-3-3-7 7v3h3z" /><path d="M14 6l4 4M5 21l4-4" /></>, p);

export const WebhookIcon = (p) => I(
  <><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="18" r="2.5" /><circle cx="12" cy="6" r="2.5" /><path d="M9 11l-3 5M15 11l3 5M9 18h6" /></>, p);

export const StationIcon = (p) => I(
  <><rect x="4" y="4" width="16" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>, p);

export const ComplianceIcon = (p) => I(
  <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>, p);

export const DsarIcon = (p) => I(
  <><circle cx="9" cy="9" r="3" /><path d="M3 21v-1a4 4 0 014-4h4a4 4 0 014 4v1" /><path d="M16 11l3 3 4-4" /></>, p);

export const Nom35Icon = (p) => I(
  <><path d="M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12z" /><path d="M9 12l2 2 4-4" /></>, p);

export const ReceiptIcon = (p) => I(
  <><path d="M5 3h14v18l-2-2-2 2-2-2-2 2-2-2-2 2-2-2V3z" /><path d="M9 8h6M9 12h6M9 16h3" /></>, p);

export const PulseIcon = (p) => I(
  <><path d="M3 12h4l2-7 4 14 2-7h6" /></>, p);

export const SirenIcon = (p) => I(
  <><path d="M5 18a7 7 0 0114 0v2H5v-2z" /><path d="M12 5V3M3.5 9.5l-1-1M21.5 9.5l-1-1" /></>, p);

export const ConeIcon = (p) => I(
  <><path d="M5 19l3-14h8l3 14" /><path d="M5 19h14" /><path d="M8 11h8M9 7h6" /></>, p);
