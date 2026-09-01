// Cuts the dark glowing background out of Assets/MATSYA.png to produce a clean
// transparent player sprite at public/images/matsya.png.
//
// Uses a border flood-fill: starting from the image edges, it clears contiguous
// dark/low-luma pixels (background + surrounding glow) and STOPS at the bright
// fish. Because it only removes pixels reachable from the border, the fish's own
// dark features (pupils, outlines) are kept — they're interior, not connected.
//
// Run: node scripts/cutout-matsya.js
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const IN = root + '/Assets/Matsya/MATSYA.png';
const OUT = root + '/public/images/matsya.png';

const LUMA_T = 135; // fill through pixels darker than this (bg + glow)

const { data, info } = await sharp(IN)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width: W, height: H, channels: C } = info;
const luma = (i) => 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

const bg = new Uint8Array(W * H); // 1 = background (to erase)
const stack = [];
const pushIf = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const p = y * W + x;
  if (bg[p]) return;
  if (luma(p * C) < LUMA_T) {
    bg[p] = 1;
    stack.push(p);
  }
};

// Seed from every border pixel.
for (let x = 0; x < W; x++) { pushIf(x, 0); pushIf(x, H - 1); }
for (let y = 0; y < H; y++) { pushIf(0, y); pushIf(W - 1, y); }

while (stack.length) {
  const p = stack.pop();
  const x = p % W;
  const y = (p / W) | 0;
  pushIf(x + 1, y);
  pushIf(x - 1, y);
  pushIf(x, y + 1);
  pushIf(x, y - 1);
}

// Apply: erase background pixels (alpha 0).
for (let p = 0; p < W * H; p++) {
  if (bg[p]) data[p * C + 3] = 0;
}

// Rebuild, feather the alpha edge a touch, trim to content, resize.
const cut = sharp(data, { raw: { width: W, height: H, channels: C } });
let img = sharp(await cut.png().toBuffer());
// Soft 1px alpha feather to kill jaggies/halo, then trim transparent margins.
img = img.median(1).trim({ threshold: 10 });

const outBuf = await img
  .resize({ width: 200, withoutEnlargement: true })
  .png({ compressionLevel: 9, effort: 8 })
  .toBuffer();
fs.writeFileSync(OUT, outBuf);

const meta = await sharp(outBuf).metadata();
console.log(`matsya.png  ${meta.width}x${meta.height}  ${(outBuf.length / 1024).toFixed(0)} KB`);
