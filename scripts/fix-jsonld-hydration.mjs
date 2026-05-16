/* Fix hydration mismatch en scripts <script type="application/ld+json" nonce={...}>.
   El browser strip-ea el nonce attribute post-SSR (CSP3 security), causing React
   to detect diff. Fix: agregar suppressHydrationWarning. */
import fs from "node:fs/promises";

const FILES = [
  "src/app/demo/page.jsx",
  "src/app/layout.js",
  "src/app/nom35/page.jsx",
  "src/app/pricing/page.jsx",
  "src/app/trust/page.jsx",
  "src/app/why/page.jsx",
];

let total = 0;
for (const f of FILES) {
  let c = await fs.readFile(f, "utf8");
  // Match `<script\n          type="application/ld+json"\n          nonce={nonce}\n` pattern
  // and insert suppressHydrationWarning after nonce if not already present
  const before = c;
  c = c.replace(
    /(<script\s*\n\s*type="application\/ld\+json"\s*\n\s*nonce=\{[^}]+\})\s*\n(\s*)(dangerouslySetInnerHTML)/g,
    "$1\n$2suppressHydrationWarning\n$2$3"
  );
  if (c !== before && !before.includes("suppressHydrationWarning")) {
    await fs.writeFile(f, c, "utf8");
    console.log(`✓ ${f}`);
    total++;
  } else if (before.includes("suppressHydrationWarning")) {
    console.log(`· ${f} (already has suppressHydrationWarning)`);
  } else {
    console.log(`? ${f} (no match)`);
  }
}
console.log(`\nTotal: ${total} fixed.`);
