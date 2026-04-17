/* ═══════════════════════════════════════════════════════════════
   Next.js instrumentation hook — runtime-aware
   El código Node-only vive en `instrumentation-node.js` y sólo se
   importa dinámicamente cuando NEXT_RUNTIME === "nodejs", evitando
   que el bundler intente resolver @opentelemetry/sdk-node en edge.
   ═══════════════════════════════════════════════════════════════ */

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const mod = await import("./instrumentation-node.js");
    await mod.bootstrapOtel();
  } catch (err) {
    console.warn("[instrumentation] skipped:", err?.message);
  }
}
