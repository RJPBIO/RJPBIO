import { webcrypto } from "node:crypto";
import "fake-indexeddb/auto";

if (!globalThis.crypto) globalThis.crypto = webcrypto;

// Polyfill de matchMedia para jsdom
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (q) => ({
    matches: false, media: q, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
  });
}
