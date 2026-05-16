/* Fix the `margin: ,` regression in 16 marketing pages.
   Replaces empty margin value with the canonical pattern used in demo/page.jsx:
     margin: `${space[5]}px 0 0`
*/
import fs from "node:fs/promises";
import path from "node:path";

const FILES = [
  "src/app/for-aviation/page.jsx",
  "src/app/for-energy/page.jsx",
  "src/app/for-finance/page.jsx",
  "src/app/for-healthcare/page.jsx",
  "src/app/for-logistics/page.jsx",
  "src/app/for-manufacturing/page.jsx",
  "src/app/for-public-sector/page.jsx",
  "src/app/for-tech/page.jsx",
  "src/app/for/page.jsx",
  "src/app/learn/cronotipo/page.jsx",
  "src/app/learn/hrv-basics/page.jsx",
  "src/app/learn/page.jsx",
  "src/app/learn/respiracion-resonante/page.jsx",
  "src/app/vs/calm/page.jsx",
  "src/app/vs/headspace/page.jsx",
  "src/app/vs/modern-health/page.jsx",
];

const BAD = "              margin: ,";
const GOOD = "              margin: `${space[5]}px 0 0`,";

// Some files use 16 spaces (vs/* nested deeper). Check both.
const BAD_DEEP = "                margin: ,";
const GOOD_DEEP = "                margin: `${space[5]}px 0 0`,";

let total = 0;
for (const file of FILES) {
  const full = path.resolve(process.cwd(), file);
  let content = await fs.readFile(full, "utf8");
  let changed = false;
  if (content.includes(BAD)) {
    content = content.replace(BAD, GOOD);
    changed = true;
  }
  if (content.includes(BAD_DEEP)) {
    content = content.replace(BAD_DEEP, GOOD_DEEP);
    changed = true;
  }
  // Also handle without leading whitespace match (defensive)
  if (!changed && /margin:\s*,/.test(content)) {
    content = content.replace(/margin:\s*,/, "margin: `${space[5]}px 0 0`,");
    changed = true;
  }
  if (changed) {
    // Verify space[N] is imported, or fall back to hardcoded value
    if (!/from\s+"@\/components\/ui\/tokens"/.test(content) && !/import\s+\{[^}]*\bspace\b/.test(content)) {
      // No space import — use hardcoded fallback
      content = content.replace("margin: `${space[5]}px 0 0`,", "margin: \"24px 0 0\",");
    }
    await fs.writeFile(full, content, "utf8");
    console.log(`✓ fixed ${file}`);
    total++;
  } else {
    console.log(`· no margin: , found in ${file}`);
  }
}
console.log(`\nTotal: ${total} files fixed.`);
