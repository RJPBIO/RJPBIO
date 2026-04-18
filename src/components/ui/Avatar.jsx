import { cssVar, radius, font } from "./tokens";

/**
 * Avatar — imagen o iniciales tokenizado. Si no hay `src` (o falla la carga),
 * genera iniciales del `name` con gradiente bio-signal determinista.
 */
export function Avatar({ src, name = "?", size = 36, title }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("") || "?";

  const hash = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0);
  const palettes = [
    "linear-gradient(135deg, #10B981, #22D3EE)",
    "linear-gradient(135deg, #6366F1, #F472B6)",
    "linear-gradient(135deg, #F472B6, #FDE68A)",
    "linear-gradient(135deg, #8B5CF6, #22D3EE)",
    "linear-gradient(135deg, #059669, #FDE68A)",
  ];
  const bg = palettes[Math.abs(hash) % palettes.length];

  const common = {
    width: size, height: size,
    borderRadius: radius.full,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    fontSize: Math.max(11, Math.round(size * 0.4)),
    fontWeight: font.weight.bold,
    color: "#FFF",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: bg,
    overflow: "hidden",
    flexShrink: 0,
    boxShadow: `0 0 0 1px ${cssVar.border}`,
  };

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} title={title || name} width={size} height={size} style={{ ...common, objectFit: "cover" }} />
    );
  }
  return <span aria-label={name} title={title || name} style={common}>{initials}</span>;
}
