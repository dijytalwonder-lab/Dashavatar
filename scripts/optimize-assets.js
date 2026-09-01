// One-shot optimizer: shrinks the source art in Assets/ into right-sized,
// well-compressed PNGs in public/images/ (what the game actually loads).
// Run: node scripts/optimize-assets.js
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const root = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const SRC = root + '/Assets';
const OUT = root + '/public/images';
fs.mkdirSync(OUT, { recursive: true });

// [srcFile, outKey, targetWidth, hasAlpha]
const jobs = [
  ['MainMenuBg.png', 'menuBg', 820, false],
  ['MatsyaWorld.png', 'matsyaWorldBg', 1500, false],
  ['logo.png', 'logo', 1000, true],
  ['play.png', 'btnPlay', 900, true],
  ['chapters.png', 'btnChapters', 900, true],
  ['settings.png', 'btnSettings', 900, true]
];

for (const [file, key, width, alpha] of jobs) {
  const inPath = `${SRC}/${file}`;
  const outPath = `${OUT}/${key}.png`;
  let img = sharp(inPath).resize({ width, withoutEnlargement: true });
  if (alpha) {
    // UI art with transparency — keep alpha, quantize the palette to shrink.
    img = img.png({ compressionLevel: 9, quality: 90, effort: 8, palette: true });
  } else {
    // Opaque backgrounds — flatten + strong palette quantization.
    img = img.flatten({ background: '#0a2233' }).png({ compressionLevel: 9, quality: 82, effort: 8, palette: true });
  }
  const info = await img.toFile(outPath);
  const kb = (fs.statSync(outPath).size / 1024).toFixed(0);
  console.log(`${key.padEnd(14)} ${info.width}x${info.height}  ->  ${kb} KB`);
}
console.log('done.');
