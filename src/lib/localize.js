/* ═══════════════════════════════════════════════════════════════
   LOCALIZE — helpers for display names/subtitles of protocols &
   programs in the user's current locale.

   Falls back to the source (Spanish) if the locale dictionary
   doesn't have an entry. This is the "Tier A" localization — UI
   chrome + short identifiers — enough to run demos in English
   without translating the full protocol instruction content.

   Long-form content (iExec steps, phase i, science sc) stays in
   source language by design — full translation is a larger phase.

   Usage:
     import { protocolDisplayName, protocolDisplaySubtitle } from "./localize";
     const name = protocolDisplayName(protocol); // auto-detects current locale
     const name = protocolDisplayName(protocol, "en"); // forced locale
   ═══════════════════════════════════════════════════════════════ */

import { LOCALES, getLocale, FALLBACK_LOCALE } from "./i18n";

function resolveField(dict, id, field) {
  if (!dict) return null;
  const entry = dict[String(id)];
  if (!entry) return null;
  return entry[field] || null;
}

/**
 * Display name for a protocol in the given (or current) locale.
 * Fallback order: locale.protocols.<id>.n → EN.protocols.<id>.n → protocol.n (source).
 */
export function protocolDisplayName(protocol, locale) {
  if (!protocol) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.protocols, protocol.id, "n");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enName = resolveField(LOCALES[FALLBACK_LOCALE]?.protocols, protocol.id, "n");
    if (enName) return enName;
  }
  return protocol.n || "";
}

/**
 * Display subtitle for a protocol.
 */
export function protocolDisplaySubtitle(protocol, locale) {
  if (!protocol) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.protocols, protocol.id, "sb");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enSb = resolveField(LOCALES[FALLBACK_LOCALE]?.protocols, protocol.id, "sb");
    if (enSb) return enSb;
  }
  return protocol.sb || "";
}

/**
 * Display name for a program (by id string).
 */
export function programDisplayName(program, locale) {
  if (!program) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.programsData, program.id, "n");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enName = resolveField(LOCALES[FALLBACK_LOCALE]?.programsData, program.id, "n");
    if (enName) return enName;
  }
  return program.n || "";
}

/**
 * Display subtitle for a program.
 */
export function programDisplaySubtitle(program, locale) {
  if (!program) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.programsData, program.id, "sb");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enSb = resolveField(LOCALES[FALLBACK_LOCALE]?.programsData, program.id, "sb");
    if (enSb) return enSb;
  }
  return program.sb || "";
}

/**
 * Display long-form description for a program.
 */
export function programDisplayLong(program, locale) {
  if (!program) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.programsData, program.id, "sbLong");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enLong = resolveField(LOCALES[FALLBACK_LOCALE]?.programsData, program.id, "sbLong");
    if (enLong) return enLong;
  }
  return program.sb_long || "";
}

/**
 * Display rationale for a program.
 */
export function programDisplayRationale(program, locale) {
  if (!program) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.programsData, program.id, "rationale");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enRat = resolveField(LOCALES[FALLBACK_LOCALE]?.programsData, program.id, "rationale");
    if (enRat) return enRat;
  }
  return program.rationale || "";
}

/**
 * Display evidence blurb for a program.
 */
export function programDisplayEvidence(program, locale) {
  if (!program) return "";
  const loc = locale || getLocale();
  const localized = resolveField(LOCALES[loc]?.programsData, program.id, "evidence");
  if (localized) return localized;
  if (loc !== FALLBACK_LOCALE) {
    const enEv = resolveField(LOCALES[FALLBACK_LOCALE]?.programsData, program.id, "evidence");
    if (enEv) return enEv;
  }
  return program.evidence || "";
}
