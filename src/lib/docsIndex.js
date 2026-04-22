/* Static docs index — mirrors src/app/docs/page.jsx section metadata.
   Drives in-palette docs search (title + keywords → /docs#anchor). */
export const DOCS_INDEX = [
  {
    id: "auth",
    es: { title: "Autenticación", summary: "API keys, sesiones, SCIM, CSRF" },
    en: { title: "Authentication", summary: "API keys, sessions, SCIM, CSRF" },
    keywords: "bearer api key token sha-256 oauth sso csrf scim",
  },
  {
    id: "webhooks",
    es: { title: "Webhooks", summary: "HMAC-SHA256, Standard Webhooks, reintentos" },
    en: { title: "Webhooks", summary: "HMAC-SHA256, Standard Webhooks, retries" },
    keywords: "hmac signature timestamp retry replay delivery",
  },
  {
    id: "rate-limits",
    es: { title: "Rate limits", summary: "Headers RFC 9331, 429, ventanas" },
    en: { title: "Rate limits", summary: "RFC 9331 headers, 429, windows" },
    keywords: "ratelimit 429 quota throttle retry-after",
  },
  {
    id: "idempotency",
    es: { title: "Idempotencia", summary: "Header Idempotency-Key, ventana 24h" },
    en: { title: "Idempotency", summary: "Idempotency-Key header, 24h window" },
    keywords: "idempotency-key post retry duplicate",
  },
  {
    id: "errors",
    es: { title: "Errores", summary: "Códigos, envelope JSON, HTTP status" },
    en: { title: "Errors", summary: "Error codes, JSON envelope, HTTP status" },
    keywords: "error status problem+json code message trace",
  },
  {
    id: "versioning",
    es: { title: "Versionado y deprecación", summary: "v1, RFC 8594, Sunset" },
    en: { title: "Versioning & deprecation", summary: "v1, RFC 8594, Sunset" },
    keywords: "version deprecate sunset rfc 8594 major",
  },
  {
    id: "spec",
    es: { title: "Especificación OpenAPI", summary: "OpenAPI 3.1 JSON" },
    en: { title: "OpenAPI specification", summary: "OpenAPI 3.1 JSON" },
    keywords: "openapi swagger schema contract",
  },
  {
    id: "roi-model",
    es: { title: "Modelo ROI", summary: "Fórmula y supuestos" },
    en: { title: "ROI model", summary: "Formula and assumptions" },
    keywords: "roi calculator formula assumptions",
  },
];

export function docsSearchItems(locale) {
  const lang = locale === "en" ? "en" : "es";
  return DOCS_INDEX.map((d) => ({
    id: `docs-${d.id}`,
    group: lang === "en" ? "Docs" : "Docs",
    icon: "§",
    label: d[lang].title,
    sublabel: d[lang].summary,
    href: `/docs#${d.id}`,
    keywords: `docs documentation documentacion ${d.id} ${d.keywords} ${d[lang].summary}`,
  }));
}
