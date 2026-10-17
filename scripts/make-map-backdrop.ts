// tsx scripts/make-map-backdrop.ts <scan.tif> <out-name> <left> <top> <width> <height>
//
// Turns a historic map scan into the pair of blurred backdrops a review page
// shows behind its card (see apps/web-olive/src/backdrops.ts). The crop is in
// fractions of the scan, so the same numbers work at any scan resolution; crop
// inside the neatline to drop margins and library stamps.
//
// The scan itself is not committed, only the two small webp files written to
// apps/web-olive/public/backdrops/. Light keeps the paper, faded; dark is the
// inverse in grey, so the linework reads as pale lines on the dark backdrop.
// Both are toned further by a CSS wash, so their colour here stays neutral.

import { resolve } from 'node:path';
import sharp from 'sharp';

const [src, name, ...fractions] = process.argv.slice(2);
const [left, top, width, height] = fractions.map(Number);
if (!src || !name || [left, top, width, height].some((n) => n === undefined || Number.isNaN(n))) {
  console.error('usage: make-map-backdrop <scan.tif> <out-name> <left> <top> <width> <height>');
  process.exit(1);
}

const outDir = resolve(import.meta.dirname, '../apps/web-olive/public/backdrops');
const meta = await sharp(src, { limitInputPixels: false }).metadata();
const W = meta.width;
const H = meta.height;
const crop = {
  left: Math.round(W * (left ?? 0)),
  top: Math.round(H * (top ?? 0)),
  width: Math.round(W * (width ?? 1)),
  height: Math.round(H * (height ?? 1)),
};
const base = () =>
  sharp(src, { limitInputPixels: false }).extract(crop).resize({ width: 1800 }).blur(2.2);

await base()
  .modulate({ saturation: 0.55, brightness: 1.04 })
  .webp({ quality: 62 })
  .toFile(resolve(outDir, `${name}-light.webp`));
await base()
  .negate({ alpha: false })
  .grayscale()
  .linear(0.55, 0)
  .webp({ quality: 62 })
  .toFile(resolve(outDir, `${name}-dark.webp`));

console.log(`wrote ${name}-light.webp and ${name}-dark.webp from`, crop);
