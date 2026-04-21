/* ═══════════════════════════════════════════════════════════════
   SMS — provider pluggable. Twilio en prod si TWILIO_* está
   configurado. Consola en dev (se imprime el OTP al terminal).
   Jamás dejamos caer mensajes a un "fake gateway" en prod: si
   el provider falta, send() explota — sign-in por teléfono se
   desactiva cleanly en el discover endpoint.
   ═══════════════════════════════════════════════════════════════ */

import "server-only";

export function smsEnabled() {
  if (process.env.SMS_PROVIDER === "console") return true;
  if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM) return true;
  return process.env.NODE_ENV !== "production"; // dev: console fallback
}

// Normalize to E.164. Accepts "+52 614 123 4567", "52 614 123 4567",
// "614 123 4567" with default country. Returns null if unparseable.
export function normalizeE164(raw, defaultCountry = "52") {
  if (!raw) return null;
  const digits = String(raw).replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+")) {
    const d = digits.slice(1).replace(/\D/g, "");
    if (d.length < 8 || d.length > 15) return null;
    return "+" + d;
  }
  const d = digits.replace(/\D/g, "");
  if (d.length >= 10 && d.length <= 15) return "+" + (d.length === 10 ? defaultCountry + d : d);
  return null;
}

async function sendViaTwilio(to, body) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`twilio ${r.status} ${txt.slice(0, 200)}`);
  }
  return r.json();
}

async function sendViaConsole(to, body) {
  // eslint-disable-next-line no-console
  console.log(`[sms:console] → ${to}: ${body}`);
  return { sid: "console-" + Date.now() };
}

export async function sendSms(to, body) {
  const provider = process.env.SMS_PROVIDER
    || (process.env.TWILIO_ACCOUNT_SID ? "twilio" : process.env.NODE_ENV === "production" ? "missing" : "console");
  if (provider === "twilio") return sendViaTwilio(to, body);
  if (provider === "console") return sendViaConsole(to, body);
  throw new Error("sms_provider_missing");
}
