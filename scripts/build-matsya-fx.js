// Extracts extra Matsya action poses from MatsySprites.png:
//   dash   -> whirlpool poses (2 frames)   -> public/images/matsya_dash.png
//   attack -> cast / ring poses (2 frames)  -> public/images/matsya_attack.png
// Same cleanup as the swim strip (clear faint gradient haze).
//
// Run: node scripts/build-matsya-fx.js [preview]
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = root + '/Assets/MatsySprites.png';
const OUTDIR = root + '/public/images';
const ALPHA_MIN = 55;

// [x, y, w, h] crops on the 1536x1024 sheet
const SETS = {
  dash: { cell: [250, 200], frames: [[984, 672], [1284, 672]] },   // whirlpool poses
  attack: { cell: [250, 190], frames: [[18, 500], [258, 500]] }     // cast/ring poses
};

async function frame(x, y, w, h) {
  const { data, info } = await sharp(SRC).extract({ left: x, top: y, width: w, height: h })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  for (let p = 0; p < W * H; p++) if (data[p * C + 3] < ALPHA_MIN) data[p * C + 3] = 0;
  return sharp(data, { raw: { width: W, height: H, channels: C } }).png().toBuffer();
}

for (const [name, set] of Object.entries(SETS)) {
  const [cw, ch] = set.cell;
  const comps = [];
  for (let i = 0; i < set.frames.length; i++) {
    const [x, y] = set.frames[i];
    comps.push({ input: await frame(x, y, cw, ch), left: i * cw, top: 0 });
  }
  const strip = sharp({ create: { width: cw * set.frames.length, height: ch, channels: 4, background: '#00000000' } });
  const buf = await strip.composite(comps).png({ compressionLevel: 9 }).toBuffer();
  fs.writeFileSync(`${OUTDIR}/matsya_${name}.png`, buf);
  console.log(`matsya_${name}.png  ${cw * set.frames.length}x${ch}  (${set.frames.length}@${cw}x${ch})  ${(buf.length / 1024).toFixed(0)}KB`);
  // preview on blue
  const prev = sharp({ create: { width: cw * set.frames.length, height: ch, channels: 4, background: '#0a3a5c' } });
  fs.writeFileSync(process.env.TEMP + `/matsya_${name}_preview.png`, await prev.composite([{ input: buf, left: 0, top: 0 }]).png().toBuffer());
}
console.log('done');
