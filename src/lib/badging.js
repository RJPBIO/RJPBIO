/* Badging API — unread counter on the installed PWA icon. */
export function setBadge(n) {
  try {
    if (n > 0 && "setAppBadge" in navigator) return navigator.setAppBadge(n);
    if ("clearAppBadge" in navigator) return navigator.clearAppBadge();
  } catch {}
}

export function clearBadge() {
  try { if ("clearAppBadge" in navigator) return navigator.clearAppBadge(); } catch {}
}
