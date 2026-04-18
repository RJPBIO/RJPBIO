/* ═══════════════════════════════════════════════════════════════
   Deprecation headers (RFC 8594 + IETF draft-ietf-httpapi-deprecation-header).
   ───────────────────────────────────────────────────────────────
   Uso:
     import { withDeprecation } from "@/server/deprecation";
     return withDeprecation(response, {
       deprecatedOn: "2026-04-01",
       sunsetOn: "2026-10-01",
       successor: "/api/v2/sessions",
       docs: "https://bio-ignicion.app/changelog#v2",
     });

   Garantía: mínimo 6 meses entre deprecatedOn y sunsetOn.
   ═══════════════════════════════════════════════════════════════ */

function toHttpDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) throw new Error("invalid date");
  return dt.toUTCString();
}

export function withDeprecation(response, { deprecatedOn, sunsetOn, successor, docs } = {}) {
  if (!response || !response.headers) return response;
  if (deprecatedOn) response.headers.set("Deprecation", toHttpDate(deprecatedOn));
  if (sunsetOn) response.headers.set("Sunset", toHttpDate(sunsetOn));
  const links = [];
  if (successor) links.push(`<${successor}>; rel="successor-version"`);
  if (docs) links.push(`<${docs}>; rel="deprecation"; type="text/html"`);
  if (links.length) {
    const prev = response.headers.get("Link");
    response.headers.set("Link", prev ? `${prev}, ${links.join(", ")}` : links.join(", "));
  }
  return response;
}

/**
 * Devuelve una fecha de sunset a N meses del "ahora" — útil para helpers
 * programáticos al deprecar rutas. Validador mínimo de seis meses.
 */
export function sunsetAfter(months = 6, from = new Date()) {
  if (months < 6) throw new Error("Deprecation policy requires ≥6 months of notice");
  const d = new Date(from);
  d.setMonth(d.getMonth() + months);
  return d;
}
