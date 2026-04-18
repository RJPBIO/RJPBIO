/* ═══════════════════════════════════════════════════════════════
   Transactional email — Postmark-first, SMTP-fallback-ready.
   Todas las plantillas se resuelven vía `tLocale(locale, key)` del
   diccionario i18n compartido con el cliente. El locale se toma del
   parámetro `locale` (normalmente `recipient.user.locale` del caller)
   o cae a DEFAULT_LOCALE si no se provee.
   No-op en dev salvo POSTMARK_SERVER_TOKEN.
   ═══════════════════════════════════════════════════════════════ */

import { tLocale, fmtCurrencyL, DEFAULT_LOCALE } from "../lib/i18n";

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

function wrap(body, locale) {
  const brand = tLocale(locale, "emails.brandFooter");
  return `<html lang="${locale}"><body style="font-family:system-ui;color:#0F172A;max-width:560px;margin:auto;padding:24px">${body}<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0"/><p style="color:#64748B;font-size:12px">${brand} — <a href="https://bio-ignicion.app/privacy">${tLocale(locale, "privacy.title")}</a></p></body></html>`;
}

export async function sendInvite({ to, orgName, acceptUrl, inviterName, locale = DEFAULT_LOCALE }) {
  const inviter = inviterName || tLocale(locale, "emails.invite.fallbackInviter");
  const vars = { inviter, org: orgName, url: acceptUrl };
  const Subject = tLocale(locale, "emails.invite.subject", vars);
  const heading = tLocale(locale, "emails.invite.heading");
  const body    = tLocale(locale, "emails.invite.body", vars);
  const cta     = tLocale(locale, "emails.invite.cta");
  const fine    = tLocale(locale, "emails.invite.fineprint");
  const text    = tLocale(locale, "emails.invite.text", vars);
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: wrap(`<h2>${heading}</h2><p>${body}</p><p><a href="${acceptUrl}" style="background:#10B981;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">${cta}</a></p><p style="color:#64748B;font-size:13px">${fine}</p>`, locale),
    TextBody: text,
  });
}

export async function sendWelcome({ to, name, locale = DEFAULT_LOCALE }) {
  const vars = { name: name || "" };
  const Subject = tLocale(locale, "emails.welcome.subject");
  const heading = tLocale(locale, "emails.welcome.heading", vars);
  const body    = tLocale(locale, "emails.welcome.body");
  const text    = tLocale(locale, "emails.welcome.text");
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: wrap(`<h2>${heading}</h2><p>${body}</p>`, locale),
    TextBody: text,
  });
}

export async function sendSecurityAlert({ to, event, ip, ua, when, locale = DEFAULT_LOCALE }) {
  const vars = { event, ip, ua, when };
  const Subject = tLocale(locale, "emails.security.subject", vars);
  const heading = tLocale(locale, "emails.security.heading");
  const body    = tLocale(locale, "emails.security.body", vars);
  const ipLine  = tLocale(locale, "emails.security.ipLine", vars);
  const uaLine  = tLocale(locale, "emails.security.uaLine", vars);
  const footer  = tLocale(locale, "emails.security.footer");
  const text    = tLocale(locale, "emails.security.text", vars);
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: wrap(`<h2>${heading}</h2><p>${body}</p><ul><li>${ipLine}</li><li>${uaLine}</li></ul><p>${footer}</p>`, locale),
    TextBody: text,
  });
}

export async function sendReceipt({ to, amount, currency, invoiceUrl, locale = DEFAULT_LOCALE }) {
  const money = fmtCurrencyL(locale, amount, currency);
  const vars = { amount: money, url: invoiceUrl };
  const Subject = tLocale(locale, "emails.receipt.subject");
  const heading = tLocale(locale, "emails.receipt.heading");
  const body    = tLocale(locale, "emails.receipt.body", vars);
  const link    = tLocale(locale, "emails.receipt.viewInvoice");
  const text    = tLocale(locale, "emails.receipt.text", vars);
  return postmark({
    From: FROM, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: wrap(`<h2>${heading}</h2><p>${body}</p><p><a href="${invoiceUrl}">${link}</a></p>`, locale),
    TextBody: text,
  });
}
