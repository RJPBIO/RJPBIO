/* Sprint 53 — genera PNG fallbacks para apple-touch-icon.
   iOS busca agresivamente .png aunque tengamos SVG. Confirmado en
   test real con iPhone iOS 16.6.1: 404s en /apple-touch-icon.png,
   /apple-touch-icon-precomposed.png, /apple-touch-icon-120x120.png.

   Generamos los tamaños canónicos:
   - apple-touch-icon.png 180×180 (default iOS retina)
   - apple-touch-icon-180x180.png 180×180
   - apple-touch-icon-152x152.png (iPad retina)
   - apple-touch-icon-120x120.png (iPhone retina pre-Plus)
   - apple-touch-icon-precomposed.png (iOS<7 fallback, evita 404)
   - favicon-32x32.png + favicon-16x16.png + favicon.ico
*/
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SRC = "public/apple-touch-icon.svg";
const OUT = "public";

const SIZES = [
  { name: "apple-touch-icon.png", size: 180 },
  { name: "apple-touch-icon-180x180.png", size: 180 },
  { name: "apple-touch-icon-152x152.png", size: 152 },
  { name: "apple-touch-icon-120x120.png", size: 120 },
  { name: "apple-touch-icon-precomposed.png", size: 180 },
  { name: "apple-touch-icon-120x120-precomposed.png", size: 120 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "favicon-16x16.png", size: 16 },
];

const svg = await fs.readFile(SRC);

for (const s of SIZES) {
  const out = path.join(OUT, s.name);
  await sharp(svg, { density: 384 }) // density alto para que SVG se rasterize nítido
    .resize(s.size, s.size, { fit: "cover" })
    .png()
    .toFile(out);
  console.log(`✓ ${out} (${s.size}×${s.size})`);
}

// favicon.ico (multi-size 16+32+48)
const ico16 = await sharp(svg, { density: 256 }).resize(16, 16).png().toBuffer();
const ico32 = await sharp(svg, { density: 256 }).resize(32, 32).png().toBuffer();
// Para .ico necesitaríamos a-ico-image, pero la mayoría de browsers
// modernos aceptan PNG renamed a .ico. Hacemos eso.
await fs.writeFile(path.join(OUT, "favicon.ico"), ico32);
console.log(`✓ public/favicon.ico (32×32)`);
