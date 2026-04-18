/* ═══════════════════════════════════════════════════════════════
   Lead capture (demo requests, ROI calculator leads).
   Público — sin autenticación — rate-limit estricto por IP.
   No escribimos a DB (PII sin consentimiento granular); enviamos
   por email al equipo de ventas y devolvemos 200.
   ═══════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { z } from "zod";
import { check as checkRate } from "@/server/ratelimit";
import { requireCsrf } from "@/server/csrf";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const LeadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  company: z.string().max(160).optional().default(""),
  size: z.enum(["1-25", "26-100", "101-500", "501-2000", "2000+"]).optional(),
  source: z.enum(["demo", "roi", "pricing", "other"]).default("other"),
  note: z.string().max(1200).optional().default(""),
  // Honeypot: si viene lleno, es bot.
  website: z.string().max(0).optional(),
});

async function notifySales(lead) {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const to = process.env.SALES_INBOX || "sales@bio-ignicion.app";
  if (!token) { logger.info({ event: "lead.captured", source: lead.source, email: lead.email }); return; }
  await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Postmark-Server-Token": token },
    body: JSON.stringify({
      From: process.env.EMAIL_FROM || "no-reply@bio-ignicion.app",
      To: to,
      Subject: `[Lead · ${lead.source}] ${lead.company || lead.name}`,
      MessageStream: "outbound",
      TextBody: [
        `Nombre:  ${lead.name}`,
        `Email:   ${lead.email}`,
        `Empresa: ${lead.company || "—"}`,
        `Tamaño:  ${lead.size || "—"}`,
        `Fuente:  ${lead.source}`,
        ``,
        lead.note || "(sin mensaje)",
      ].join("\n"),
    }),
  }).catch((e) => logger.error({ event: "lead.notify.failed", err: String(e) }));
}

export async function POST(req) {
  const csrfErr = requireCsrf(req);
  if (csrfErr) return csrfErr;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rate = await checkRate(`leads:${ip}`, { limit: 3, windowMs: 60_000 });
  if (!rate.ok) {
    return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "Retry-After": String(Math.ceil((rate.reset - Date.now()) / 1000)) } });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });

  // Honeypot silencioso: respondemos 200 al bot pero no notificamos.
  if (parsed.data.website) return NextResponse.json({ ok: true });

  await notifySales(parsed.data);
  return NextResponse.json({ ok: true });
}
