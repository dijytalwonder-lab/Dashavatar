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

    this.add
      .text(GAME_W / 2, 200, 'DASHAVATARA', {
        fontFamily: 'Georgia, serif',
        fontSize: '54px',
        color: '#ffd257',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setShadow(0, 4, '#00131f', 8);

    this.add
      .text(GAME_W / 2, 254, 'THE TEN AVATARS', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '22px',
        color: '#7fd7ff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    // Big swimming Matsya on the menu
    const fishY = 560;
    this.add.image(GAME_W / 2, fishY, 'glow').setScale(2.8).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    const fish = this.add.image(GAME_W / 2, fishY, 'matsya').setScale(2.0);
    this.tweens.add({
      targets: fish,
      y: '+=20',
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.add
      .text(GAME_W / 2, 760, 'An epic journey through the ten\nincarnations of Vishnu.', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#9bd7ef',
        align: 'center',
        lineSpacing: 6,
        fontStyle: 'italic'
      })
      .setOrigin(0.5);

    // Play button -> chapter/world select
    this._button(GAME_W / 2, 900, 'PLAY', () => {
      AudioManager.unlock();
      AudioManager.click();
      this.scene.start('ChapterSelect');
    });

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
      .text(GAME_W / 2, GAME_H - 40, 'Swim · SURGE to dash · TAIL WHIP to strike', {
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
