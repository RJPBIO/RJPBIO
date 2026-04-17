/* ═══════════════════════════════════════════════════════════════
   BIO-IGNICIÓN — Deep Link Guard
   Valida params NFC/QR y opcionalmente verifica HMAC si hay secret.
   ═══════════════════════════════════════════════════════════════ */

const MAX_LEN = 128;
const SAFE = /^[A-Za-z0-9_\-.:@ ]{1,128}$/;
const ALLOWED_T = new Set(["entrada", "salida", "exit", "mid", "break"]);

export function parseDeepLink(searchParams) {
  const c = (searchParams.get("c") || "").slice(0, MAX_LEN);
  const t = (searchParams.get("t") || "").slice(0, MAX_LEN);
  const e = (searchParams.get("e") || "").slice(0, MAX_LEN);
  const sig = searchParams.get("sig") || "";
  const ts = Number(searchParams.get("ts") || 0);

  if (c && !SAFE.test(c)) return null;
  if (t && !ALLOWED_T.has(t)) return null;
  if (e && !SAFE.test(e)) return null;

  return { company: c, type: t || "entrada", employee: e, sig, ts };
}

async function hmac(secret, msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify", "sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyDeepLink(link, secret = process.env.NEXT_PUBLIC_DEEPLINK_SECRET) {
  if (!link) return { ok: false, reason: "invalid" };
  if (!secret) return { ok: true, signed: false };
  if (!link.sig || !link.ts) return { ok: false, reason: "unsigned" };
  if (Math.abs(Date.now() - link.ts) > 10 * 60 * 1000) return { ok: false, reason: "expired" };
  const msg = `${link.company}|${link.type}|${link.employee}|${link.ts}`;
  const expected = await hmac(secret, msg);
  const ok = timingSafeEq(expected, link.sig);
  return { ok, signed: true, reason: ok ? null : "bad_signature" };
}

function timingSafeEq(a, b) {
  if (a.length !== b.length) return false;
  let res = 0;
  for (let i = 0; i < a.length; i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return res === 0;
}
