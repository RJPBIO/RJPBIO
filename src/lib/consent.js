/* ═══════════════════════════════════════════════════════════════
   Consent helper — reads/writes the granular consent state used
   by ConsentBanner and any module that needs to gate analytics or
   marketing features on user choice.

   Storage key bumped to v2 when categories were introduced. v1
   "accepted" records are treated as minimal (necessary only) so
   we ask the user again to split analytics/marketing.
   ═══════════════════════════════════════════════════════════════ */

export const CONSENT_KEY = "bio-consent-v2";
export const LEGACY_KEY = "bio-consent-v1";

export const DEFAULT_CONSENT = {
  v: 2,
  necessary: true,
  analytics: false,
  marketing: false,
  ts: 0,
  decided: false,
};

export function readConsent() {
  if (typeof window === "undefined") return { ...DEFAULT_CONSENT };
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.v === 2) {
        return {
          v: 2,
          necessary: true,
          analytics: Boolean(parsed.analytics),
          marketing: Boolean(parsed.marketing),
          ts: Number(parsed.ts) || 0,
          decided: true,
        };
      }
    }
    if (localStorage.getItem(LEGACY_KEY)) {
      return { ...DEFAULT_CONSENT, decided: false };
    }
  } catch {}
  return { ...DEFAULT_CONSENT };
}

export function writeConsent(partial) {
  if (typeof window === "undefined") return;
  const next = {
    v: 2,
    necessary: true,
    analytics: Boolean(partial?.analytics),
    marketing: Boolean(partial?.marketing),
    ts: Date.now(),
  };
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    localStorage.removeItem(LEGACY_KEY);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("bio-consent:changed", { detail: next }));
  } catch {}
  return { ...next, decided: true };
}

export function hasAnalyticsConsent() {
  return readConsent().analytics === true;
}

export function hasMarketingConsent() {
  return readConsent().marketing === true;
}

export function openConsent() {
  if (typeof window === "undefined") return;
  try { window.dispatchEvent(new Event("bio-consent:open")); } catch {}
}
