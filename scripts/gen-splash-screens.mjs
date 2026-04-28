/* Sprint 85 — Genera apple-touch-startup-image PNGs para iOS PWA.

   iOS busca splashes específicos por dimensiones exactas + media queries
   con device-width, device-height, -webkit-device-pixel-ratio, orientation.
   Si no encuentra match, muestra blank screen → bad first-impression.

   Cubrimos PORTRAIT only porque manifest.webmanifest tiene
   `orientation: "portrait"` — la PWA está locked a portrait standalone.

   Devices cubiertos (top 95%+ del market actual):
     · iPhone 15/14 Pro Max         (1290×2796)
     · iPhone 15/14 Pro             (1179×2556)
     · iPhone 15/14 Plus, 12/13 Pro Max (1284×2778)
     · iPhone 15/14, 12/13 + Pro    (1170×2532)
     · iPhone 13 mini, 12 mini, 11 Pro, X, XS (1125×2436)
     · iPhone 11 Pro Max, XS Max    (1242×2688)
     · iPhone 11, XR                (828×1792)
     · iPhone 8/7/6 Plus            (1242×2208)
     · iPhone SE 2/3, 8, 7, 6/6S    (750×1334)
     · iPad Pro 12.9"               (2048×2732)
     · iPad Pro 11" / Air 11"       (1668×2388)
     · iPad Air 10.9"               (1640×2360)
     · iPad 10.2"                   (1620×2160)
     · iPad mini 8.3" / 7.9"        (1488×2266)
     · iPad 9.7"                    (1536×2048)

   Diseño: BioGlyph centrado a 32% de min(w,h) sobre fondo #0B0E14
   (matches manifest background_color). Apple HIG recomienda splashes
   minimales — mark + bg, sin texto (no traducible, no localizable).

   Uso: node scripts/gen-splash-screens.mjs
*/
import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const BG = "#0B0E14";
const SRC = "public/splash-glyph.svg";
const OUT_DIR = "public/splash";

const SIZES = [
  // iPhone — sorted by recency (newest first)
  { w: 1290, h: 2796, label: "iPhone 15/14 Pro Max" },
  { w: 1179, h: 2556, label: "iPhone 15/14 Pro" },
  { w: 1284, h: 2778, label: "iPhone 14 Plus, 13/12 Pro Max" },
  { w: 1170, h: 2532, label: "iPhone 15/14/13/12 + Pro" },
  { w: 1125, h: 2436, label: "iPhone 13 mini, 11 Pro, X" },
  { w: 1242, h: 2688, label: "iPhone 11 Pro Max, XS Max" },
  { w: 828,  h: 1792, label: "iPhone 11, XR" },
  { w: 1242, h: 2208, label: "iPhone 8/7/6 Plus" },
  { w: 750,  h: 1334, label: "iPhone 8, 7, SE 2/3" },
  // iPad
  { w: 2048, h: 2732, label: "iPad Pro 12.9\"" },
  { w: 1668, h: 2388, label: "iPad Pro 11\" / Air 11\"" },
  { w: 1640, h: 2360, label: "iPad Air 10.9\"" },
  { w: 1620, h: 2160, label: "iPad 10.2\"" },
  { w: 1488, h: 2266, label: "iPad mini 8.3\"/7.9\"" },
  { w: 1536, h: 2048, label: "iPad 9.7\"" },
];

await mkdir(resolve(OUT_DIR), { recursive: true });
const svg = await readFile(SRC);

console.log(`Generando ${SIZES.length} splash screens en ${OUT_DIR}/...\n`);

for (const s of SIZES) {
  // Glyph a 32% del min(w,h) — matches Apple guidelines (logo NO debe
  // ocupar más de 1/3 del viewport). Centrado matemáticamente.
  const glyphSize = Math.round(Math.min(s.w, s.h) * 0.32);
  const top = Math.round((s.h - glyphSize) / 2);
  const left = Math.round((s.w - glyphSize) / 2);

  // Renderizamos el SVG a la dimensión target con density alto para
  // anti-aliasing nítido. Sharp rasteriza el SVG a PNG, mantiene
  // transparencia de los rayos y glow.
  const glyphPng = await sharp(svg, { density: 384 })
    .resize(glyphSize, glyphSize)
    .png()
    .toBuffer();

  const out = resolve(OUT_DIR, `splash-${s.w}x${s.h}.png`);
  await sharp({
    create: {
      width: s.w,
      height: s.h,
      channels: 3,
      background: BG,
    },
  })
    .composite([{ input: glyphPng, top, left }])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(`  ✓ ${s.w}×${s.h} — ${s.label}`);
}

console.log(`\n✓ Generados ${SIZES.length} splash screens.`);
console.log(`Total: ~${Math.round((SIZES.length * 200) / 1024)} KB (estimate).`);
console.log(`\nNext: añadir <link rel="apple-touch-startup-image"> tags a layout.js`);
