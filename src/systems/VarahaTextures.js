// VarahaTextures — procedural placeholder art for Chapter 3 (Varaha, rescuing
// the Earth from the deep). Same swap-in convention as the other texture modules.
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

export function generateVarahaTextures(scene) {
  // --- Varaha: cute mighty boar facing RIGHT (tusks + snout) ---
  tex(scene, 'varaha', 132, 100, (ctx, w, h) => {
    // body
    const grad = ctx.createLinearGradient(0, 24, 0, 92);
    grad.addColorStop(0, css(0x4a3b6a));
    grad.addColorStop(1, css(0x2c2244));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.ellipse(58, 58, 46, 32, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.fillStyle = css(0x241b38);
    [36, 58, 78].forEach((x) => { ctx.fillRect(x, 82, 9, 14); });
    // tail curl
    ctx.strokeStyle = css(0x241b38); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(14, 52); ctx.quadraticCurveTo(2, 46, 10, 38); ctx.stroke();
    // head
    ctx.fillStyle = css(0x5a4a7a);
    ctx.beginPath(); ctx.ellipse(102, 56, 26, 24, 0, 0, Math.PI * 2); ctx.fill();
    // snout
    ctx.fillStyle = css(0x6b5a8a);
    ctx.beginPath(); ctx.ellipse(122, 62, 12, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a2038';
    ctx.beginPath(); ctx.arc(126, 60, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(120, 60, 2.5, 0, Math.PI * 2); ctx.fill();
    // tusks
    ctx.fillStyle = css(0xf0e6c8);
    ctx.beginPath(); ctx.moveTo(114, 68); ctx.quadraticCurveTo(120, 84, 108, 82); ctx.quadraticCurveTo(112, 74, 114, 68); ctx.fill();
    ctx.beginPath(); ctx.moveTo(128, 66); ctx.quadraticCurveTo(136, 80, 126, 80); ctx.quadraticCurveTo(126, 72, 128, 66); ctx.fill();
    // ear
    ctx.fillStyle = css(0x4a3b6a);
    ctx.beginPath(); ctx.moveTo(92, 36); ctx.lineTo(86, 20); ctx.lineTo(102, 34); ctx.fill();
    // eye + gold tilak
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(104, 50, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1226'; ctx.beginPath(); ctx.arc(106, 50, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(COLORS.gold); ctx.fillRect(100, 40, 2, 8);
  });

  // --- Breakable rock barrier (tall wall block) ---
  tex(scene, 'breakRock', 96, 150, (ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 96, 0);
    grad.addColorStop(0, css(0x5a5044));
    grad.addColorStop(1, css(0x3f382e));
    ctx.fillStyle = grad;
    ctx.fillRect(4, 4, 88, 142);
    ctx.strokeStyle = css(0x2a251d); ctx.lineWidth = 3; ctx.strokeRect(4, 4, 88, 142);
    // cracks
    ctx.strokeStyle = css(0x241f18, 0.8); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, 10); ctx.lineTo(40, 60); ctx.lineTo(24, 100); ctx.lineTo(44, 144); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, 20); ctx.lineTo(56, 70); ctx.lineTo(74, 120); ctx.stroke();
    // gem hint (glowing weak point)
    ctx.fillStyle = css(0xffca6a, 0.85);
    ctx.beginPath(); ctx.arc(48, 75, 7, 0, Math.PI * 2); ctx.fill();
  });

  // --- Deep asura minion (dark fanged fish/imp) facing LEFT ---
  tex(scene, 'deepEnemy', 76, 56, (ctx, w, h) => {
    ctx.fillStyle = css(0x7a2f4a);
    ctx.beginPath(); ctx.ellipse(42, 28, 26, 17, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(66, 28); ctx.lineTo(76, 8); ctx.lineTo(76, 48); ctx.closePath(); ctx.fill();
    // mouth teeth (left)
    ctx.fillStyle = '#2a0810';
    ctx.beginPath(); ctx.arc(18, 28, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(12 + i * 5, 24); ctx.lineTo(15 + i * 5, 28); ctx.lineTo(12 + i * 5, 32); ctx.fill(); }
    ctx.fillStyle = css(0xffca4d); ctx.beginPath(); ctx.arc(30, 22, 4, 0, Math.PI * 2); ctx.fill();
  });

  // --- Earth relic (collectible fragment) ---
  tex(scene, 'relic', 44, 44, (ctx, w, h) => {
    ctx.fillStyle = css(0x3f8f5a);
    ctx.beginPath(); ctx.arc(22, 22, 16, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(0x2f6f9c);
    ctx.beginPath(); ctx.arc(16, 18, 6, 0, Math.PI * 2); ctx.arc(30, 26, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = css(COLORS.gold, 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(22, 22, 16, 0, Math.PI * 2); ctx.stroke();
  });

  // --- The Earth (Bhudevi) — larger globe to lift ---
  tex(scene, 'earth', 120, 120, (ctx, w, h) => {
    const g = ctx.createRadialGradient(46, 44, 10, 60, 60, 58);
    g.addColorStop(0, css(0x8fd0ff));
    g.addColorStop(1, css(0x1d5a8c));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(60, 60, 54, 0, Math.PI * 2); ctx.fill();
    // continents
    ctx.fillStyle = css(0x4aa06a);
    ctx.beginPath(); ctx.ellipse(44, 46, 18, 12, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(78, 74, 16, 20, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(70, 34, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    // halo
    ctx.strokeStyle = css(COLORS.gold, 0.7); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(60, 60, 56, 0, Math.PI * 2); ctx.stroke();
  });

  // --- Hiranyaksha boss (golden-eyed asura with mace) ---
  tex(scene, 'hiranyaksha', 210, 220, (ctx, w, h) => {
    const g = ctx.createRadialGradient(105, 110, 20, 105, 110, 100);
    g.addColorStop(0, css(0x3a5a3a));
    g.addColorStop(1, css(0x1f3320));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(105, 118, 78, 84, 0, 0, Math.PI * 2); ctx.fill();
    // crown horns
    ctx.fillStyle = css(COLORS.gold);
    ctx.beginPath(); ctx.moveTo(60, 52); ctx.lineTo(44, 12); ctx.lineTo(78, 46); ctx.fill();
    ctx.beginPath(); ctx.moveTo(150, 52); ctx.lineTo(166, 12); ctx.lineTo(132, 46); ctx.fill();
    ctx.beginPath(); ctx.moveTo(90, 40); ctx.lineTo(105, 6); ctx.lineTo(120, 40); ctx.fill();
    // eyes (golden, glowing)
    ctx.fillStyle = css(0xffe14d);
    ctx.beginPath(); ctx.ellipse(84, 104, 13, 9, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(126, 104, 13, 9, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a2a10';
    ctx.beginPath(); ctx.arc(84, 104, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(126, 104, 4, 0, Math.PI * 2); ctx.fill();
    // fanged mouth
    ctx.fillStyle = '#0d1a08';
    ctx.beginPath(); ctx.ellipse(105, 150, 36, 22, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(74 + i * 16, 150); ctx.lineTo(82 + i * 16, 166); ctx.lineTo(90 + i * 16, 150); ctx.fill(); }
  });

  // --- Cave spike hazard ---
  tex(scene, 'caveSpike', 70, 70, (ctx, w, h) => {
    ctx.fillStyle = css(0x6a5f50);
    for (let i = 0; i < 4; i++) {
      const x = 6 + i * 16;
      ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + 8, h - 40 - (i % 2) * 14); ctx.lineTo(x + 16, h); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = css(0x4a4238); ctx.fillRect(0, h - 8, w, 8);
  });
}
