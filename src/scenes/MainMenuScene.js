import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { makeWaterBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    makeWaterBackground(this);

    // Big swimming Matsya on the menu
    const fish = this.add.image(GAME_W / 2, 260, 'matsya').setScale(1.6);
    this.tweens.add({
      targets: fish,
      y: '+=18',
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    this.add.image(GAME_W / 2, 260, 'glow').setScale(2.2).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);

    this.add
      .text(GAME_W / 2, 90, 'DASHAVATARA', {
        fontFamily: 'Georgia, serif',
        fontSize: '62px',
        color: '#ffd257',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#00131f', 8);

    this.add
      .text(GAME_W / 2, 145, 'THE TEN AVATARS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#7fd7ff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, 400, 'Chapter 1 · Matsya', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#eaf6ff'
      })
      .setOrigin(0.5);
    this.add
      .text(GAME_W / 2, 438, 'The Great Flood', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#9bd7ef',
        fontStyle: 'italic'
      })
      .setOrigin(0.5);

    // Play button
    this._button(GAME_W / 2, 520, 'PLAY', () => {
      AudioManager.unlock();
      AudioManager.click();
      this.scene.start('Story');
    });

    // Continue hint if already completed
    if (SaveManager.data.chapters[1] && SaveManager.data.chapters[1].completed) {
      this.add
        .text(GAME_W / 2, 585, `Best score: ${SaveManager.data.chapters[1].bestScore}`, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: '18px',
          color: '#ffd257'
        })
        .setOrigin(0.5);
    }

    // Sound toggle
    this._soundBtn = this.add
      .text(GAME_W - 30, 30, SaveManager.soundOn ? '🔊' : '🔇', { fontSize: '30px' })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        AudioManager.unlock();
        const on = AudioManager.toggle();
        this._soundBtn.setText(on ? '🔊' : '🔇');
        AudioManager.click();
      });

    this.add
      .text(GAME_W / 2, GAME_H - 30, 'Swim with the joystick · SURGE to dash · TAIL WHIP to strike', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#6fb6d6'
      })
      .setOrigin(0.5);

    // Any tap unlocks audio (browser gesture requirement)
    this.input.once('pointerdown', () => AudioManager.unlock());
  }

  _button(x, y, label, onClick) {
    const w = 240;
    const h = 66;
    const g = this.add.container(x, y);
    const bg = this.add
      .rectangle(0, 0, w, h, COLORS.gold, 0.9)
      .setStrokeStyle(3, 0xfff2cc, 0.9);
    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '30px',
        color: '#00263a',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);
    g.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => g.setScale(1.05))
      .on('pointerout', () => g.setScale(1))
      .on('pointerdown', () => {
        g.setScale(0.96);
        onClick();
      });
    this.tweens.add({
      targets: g,
      scale: { from: 1, to: 1.04 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    return g;
  }
}
