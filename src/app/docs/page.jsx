/* ═══════════════════════════════════════════════════════════════
   /docs — API pública v1. Referencia para integradores B2B.

   Todo lo afirmado aquí debe existir en el código:
   · auth Bearer (lib/rateLimit + middleware)
   · webhooks firmados (Standard Webhooks v1 en lib/webhooks)
   · rate-limits RFC 9331, deprecation RFC 8594
   · spec servido en /api/openapi (OpenAPI 3.1)
   Sin promesas de latencia ni SLO que no podamos respaldar.
   ═══════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { PublicShell } from "@/components/ui/PublicShell";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import CodeTabs from "@/components/ui/CodeTabs";
import { cssVar, space, font, bioSignal } from "@/components/ui/tokens";
import { getServerLocale } from "@/lib/locale-server";
import IgnitionReveal from "@/components/brand/IgnitionReveal";
import BioglyphLattice from "@/components/brand/BioglyphLattice";
import PulseDivider from "@/components/brand/PulseDivider";

const API_GA_DATE = "2025-11-01";
const DOCS_LAST_REVIEWED = "2026-04-20";

const QUICKSTART_SNIPPETS = {
  es: [
    {
      id: "curl",
      label: "curl",
      code: `# Whoami — verifica que la key esté viva
curl https://bio-ignicion.app/api/v1/users/me \\
     -H "Authorization: Bearer bi_xxx"

# Crea una sesión idempotente
curl -X POST https://bio-ignicion.app/api/v1/sessions \\
     -H "Authorization: Bearer bi_xxx" \\
     -H "Idempotency-Key: $(uuidgen)" \\
     -H "Content-Type: application/json" \\
     -d '{"protocol":"resonant-breath-5m"}'`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const BASE = "https://bio-ignicion.app/api/v1";
const KEY  = process.env.BI_API_KEY!;          // bi_xxx

// Whoami — verifica que la key esté viva
const me = await fetch(\`\${BASE}/users/me\`, {
  headers: { Authorization: \`Bearer \${KEY}\` },
}).then((r) => r.json());

// Crea una sesión idempotente
const session = await fetch(\`\${BASE}/sessions\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${KEY}\`,
    "Idempotency-Key": crypto.randomUUID(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ protocol: "resonant-breath-5m" }),
}).then((r) => r.json());`,
    },
    {
      id: "py",
      label: "Python",
      code: `import os, uuid, requests

BASE = "https://bio-ignicion.app/api/v1"
KEY  = os.environ["BI_API_KEY"]               # bi_xxx
headers = {"Authorization": f"Bearer {KEY}"}

# Whoami — verifica que la key esté viva
me = requests.get(f"{BASE}/users/me", headers=headers).json()

# Crea una sesión idempotente
session = requests.post(
    f"{BASE}/sessions",
    headers={**headers, "Idempotency-Key": str(uuid.uuid4())},
    json={"protocol": "resonant-breath-5m"},
).json()`,
    },
  ],
  en: [
    {
      id: "curl",
      label: "curl",
      code: `# Whoami — verifies the key is live
curl https://bio-ignicion.app/api/v1/users/me \\
     -H "Authorization: Bearer bi_xxx"

# Create an idempotent session
curl -X POST https://bio-ignicion.app/api/v1/sessions \\
     -H "Authorization: Bearer bi_xxx" \\
     -H "Idempotency-Key: $(uuidgen)" \\
     -H "Content-Type: application/json" \\
     -d '{"protocol":"resonant-breath-5m"}'`,
    },
    {
      id: "ts",
      label: "TypeScript",
      code: `const BASE = "https://bio-ignicion.app/api/v1";
const KEY  = process.env.BI_API_KEY!;          // bi_xxx

// Whoami — verifies the key is live
const me = await fetch(\`\${BASE}/users/me\`, {
  headers: { Authorization: \`Bearer \${KEY}\` },
}).then((r) => r.json());

// Create an idempotent session
const session = await fetch(\`\${BASE}/sessions\`, {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${KEY}\`,
    "Idempotency-Key": crypto.randomUUID(),
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ protocol: "resonant-breath-5m" }),
}).then((r) => r.json());`,
    },
    {
      id: "py",
      label: "Python",
      code: `import os, uuid, requests

BASE = "https://bio-ignicion.app/api/v1"
KEY  = os.environ["BI_API_KEY"]               # bi_xxx
headers = {"Authorization": f"Bearer {KEY}"}

# Whoami — verifies the key is live
me = requests.get(f"{BASE}/users/me", headers=headers).json()

# Create an idempotent session
session = requests.post(
    f"{BASE}/sessions",
    headers={**headers, "Idempotency-Key": str(uuid.uuid4())},
    json={"protocol": "resonant-breath-5m"},
).json()`,
    },
  ],
};

export const metadata = {
  title: "API Docs",
  description:
    "Referencia pública de la API v1 — OpenAPI 3.1, Standard Webhooks, rate-limits RFC 9331, idempotencia y deprecación transparente.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "BIO-IGNICIÓN · API Docs",
    description: "API v1 · OpenAPI 3.1 · Standard Webhooks · RFC 9331",
    images: [{ url: "/screenshots/ignicion-wide.svg", width: 1280, height: 720 }],
  },
};

const kickerStyle = {
  fontFamily: cssVar.fontMono,
  fontSize: font.size.xs,
  color: bioSignal.phosphorCyan,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: font.weight.bold,
  marginBlockEnd: space[3],
};

const COPY = {
  es: {
    eyebrow: "API · V1 · GA",
    title: "Integra el pulso.",
    editorial: "OpenAPI 3.1. Standard Webhooks. RFC 9331.",
    intro:
      "Todo lo documentado aquí existe en producción hoy. La misma especificación que servimos en /api/openapi alimenta Scalar, Postman, clientes generados con openapi-typescript y este sitio. Sin claims que no podamos sostener.",

    statSpec: "OpenAPI 3.1",
    statSpecSub: "spec completo versionado",
    statWebhooks: "Standard Webhooks",
    statWebhooksSub: "HMAC-SHA256 · prefijo v1,",
    statRate: "RFC 9331",
    statRateSub: "headers RateLimit-* estándar",
    statScim: "SCIM 2.0",
    statScimSub: "provisioning de usuarios",

    quickstartKicker: "QUICKSTART · 60 S",
    quickstartH: "De cero a sesión en dos llamadas.",
    quickstartBaseUrl: (
      <>Base URL: <code>https://bio-ignicion.app/api/v1</code> · genera una key en <a href="/admin/api-keys">Admin · API Keys</a>.</>
    ),
    quickstartFoot:
      "Referencia completa abajo — auth, webhooks, rate-limits, idempotencia, errores, versionado, OpenAPI y modelo ROI.",
    copyLabel: "Copiar",
    copiedLabel: "Copiado al portapapeles",
    copyErrorLabel: "No se pudo copiar",

    groupCore: "CONCEPTOS",
    groupCoreCount: (n) => `${n} secciones`,
    groupResources: "RECURSOS",
    groupResourcesCount: (n) => `${n} anexos`,
    toc: "Índice",
    tocCore: "Conceptos",
    tocResources: "Recursos",
    openSpec: "openapi.json ↓",

    versioningLabelGA: "v1 · GA",
    versioningLabelDeprecation: "Deprecation",
    versioningLabelSunset: "Sunset",
    versioningGap: "≥ 6 meses",

    errorsClient: "Cliente",
    errorsServer: "Servidor",

    closingKicker: "SIGUIENTE PASO",
    closingHLead: "Leíste la referencia.",
    closingHBody: "Ahora prueba contra una key real.",
    closingBody:
      "Genera una key en minutos, ejecuta el quickstart contra tu propio entorno, y escribe webhooks firmados antes del café.",
    closingPrimary: "Generar API key",
    closingSecondary: "Descargar openapi.json",
    closingTertiary: "Arquitectura y DPA",

    footerReviewed: "Referencia revisada por última vez",
    footerSdk: "¿Necesitas un SDK?",
    footerSdkNote: "developers@bio-ignicion.app — respondemos en días hábiles.",
  },
  en: {
    eyebrow: "API · V1 · GA",
    title: "Integrate the pulse.",
    editorial: "OpenAPI 3.1. Standard Webhooks. RFC 9331.",
    intro:
      "Everything documented here exists in production today. The same spec served at /api/openapi powers Scalar, Postman, openapi-typescript clients and this page. No claims we can't back.",

    statSpec: "OpenAPI 3.1",
    statSpecSub: "full versioned spec",
    statWebhooks: "Standard Webhooks",
    statWebhooksSub: "HMAC-SHA256 · v1, prefix",
    statRate: "RFC 9331",
    statRateSub: "standard RateLimit-* headers",
    statScim: "SCIM 2.0",
    statScimSub: "user provisioning",

    quickstartKicker: "QUICKSTART · 60 S",
    quickstartH: "Zero to first session in two calls.",
    quickstartBaseUrl: (
      <>Base URL: <code>https://bio-ignicion.app/api/v1</code> · mint a key in <a href="/admin/api-keys">Admin · API Keys</a>.</>
    ),
    quickstartFoot:
      "Full reference below — auth, webhooks, rate-limits, idempotency, errors, versioning, OpenAPI and ROI model.",
    copyLabel: "Copy",
    copiedLabel: "Copied to clipboard",
    copyErrorLabel: "Could not copy",

    groupCore: "CONCEPTS",
    groupCoreCount: (n) => `${n} sections`,
    groupResources: "RESOURCES",
    groupResourcesCount: (n) => `${n} annexes`,
    toc: "Index",
    tocCore: "Concepts",
    tocResources: "Resources",
    openSpec: "openapi.json ↓",

    versioningLabelGA: "v1 · GA",
    versioningLabelDeprecation: "Deprecation",
    versioningLabelSunset: "Sunset",
    versioningGap: "≥ 6 months",

    errorsClient: "Client",
    errorsServer: "Server",

    closingKicker: "NEXT STEP",
    closingHLead: "You've read the reference.",
    closingHBody: "Now run it against a real key.",
    closingBody:
      "Mint a key in minutes, run the quickstart against your own environment, and ship signed webhooks before coffee.",
    closingPrimary: "Generate API key",
    closingSecondary: "Download openapi.json",
    closingTertiary: "Architecture & DPA",

    footerReviewed: "Reference last reviewed",
    footerSdk: "Need an SDK?",
    footerSdkNote: "developers@bio-ignicion.app — we reply within business days.",
  },
};

function sectionsFor(locale) {
  const en = locale === "en";
  return [
    {
      id: "auth",
      group: "core",
      title: en ? "Authentication" : "Autenticación",
      kicker: "BEARER · SHA-256 HASHED",
      body: (
        <>
          <p>
            {en ? <>
              Every server-to-server call uses an <code>API Key</code> prefixed with <code>bi_</code>.
              It's issued from Admin · API Keys and sent in the header{" "}
              <code>Authorization: Bearer bi_&lt;key&gt;</code>. Keys are hashed with SHA-256 before
              storage — we never store or can recover plaintext.
            </> : <>
              Toda llamada server-to-server usa un <code>API Key</code> con prefijo <code>bi_</code>.
              Se emite desde Admin · API Keys y se envía en el header{" "}
              <code>Authorization: Bearer bi_&lt;key&gt;</code>. Las claves se hashean con SHA-256 antes
              de guardarse — nunca las tenemos ni podemos recuperar en claro.
            </>}
          </p>
          <p>{en
            ? "Browser-to-server requests use a session cookie (NextAuth) plus CSRF double-submit. SCIM 2.0 endpoints sit under /api/scim/v2 with the same Bearer scheme."
            : "Los requests navegador→servidor usan cookie de sesión (NextAuth) más CSRF double-submit. Los endpoints SCIM 2.0 viven en /api/scim/v2 con el mismo esquema Bearer."}</p>
        </>
      ),
    },
    {
      id: "webhooks",
      group: "core",
      title: "Webhooks",
      kicker: "STANDARD WEBHOOKS · HMAC-SHA256",
      body: (
        <>
          <p>
            {en ? <>
              We implement the{" "}
              <a href="https://standardwebhooks.com" target="_blank" rel="noopener noreferrer">Standard Webhooks</a> spec.
              Every delivery includes <code>webhook-id</code>, <code>webhook-timestamp</code> and{" "}
              <code>webhook-signature</code> (HMAC-SHA256 in base64, prefix <code>v1,</code>).
            </> : <>
              Implementamos el estándar{" "}
              <a href="https://standardwebhooks.com" target="_blank" rel="noopener noreferrer">Standard Webhooks</a>.
              Cada entrega incluye <code>webhook-id</code>, <code>webhook-timestamp</code> y{" "}
              <code>webhook-signature</code> (HMAC-SHA256 en base64, prefijo <code>v1,</code>).
            </>}
          </p>
          <pre>{`signed = \`\${id}.\${timestamp}.\${body}\`
signature = "v1," + base64(hmac_sha256(secret, signed))`}</pre>
          <p>{en
            ? "Retries use exponential backoff up to 5 attempts. Reject any timestamp outside ±5 min to prevent replay. Delivery logs live under /admin · Webhooks."
            : "Los reintentos usan backoff exponencial hasta 5 veces. Rechaza cualquier timestamp fuera de ±5 min para evitar replay. Los logs de entrega viven en /admin · Webhooks."}</p>
        </>
      ),
    },
    {
      id: "rate-limits",
      group: "core",
      title: en ? "Rate limits" : "Rate limits",
      kicker: "RFC 9331 · RATELIMIT-*",
      body: (
        <p>
          {en ? <>
            Default: <b>120 req/min</b> per IP, <b>10 req/min</b> on authentication endpoints. Quotas
            are returned in the headers <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>{" "}
            and <code>RateLimit-Reset</code>. A <code>429</code> response includes{" "}
            <code>Retry-After</code> in seconds. No burst credit on auth.
          </> : <>
            Por defecto: <b>120 req/min</b> por IP, <b>10 req/min</b> en endpoints de autenticación.
            Los cupos vienen en los headers <code>RateLimit-Limit</code>, <code>RateLimit-Remaining</code>{" "}
            y <code>RateLimit-Reset</code>. Un <code>429</code> incluye{" "}
            <code>Retry-After</code> en segundos. No hay crédito de burst en auth.
          </>}
        </p>
      ),
    },
    {
      id: "idempotency",
      group: "core",
      title: en ? "Idempotency" : "Idempotencia",
      kicker: en ? "POST · 24H WINDOW" : "POST · VENTANA 24H",
      body: (
        <p>
          {en ? <>
            <code>POST</code> requests that create resources accept an <code>Idempotency-Key</code> header.
            Retries with the same key within 24 h return the original response body and status code. Use
            a fresh UUIDv4 per business operation, not per retry.
          </> : <>
            Los <code>POST</code> que crean recursos aceptan el header <code>Idempotency-Key</code>.
            Los reintentos con la misma key dentro de 24 h devuelven el mismo cuerpo y status original.
            Usa un UUIDv4 nuevo por operación de negocio, no por reintento.
          </>}
        </p>
      ),
    },
    {
      id: "errors",
      group: "core",
      title: en ? "Errors" : "Errores",
      kicker: "JSON ENVELOPE · HTTP STATUS",
      body: (
        <>
          <p>
            {en
              ? "All 4xx/5xx responses share the same JSON envelope. The error field is a short machine-readable key; HTTP status carries the category."
              : "Todas las respuestas 4xx/5xx comparten el mismo envelope JSON. El campo error es una clave corta legible para máquina; el status HTTP indica la categoría."}
          </p>
          <pre>{`{ "error": "invalid_idempotency_key" }`}</pre>
          <dl className="bi-docs-errors" aria-label={en ? "HTTP status codes" : "Códigos HTTP"}>
            <dt data-sev="client" aria-label={en ? "Client · 400" : "Cliente · 400"}>400</dt>
            <dd>{en ? "Malformed request — JSON invalid or required field missing." : "Request malformado — JSON inválido o falta un campo requerido."}</dd>
            <dt data-sev="client">401</dt>
            <dd>{en ? "Missing, revoked or expired API key." : "API key ausente, revocada o expirada."}</dd>
            <dt data-sev="client">403</dt>
            <dd>{en ? "Key is valid but the caller lacks permission for this resource." : "La key es válida pero el llamador no tiene permiso sobre este recurso."}</dd>
            <dt data-sev="client">404</dt>
            <dd>{en ? "Resource does not exist, or is scoped to a different team." : "El recurso no existe, o pertenece a otro team."}</dd>
            <dt data-sev="client">409</dt>
            <dd>{en ? "Idempotency conflict — same key reused with a different body." : "Conflicto de idempotencia — misma key reusada con un body distinto."}</dd>
            <dt data-sev="client">422</dt>
            <dd>{en ? "Validation failed — see error key for the specific rule." : "Validación falló — revisa el campo error para la regla concreta."}</dd>
            <dt data-sev="client">429</dt>
            <dd>{en ? "Rate limit exceeded — back off per Retry-After." : "Rate limit excedido — haz back-off según Retry-After."}</dd>
            <dt data-sev="server">5xx</dt>
            <dd>{en ? "Server fault. Retries are safe on idempotent requests." : "Falla del servidor. Reintentar es seguro en requests idempotentes."}</dd>
          </dl>
          <div className="bi-docs-errors-legend" aria-hidden>
            <span><span className="bi-docs-sev bi-docs-sev--client" /> {en ? "Client (4xx)" : "Cliente (4xx)"}</span>
            <span><span className="bi-docs-sev bi-docs-sev--server" /> {en ? "Server (5xx)" : "Servidor (5xx)"}</span>
          </div>
        </>
      ),
    },
    {
      id: "versioning",
      group: "core",
      title: en ? "Versioning & deprecation" : "Versionado y deprecación",
      kicker: "MAJOR v1 · RFC 8594",
      body: (
        <>
          <p>
            {en ? <>
              The current major is <code>v1</code>, GA since <b>{API_GA_DATE}</b>. Breaking changes land
              only in a new major. We do not silently break response shapes.
            </> : <>
              La mayor actual es <code>v1</code>, GA desde <b>{API_GA_DATE}</b>. Los breaking changes
              entran solo en una nueva mayor. No rompemos formas de respuesta en silencio.
            </>}
          </p>
          <div className="bi-docs-timeline" role="img" aria-label={
            en ? "Version lifecycle: GA, deprecation, sunset"
               : "Ciclo de vida: GA, deprecación, sunset"
          }>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--live">
              <span className="bi-docs-timeline-dot" aria-hidden />
              <span className="bi-docs-timeline-label">v1 · GA</span>
              <span className="bi-docs-timeline-meta">{API_GA_DATE}</span>
            </div>
            <div className="bi-docs-timeline-gap" aria-hidden>
              <span className="bi-docs-timeline-gap-line" />
            </div>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--future">
              <span className="bi-docs-timeline-dot" aria-hidden />
              <span className="bi-docs-timeline-label">Deprecation</span>
              <span className="bi-docs-timeline-meta">{en ? "header emitted" : "header emitido"}</span>
            </div>
            <div className="bi-docs-timeline-gap" aria-hidden>
              <span className="bi-docs-timeline-gap-line" />
              <span className="bi-docs-timeline-gap-label">{en ? "≥ 6 months" : "≥ 6 meses"}</span>
            </div>
            <div className="bi-docs-timeline-step bi-docs-timeline-step--future">
              <span className="bi-docs-timeline-dot" aria-hidden />
              <span className="bi-docs-timeline-label">Sunset</span>
              <span className="bi-docs-timeline-meta">{en ? "removal date" : "fecha de retiro"}</span>
            </div>
          </div>
          <p>
            {en ? <>
              Endpoints scheduled for retirement return <code>Deprecation: &lt;date&gt;</code>,{" "}
              <code>Sunset: &lt;date&gt;</code> and{" "}
              <code>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
              (<a href="https://datatracker.ietf.org/doc/html/rfc8594" target="_blank" rel="noopener noreferrer">RFC 8594</a>).
            </> : <>
              Los endpoints marcados para retiro devuelven <code>Deprecation: &lt;date&gt;</code>,{" "}
              <code>Sunset: &lt;date&gt;</code> y{" "}
              <code>Link: &lt;replacement&gt;; rel="successor-version"</code>{" "}
              (<a href="https://datatracker.ietf.org/doc/html/rfc8594" target="_blank" rel="noopener noreferrer">RFC 8594</a>).
            </>}
          </p>
        </>
      ),
    },
    {
      id: "spec",
      group: "resources",
      title: en ? "OpenAPI specification" : "Especificación OpenAPI",
      kicker: "OPENAPI 3.1 · JSON",
      body: (
        <>
          <p>
            {en ? <>
              Download the full spec as <a href="/api/openapi">OpenAPI 3.1 JSON</a>. Compatible with
              Scalar, Swagger UI, Postman, Stoplight, Insomnia, HTTPie and clients generated with
              openapi-typescript.
            </> : <>
              Descarga el spec completo en <a href="/api/openapi">JSON OpenAPI 3.1</a>. Compatible con
              Scalar, Swagger UI, Postman, Stoplight, Insomnia, HTTPie y clientes generados con
              openapi-typescript.
            </>}
          </p>
          <pre>{`curl https://bio-ignicion.app/api/openapi -o openapi.json
npx @scalar/cli reference openapi.json
npx openapi-typescript openapi.json -o src/types/api.ts`}</pre>
        </>
      ),
    },
    {
      id: "roi-model",
      group: "resources",
      title: en ? "ROI model" : "Modelo ROI",
      kicker: "FORMULA · ASSUMPTIONS",
      body: (
        <p>
          {en ? <>
            The <a href="/roi-calculator">public calculator</a> uses the same formula as the team panel:{" "}
            <code>recoveredHours = sessionsMinutes × observedLift × residualFactor ÷ 60</code>, with{" "}
            <code>effectSizeCap = 0.35</code> and <code>residualFactor = 2.0</code>. Assumptions and
            literature references (Zeidan 2010, Basso 2019) live in <code>src/lib/roi.js</code> — reported
            as estimate, never as guaranteed return.
          </> : <>
            La <a href="/roi-calculator">calculadora pública</a> usa la misma fórmula que el panel de equipo:{" "}
            <code>recoveredHours = sessionsMinutes × observedLift × residualFactor ÷ 60</code>, con{" "}
            <code>effectSizeCap = 0.35</code> y <code>residualFactor = 2.0</code>. Supuestos y referencias
            a literatura (Zeidan 2010, Basso 2019) viven en <code>src/lib/roi.js</code> — reportado como
            estimación, nunca como retorno garantizado.
          </>}
        </p>
      ),
    },
  ];
}

export default async function DocsPage() {
  const locale = await getServerLocale();
  const L = locale === "en" ? "en" : "es";
  const c = COPY[L];
  const en = L === "en";
  const sections = sectionsFor(locale);
  const core = sections.filter((s) => s.group === "core");
  const resources = sections.filter((s) => s.group === "resources");

  const reviewedDate = new Date(DOCS_LAST_REVIEWED).toLocaleDateString(
    en ? "en-US" : "es-MX",
    { year: "numeric", month: "long", day: "numeric" }
  );

  return (
    <PublicShell activePath="/docs">
      {/* ═══ Hero ═══ */}
      <Container size="lg" className="bi-prose">
        <header className="bi-docs-hero">
          <div aria-hidden className="bi-docs-hero-lattice">
            <BioglyphLattice variant="ambient" />
          </div>
          <span aria-hidden className="bi-docs-hero-aura" />
          <div style={{ position: "relative", zIndex: 1 }}>
            <IgnitionReveal sparkOrigin="12% 30%">
              <div style={kickerStyle}>{c.eyebrow}</div>
              <h1
                style={{
                  margin: `${space[3]}px 0 ${space[4]}px`,
                  fontSize: "clamp(36px, 5.2vw, 64px)",
                  letterSpacing: "-0.035em",
                  lineHeight: 1.02,
                }}
              >
                {c.title}
              </h1>
              <p
                style={{
                  fontFamily: "var(--font-editorial), 'Instrument Serif', Georgia, serif",
                  fontStyle: "italic",
                  fontSize: "clamp(18px, 2vw, 24px)",
                  lineHeight: 1.35,
                  color: cssVar.textMuted,
                  maxWidth: "44ch",
                  margin: `0 0 ${space[4]}px`,
                }}
              >
                {c.editorial}
              </p>
              <p style={{ maxWidth: "62ch", marginBlockStart: 0, color: cssVar.textDim }}>
                {c.intro}
              </p>
            </IgnitionReveal>
          </div>
        </header>
      </Container>

      {/* ═══ Stat strip — real standards, no latency fantasy ═══ */}
      <section aria-label={c.statSpec} style={{ marginBlockStart: space[7] }}>
        <Container size="xl" style={{ paddingInline: 0 }}>
          <div className="bi-proof-stats bi-proof-stats--label">
            <div>
              <span className="v">{c.statSpec}</span>
              <span className="l">{en ? "Specification" : "Especificación"}</span>
              <span className="s">{c.statSpecSub}</span>
            </div>
            <div>
              <span className="v">{c.statWebhooks}</span>
              <span className="l">{en ? "Signed events" : "Eventos firmados"}</span>
              <span className="s">{c.statWebhooksSub}</span>
            </div>
            <div>
              <span className="v">{c.statRate}</span>
              <span className="l">{en ? "Rate limits" : "Rate limits"}</span>
              <span className="s">{c.statRateSub}</span>
            </div>
            <div>
              <span className="v">{c.statScim}</span>
              <span className="l">{en ? "Provisioning" : "Provisioning"}</span>
              <span className="s">{c.statScimSub}</span>
            </div>
          </div>
        </Container>
      </section>

      <PulseDivider intensity="dim" />

      {/* ═══ Quickstart + reference body ═══ */}
      <Container size="lg" className="bi-prose">
        <Card
          as="section"
          aria-labelledby="quickstart"
          style={{
            marginBlockEnd: space[6],
            borderColor: cssVar.accent,
            background: cssVar.accentSoft,
          }}
        >
          <div style={{ ...kickerStyle, marginBlockEnd: space[2] }}>{c.quickstartKicker}</div>
          <h2
            id="quickstart"
            style={{
              marginTop: 0,
              marginBlockEnd: space[3],
              fontSize: "clamp(22px, 2.6vw, 30px)",
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
            }}
          >
            {c.quickstartH}
          </h2>
          <p style={{ marginBlockStart: 0 }}>{c.quickstartBaseUrl}</p>
          <CodeTabs
            tabs={QUICKSTART_SNIPPETS[en ? "en" : "es"]}
            ariaLabel={en ? "SDK quickstart samples" : "Ejemplos de quickstart"}
            copyLabel={c.copyLabel}
            copiedLabel={c.copiedLabel}
            copyErrorLabel={c.copyErrorLabel}
          />
          <p style={{ marginBlockEnd: 0, fontSize: font.size.sm, color: cssVar.textDim }}>
            {c.quickstartFoot}
          </p>
        </Card>

        {/* Single clean TOC row, not sticky. Grid so the CTA always sits right. */}
        <nav aria-label={c.toc} className="bi-docs-toc">
          <div className="bi-docs-toc-chips">
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="bi-docs-toc-chip">
                {s.title}
              </a>
            ))}
          </div>
          <div className="bi-docs-toc-cta">
            <Button href="/api/openapi" size="sm">{c.openSpec}</Button>
          </div>
        </nav>

        {/* Core concepts */}
        <div className="bi-docs-group-kicker" aria-hidden>{c.groupCore}</div>
        <div className="bi-docs-ref" style={{ display: "grid", gap: space[3] }}>
          {core.map((s) => (
            <Card as="section" key={s.id} id={s.id} className="bi-docs-ref-card">
              <div className="bi-docs-ref-kicker">{s.kicker}</div>
              <h2 className="bi-docs-ref-title">{s.title}</h2>
              <div>{s.body}</div>
            </Card>
          ))}
        </div>

        {/* Resources */}
        <div className="bi-docs-group-kicker" style={{ marginBlockStart: space[6] }} aria-hidden>
          {c.groupResources}
        </div>
        <div className="bi-docs-ref" style={{ display: "grid", gap: space[3] }}>
          {resources.map((s) => (
            <Card as="section" key={s.id} id={s.id} className="bi-docs-ref-card">
              <div className="bi-docs-ref-kicker">{s.kicker}</div>
              <h2 className="bi-docs-ref-title">{s.title}</h2>
              <div>{s.body}</div>
            </Card>
          ))}
        </div>
      </Container>

      <PulseDivider intensity="dim" />

      {/* ═══ Closing CTA ═══ */}
      <section aria-labelledby="docs-closing" className="bi-demo-closing-section">
        <Container size="lg" style={{ paddingBlock: `clamp(48px, 7vw, 96px)` }}>
          <IgnitionReveal sparkOrigin="50% 20%">
            <div className="bi-demo-closing">
              <div aria-hidden className="bi-demo-closing-lattice">
                <BioglyphLattice variant="ambient" />
              </div>
              <span aria-hidden className="bi-demo-closing-aura" />
              <span aria-hidden className="bi-demo-closing-aura bi-demo-closing-aura--spark" />

              <div className="bi-demo-closing-mark" aria-hidden>
                <span className="bi-demo-closing-mark-core" />
                <span className="bi-demo-closing-mark-ring" />
              </div>

              <div style={{ ...kickerStyle, marginBottom: space[4] }}>{c.closingKicker}</div>

              <h2 id="docs-closing" className="bi-demo-closing-h">
                <span className="bi-demo-closing-h-lead">{c.closingHLead}</span>{" "}
                <span className="bi-demo-closing-h-body">{c.closingHBody}</span>
              </h2>

              <p className="bi-demo-closing-body">{c.closingBody}</p>

              <div className="bi-demo-closing-actions">
                <Link href="/admin/api-keys" className="bi-demo-closing-primary">
                  <span className="bi-demo-closing-primary-label">{c.closingPrimary}</span>
                  <span aria-hidden className="bi-demo-closing-primary-sep" />
                  <svg aria-hidden width="15" height="15" viewBox="0 0 15 15" className="bi-demo-closing-primary-arrow">
                    <path d="M3 7.5h9M8.5 3.5l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </Link>
                <Link href="/api/openapi" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5v8M3 6l3.5 3.5L10 6M2.5 11.5h8" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingSecondary}</span>
                </Link>
                <Link href="/trust" className="bi-demo-closing-ghost">
                  <svg aria-hidden width="13" height="13" viewBox="0 0 13 13">
                    <path d="M6.5 1.5L11 3.5v4c0 2.5-2 4.5-4.5 5C4 12 2 10 2 7.5v-4L6.5 1.5z" stroke="currentColor" strokeWidth="1.3" fill="none" strokeLinejoin="round" />
                  </svg>
                  <span>{c.closingTertiary}</span>
                </Link>
              </div>

              <div className="bi-demo-closing-meta">
                <div className="bi-demo-closing-avail">
                  <span aria-hidden className="bi-demo-closing-avail-pulse">
                    <span className="bi-demo-closing-avail-dot" />
                  </span>
                  <span className="bi-demo-closing-avail-label">{c.footerReviewed}</span>
                  <span className="bi-demo-closing-avail-meta">{reviewedDate}</span>
                </div>
                <div className="bi-demo-closing-sig">
                  <span className="bi-demo-closing-sig-name">{c.footerSdk}</span>
                  <a href="mailto:developers@bio-ignicion.app" className="bi-demo-closing-sig-link">
                    developers@bio-ignicion.app
                  </a>
                </div>
              </div>
            </div>
          </IgnitionReveal>
        </Container>
      </section>
    </PublicShell>
  );
}
