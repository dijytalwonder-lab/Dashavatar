import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';

// Shared animated underwater backdrop: vertical depth gradient, drifting light
// rays, rising bubbles and a soft caustic shimmer. Used by menu + gameplay so
// every scene feels like the same ocean. `worldWidth` lets it tile across a
// scrolling level; pass GAME_W for static scenes.
export function makeWaterBackground(scene, worldWidth = GAME_W) {
  const layer = scene.add.container(0, 0).setDepth(-100);

  // Depth gradient (surface bright -> deep dark), drawn once to a texture-sized rect stack.
  const bands = 24;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1);
    const c = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(COLORS.shallowWater),
      Phaser.Display.Color.ValueToColor(COLORS.deepWater),
      bands - 1,
      i
    );
    const hex = Phaser.Display.Color.GetColor(c.r, c.g, c.b);
    const r = scene.add
      .rectangle(0, (GAME_H / bands) * i, worldWidth, GAME_H / bands + 1, hex)
      .setOrigin(0, 0)
      .setScrollFactor(0.0, 1);
    layer.add(r);
  }

  // Light rays from the surface (angled translucent beams)
  const rays = [];
  for (let i = 0; i < 6; i++) {
    const rx = (worldWidth / 6) * i + 60;
    const ray = scene.add
      .rectangle(rx, 0, 60, GAME_H * 1.2, 0xbdf0ff, 0.06)
      .setOrigin(0.5, 0)
      .setAngle(12)
      .setScrollFactor(0.3, 0);
    rays.push(ray);
    layer.add(ray);
    scene.tweens.add({
      targets: ray,
      alpha: { from: 0.03, to: 0.1 },
      duration: 3000 + i * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  // Rising bubbles (emitter) — parallax slow layer
  const bubbles = scene.add.particles(0, 0, 'bubble', {
    x: { min: 0, max: Math.min(worldWidth, GAME_W) },
    y: GAME_H + 10,
    lifespan: 6000,
    speedY: { min: -60, max: -30 },
    speedX: { min: -10, max: 10 },
    scale: { min: 0.2, max: 0.9 },
    alpha: { start: 0.5, end: 0 },
    frequency: 400,
    quantity: 1
  });
  bubbles.setScrollFactor(0.4, 1).setDepth(-90);

  return { layer, bubbles, rays };
}

// Level backdrop built from real world art (`bgKey`): a parallax tile of the
// painted scene, tinted and darkened by an underwater depth overlay, with light
// rays and rising bubbles on top. Returns the tileSprite so the scene can drive
// its parallax each frame:  bg.tilePositionX = camera.scrollX * 0.4
export function makeWorldBackground(scene, bgKey) {
  const img = scene.textures.get(bgKey).getSourceImage();
  const tile = scene.add
    .tileSprite(0, 0, GAME_W, GAME_H, bgKey)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(-120);
  tile.setTileScale(GAME_H / img.height);
  tile.setTint(0x6f9fc8); // cool it toward underwater blue

  // Underwater depth overlay: clear near the surface, deep-dark at the bottom.
  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(-115);
  overlay.fillGradientStyle(
    COLORS.shallowWater, COLORS.shallowWater, COLORS.deepWater, COLORS.deepWater,
    0.25, 0.25, 0.96, 0.96
  );
  overlay.fillRect(0, 0, GAME_W, GAME_H);

  // Light rays
  for (let i = 0; i < 5; i++) {
    const ray = scene.add
      .rectangle((GAME_W / 5) * i + 60, 0, 70, GAME_H * 1.2, 0xbdf0ff, 0.05)
      .setOrigin(0.5, 0)
      .setAngle(10)
      .setScrollFactor(0)
      .setDepth(-110);
    scene.tweens.add({
      targets: ray, alpha: { from: 0.03, to: 0.09 },
      duration: 3200 + i * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });
  }

  // Rising bubbles
  const bubbles = scene.add.particles(0, 0, 'bubble', {
    x: { min: 0, max: GAME_W },
    y: GAME_H + 10,
    lifespan: 6000,
    speedY: { min: -55, max: -28 },
    speedX: { min: -8, max: 8 },
    scale: { min: 0.2, max: 0.85 },
    alpha: { start: 0.45, end: 0 },
    frequency: 320,
    quantity: 1
  });
  bubbles.setScrollFactor(0).setDepth(-108);

  return tile;
}

// Three painted underwater scenes, one per level segment, cross-fading as the
// camera crosses the segment boundaries (s2, s3 in world-x). Returns an object
// with update(cameraX). A subtle depth overlay + live bubbles sit on top.
export function makeSegmentedBackground(scene, s2, s3) {
  const cover = (key, depth) => {
    const img = scene.add.image(GAME_W / 2, GAME_H / 2, key).setScrollFactor(0).setDepth(depth);
    const s = Math.max(GAME_W / img.width, GAME_H / img.height);
    img.setScale(s);
    return img;
  };
  // Ordered back-to-front; later segments drawn on top and revealed by alpha.
  const near = cover('bgNear', -122); // segment 1
  const mid = cover('bgMid', -121);   // segment 2
  const far = cover('bgFar', -120);   // segment 3

  // Gentle depth overlay so HUD + sprites stay legible over busy art.
  const overlay = scene.add.graphics().setScrollFactor(0).setDepth(-115);
  overlay.fillGradientStyle(0x000000, 0x000000, COLORS.deepWater, COLORS.deepWater, 0.0, 0.0, 0.35, 0.35);
  overlay.fillRect(0, 0, GAME_W, GAME_H);

  // A few live rising bubbles for motion.
  scene.add.particles(0, 0, 'bubble', {
    x: { min: 0, max: GAME_W }, y: GAME_H + 10, lifespan: 6000,
    speedY: { min: -50, max: -26 }, speedX: { min: -8, max: 8 },
    scale: { min: 0.2, max: 0.8 }, alpha: { start: 0.4, end: 0 }, frequency: 380, quantity: 1
  }).setScrollFactor(0).setDepth(-108);

  const FADE = 500; // px of cross-fade around each boundary
  const ramp = (x, edge) => Phaser.Math.Clamp((x - (edge - FADE)) / FADE, 0, 1);

  return {
    update(camX) {
      const cx = camX + GAME_W / 2;
      mid.setAlpha(ramp(cx, s2));            // near -> mid across s2
      far.setAlpha(ramp(cx, s3));            // (mid) -> far across s3
    }
  };
}
