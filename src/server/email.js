/* ═══════════════════════════════════════════════════════════════
   Transactional email — Postmark-first, SMTP-fallback-ready.
   Sprint 18: branding-aware (logo + colors del Org si se pasa).
   ═══════════════════════════════════════════════════════════════
   Cada template acepta `branding` opcional:
     { logoUrl, primaryColor, accentColor, customDomain, ... }
   y `customDomainVerified` para usar custom From si existe.
   Si no se pasa branding → defaults BIO-IGN.

   Tooling pure en lib/email-template.js (renderEmailHTML, renderCtaButton,
   getBrandedFrom, sanitizeVars, escapeHtml). Aquí solo orquesta Postmark
   + i18n + persistencia de la decisión "branding aplicado o no".
   ═══════════════════════════════════════════════════════════════ */

import { tLocale, fmtCurrencyL, DEFAULT_LOCALE } from "../lib/i18n";
import {
  renderEmailHTML,
  renderCtaButton,
  renderEmailText,
  getBrandedFrom,
  escapeHtml,
} from "../lib/email-template";

const DEFAULT_FROM = process.env.EMAIL_FROM || "BIO-IGNICIÓN <no-reply@bio-ignicion.app>";

async function postmark(payload) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  // eslint-disable-next-line no-console -- intentional dev fallback when no Postmark token
  if (!token) { console.info("[email] skipped (no token):", payload.To, payload.Subject); return { skipped: true }; }
  const r = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json", "X-Postmark-Server-Token": token },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`Postmark ${r.status}: ${await r.text()}`);
  return r.json();
}

/**
 * Compone el From con custom domain si está verified, sino default.
 */
function resolveFrom({ branding, orgName, customDomainVerified } = {}) {
  return getBrandedFrom({
    branding,
    orgName,
    customDomainVerified,
    fallback: DEFAULT_FROM,
  });
}

export async function sendInvite({ to, orgName, acceptUrl, inviterName, locale = DEFAULT_LOCALE, branding, customDomainVerified } = {}) {
  const inviter = inviterName || tLocale(locale, "emails.invite.fallbackInviter");
  const vars = { inviter: escapeHtml(inviter), org: escapeHtml(orgName), url: acceptUrl };
  const Subject = tLocale(locale, "emails.invite.subject", { inviter, org: orgName });
  const heading = tLocale(locale, "emails.invite.heading");
  const body    = tLocale(locale, "emails.invite.body", vars);
  const cta     = tLocale(locale, "emails.invite.cta");
  const fine    = tLocale(locale, "emails.invite.fineprint");
  const text    = tLocale(locale, "emails.invite.text", { inviter, org: orgName, url: acceptUrl });
  const ctaHtml = renderCtaButton({ url: acceptUrl, label: cta, branding });
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p>${ctaHtml}<p style="color:#64748B;font-size:13px">${escapeHtml(fine)}</p>`;
  return postmark({
    From: resolveFrom({ branding, orgName, customDomainVerified }),
    To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

export async function sendWelcome({ to, name, locale = DEFAULT_LOCALE, branding, orgName, customDomainVerified } = {}) {
  const vars = { name: escapeHtml(name || "") };
  const Subject = tLocale(locale, "emails.welcome.subject");
  const heading = tLocale(locale, "emails.welcome.heading", vars);
  const body    = tLocale(locale, "emails.welcome.body");
  const text    = tLocale(locale, "emails.welcome.text");
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p>`;
  return postmark({
    From: resolveFrom({ branding, orgName, customDomainVerified }),
    To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

export async function sendSecurityAlert({ to, event, ip, ua, when, locale = DEFAULT_LOCALE, branding, orgName, customDomainVerified } = {}) {
  const vars = {
    event: escapeHtml(event), ip: escapeHtml(ip),
    ua: escapeHtml(ua), when: escapeHtml(when),
  };
  const Subject = tLocale(locale, "emails.security.subject", { event, ip, ua, when });
  const heading = tLocale(locale, "emails.security.heading");
  const body    = tLocale(locale, "emails.security.body", vars);
  const ipLine  = tLocale(locale, "emails.security.ipLine", vars);
  const uaLine  = tLocale(locale, "emails.security.uaLine", vars);
  const footer  = tLocale(locale, "emails.security.footer");
  const text    = tLocale(locale, "emails.security.text", { event, ip, ua, when });
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p><ul><li>${ipLine}</li><li>${uaLine}</li></ul><p>${escapeHtml(footer)}</p>`;
  return postmark({
    From: resolveFrom({ branding, orgName, customDomainVerified }),
    To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

export async function sendMfaResetResolved({ to, status, orgName, reason, signinUrl, locale = DEFAULT_LOCALE, branding, customDomainVerified } = {}) {
  const vars = { org: escapeHtml(orgName || "") };
  const From = resolveFrom({ branding, orgName, customDomainVerified });
  if (status === "approved") {
    const Subject = tLocale(locale, "emails.mfaReset.approvedSubject");
    const heading = tLocale(locale, "emails.mfaReset.approvedHeading");
    const body    = tLocale(locale, "emails.mfaReset.approvedBody", vars);
    const cta     = tLocale(locale, "emails.mfaReset.approvedCta");
    const fine    = tLocale(locale, "emails.mfaReset.approvedFineprint");
    const text    = tLocale(locale, "emails.mfaReset.approvedText");
    const url     = signinUrl || "https://bio-ignicion.app/signin";
    const ctaHtml = renderCtaButton({ url, label: cta, branding });
    const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p>${ctaHtml}<p style="color:#64748B;font-size:13px">${escapeHtml(fine)}</p>`;
    return postmark({
      From, To: to, MessageStream: "outbound",
      Subject,
      HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
      TextBody: renderEmailText({ contentText: text, locale }),
    });
  }
  const Subject = tLocale(locale, "emails.mfaReset.rejectedSubject");
  const heading = tLocale(locale, "emails.mfaReset.rejectedHeading");
  const body    = tLocale(locale, "emails.mfaReset.rejectedBody", vars);
  const reasonLabel = tLocale(locale, "emails.mfaReset.rejectedReasonLabel");
  const fine    = tLocale(locale, "emails.mfaReset.rejectedFineprint");
  const text    = tLocale(locale, "emails.mfaReset.rejectedText");
  const reasonBlock = reason ? `<p style="color:#475569;font-size:14px"><b>${escapeHtml(reasonLabel)}</b> ${escapeHtml(reason)}</p>` : "";
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p>${reasonBlock}<p style="color:#64748B;font-size:13px">${escapeHtml(fine)}</p>`;
  return postmark({
    From, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

export async function sendReceipt({ to, amount, currency, invoiceUrl, locale = DEFAULT_LOCALE, branding, orgName, customDomainVerified } = {}) {
  const money = fmtCurrencyL(locale, amount, currency);
  const vars = { amount: escapeHtml(money), url: invoiceUrl };
  const Subject = tLocale(locale, "emails.receipt.subject");
  const heading = tLocale(locale, "emails.receipt.heading");
  const body    = tLocale(locale, "emails.receipt.body", vars);
  const link    = tLocale(locale, "emails.receipt.viewInvoice");
  const text    = tLocale(locale, "emails.receipt.text", { amount: money, url: invoiceUrl });
  const ctaHtml = renderCtaButton({ url: invoiceUrl, label: link, branding });
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p>${ctaHtml}`;
  return postmark({
    From: resolveFrom({ branding, orgName, customDomainVerified }),
    To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

/**
 * Sprint 18 — DSAR completion email. Notifica al usuario que su request
 * fue resuelta. Para ACCESS/PORTABILITY incluye link al artifact.
 *
 * @param {object} args
 * @param {"approved"|"rejected"|"completed"} args.status
 * @param {"ACCESS"|"PORTABILITY"|"ERASURE"} args.kind
 * @param {string} [args.artifactUrl]
 * @param {string} [args.notes]
 */
export async function sendDsarResolved({
  to, status, kind, artifactUrl, notes, orgName,
  locale = DEFAULT_LOCALE, branding, customDomainVerified,
} = {}) {
  const From = resolveFrom({ branding, orgName, customDomainVerified });
  const isApproved = status === "approved" || status === "completed";
  const Subject = locale === "en"
    ? `Your data request was ${isApproved ? "approved" : "reviewed"}`
    : `Tu solicitud de datos fue ${isApproved ? "aprobada" : "revisada"}`;
  const heading = locale === "en"
    ? `Data request: ${kind}`
    : `Solicitud de datos: ${kind}`;
  const statusText = isApproved
    ? (locale === "en" ? "Approved" : "Aprobada")
    : (locale === "en" ? "Rejected" : "Rechazada");
  const body = locale === "en"
    ? `Your <strong>${kind}</strong> request has been <strong>${statusText.toLowerCase()}</strong> by the admin team${orgName ? ` of <strong>${escapeHtml(orgName)}</strong>` : ""}.`
    : `Tu solicitud <strong>${kind}</strong> ha sido <strong>${statusText.toLowerCase()}</strong> por el equipo admin${orgName ? ` de <strong>${escapeHtml(orgName)}</strong>` : ""}.`;
  const ctaHtml = (isApproved && artifactUrl)
    ? renderCtaButton({
        url: artifactUrl,
        label: locale === "en" ? "Download my data" : "Descargar mis datos",
        branding,
      })
    : "";
  const notesBlock = notes
    ? `<p style="color:#475569;font-size:14px;background:#F8FAFC;padding:12px;border-radius:6px"><strong>${locale === "en" ? "Admin notes" : "Notas del admin"}:</strong><br/>${escapeHtml(notes)}</p>`
    : "";
  const fine = locale === "en"
    ? "Aggregated anonymous data may be retained per Recital 26 GDPR for analytics."
    : "Los datos agregados anónimos pueden retenerse según Recital 26 GDPR para analíticas.";
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${body}</p>${notesBlock}${ctaHtml}<p style="color:#64748B;font-size:12px">${escapeHtml(fine)}</p>`;
  const text = `${heading}\n\n${kind} ${statusText}\n${notes ? `\n${notes}\n` : ""}${artifactUrl ? `\n${artifactUrl}\n` : ""}`;
  return postmark({
    From, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

/**
 * Sprint 20 — verifica email subscription al status page.
 * Branding: defaults BIO-IGN (status page es plataforma-wide, no per-org).
 */
export async function sendIncidentVerification({ to, verifyUrl, locale = DEFAULT_LOCALE } = {}) {
  if (!to || !verifyUrl) return { skipped: true };
  const Subject = locale === "en"
    ? "Confirm your status page subscription"
    : "Confirma tu suscripción al status page";
  const heading = locale === "en"
    ? "Confirm your subscription"
    : "Confirma tu suscripción";
  const body = locale === "en"
    ? "Click the button below to confirm. We won't email you incident notifications until you confirm."
    : "Click el botón para confirmar. No enviaremos notificaciones de incidents hasta que confirmes.";
  const cta = locale === "en" ? "Confirm subscription" : "Confirmar suscripción";
  const ctaHtml = renderCtaButton({ url: verifyUrl, label: cta });
  const fine = locale === "en"
    ? "If you didn't request this, ignore this email."
    : "Si no solicitaste esto, ignora este correo.";
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(body)}</p>${ctaHtml}<p style="color:#64748B;font-size:13px">${escapeHtml(fine)}</p>`;
  const text = `${heading}\n\n${body}\n\n${verifyUrl}\n\n${fine}\n`;
  return postmark({
    From: DEFAULT_FROM, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

/**
 * Sprint 20 — notifica subscribers verificados de un incident
 * (created/updated/resolved). Incluye unsubscribe one-click footer.
 */
export async function sendIncidentNotification({
  to, subject, incident, kind = "updated", unsubscribeUrl,
  locale = DEFAULT_LOCALE,
} = {}) {
  if (!to || !incident) return { skipped: true };
  const isResolved = incident.status === "resolved";
  const heading = isResolved
    ? (locale === "en" ? "Incident resolved" : "Incidente resuelto")
    : (kind === "created"
      ? (locale === "en" ? "New incident" : "Nuevo incidente")
      : (locale === "en" ? "Incident update" : "Actualización del incidente"));

  const sevLabel = (incident.severity || "").toUpperCase();
  const statusBadge = `<span style="display:inline-block;padding:2px 8px;background:${
    isResolved ? "#10B981" : sevLabel === "CRITICAL" ? "#EF4444" : sevLabel === "MAJOR" ? "#F59E0B" : "#6B7280"
  };color:#fff;border-radius:4px;font-size:12px;font-weight:600">${escapeHtml(sevLabel)}</span>`;

  const startedAt = incident.startedAt
    ? `<p style="color:#64748B;font-size:13px">${locale === "en" ? "Started" : "Iniciado"}: ${escapeHtml(new Date(incident.startedAt).toISOString())}</p>`
    : "";
  const components = (incident.components || []).length
    ? `<p style="color:#64748B;font-size:13px">${locale === "en" ? "Components" : "Componentes"}: ${incident.components.map((c) => `<code>${escapeHtml(c)}</code>`).join(", ")}</p>`
    : "";

  const bodyHtml = incident.body
    ? `<p style="color:#0F172A">${escapeHtml(incident.body)}</p>`
    : "";

  const statusUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://bio-ignicion.app"}/status#i-${incident.id}`;
  const ctaHtml = renderCtaButton({
    url: statusUrl,
    label: locale === "en" ? "View on status page" : "Ver en el status page",
  });

  const unsubFooter = unsubscribeUrl
    ? `<p style="color:#94A3B8;font-size:12px;margin-top:24px;border-top:1px solid #E2E8F0;padding-top:12px">${
        locale === "en"
          ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#94A3B8">Unsubscribe</a> from status notifications.`
          : `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#94A3B8">Cancelar suscripción</a> a notificaciones de status.`
      }</p>`
    : "";

  const inner = `<h2>${escapeHtml(heading)}</h2>
<p>${statusBadge} <strong>${escapeHtml(incident.title || "")}</strong></p>
${bodyHtml}${startedAt}${components}${ctaHtml}${unsubFooter}`;

  const text = `${heading}\n\n[${sevLabel}] ${incident.title}\n${incident.body || ""}\n\n${statusUrl}\n${unsubscribeUrl ? `\nUnsubscribe: ${unsubscribeUrl}\n` : ""}`;
  return postmark({
    From: DEFAULT_FROM, To: to, MessageStream: "outbound",
    Subject: subject || `[${sevLabel}] ${incident.title}`,
    HtmlBody: renderEmailHTML({ content: inner, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}

/**
 * Phase 6F SP-C — Executive report digest email.
 * Decision A locked: link only (sin data sensible inline). KPIs como
 * highlights mínimos no-PII (counts agregados públicos por tier B2B);
 * detalles bajo auth gate al click.
 *
 * @param {object} args
 * @param {string} args.to                    - admin email
 * @param {string} args.adminName             - nombre del recipiente
 * @param {string} args.orgName
 * @param {string} args.reportUrl             - URL al dashboard de reportes
 * @param {object} [args.highlights]          - { activeMembers, sessionsTotal, programCompletionRate }
 * @param {string} [args.locale="es"]
 * @param {object} [args.branding]
 * @param {boolean} [args.customDomainVerified]
 */
export async function sendExecutiveReportDigest({
  to, adminName, orgName, reportUrl, highlights = {},
  locale = DEFAULT_LOCALE, branding, customDomainVerified,
} = {}) {
  if (!to || !reportUrl || !orgName) return { skipped: true };

  const From = resolveFrom({ branding, orgName, customDomainVerified });
  const safeName = escapeHtml(adminName || "");
  const safeOrg = escapeHtml(orgName);
  const greeting = locale === "en"
    ? `Hello${safeName ? `, ${safeName}` : ""}.`
    : `Hola${safeName ? `, ${safeName}` : ""}.`;
  const heading = locale === "en"
    ? `Executive report · ${safeOrg}`
    : `Reporte ejecutivo · ${safeOrg}`;
  const intro = locale === "en"
    ? `Your ${escapeHtml(String(highlights.periodDays || 90))}-day executive report for <strong>${safeOrg}</strong> is ready.`
    : `Tu reporte ejecutivo de los últimos ${escapeHtml(String(highlights.periodDays || 90))} días para <strong>${safeOrg}</strong> está listo.`;
  const ctaLabel = locale === "en" ? "Open the full report" : "Abrir el reporte completo";

  // Highlights mínimos — counts agregados (no PII, no nivel NOM-035 details).
  // Mantener concretos pero sin detail breakdown — fuerza al admin a hacer
  // click (auth gate + audit log).
  const lines = [];
  if (typeof highlights.activeMembers === "number") {
    lines.push(locale === "en"
      ? `Active members: <strong>${highlights.activeMembers}</strong>`
      : `Miembros activos: <strong>${highlights.activeMembers}</strong>`);
  }
  if (typeof highlights.sessionsTotal === "number") {
    lines.push(locale === "en"
      ? `Sessions in period: <strong>${highlights.sessionsTotal}</strong>`
      : `Sesiones en el periodo: <strong>${highlights.sessionsTotal}</strong>`);
  }
  if (typeof highlights.programCompletionRate === "number") {
    const pct = Math.round(highlights.programCompletionRate * 100);
    lines.push(locale === "en"
      ? `Program completion rate: <strong>${pct}%</strong>`
      : `Tasa de completion programas: <strong>${pct}%</strong>`);
  }
  const highlightsBlock = lines.length
    ? `<ul style="line-height:1.7;color:#0F172A">${lines.map((l) => `<li>${l}</li>`).join("")}</ul>`
    : "";

  const fine = locale === "en"
    ? "Aggregated data with k≥5 anonymization. LFPDPPP / GDPR Art-89 compliant. Bio-Ignición is not a medical device."
    : "Datos agregados con anonimización k≥5. LFPDPPP / GDPR Art-89 compliant. Bio-Ignición no es dispositivo médico.";
  const text = `${heading}\n\n${greeting}\n\n${locale === "en" ? "Your report is ready." : "Tu reporte está listo."}\n${reportUrl}\n\n${fine}\n`;
  const ctaHtml = renderCtaButton({ url: reportUrl, label: ctaLabel, branding });
  const inner = `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(greeting)}</p><p>${intro}</p>${highlightsBlock}${ctaHtml}<p style="color:#64748B;font-size:12px;margin-top:24px">${escapeHtml(fine)}</p>`;

  const Subject = locale === "en"
    ? `Bio-Ignición · Executive report for ${orgName}`
    : `Bio-Ignición · Reporte ejecutivo de ${orgName}`;

  return postmark({
    From, To: to, MessageStream: "outbound",
    Subject,
    HtmlBody: renderEmailHTML({ content: inner, branding, locale }),
    TextBody: renderEmailText({ contentText: text, locale }),
  });
}
