import { cssVar, font, space } from "./ui/tokens";

/* TrustBadgesStrip — canonical enterprise compliance ribbon.
   Server-safe. Used on marketing heroes (home, pricing, trust, for-*) to
   expose the compliance surface at-a-glance. Each badge marks its own tone
   (ready / pending / informational) so we stay truthful. */

const BADGES = [
  { label: "SOC 2 Type II", status: "En auditoría", statusEn: "In audit",     tone: "pending" },
  { label: "ISO 27001",     status: "En proceso",   statusEn: "In progress",  tone: "pending" },
  { label: "GDPR",          status: "Alineado",     statusEn: "Aligned",      tone: "ready" },
  { label: "HIPAA",         status: "Alineado",     statusEn: "Aligned",      tone: "ready" },
  { label: "WCAG 2.2 AA",   status: "Alineado",     statusEn: "Aligned",      tone: "ready" },
  { label: "NOM-035",       status: "Cumple",       statusEn: "Compliant",    tone: "ready" },
];

export default function TrustBadgesStrip({
  locale = "es",
  kicker,
  showKicker = true,
  align = "center",
  compact = false,
  className,
}) {
  const en = locale === "en";
  const defaultKicker = en ? "Compliance surface" : "Superficie de cumplimiento";
  return (
    <div
      className={`bi-trust-block${compact ? " bi-trust-block--bare" : ""}${className ? " " + className : ""}`}
      style={{ textAlign: align, margin: compact ? 0 : `${space[6]}px auto` }}
      aria-label={kicker || defaultKicker}
    >
      {showKicker ? (
        <div
          className="bi-trust-kicker"
          style={{
            fontFamily: cssVar.fontMono,
            fontSize: font.size.xs,
            color: "#22D3EE",
            textTransform: "uppercase",
            letterSpacing: "0.24em",
            fontWeight: font.weight.bold,
            marginBlockEnd: space[3],
          }}
        >
          {kicker || defaultKicker}
        </div>
      ) : null}
      <div className="bi-trust-strip" role="list" style={{ justifyContent: align === "center" ? "center" : align }}>
        {BADGES.map((b) => (
          <span
            key={b.label}
            className="bi-trust-chip"
            role="listitem"
            data-tone={b.tone}
            title={`${b.label} · ${en ? b.statusEn : b.status}`}
          >
            <span className="dot" aria-hidden />
            <span className="trust-label">{b.label}</span>
            <span className="trust-status" aria-hidden>
              {en ? b.statusEn : b.status}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
