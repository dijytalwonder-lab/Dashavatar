// NarasimhaTextures — procedural placeholder art for Chapter 4 (Narasimha, the
// man-lion). Same swap-in convention as the other texture modules.
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

export function generateNarasimhaTextures(scene) {
  // --- Narasimha: chibi man-lion facing RIGHT (mane, claws) ---
  tex(scene, 'narasimha', 120, 116, (ctx, w, h) => {
    // torso
    ctx.fillStyle = css(0xd98f3a);
    ctx.beginPath(); ctx.ellipse(56, 78, 26, 30, 0, 0, Math.PI * 2); ctx.fill();
    // legs
    ctx.fillStyle = css(0xb5702a);
    ctx.fillRect(44, 100, 10, 14); ctx.fillRect(64, 100, 10, 14);
    // arms + claws (right arm forward)
    ctx.strokeStyle = css(0xd98f3a); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(70, 70); ctx.lineTo(96, 78); ctx.stroke();
    ctx.fillStyle = css(0xf0e6c8);
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(96, 72 + i * 4); ctx.lineTo(108, 70 + i * 4); ctx.lineTo(96, 78 + i * 4); ctx.fill(); }
    // mane
    ctx.fillStyle = css(0x8a4a1a);
    for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(66 + Math.cos(an) * 22, 36 + Math.sin(an) * 22); ctx.lineTo(66 + Math.cos(an) * 34, 36 + Math.sin(an) * 34); ctx.lineTo(66 + Math.cos(an + 0.2) * 22, 36 + Math.sin(an + 0.2) * 22); ctx.fill(); }
    // head
    ctx.fillStyle = css(0xf0c060);
    ctx.beginPath(); ctx.arc(66, 36, 22, 0, Math.PI * 2); ctx.fill();
    // snout
    ctx.fillStyle = css(0xffe0a0);
    ctx.beginPath(); ctx.ellipse(80, 42, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2410'; ctx.beginPath(); ctx.arc(86, 40, 2.5, 0, Math.PI * 2); ctx.fill();
    // eyes (fierce)
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(74, 30, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css(0xd94b2a); ctx.beginPath(); ctx.arc(76, 30, 2.6, 0, Math.PI * 2); ctx.fill();
    // fangs
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(74, 48); ctx.lineTo(77, 56); ctx.lineTo(80, 48); ctx.fill();
    // ears
    ctx.fillStyle = css(0xf0c060);
    ctx.beginPath(); ctx.moveTo(52, 18); ctx.lineTo(48, 6); ctx.lineTo(60, 16); ctx.fill();
    // gold tilak
    ctx.fillStyle = css(COLORS.gold); ctx.fillRect(65, 22, 2, 8);
  });

  // --- Asura guard (enemy soldier) facing LEFT ---
  tex(scene, 'asuraGuard', 68, 88, (ctx, w, h) => {
    // body
    ctx.fillStyle = css(0x5a3f6a);
    ctx.beginPath(); ctx.ellipse(34, 56, 18, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(24, 74, 8, 12); ctx.fillRect(38, 74, 8, 12);
    // head
    ctx.fillStyle = css(0x7a4f8a);
    ctx.beginPath(); ctx.arc(34, 26, 15, 0, Math.PI * 2); ctx.fill();
    // horns
    ctx.fillStyle = css(0xd9c9a0);
    ctx.beginPath(); ctx.moveTo(24, 16); ctx.lineTo(18, 4); ctx.lineTo(30, 14); ctx.fill();
    ctx.beginPath(); ctx.moveTo(44, 16); ctx.lineTo(50, 4); ctx.lineTo(38, 14); ctx.fill();
    // eye (left-facing)
    ctx.fillStyle = css(0xffca4d); ctx.beginPath(); ctx.arc(28, 24, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a0810'; ctx.beginPath(); ctx.arc(27, 24, 2, 0, Math.PI * 2); ctx.fill();
    // spear (points left)
    ctx.strokeStyle = css(0x6b4a2a); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(14, 44); ctx.lineTo(52, 60); ctx.stroke();
    ctx.fillStyle = css(0xbfc7cf);
    ctx.beginPath(); ctx.moveTo(14, 44); ctx.lineTo(6, 40); ctx.lineTo(10, 50); ctx.fill();
  });

  // --- Hiranyakashipu (the tyrant king boss) ---
  tex(scene, 'hiranyakashipu', 210, 230, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 20, 0, 220);
    g.addColorStop(0, css(0x6a2f4a));
    g.addColorStop(1, css(0x3a1730));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(105, 130, 74, 88, 0, 0, Math.PI * 2); ctx.fill();
    // ornate crown
    ctx.fillStyle = css(COLORS.gold);
    ctx.beginPath(); ctx.moveTo(60, 60); ctx.lineTo(70, 20); ctx.lineTo(86, 52); ctx.lineTo(105, 12); ctx.lineTo(124, 52); ctx.lineTo(140, 20); ctx.lineTo(150, 60); ctx.closePath(); ctx.fill();
    ctx.fillStyle = css(0x2f6fd6); ctx.beginPath(); ctx.arc(105, 40, 6, 0, Math.PI * 2); ctx.fill();
    // face
    ctx.fillStyle = css(0x8a4f6a);
    ctx.beginPath(); ctx.ellipse(105, 100, 44, 40, 0, 0, Math.PI * 2); ctx.fill();
    // eyes
    ctx.fillStyle = css(0xffe14d);
    ctx.beginPath(); ctx.ellipse(88, 96, 11, 8, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(122, 96, 11, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2a0810';
    ctx.beginPath(); ctx.arc(88, 96, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(122, 96, 3.5, 0, Math.PI * 2); ctx.fill();
    // angry brow
    ctx.strokeStyle = '#2a0810'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(76, 84); ctx.lineTo(98, 92); ctx.moveTo(134, 84); ctx.lineTo(112, 92); ctx.stroke();
    // moustache
    ctx.strokeStyle = '#1a0d14'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(105, 118); ctx.quadraticCurveTo(80, 120, 72, 108); ctx.moveTo(105, 118); ctx.quadraticCurveTo(130, 120, 138, 108); ctx.stroke();
  });

  // --- Palace pillar (the famous pillar) ---
  tex(scene, 'pillar', 80, 320, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 80, 0);
    g.addColorStop(0, css(0x8a7a5a));
    g.addColorStop(0.5, css(0xc9b98a));
    g.addColorStop(1, css(0x6f5f42));
    ctx.fillStyle = g;
    ctx.fillRect(10, 20, 60, 288);
    // capital + base
    ctx.fillStyle = css(COLORS.gold);
    ctx.fillRect(2, 8, 76, 20); ctx.fillRect(2, 300, 76, 18);
    // flutes
    ctx.strokeStyle = css(0x5f5138, 0.5); ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(10 + i * 12, 28); ctx.lineTo(10 + i * 12, 300); ctx.stroke(); }
  });
}
