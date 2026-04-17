/* ═══════════════════════════════════════════════════════════════
   Transactional email — Postmark-first, SMTP-fallback-ready.
   All templates are plain JS strings; switch to React Email later.
   No-op in dev unless POSTMARK_SERVER_TOKEN is set.
   ═══════════════════════════════════════════════════════════════ */

const FROM = process.env.EMAIL_FROM || "BIO-IGNICIÓN <no-reply@bio-ignicion.app>";

async function postmark(payload) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  if (!token) { console.info("[email] skipped (no token):", payload.To, payload.Subject); return { skipped: true }; }
  const r = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Postmark ${r.status}: ${await r.text()}`);
  return r.json();
}

function wrap(body) {
  return `<html><body style="font-family:system-ui;color:#0F172A;max-width:560px;margin:auto;padding:24px">${body}<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/><p style="color:#64748B;font-size:12px">BIO-IGNICIÓN · <a href="https://bio-ignicion.app/privacy">Privacidad</a></p></body></html>`;
}

export async function sendInvite({ to, orgName, acceptUrl, inviterName }) {
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject: `${inviterName || "Alguien"} te invitó a ${orgName} en BIO-IGNICIÓN`,
    HtmlBody: wrap(`<h2>Bienvenido</h2><p>Te invitaron a colaborar en <b>${orgName}</b>.</p><p><a href="${acceptUrl}" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Aceptar invitación</a></p><p style="color:#64748B;font-size:13px">Este enlace expira en 7 días.</p>`),
    TextBody: `Te invitaron a ${orgName}. Acepta: ${acceptUrl}`,
  });
}

export async function sendWelcome({ to, name }) {
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject: "Bienvenido a BIO-IGNICIÓN",
    HtmlBody: wrap(`<h2>Hola ${name || ""}</h2><p>Tu cuenta está lista. Comienza con una sesión de 120 segundos.</p>`),
    TextBody: `Tu cuenta está lista.`,
  });
}

export async function sendSecurityAlert({ to, event, ip, ua, when }) {
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject: `[seguridad] ${event}`,
    HtmlBody: wrap(`<h2>Actividad en tu cuenta</h2><p><b>${event}</b> el ${when}.</p><ul><li>IP: ${ip}</li><li>Agente: ${ua}</li></ul><p>Si no fuiste tú, rota tus credenciales y contacta security@bio-ignicion.app.</p>`),
    TextBody: `Actividad: ${event} el ${when} desde ${ip}`,
  });
}

export async function sendReceipt({ to, amount, currency, invoiceUrl }) {
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject: "Recibo de BIO-IGNICIÓN",
    HtmlBody: wrap(`<h2>Recibo</h2><p>Cargamos <b>${new Intl.NumberFormat("es", { style: "currency", currency }).format(amount)}</b>.</p><p><a href="${invoiceUrl}">Ver factura</a></p>`),
    TextBody: `Recibo: ${amount} ${currency} — ${invoiceUrl}`,
  });
}
