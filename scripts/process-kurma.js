// Processes Chapter 2 (Kurma) art from Assets/Kurma/ into game-ready sprites in
// public/images/. Handles: dark-glow cutout (hero + shell), light/checker key
// (rock, poison, asura on light bg), transparent trims (treasure, amrita), and
// the opaque level background -> JPG.
//
// Run: node scripts/process-kurma.js [preview]
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = root + '/Assets/Kurma';
const OUT = root + '/public/images';
fs.mkdirSync(OUT, { recursive: true });

const luma = (d, i) => 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];

function floodClear(data, W, H, C, isBg) {
  const bg = new Uint8Array(W * H); const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x; if (bg[p]) return;
    if (isBg(p * C)) { bg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1); }
  for (let p = 0; p < W * H; p++) if (bg[p]) data[p * C + 3] = 0;
}

// mode: 'dark' (remove dark glow), 'light' (remove white/grey checker)
async function cut(file, { crop, mode, t, desat = 28, width, out }) {
  let img = sharp(`${SRC}/${file}`).ensureAlpha();
  if (crop) img = img.extract({ left: crop[0], top: crop[1], width: crop[2], height: crop[3] });
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  let isBg;
  if (mode === 'dark') isBg = (i) => luma(data, i) < t;
  else isBg = (i) => { const mx = Math.max(data[i], data[i + 1], data[i + 2]); const mn = Math.min(data[i], data[i + 1], data[i + 2]); return luma(data, i) > t && (mx - mn) < desat; };
  floodClear(data, W, H, C, isBg);
  const buf = await sharp(await sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer())
    .median(1).trim({ threshold: 8 }).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9, effort: 8 }).toBuffer();
  fs.writeFileSync(`${OUT}/${out}.png`, buf);
  return buf;
}

async function trimOnly(file, width, out) {
  const buf = await sharp(`${SRC}/${file}`).trim({ threshold: 10 }).resize({ width, withoutEnlargement: true }).png({ compressionLevel: 9, effort: 8 }).toBuffer();
  fs.writeFileSync(`${OUT}/${out}.png`, buf);
  return buf;
}

const results = {};
results.kurma = await cut('kurma.png', { mode: 'dark', t: 120, width: 520, out: 'kurma' });
results.kurmaShell = await cut('kurmaShell.png', { crop: [330, 70, 900, 640], mode: 'dark', t: 120, width: 520, out: 'kurmaShell' });
results.rock = await cut('rock.png', { mode: 'light', t: 188, desat: 30, width: 110, out: 'rock' });
results.poison = await cut('poison.png', { mode: 'light', t: 188, desat: 30, width: 150, out: 'poison' });
results.asura = await cut('asura.png', { mode: 'light', t: 200, desat: 40, width: 240, out: 'asura' });
results.treasure = await trimOnly('treasure.png', 64, 'treasure');
results.amritaPot = await trimOnly('amritaPot.png', 92, 'amritaPot');

// Level background -> JPG (opaque)
const bgBuf = await sharp(`${SRC}/Kurama bg.png`).resize({ width: 900 }).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
fs.writeFileSync(`${OUT}/kurmaBg.jpg`, bgBuf);

for (const [k, b] of Object.entries(results)) { const m = await sharp(b).metadata(); console.log(`${k.padEnd(11)} ${m.width}x${m.height}  ${(b.length / 1024).toFixed(0)}KB`); }
console.log(`kurmaBg.jpg  ${(bgBuf.length / 1024).toFixed(0)}KB`);

// contact-sheet preview
const keys = ['kurma', 'kurmaShell', 'rock', 'poison', 'asura', 'treasure', 'amritaPot'];
const cell = 250, cols = 4, rows = 2;
const sheet = sharp({ create: { width: cols * cell, height: rows * cell, channels: 4, background: '#0a3a5c' } });
const comps = [];
for (let i = 0; i < keys.length; i++) {
  const b = await sharp(`${OUT}/${keys[i]}.png`).resize({ width: cell - 40, height: cell - 50, fit: 'inside' }).toBuffer();
  const md = await sharp(b).metadata();
  comps.push({ input: b, left: (i % cols) * cell + ((cell - md.width) >> 1), top: Math.floor(i / cols) * cell + ((cell - md.height) >> 1) });
}
fs.writeFileSync(process.env.TEMP + '/kurma_preview.png', await sheet.composite(comps).png().toBuffer());
console.log('preview written');
