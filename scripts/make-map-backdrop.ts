// tsx scripts/make-map-backdrop.ts <scan.tif> <out-dir> <out-name> <left> <top> <width> <height>
//
// Turns a historic map scan into the pair of blurred backdrops a review page
// shows behind its card. The crop is in
// fractions of the scan, so the same numbers work at any scan resolution; crop
// inside the neatline to drop margins and library stamps.
//
// Neither the scan nor the output is committed: the backdrops are site copy.
// Upload both files to the CMS media library, then add published Site Copy
// documents `review_backdrop_<city>_light` and `_dark` holding their URLs. Note
// the map's source, licence and these arguments in each document's
// description, so a sheet can be re-cropped later. Every map must be free to
// use on a site that takes tips: USGS sheets are public domain; collections
// licensed for non-commercial use only (David Rumsey, for one) are not.
//
// Light keeps the paper, faded; dark is the
// inverse in grey, so the linework reads as pale lines on the dark backdrop.
// Both are toned further by a CSS wash, so their colour here stays neutral.

import { resolve } from 'node:path';
import sharp from 'sharp';

const [src, dir, name, ...fractions] = process.argv.slice(2);
const [left, top, width, height] = fractions.map(Number);
if (
  !src ||
  !dir ||
  !name ||
  [left, top, width, height].some((n) => n === undefined || Number.isNaN(n))
) {
  console.error(
    'usage: make-map-backdrop <scan.tif> <out-dir> <out-name> <left> <top> <width> <height>',
  );
  process.exit(1);
}

const outDir = resolve(dir);
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
