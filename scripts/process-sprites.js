// Processes the provided gameplay art into game-ready transparent sprites in
// public/images/. Three job types:
//   'white' : art on an opaque white background -> border flood-fill removes the
//             white bg but keeps interior white highlights (eyes/teeth), + trim.
//   'sheet' : a transparent sprite SHEET -> crop one clean frame + trim (the
//             frames already have alpha; we just isolate and tighten one).
//   'single': already-transparent single art -> trim + resize.
//
// Run: node scripts/process-sprites.js [name]
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = root + '/Assets';
const OUT = root + '/public/images';
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2];

const JOBS = [
  { key: 'enemyFish', file: 'enemyFish.png', type: 'white', width: 150 },
  { key: 'eel', file: 'eel.png', type: 'white', width: 200 },
  // sheets: crop = [x,y,w,h] isolating ONE frame; trim tightens on alpha
  { key: 'sage', file: 'sage.png', type: 'sheet', crop: [12, 24, 244, 268], trim: 30, width: 120 },
  { key: 'seed', file: 'seed.png', type: 'sheet', crop: [70, 24, 210, 250], trim: 30, width: 96 },
  { key: 'animal', file: 'animal.png', type: 'sheet', crop: [28, 18, 250, 272], trim: 25, width: 130 },
  { key: 'scroll', file: 'scroll.png', type: 'sheet', crop: [66, 20, 220, 320], trim: 30, width: 92 },
  { key: 'boss', file: 'boss.png', type: 'sheet', crop: [18, 462, 250, 236], trim: 25, width: 240 },
  { key: 'boat', file: 'boat.png', type: 'sheet', crop: [30, 20, 360, 350], trim: 22, width: 210 }
];

async function finish(imgBuf, job) {
  const buf = await sharp(imgBuf)
    .trim({ threshold: job.trim ?? 12 })
    .resize({ width: job.width, withoutEnlargement: true })
    .png({ compressionLevel: 9, effort: 8 })
    .toBuffer();
  fs.writeFileSync(`${OUT}/${job.key}.png`, buf);
  const m = await sharp(buf).metadata();
  console.log(`${job.key.padEnd(11)} ${job.type.padEnd(7)} ${m.width}x${m.height}  ${(buf.length / 1024).toFixed(0)}KB`);
}

async function sheet(job) {
  const [x, y, w, h] = job.crop;
  const buf = await sharp(`${SRC}/${job.file}`).extract({ left: x, top: y, width: w, height: h }).png().toBuffer();
  await finish(buf, job);
}

async function white(job) {
  const { data, info } = await sharp(`${SRC}/${job.file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const isWhite = (p) => data[p] > 232 && data[p + 1] > 232 && data[p + 2] > 232;
  const bg = new Uint8Array(W * H);
  const stack = [];
  const seed = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (bg[p]) return;
    if (isWhite(p * C)) { bg[p] = 1; stack.push(p); }
  };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  while (stack.length) {
    const p = stack.pop(); const x = p % W, y = (p / W) | 0;
    seed(x + 1, y); seed(x - 1, y); seed(x, y + 1); seed(x, y - 1);
  }
  for (let p = 0; p < W * H; p++) if (bg[p]) data[p * C + 3] = 0;
  const buf = await sharp(data, { raw: { width: W, height: H, channels: C } }).median(1).png().toBuffer();
  await finish(buf, job);
}

for (const job of JOBS) {
  if (only && job.key !== only) continue;
  if (job.type === 'white') await white(job);
  else await sheet(job);
}
console.log('done.');
