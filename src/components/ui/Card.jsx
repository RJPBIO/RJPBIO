import { cssVar, radius, space } from "./tokens";

/**
 * Tarjeta semántica tokenizada. `as` permite elegir el elemento
 * (article/section/li) para preservar semántica en listas.
 */
export function Card({
  as: Tag = "article",
  featured = false,
  padding = 5,
  className = "",
  style,
  children,
  ...rest
}) {
  return (
    <Tag
      className={`bi-card ${featured ? "bi-card-featured" : ""} ${className}`}
      style={{
        position: "relative",
        padding: space[padding],
        background: featured ? cssVar.surface2 : cssVar.surface,
        border: `1px solid ${featured ? cssVar.accent : cssVar.border}`,
        borderRadius: radius.lg,
        boxShadow: featured ? `0 18px 40px -20px ${cssVar.accent}80` : "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({ children, style }) {
  return <header style={{ marginBottom: space[3], ...style }}>{children}</header>;
}

export function CardBody({ children, style }) {
  return <div style={{ color: cssVar.textDim, lineHeight: 1.65, ...style }}>{children}</div>;
}
