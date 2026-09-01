// KurmaTextures — procedural placeholder art for Chapter 2 (Kurma, the Churning
// of the Ocean). Same swap-in convention as Textures.js: load a real PNG under
// the same key in PreloadScene and the generated one is skipped (guarded here).
import { COLORS } from '../config.js';

function css(hex, a = 1) {
  const r = (hex >> 16) & 0xff, g = (hex >> 8) & 0xff, b = hex & 0xff;
  return `rgba(${r},${g},${b},${a})`;
}
function tex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const t = scene.textures.createCanvas(key, w, h);
  draw(t.getContext(), w, h);
  t.refresh();
}

export function generateKurmaTextures(scene) {
  // --- Kurma: cute tortoise facing RIGHT (head + legs out) ---
  tex(scene, 'kurma', 120, 96, (ctx, w, h) => {
    // back legs
    ctx.fillStyle = css(COLORS.kurmaSkin);
    ctx.beginPath(); ctx.ellipse(34, 74, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(78, 74, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    // tail
    ctx.beginPath(); ctx.moveTo(20, 56); ctx.lineTo(6, 60); ctx.lineTo(20, 66); ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(100, 50, 16, 13, 0, 0, Math.PI * 2); ctx.fill();
    // shell
    const grad = ctx.createLinearGradient(0, 20, 0, 70);
    grad.addColorStop(0, css(0x5aa06a));
    grad.addColorStop(1, css(COLORS.kurmaShellDark));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(56, 48, 44, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(COLORS.kurmaShellDark); ctx.lineWidth = 3; ctx.stroke();
    // shell plates
    ctx.strokeStyle = css(0x2f5f3a, 0.8); ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(56 + i * 16, 20); ctx.lineTo(56 + i * 16, 76); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(56, 48, 24, 14, 0, 0, Math.PI * 2); ctx.stroke();
    // gold rim (divine)
    ctx.strokeStyle = css(COLORS.gold, 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(56, 48, 44, 30, 0, 0, Math.PI * 2); ctx.stroke();
    // eye
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(106, 46, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a2233'; ctx.beginPath(); ctx.arc(107, 46, 2, 0, Math.PI * 2); ctx.fill();
    // tilak
    ctx.fillStyle = css(COLORS.gold); ctx.fillRect(99, 40, 2, 8);
  });

  // --- Kurma shell (retracted / defending) — a domed shield ---
  tex(scene, 'kurmaShell', 110, 84, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 6, 0, 78);
    grad.addColorStop(0, css(0x6ab07a));
    grad.addColorStop(1, css(COLORS.kurmaShellDark));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(55, 46, 50, 36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(COLORS.gold, 0.95); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(55, 46, 50, 36, 0, 0, Math.PI * 2); ctx.stroke();
    // plate pattern
    ctx.strokeStyle = css(0x2f5f3a, 0.9); ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(55 + i * 18, 12); ctx.lineTo(55 + i * 18, 80); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(55, 46, 30, 18, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(55, 46, 14, 8, 0, 0, Math.PI * 2); ctx.stroke();
  });

  // --- Falling rock hazard ---
  tex(scene, 'rock', 64, 60, (ctx, w, h) => {
    ctx.fillStyle = css(COLORS.rock);
    ctx.beginPath();
    ctx.moveTo(10, 26); ctx.lineTo(24, 8); ctx.lineTo(46, 10); ctx.lineTo(58, 30);
    ctx.lineTo(50, 52); ctx.lineTo(26, 56); ctx.lineTo(8, 44); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css(0x453f36); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = css(0x847a6a, 0.6);
    ctx.beginPath(); ctx.moveTo(24, 8); ctx.lineTo(40, 22); ctx.lineTo(30, 30); ctx.fill();
  });

  // --- Treasure (glowing ratna / gem-pot) ---
  tex(scene, 'treasure', 52, 56, (ctx, w, h) => {
    // pot base
    ctx.fillStyle = css(COLORS.goldDark);
    ctx.beginPath(); ctx.moveTo(12, 30); ctx.quadraticCurveTo(26, 56, 40, 30); ctx.lineTo(36, 24); ctx.lineTo(16, 24); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(COLORS.gold);
    ctx.fillRect(14, 18, 24, 8);
    // gem
    ctx.fillStyle = css(0x7fd0ff);
    ctx.beginPath(); ctx.moveTo(26, 4); ctx.lineTo(34, 16); ctx.lineTo(26, 24); ctx.lineTo(18, 16); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = css('#ffffff'); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  });

  // --- Poison blob (halahala) ---
  tex(scene, 'poison', 72, 72, (ctx, w, h) => {
    const g = ctx.createRadialGradient(36, 36, 4, 36, 36, 34);
    g.addColorStop(0, css(0xcaff6a, 0.95));
    g.addColorStop(0.6, css(COLORS.poison, 0.8));
    g.addColorStop(1, css(0x2f6f1c, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(36, 36, 34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(0x1a3a0e, 0.5);
    ctx.beginPath(); ctx.arc(28, 30, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(46, 40, 4, 0, Math.PI * 2); ctx.fill();
  });

  // --- Mount Mandara (churning mountain, top) ---
  tex(scene, 'mandara', 260, 220, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, 220);
    g.addColorStop(0, css(0xa89a80));
    g.addColorStop(1, css(0x5f5546));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(130, 8); ctx.lineTo(250, 210); ctx.lineTo(10, 210); ctx.closePath(); ctx.fill();
    // snow cap
    ctx.fillStyle = css(0xeef2f5, 0.9);
    ctx.beginPath(); ctx.moveTo(130, 8); ctx.lineTo(168, 70); ctx.lineTo(150, 66); ctx.lineTo(130, 90); ctx.lineTo(110, 66); ctx.lineTo(92, 70); ctx.closePath(); ctx.fill();
    // ridges
    ctx.strokeStyle = css(0x3f3830, 0.5); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(130, 30); ctx.lineTo(90, 210); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(130, 30); ctx.lineTo(180, 210); ctx.stroke();
  });

  // --- Vasuki serpent coil (decorative rope around the mountain) ---
  tex(scene, 'vasuki', 300, 60, (ctx, w, h) => {
    ctx.lineCap = 'round'; ctx.lineWidth = 22;
    ctx.strokeStyle = css(0x9c6bd0);
    ctx.beginPath();
    for (let x = 6; x <= w - 6; x += 4) { const y = 30 + Math.sin(x / 22) * 16; if (x === 6) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke();
    // scales
    ctx.strokeStyle = css(0x6f3fa0, 0.6); ctx.lineWidth = 3;
    for (let x = 14; x < w - 14; x += 18) { const y = 30 + Math.sin(x / 22) * 16; ctx.beginPath(); ctx.moveTo(x, y - 8); ctx.lineTo(x, y + 8); ctx.stroke(); }
  });

  // --- Asura boss (Svarbhanu / Rahu — demon head) ---
  tex(scene, 'asura', 200, 200, (ctx, w, h) => {
    const g = ctx.createRadialGradient(100, 100, 20, 100, 100, 96);
    g.addColorStop(0, css(0x9a3f5a));
    g.addColorStop(1, css(COLORS.asura));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(100, 108, 74, 78, 0, 0, Math.PI * 2); ctx.fill();
    // horns
    ctx.fillStyle = css(0xd9c9a0);
    ctx.beginPath(); ctx.moveTo(52, 44); ctx.lineTo(30, 6); ctx.lineTo(66, 40); ctx.fill();
    ctx.beginPath(); ctx.moveTo(148, 44); ctx.lineTo(170, 6); ctx.lineTo(134, 40); ctx.fill();
    // eyes (angry)
    ctx.fillStyle = css(0xffe14d);
    ctx.beginPath(); ctx.ellipse(76, 96, 12, 8, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(124, 96, 12, 8, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a0d0d';
    ctx.beginPath(); ctx.arc(76, 96, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(124, 96, 4, 0, Math.PI * 2); ctx.fill();
    // fanged mouth
    ctx.fillStyle = '#2a0810';
    ctx.beginPath(); ctx.ellipse(100, 140, 34, 20, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(74 + i * 18, 140); ctx.lineTo(82 + i * 18, 156); ctx.lineTo(90 + i * 18, 140); ctx.fill(); }
  });

  // --- Amrita pot (Kumbha of nectar) ---
  tex(scene, 'amritaPot', 84, 96, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 20, 0, 92);
    g.addColorStop(0, css(COLORS.gold));
    g.addColorStop(1, css(COLORS.goldDark));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(42, 60, 34, 32, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(COLORS.goldDark);
    ctx.beginPath(); ctx.ellipse(42, 26, 20, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(28, 20, 28, 10);
    // nectar glow
    ctx.fillStyle = css(COLORS.amrita, 0.9);
    ctx.beginPath(); ctx.ellipse(42, 24, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
    // shine
    ctx.strokeStyle = css('#ffffff'); ctx.globalAlpha = 0.4; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(30, 52, 14, Math.PI, Math.PI * 1.5); ctx.stroke(); ctx.globalAlpha = 1;
  });
}
