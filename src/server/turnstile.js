/* Cloudflare Turnstile — anti-bot on signin/signup. */
export async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { success: true, skipped: true };
  if (!token) return { success: false, error: "missing-token" };
  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ secret, response: token, remoteip: ip || "" }).toString(),
  });
  return r.json();
}
