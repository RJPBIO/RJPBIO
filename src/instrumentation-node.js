/* ═══════════════════════════════════════════════════════════════
   OpenTelemetry bootstrap — Node-only
   Aislado de `instrumentation.js` para que el bundler no intente
   resolver `@opentelemetry/sdk-node` (y sus APIs Node) en runtimes
   edge/browser donde `process.on` y `fs` no existen.
   ═══════════════════════════════════════════════════════════════ */

export async function bootstrapOtel() {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;

  try {
    const { NodeSDK } = await import("@opentelemetry/sdk-node");
    const { OTLPTraceExporter } = await import("@opentelemetry/exporter-trace-otlp-http");
    const { Resource } = await import("@opentelemetry/resources");
    const { SemanticResourceAttributes } = await import("@opentelemetry/semantic-conventions");
    const { getNodeAutoInstrumentations } = await import("@opentelemetry/auto-instrumentations-node");

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || "bio-ignicion",
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || "1.0.0",
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || "development",
      }),
      traceExporter: new OTLPTraceExporter({
        url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? Object.fromEntries(process.env.OTEL_EXPORTER_OTLP_HEADERS.split(",").map((p) => p.split("=")))
          : {},
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          "@opentelemetry/instrumentation-fs": { enabled: false },
        }),
      ],
    });

    sdk.start();
    if (typeof process !== "undefined" && typeof process.on === "function") {
      process.on("SIGTERM", () => sdk.shutdown().catch(() => {}));
    }
  } catch (err) {
    console.warn("[otel] bootstrap skipped:", err?.message);
  }
}
