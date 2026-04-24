/* ═══════════════════════════════════════════════════════════════
   ProductEvidence — Stripe-style code-snippet section adapted to
   our compliance artifacts. Three receipts the platform actually
   produces (NOM-035 export · GDPR-shaped data export · hash-chain
   audit log), each framed as a monospace inkwell block.

   Copy is passed in from the parent page so bilingual text lives
   in ES/EN blocks alongside the rest of /home copy. Sample values
   are placeholders ("Empresa Ejemplo") — honest artifacts, honest
   labels, no fake customer names.
   ═══════════════════════════════════════════════════════════════ */

import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import IgnitionReveal from "@/components/brand/IgnitionReveal";

export default function ProductEvidence({ T }) {
  const receipts = [
    {
      kicker: T.nomKicker,
      title: T.nomTitle,
      caption: T.nomCaption,
      lines: T.nomLines,
    },
    {
      kicker: T.exportKicker,
      title: T.exportTitle,
      caption: T.exportCaption,
      lines: T.exportLines,
    },
    {
      kicker: T.auditKicker,
      title: T.auditTitle,
      caption: T.auditCaption,
      lines: T.auditLines,
    },
  ];

  return (
    <IgnitionReveal sparkOrigin="50% 40%">
      <div className="bi-evidence-grid" role="list">
        {receipts.map((r) => (
          <article key={r.title} className="bi-evidence-card" role="listitem">
            <div className="bi-evidence-kicker">
              <span className="bi-evidence-dot" aria-hidden />
              {r.kicker}
            </div>
            <h3 className="bi-evidence-title">{r.title}</h3>
            {/* tabIndex=0 on <pre> so keyboard users can scroll the
                inkwell block when content overflows. axe/WCAG 2.1.1 +
                2.1.3 require scrollable regions to be focusable. */}
            <pre
              className="bi-evidence-code"
              role="region"
              aria-label={r.title}
              tabIndex={0}
              style={{ fontFamily: cssVar.fontMono, fontSize: 11.5, lineHeight: 1.55 }}
            >
              <code>
                {r.lines.map((line, i) => (
                  <span key={i} className={`bi-evidence-line${line.kind ? ` ${line.kind}` : ""}`}>
                    {line.text}
                    {i < r.lines.length - 1 ? "\n" : ""}
                  </span>
                ))}
              </code>
            </pre>
            <p className="bi-evidence-caption">{r.caption}</p>
          </article>
        ))}
      </div>
    </IgnitionReveal>
  );
}
