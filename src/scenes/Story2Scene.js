import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

const PANELS = [
  { title: 'The gods grow weak', body: 'A curse has drained the devas of their strength. Only amrita — the nectar of immortality — can restore them.' },
  { title: 'A great churning', body: 'Devas and asuras agree to churn the Ocean of Milk. Mount Mandara is the churning rod; the serpent Vasuki, the rope.' },
  { title: 'The mountain sinks', body: 'As they pull and heave, Mount Mandara has no base — and begins to sink into the depths.' },
  { title: 'Kurma rises', body: 'Vishnu takes the form of KURMA, the great tortoise, and dives beneath to bear the mountain upon his shell.' },
  { title: 'Endure', body: 'Hold firm! The churning stirs up rocks, poison, and demons. Defend — until the amrita rises.' }
];

export default class Story2Scene extends Phaser.Scene {
  constructor() { super('Story2'); }

  create() {
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgMid').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x5a7a8a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x04121a, 0.35).setDepth(-9);
    AudioManager.startAmbient();

    this.index = 0;
    this.add.rectangle(GAME_W / 2, GAME_H / 2 + 40, GAME_W - 70, 340, 0x00121f, 0.72).setStrokeStyle(2, COLORS.gold, 0.4);
    this.titleTxt = this.add.text(GAME_W / 2, GAME_H / 2 - 90, '', {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffd257', fontStyle: 'bold', align: 'center', wordWrap: { width: GAME_W - 120 }
    }).setOrigin(0.5);
    this.bodyTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 40, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '23px', color: '#eaf6ff', align: 'center', wordWrap: { width: GAME_W - 130 }, lineSpacing: 8
    }).setOrigin(0.5);

    // Kurma drifts across the top
    const kurma = this.add.image(-80, 170, 'kurma').setScale(1.1);
    this.tweens.add({ targets: kurma, x: GAME_W + 80, duration: 11000, repeat: -1, onRepeat: () => (kurma.y = 130 + Math.random() * 120) });

    this.hint = this.add.text(GAME_W / 2, GAME_H - 40, 'tap to continue', { fontFamily: 'system-ui', fontSize: '18px', color: '#ffd257' }).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(GAME_W - 30, 26, 'SKIP ▶', { fontFamily: 'system-ui', fontSize: '20px', color: '#9bd7ef' })
      .setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this._start());

    this._show();
    this.input.on('pointerdown', (p) => { if (p.y < 60 && p.x > GAME_W - 140) return; this._advance(); });
  }

  _show() {
    const panel = PANELS[this.index];
    this.titleTxt.setText(panel.title); this.bodyTxt.setText(panel.body);
    this.titleTxt.setAlpha(0); this.bodyTxt.setAlpha(0);
    this.tweens.add({ targets: [this.titleTxt, this.bodyTxt], alpha: 1, duration: 450 });
    AudioManager.click();
  }

  _advance() { this.index++; if (this.index >= PANELS.length) this._start(); else this._show(); }

  _start() {
    this.cameras.main.fadeOut(500, 0, 8, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level2'));
  }
}
