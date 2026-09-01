import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { generateAllTextures } from '../systems/Textures.js';

// PreloadScene — builds all procedural textures and shows a loading bar.
// To swap in real art later: this.load.image('matsya', 'images/matsya.png') etc.
// (place files in public/images/ so Vite copies them to dist/), then remove the
// matching generated texture. Runtime asset keys stay identical.
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    // Loading bar
    const barW = 420;
    const x = GAME_W / 2 - barW / 2;
    const y = GAME_H / 2;
    this.add
      .text(GAME_W / 2, y - 60, 'DASHAVATARA', {
        fontFamily: 'Georgia, serif',
        fontSize: '46px',
        color: '#ffd257',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, y - 20, 'Chapter 1 · Matsya — The Great Flood', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#7fd7ff'
      })
      .setOrigin(0.5);

    const border = this.add.rectangle(GAME_W / 2, y + 30, barW + 6, 22, 0x000000, 0.4);
    border.setStrokeStyle(2, COLORS.air, 0.6);
    const bar = this.add.rectangle(x, y + 30, 1, 16, COLORS.air).setOrigin(0, 0.5);

    // Track real load progress (images below are a few MB total).
    this.load.on('progress', (p) => { bar.width = Math.max(1, barW * p); });
    this._bar = bar;
    this._barW = barW;

    // Real UI + world art (remaining sprites are generated procedurally in create()).
    // Hero + gameplay sprites
    this.load.image('matsya', 'images/matsya.png');
    this.load.spritesheet('matsyaSwim', 'images/matsya_swim.png', { frameWidth: 250, frameHeight: 186 });
    this.load.image('enemyFish', 'images/enemyFish.png');
    this.load.image('eel', 'images/eel.png');
    this.load.image('sage', 'images/sage.png');
    this.load.image('seed', 'images/seed.png');
    this.load.image('animal', 'images/animal.png');
    this.load.image('scroll', 'images/scroll.png');
    this.load.image('boss', 'images/boss.png');
    this.load.image('boat', 'images/boat.png');
    // Level backdrops (opaque -> JPG)
    this.load.image('bgFar', 'images/bgFar.jpg');
    this.load.image('bgMid', 'images/bgMid.jpg');
    this.load.image('bgNear', 'images/bgNear.jpg');
    this.load.image('worldMatsya', 'images/worldMatsya.jpg'); // chapter-select card art
    // UI
    this.load.image('menuBg', 'images/menuBg.png');
    this.load.image('logo', 'images/logo.png');
    this.load.image('btnPlay', 'images/btnPlay.png');
    this.load.image('btnChapters', 'images/btnChapters.png');
    this.load.image('btnSettings', 'images/btnSettings.png');
    this.load.image('pauseBtn', 'images/pauseBtn.png');
    this.load.image('lockedWorld', 'images/lockedWorld.png');
  }

  create() {
    generateAllTextures(this);

    // Matsya swim-cycle animation (global — usable from any scene).
    if (!this.anims.exists('matsya-swim')) {
      this.anims.create({
        key: 'matsya-swim',
        frames: this.anims.generateFrameNumbers('matsyaSwim', { start: 0, end: 5 }),
        frameRate: 9,
        repeat: -1
      });
    }

    // brief bar fill for a polished boot (cosmetic)…
    this.tweens.add({
      targets: this._bar,
      width: this._barW,
      duration: 500,
      ease: 'Sine.easeInOut'
    });
    // …and a reliable timer drives the transition into the menu.
    this.time.delayedCall(600, () => this.scene.start('MainMenu'));
  }
}
