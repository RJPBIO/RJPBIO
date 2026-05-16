/* ═══════════════════════════════════════════════════════════════
   bulk-upgrade-v2.mjs — Apply Apple/Linear-grade CSS upgrades
   bulk across the 6 existing render scripts.

   Upgrades applied (consistent across all light-theme PDFs):
     · INK color: #0B1320 → #0F172A (canonical from ActivationKit)
     · Page padding: 88×96 → 112×120 (+27% whitespace)
     · Cover padding: 220→240 top
     · Body type: 17px/1.6 → 18px/1.72
     · Lede: 22px/1.5/24mb → 26px/1.48/36mb
     · h1.sec-h: 52px/1.05/28mb → 64px/1.02/44mb (+23% size, +57% spacing)
     · h2.sub-h: 26px/1.2/36mt/16mb → 32px/1.15/56mt/22mb
     · Cover h1: 88px → 104px
     · .callout: 20→32 margin, 18×22 → 26×30 padding, rx 8 → 14
     · Tables: 12×14 → 18×18 padding
     · Lists: 8×26 → 12×30 padding, line-height 1.55 → 1.65
     · Hairlines: 1px → 0.6px (more refined)
     · Eyebrow rule: 32px → 40px (more prominent)
     · TOC items: 14px padding → 18px padding

   Usage: node scripts/bulk-upgrade-v2.mjs
   ═══════════════════════════════════════════════════════════════ */

import fs from "node:fs/promises";
import path from "node:path";

const REPLACEMENTS = [
  // Canonical INK color (ActivationKit slate-900)
  ['"#0B1320"', '"#0F172A"'],

  // Page padding · portrait
  ["padding: 88px 96px 80px 96px;", "padding: 112px 120px 104px 120px;"],
  // Position statement uses a slightly different padding
  ["padding: 96px 112px 88px 112px;", "padding: 116px 128px 108px 128px;"],

  // Footer offset
  ["bottom: 32px; left: 96px; right: 96px;", "bottom: 42px; left: 120px; right: 120px;"],
  ["bottom: 36px; left: 112px; right: 112px;", "bottom: 44px; left: 128px; right: 128px;"],

  // Cover padding
  ["padding: 220px 96px 80px 96px;", "padding: 240px 120px 112px 120px;"],
  ["padding: 240px 96px 80px 96px;", "padding: 260px 120px 112px 120px;"],

  // Cover wordmark-big spacing
  ["margin-top: 96px;", "margin-top: 124px;"],

  // Cover heading
  ["font-size: 88px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.02; color: ${BRAND.ink};", "font-size: 104px; font-weight: 800; letter-spacing: -0.042em; line-height: 0.96; color: ${BRAND.ink};"],

  // .ph (page header)
  ["padding-bottom: 14px;", "padding-bottom: 18px;"],
  ["margin-bottom: 36px;", "margin-bottom: 56px;"],

  // h1.sec-h
  ["font-size: 52px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.05; color: ${BRAND.ink}; margin-bottom: 28px;", "font-size: 64px; font-weight: 800; letter-spacing: -0.030em; line-height: 1.02; color: ${BRAND.ink}; margin-bottom: 44px;"],

  // h2.sub-h
  ["font-size: 26px; font-weight: 700; letter-spacing: -0.012em; line-height: 1.2; color: ${BRAND.ink}; margin-top: 36px; margin-bottom: 16px;", "font-size: 32px; font-weight: 700; letter-spacing: -0.018em; line-height: 1.15; color: ${BRAND.ink}; margin-top: 56px; margin-bottom: 22px;"],

  // h3.minor-h
  ["font-size: 17px; font-weight: 700; letter-spacing: 0.02em; text-transform: uppercase; color: ${BRAND.cyanInk}; font-family: ${MONO}; margin-top: 28px; margin-bottom: 12px;", "font-size: 17px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${BRAND.cyanInk}; font-family: ${MONO}; margin-top: 38px; margin-bottom: 16px;"],

  // p (body type)
  ["font-size: 17px; color: ${BRAND.ink}; line-height: 1.6; margin-bottom: 14px;", "font-size: 18px; color: ${BRAND.ink}; line-height: 1.72; margin-bottom: 20px;"],

  // p.lede
  ["font-size: 22px; color: ${BRAND.inkDim}; line-height: 1.5; margin-bottom: 24px;", "font-size: 26px; color: ${BRAND.inkDim}; line-height: 1.48; margin-bottom: 36px;"],

  // ul/ol dense list items
  ["font-size: 16.5px; color: ${BRAND.ink}; padding: 8px 0 8px 26px; line-height: 1.55;", "font-size: 17px; color: ${BRAND.ink}; padding: 12px 0 12px 30px; line-height: 1.65;"],
  ["top: 18px; width: 14px;", "top: 22px; width: 16px;"],

  // .callout
  ["margin: 20px 0; padding: 18px 22px; background: rgba(34, 211, 238, 0.05); border-left: 3px solid ${BRAND.cyan}; border-radius: 0 8px 8px 0; font-size: 16px;", "margin: 32px 0; padding: 26px 30px; background: rgba(34, 211, 238, 0.04); border-left: 3px solid ${BRAND.cyan}; border-radius: 0 14px 14px 0; font-size: 17px;"],
  // .warn similar
  ["margin: 20px 0; padding: 18px 22px; background: rgba(251, 191, 36, 0.06); border-left: 3px solid ${BRAND.amber}; border-radius: 0 8px 8px 0; font-size: 16px;", "margin: 32px 0; padding: 26px 30px; background: rgba(251, 191, 36, 0.06); border-left: 3px solid ${BRAND.amber}; border-radius: 0 14px 14px 0; font-size: 17px;"],

  // Tables
  ["padding: 10px 14px; border-bottom: 1px solid ${BRAND.hair}; font-weight: 600;", "padding: 16px 18px; border-bottom: 0.6px solid ${BRAND.hair}; font-weight: 600;"],
  ["padding: 12px 14px; border-bottom: 1px solid ${BRAND.hairSoft};", "padding: 18px 18px; border-bottom: 0.6px solid ${BRAND.hairSoft};"],

  // Eyebrow rule width
  ["content: \"\"; width: 32px; height: 1px; background: ${BRAND.cyan}; display: inline-block;", "content: \"\"; width: 40px; height: 1px; background: ${BRAND.cyan}; display: inline-block;"],

  // Hairlines more refined
  ["border-top: 1px solid ${BRAND.hairSoft};", "border-top: 0.6px solid ${BRAND.hairSoft};"],
  ["border-top: 1px solid ${BRAND.ink};", "border-top: 1.2px solid ${BRAND.ink};"],

  // TOC
  ["padding: 14px 0; border-bottom: 1px dashed ${BRAND.hairSoft};", "padding: 18px 0; border-bottom: 0.6px dashed ${BRAND.hairSoft};"],
  ["font-size: 54px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.05; color: ${BRAND.ink}; margin-bottom: 56px;", "font-size: 64px; font-weight: 800; letter-spacing: -0.030em; line-height: 1.02; color: ${BRAND.ink}; margin-bottom: 72px;"],

  // hr.sep
  ["border-top: 1px solid ${BRAND.hairSoft}; margin: 32px 0;", "border-top: 0.6px solid ${BRAND.hairSoft}; margin: 44px 0;"],

  // ─── Drop shadows refined ───
  ["filter: drop-shadow(0 24px 48px rgba(11,19,32,0.18))", "filter: drop-shadow(0 32px 72px rgba(15,23,42,0.18)) drop-shadow(0 8px 24px rgba(34,211,238,0.10))"],
  ["filter: drop-shadow(0 28px 56px rgba(11,19,32,0.15))", "filter: drop-shadow(0 32px 72px rgba(15,23,42,0.18)) drop-shadow(0 8px 24px rgba(34,211,238,0.10))"],

  // ─── Landscape decks ───
  ["padding: 72px 96px;", "padding: 88px 112px;"],
  ["margin-bottom: 56px;", "margin-bottom: 72px;"],
  ["font-size: 72px; font-weight: 800; letter-spacing: -0.035em; line-height: 1.04; color: ${BRAND.ink}; max-width: 1300px;", "font-size: 84px; font-weight: 800; letter-spacing: -0.038em; line-height: 1.0; color: ${BRAND.ink}; max-width: 1380px;"],
  ["font-size: 40px; font-weight: 700; letter-spacing: -0.022em; line-height: 1.1; color: ${BRAND.ink}; margin-bottom: 18px; max-width: 1300px;", "font-size: 44px; font-weight: 700; letter-spacing: -0.025em; line-height: 1.08; color: ${BRAND.ink}; margin-bottom: 22px; max-width: 1380px;"],
];

const FILES = [
  "scripts/render-customer-docs.mjs",
  "scripts/render-study-docs.mjs",
  "scripts/render-position-statement.mjs",
  "scripts/render-hardware-design.mjs",
  "scripts/render-adoption-plan.mjs",
  "scripts/render-decks.mjs",
];

let totalChanges = 0;
for (const file of FILES) {
  const fullPath = path.resolve(process.cwd(), file);
  let content;
  try {
    content = await fs.readFile(fullPath, "utf8");
  } catch (e) {
    console.log(`× missing: ${file}`);
    continue;
  }
  let changes = 0;
  for (const [from, to] of REPLACEMENTS) {
    if (content.includes(from)) {
      const before = content.length;
      content = content.split(from).join(to);
      changes++;
    }
  }
  if (changes > 0) {
    await fs.writeFile(fullPath, content, "utf8");
    console.log(`✓ ${file} · ${changes} replacements`);
    totalChanges += changes;
  } else {
    console.log(`· ${file} · no changes`);
  }
}
console.log(`\nTotal: ${totalChanges} replacements across ${FILES.length} files.`);
