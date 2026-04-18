/* ═══════════════════════════════════════════════════════════════
   Wearables — ingress de webhooks de proveedores externos.
   - Cada proveedor verifica su propia firma (HMAC-SHA256 típico).
   - Normaliza payload → { provider, kind, normalized }.
   - Guarda raw en WearableEvent para reprocesamiento futuro.
   ═══════════════════════════════════════════════════════════════ */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const PROVIDERS = {
  whoop: {
    secretEnv: "WHOOP_WEBHOOK_SECRET",
    sigHeader: "x-whoop-signature",
    kinds: ["recovery", "sleep", "workout"],
    verify: verifyHmacHex,
  },
  oura: {
    secretEnv: "OURA_WEBHOOK_SECRET",
    sigHeader: "x-oura-signature",
    kinds: ["sleep", "activity", "readiness", "hrv"],
    verify: verifyHmacHex,
  },
  garmin: {
    secretEnv: "GARMIN_WEBHOOK_SECRET",
    sigHeader: "x-garmin-signature",
    kinds: ["activity", "stress", "hrv", "sleep"],
    verify: verifyHmacHex,
  },
  apple: {
    secretEnv: "APPLE_HEALTH_WEBHOOK_SECRET",
    sigHeader: "x-bio-signature",
    kinds: ["hrv", "sleep", "workout", "mindfulness"],
    verify: verifyHmacHex,
  },
  fitbit: {
    secretEnv: "FITBIT_WEBHOOK_SECRET",
    sigHeader: "x-fitbit-signature",
    kinds: ["sleep", "activity", "heart"],
    verify: verifyHmacBase64,
  },
};

function verifyHmacHex(secret, raw, sig) {
  if (!sig) return false;
  const mac = createHmac("sha256", secret).update(raw).digest("hex");
  const a = Buffer.from(mac, "hex");
  const b = Buffer.from(String(sig).replace(/^sha256=/, ""), "hex");
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

function verifyHmacBase64(secret, raw, sig) {
  if (!sig) return false;
  const mac = createHmac("sha256", secret).update(raw).digest("base64");
  return Buffer.byteLength(mac) === Buffer.byteLength(String(sig)) &&
    timingSafeEqual(Buffer.from(mac), Buffer.from(String(sig)));
}

export function getProvider(name) {
  return PROVIDERS[String(name || "").toLowerCase()];
}

export function verify(provider, raw, signature) {
  const p = getProvider(provider);
  if (!p) return { ok: false, reason: "unknown_provider" };
  const secret = process.env[p.secretEnv];
  if (!secret) return { ok: false, reason: "secret_missing" };
  return { ok: p.verify(secret, raw, signature) };
}

export function normalize(provider, event) {
  try {
    const kind = event?.type || event?.event || event?.kind || "webhook";
    const userExt = event?.user_id || event?.userId || event?.user || null;
    return { kind: String(kind).slice(0, 64), userExt };
  } catch {
    return { kind: "webhook", userExt: null };
  }
}
