"use client";
import { useCursorSpotlight } from "@/hooks/useCursorSpotlight";

/* SpotlightGrid — wrapper cliente que delega mousemove a descendientes con
   `.bi-spot` para la luz que sigue al cursor. Úsalo alrededor de cualquier
   grid de cards que quieras "encender" al pasar el mouse. */
export default function SpotlightGrid({ as: Tag = "div", className, children, ...rest }) {
  const ref = useCursorSpotlight(".bi-spot");
  return (
    <Tag ref={ref} className={className} {...rest}>
      {children}
    </Tag>
  );
}
