import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";

/* Editorial admin page header.
   - Eyebrow (uppercase mono, dim) optional
   - Serif italic accent + sans bold mix in h1
   - Subtitle in dim text
   - Actions slot right-aligned (responsive wrap)
   - Hairline separator below */
export function PageHeader({ eyebrow, title, italic, subtitle, actions, dense = false }) {
  return (
    <header className="bi-admin-page-header" style={{
      display: "grid",
      gap: space[2],
      paddingBlockEnd: dense ? space[4] : space[5],
      borderBlockEnd: `1px solid ${cssVar.border}`,
      marginBlockEnd: dense ? space[4] : space[5],
    }}>
      <div style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: space[3],
      }}>
        <div style={{ minWidth: 0, flex: "1 1 320px" }}>
          {eyebrow && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: font.size.xs,
              fontFamily: cssVar.fontMono,
              textTransform: "uppercase",
              letterSpacing: font.tracking.wider,
              color: bioSignal.phosphorCyanInk,
              fontWeight: font.weight.bold,
              marginBlockEnd: space[2],
            }}>
              <span aria-hidden style={{
                width: 6, height: 6, borderRadius: "50%",
                background: bioSignal.phosphorCyan,
                boxShadow: `0 0 8px ${bioSignal.phosphorCyan}`,
              }} />
              {eyebrow}
            </div>
          )}
          <h1 style={{
            fontSize: dense ? font.size["2xl"] : font.size["3xl"],
            fontWeight: font.weight.black,
            letterSpacing: font.tracking.tight,
            lineHeight: 1.05,
            margin: 0,
            color: cssVar.text,
          }}>
            {italic && (
              <span className="bi-admin-h1-italic" style={{ marginInlineEnd: ".25em" }}>
                {italic}
              </span>
            )}
            {title}
          </h1>
          {subtitle && (
            <p style={{
              fontSize: font.size.base,
              color: cssVar.textMuted,
              marginBlock: `${space[2]}px 0`,
              maxWidth: "60ch",
              lineHeight: 1.55,
            }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: "flex", gap: space[2], alignItems: "center", flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
