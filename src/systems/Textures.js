// Textures — procedurally draws every sprite with Phaser Graphics and bakes them
// into named textures. Ships the game with NO image files while keeping clean
// asset keys ('matsya', 'sage', 'scroll'…) so real art can be dropped in later
// by loading images under the same keys in PreloadScene.

import { COLORS } from '../config.js';

function makeCanvasTexture(scene, key, w, h, drawFn) {
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  drawFn(ctx, w, h);
  tex.refresh();
}

// Convert a 0xRRGGBB int to a css string.
function css(hex, alpha = 1) {
  const r = (hex >> 16) & 0xff;
  const g = (hex >> 8) & 0xff;
  const b = hex & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

export function generateAllTextures(scene) {
  // --- Matsya: a sleek golden-teal fish facing right ---
  // Skipped when the real hero sprite (public/images/matsya.png) is loaded.
  if (!scene.textures.exists('matsya'))
  makeCanvasTexture(scene, 'matsya', 96, 60, (ctx, w, h) => {
    // tail
    ctx.fillStyle = css(COLORS.matsyaFin);
    ctx.beginPath();
    ctx.moveTo(8, h / 2);
    ctx.lineTo(-2, 8);
    ctx.lineTo(30, h / 2);
    ctx.lineTo(-2, h - 8);
    ctx.closePath();
    ctx.fill();
    // body
    const grad = ctx.createLinearGradient(20, 0, 90, 0);
    grad.addColorStop(0, css(COLORS.matsyaFin));
    grad.addColorStop(0.5, css(COLORS.matsya));
    grad.addColorStop(1, css(0x9bf0f2));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(52, h / 2, 34, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // top fin
    ctx.fillStyle = css(COLORS.matsyaFin, 0.9);
    ctx.beginPath();
    ctx.moveTo(40, 12);
    ctx.lineTo(62, 2);
    ctx.lineTo(60, 16);
    ctx.closePath();
    ctx.fill();
    // gold cheek stripe
    ctx.fillStyle = css(COLORS.gold, 0.85);
    ctx.beginPath();
    ctx.ellipse(66, h / 2, 6, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(76, h / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0a2233';
    ctx.beginPath();
    ctx.arc(78, h / 2 - 4, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Sage inside a rescue bubble ---
  if (!scene.textures.exists('sage'))
  makeCanvasTexture(scene, 'sage', 64, 64, (ctx, w, h) => {
    ctx.fillStyle = css(0x9be3ff, 0.18);
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(0xbdf0ff, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    // robe
    ctx.fillStyle = css(0xff9e5e);
    ctx.beginPath();
    ctx.moveTo(20, 48);
    ctx.lineTo(44, 48);
    ctx.lineTo(38, 26);
    ctx.lineTo(26, 26);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.fillStyle = css(COLORS.sage);
    ctx.beginPath();
    ctx.arc(32, 22, 8, 0, Math.PI * 2);
    ctx.fill();
    // beard
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(26, 26);
    ctx.lineTo(38, 26);
    ctx.lineTo(32, 40);
    ctx.closePath();
    ctx.fill();
  });

  // --- Seed (sacred plant seed) ---
  if (!scene.textures.exists('seed'))
  makeCanvasTexture(scene, 'seed', 32, 40, (ctx) => {
    ctx.fillStyle = css(COLORS.seed);
    ctx.beginPath();
    ctx.ellipse(16, 24, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = css(0x5fae3a);
    ctx.beginPath();
    ctx.moveTo(16, 12);
    ctx.quadraticCurveTo(26, 2, 22, 14);
    ctx.quadraticCurveTo(18, 10, 16, 12);
    ctx.fill();
    ctx.strokeStyle = css(0x2f6d1c, 0.6);
    ctx.beginPath();
    ctx.moveTo(16, 16);
    ctx.lineTo(16, 34);
    ctx.stroke();
  });

  // --- Animal (stranded creature — a small deer-ish silhouette) ---
  if (!scene.textures.exists('animal'))
  makeCanvasTexture(scene, 'animal', 56, 48, (ctx) => {
    ctx.fillStyle = css(COLORS.animal);
    ctx.beginPath();
    ctx.ellipse(28, 30, 18, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.ellipse(44, 20, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // legs
    ctx.strokeStyle = css(0xb5703a);
    ctx.lineWidth = 3;
    [20, 28, 34].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, 38);
      ctx.lineTo(x, 46);
      ctx.stroke();
    });
    // ear
    ctx.fillStyle = css(0xd98b4a);
    ctx.beginPath();
    ctx.moveTo(46, 14);
    ctx.lineTo(50, 6);
    ctx.lineTo(50, 15);
    ctx.fill();
  });

  // --- Veda scroll (star collectible) ---
  if (!scene.textures.exists('scroll'))
  makeCanvasTexture(scene, 'scroll', 40, 44, (ctx) => {
    ctx.fillStyle = css(COLORS.scroll);
    ctx.fillRect(8, 6, 24, 32);
    ctx.fillStyle = css(COLORS.goldDark);
    ctx.fillRect(6, 4, 28, 5);
    ctx.fillRect(6, 35, 28, 5);
    ctx.strokeStyle = css(0xb08a4a, 0.7);
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(12, 14 + i * 5);
      ctx.lineTo(28, 14 + i * 5);
      ctx.stroke();
    }
    // glow om-dot
    ctx.fillStyle = css(COLORS.gold, 0.9);
    ctx.beginPath();
    ctx.arc(20, 22, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Enemy fish (aggressive) ---
  if (!scene.textures.exists('enemyFish'))
  makeCanvasTexture(scene, 'enemyFish', 72, 48, (ctx, w, h) => {
    ctx.fillStyle = css(COLORS.enemy);
    ctx.beginPath();
    ctx.ellipse(38, h / 2, 26, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    // tail
    ctx.beginPath();
    ctx.moveTo(64, h / 2);
    ctx.lineTo(72, 8);
    ctx.lineTo(72, h - 8);
    ctx.closePath();
    ctx.fill();
    // teeth mouth
    ctx.fillStyle = '#3a0d0d';
    ctx.beginPath();
    ctx.arc(16, h / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(10 + i * 5, h / 2 - 4);
      ctx.lineTo(13 + i * 5, h / 2);
      ctx.lineTo(10 + i * 5, h / 2 + 4);
      ctx.fill();
    }
    // eye
    ctx.fillStyle = '#ffdb4d';
    ctx.beginPath();
    ctx.arc(26, h / 2 - 5, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Eel (patrols / lunges) ---
  if (!scene.textures.exists('eel'))
  makeCanvasTexture(scene, 'eel', 100, 36, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, css(COLORS.eel));
    grad.addColorStop(1, css(0x4a2a7a));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(4, h / 2);
    for (let x = 4; x <= w - 8; x += 4) {
      const y = h / 2 + Math.sin(x / 10) * 6;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 14;
    ctx.strokeStyle = grad;
    ctx.lineCap = 'round';
    ctx.stroke();
    // head
    ctx.fillStyle = css(0x8a5bd9);
    ctx.beginPath();
    ctx.arc(w - 12, h / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffe14d';
    ctx.beginPath();
    ctx.arc(w - 8, h / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Air pocket / bubble cluster ---
  makeCanvasTexture(scene, 'airPocket', 80, 80, (ctx) => {
    ctx.fillStyle = css(COLORS.air, 0.22);
    ctx.beginPath();
    ctx.arc(40, 40, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = css(0xffffff, 0.5);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = css(0xffffff, 0.4);
    ctx.beginPath();
    ctx.arc(30, 28, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Small bubble particle ---
  makeCanvasTexture(scene, 'bubble', 16, 16, (ctx) => {
    ctx.fillStyle = css(0xcdf3ff, 0.5);
    ctx.beginPath();
    ctx.arc(8, 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = css(0xffffff, 0.8);
    ctx.beginPath();
    ctx.arc(6, 6, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Spike coral hazard ---
  makeCanvasTexture(scene, 'coral', 72, 64, (ctx, w, h) => {
    ctx.fillStyle = css(0xd15b8f);
    for (let i = 0; i < 5; i++) {
      const x = 8 + i * 14;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 6, h - 20 - (i % 2) * 16);
      ctx.lineTo(x + 12, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = css(0x9c3f6a);
    ctx.fillRect(0, h - 8, w, 8);
  });

  // --- Manu's boat ---
  if (!scene.textures.exists('boat'))
  makeCanvasTexture(scene, 'boat', 160, 90, (ctx, w, h) => {
    // hull
    ctx.fillStyle = css(COLORS.boat);
    ctx.beginPath();
    ctx.moveTo(10, 50);
    ctx.lineTo(150, 50);
    ctx.lineTo(130, 82);
    ctx.lineTo(30, 82);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = css(0x5e3a19);
    ctx.fillRect(10, 46, 140, 6);
    // mast + sail
    ctx.strokeStyle = css(0x3a2410);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(80, 48);
    ctx.lineTo(80, 6);
    ctx.stroke();
    ctx.fillStyle = css(0xf0e2c0);
    ctx.beginPath();
    ctx.moveTo(82, 10);
    ctx.lineTo(128, 30);
    ctx.lineTo(82, 44);
    ctx.closePath();
    ctx.fill();
  });

  // --- Hayagriva boss: horse-headed demon torso ---
  if (!scene.textures.exists('boss'))
  makeCanvasTexture(scene, 'boss', 220, 220, (ctx, w, h) => {
    // dark aura body
    const grad = ctx.createRadialGradient(110, 120, 20, 110, 120, 100);
    grad.addColorStop(0, css(0x4a2a5a));
    grad.addColorStop(1, css(COLORS.boss));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(110, 130, 78, 82, 0, 0, Math.PI * 2);
    ctx.fill();
    // horse head (elongated)
    ctx.fillStyle = css(COLORS.bossHorse);
    ctx.beginPath();
    ctx.ellipse(110, 70, 40, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    // snout
    ctx.beginPath();
    ctx.ellipse(110, 40, 24, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    // mane (flames)
    ctx.fillStyle = css(0x8a2be2, 0.8);
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(80 + i * 12, 40);
      ctx.lineTo(74 + i * 12, 8);
      ctx.lineTo(88 + i * 12, 40);
      ctx.fill();
    }
    // ears
    ctx.fillStyle = css(0x5a3420);
    ctx.beginPath(); ctx.moveTo(82, 34); ctx.lineTo(74, 12); ctx.lineTo(94, 30); ctx.fill();
    ctx.beginPath(); ctx.moveTo(138, 34); ctx.lineTo(146, 12); ctx.lineTo(126, 30); ctx.fill();
    // glowing eyes
    ctx.fillStyle = css(0xff3b3b);
    ctx.beginPath(); ctx.arc(96, 58, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(124, 58, 7, 0, Math.PI * 2); ctx.fill();
    // nostrils
    ctx.fillStyle = '#1a0d10';
    ctx.beginPath(); ctx.arc(104, 34, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(116, 34, 4, 0, Math.PI * 2); ctx.fill();
  });

  // --- Weak point marker (revealed when boss is stunned) ---
  makeCanvasTexture(scene, 'weakpoint', 48, 48, (ctx) => {
    ctx.strokeStyle = css(0xffe14d);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(24, 24, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(24, 4); ctx.lineTo(24, 44);
    ctx.moveTo(4, 24); ctx.lineTo(44, 24);
    ctx.stroke();
    ctx.fillStyle = css(0xff3b3b, 0.8);
    ctx.beginPath();
    ctx.arc(24, 24, 6, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- Soft radial glow (used for auras / pickups) ---
  makeCanvasTexture(scene, 'glow', 128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, css(0xffffff, 0.9));
    g.addColorStop(0.4, css(COLORS.gold, 0.5));
    g.addColorStop(1, css(COLORS.gold, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });

  // --- 1x1 white pixel for bars / flashes ---
  makeCanvasTexture(scene, 'pixel', 4, 4, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 4, 4);
  });
}
