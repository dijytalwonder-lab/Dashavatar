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

    // No external files to load (all art is procedural), so animate the bar to
    // full, then continue. This is also where real art would be loaded, e.g.
    //   this.load.image('matsya', 'images/matsya.png');
    this._bar = bar;
    this._barW = barW;
  }

  create() {
    generateAllTextures(this);
    // brief bar fill for a polished boot, then into the menu
    this.tweens.add({
      targets: this._bar,
      width: this._barW,
      duration: 500,
      ease: 'Sine.easeInOut',
      onComplete: () => this.scene.start('MainMenu')
    });
  }
}
