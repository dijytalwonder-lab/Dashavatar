import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { makeWaterBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';

const PANELS = [
  {
    title: 'A peaceful age…',
    body: 'Long ago, the world was calm and green. Rivers ran gentle. The sages kept the sacred Vedas safe.'
  },
  {
    title: 'The storms come',
    body: 'Then the skies darkened. Rivers overflowed, and the oceans began to rise. A great flood was coming to swallow all creation.'
  },
  {
    title: 'A small fish',
    body: 'King Manu found a tiny fish in his palms. It spoke — and grew, and grew, until it filled the sea. It was MATSYA, an avatar of Vishnu.'
  },
  {
    title: 'The warning',
    body: '“Build a boat, Manu. Gather the seeds of every plant, the sages, and the creatures. I will guide you through the flood.”'
  },
  {
    title: 'But the Vedas are gone…',
    body: 'The demon HAYAGRIVA has stolen the sacred knowledge into the deep. Matsya must save all life — and take back the Vedas.'
  }
];

export default class StoryScene extends Phaser.Scene {
  constructor() {
    super('Story');
  }

  create() {
    makeWaterBackground(this);
    AudioManager.startAmbient();

    this.index = 0;

    this.card = this.add
      .rectangle(GAME_W / 2, GAME_H / 2 + 40, GAME_W - 70, 340, 0x00121f, 0.72)
      .setStrokeStyle(2, COLORS.air, 0.4);

    this.titleTxt = this.add
      .text(GAME_W / 2, GAME_H / 2 - 90, '', {
        fontFamily: 'Georgia, serif',
        fontSize: '34px',
        color: '#ffd257',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_W - 120 }
      })
      .setOrigin(0.5);

    this.bodyTxt = this.add
      .text(GAME_W / 2, GAME_H / 2 + 40, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '23px',
        color: '#eaf6ff',
        align: 'center',
        wordWrap: { width: GAME_W - 130 },
        lineSpacing: 8
      })
      .setOrigin(0.5);

    // Matsya swims across the top during the story
    const fish = this.add.image(-80, 160, 'matsya').setScale(0.55);
    this.tweens.add({
      targets: fish,
      x: GAME_W + 80,
      duration: 9000,
      repeat: -1,
      onRepeat: () => (fish.y = 120 + Math.random() * 120)
    });

    this.hint = this.add
      .text(GAME_W / 2, GAME_H - 40, 'tap to continue', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#7fd7ff'
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    // Skip button
    this.add
      .text(GAME_W - 30, 26, 'SKIP ▶', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#9bd7ef'
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this._startLevel());

    this._show();
    this.input.on('pointerdown', (p) => {
      // ignore taps on the skip text (handled above)
      if (p.y < 60 && p.x > GAME_W - 140) return;
      this._advance();
    });
  }

  _show() {
    const panel = PANELS[this.index];
    this.titleTxt.setText(panel.title);
    this.bodyTxt.setText(panel.body);
    this.titleTxt.setAlpha(0);
    this.bodyTxt.setAlpha(0);
    this.tweens.add({ targets: [this.titleTxt, this.bodyTxt], alpha: 1, duration: 450 });
    AudioManager.click();
  }

  _advance() {
    this.index++;
    if (this.index >= PANELS.length) {
      this._startLevel();
      return;
    }
    this._show();
  }

  _startLevel() {
    this.cameras.main.fadeOut(500, 0, 8, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Level1');
    });
  }
}
