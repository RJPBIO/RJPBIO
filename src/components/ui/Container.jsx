import { space } from "./tokens";

/**
 * Contenedor responsive con max-width por breakpoint. Aplica el padding
 * horizontal estándar (20/32/48 según ancho — ver layout.js).
 */
export function Container({ size = "md", children, style, className = "" }) {
  const max = { sm: 640, md: 880, lg: 1120, xl: 1280, full: "100%" }[size] || size;
  return (
    <div
      className={`bi-container ${className}`}
      style={{
        maxWidth: max,
        marginInline: "auto",
        paddingInline: `clamp(${space[4]}px, 4vw, ${space[12]}px)`,
        paddingBlock: `clamp(${space[8]}px, 6vw, ${space[16]}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
