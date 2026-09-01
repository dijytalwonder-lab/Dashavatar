// Builds a Matsya swim-cycle spritesheet from Assets/MatsySprites.png (top row =
// 6 right-facing swim poses). Extracts uniform cells, clears the faint gradient
// haze (low-alpha pixels), and lays them out as a horizontal strip for Phaser's
// this.load.spritesheet(). Also writes a preview.
//
// Run: node scripts/build-matsya-swim.js
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = root + '/Assets/MatsySprites.png';
const OUTDIR = root + '/public/images';

// Top-row cells (source is 1536x1024, ~6 columns).
const CELL_W = 250, CELL_H = 186, Y = 9;
const XS = [2, 258, 512, 768, 1022, 1278];
const ALPHA_MIN = 55; // clear faint gradient/glow below this

async function extractFrame(x) {
  const { data, info } = await sharp(SRC)
    .extract({ left: x, top: Y, width: CELL_W, height: CELL_H })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  for (let p = 0; p < W * H; p++) {
    if (data[p * C + 3] < ALPHA_MIN) data[p * C + 3] = 0;
  }
  return { data, W, H, C };
}

// content bbox of opaque pixels
function bbox(f) {
  let minx = f.W, miny = f.H, maxx = 0, maxy = 0;
  for (let y = 0; y < f.H; y++) for (let x = 0; x < f.W; x++) {
    if (f.data[(y * f.W + x) * f.C + 3] > 60) {
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
  }
  return { minx, miny, maxx, maxy, w: maxx - minx + 1, h: maxy - miny + 1 };
}

const frames = [];
for (const x of XS) frames.push(await extractFrame(x));

// Report each frame's content bbox so we can align on the head (right edge).
const boxes = frames.map(bbox);
boxes.forEach((b, i) => console.log(`frame ${i}: bbox ${b.w}x${b.h} at (${b.minx},${b.miny}) right=${b.maxx}`));

// Build a horizontal strip of raw cells (uniform CELL_W x CELL_H).
const strip = sharp({ create: { width: CELL_W * frames.length, height: CELL_H, channels: 4, background: '#00000000' } });
const comps = [];
for (let i = 0; i < frames.length; i++) {
  const png = await sharp(frames[i].data, { raw: { width: CELL_W, height: CELL_H, channels: 4 } }).png().toBuffer();
  comps.push({ input: png, left: i * CELL_W, top: 0 });
}
const stripBuf = await strip.composite(comps).png({ compressionLevel: 9 }).toBuffer();
fs.writeFileSync(`${OUTDIR}/matsya_swim.png`, stripBuf);
console.log(`matsya_swim.png  ${CELL_W * frames.length}x${CELL_H}  (${frames.length} frames @ ${CELL_W}x${CELL_H})  ${(stripBuf.length / 1024).toFixed(0)}KB`);

// Preview on water blue
const prev = sharp({ create: { width: CELL_W * frames.length, height: CELL_H, channels: 4, background: '#0a3a5c' } });
fs.writeFileSync(process.env.TEMP + '/matsya_swim_preview.png', await prev.composite([{ input: stripBuf, left: 0, top: 0 }]).png().toBuffer());
console.log('preview written');
