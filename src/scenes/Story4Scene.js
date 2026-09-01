import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

const PANELS = [
  { title: "The tyrant's boon", body: 'Hiranyakashipu won a boon: no man nor beast may slay him, by day or night, indoors or out, on earth or sky, by any weapon. He named himself god.' },
  { title: 'The devoted son', body: 'Yet his son Prahlada worshipped Vishnu with all his heart, and would not bow to his father.' },
  { title: 'The wrath of the king', body: 'Enraged, the tyrant sought to destroy Prahlada — and sneered: “Is your Vishnu in this pillar?”' },
  { title: 'The pillar bursts', body: 'He struck the pillar — and NARASIMHA burst forth: neither man nor beast, at the twilight threshold.' },
  { title: 'Unleash your Fury', body: 'Tear through his guards and end the tyrant — with claws that are no weapon.' }
];

export default class Story4Scene extends Phaser.Scene {
  constructor() { super('Story4'); }

  create() {
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgMid').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x8a5a4a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1a0810, 0.4).setDepth(-9);
    AudioManager.startAmbient();

    this.index = 0;
    this.add.rectangle(GAME_W / 2, GAME_H / 2 + 40, GAME_W - 70, 340, 0x120608, 0.76).setStrokeStyle(2, COLORS.gold, 0.4);
    this.titleTxt = this.add.text(GAME_W / 2, GAME_H / 2 - 90, '', { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffca6a', fontStyle: 'bold', align: 'center', wordWrap: { width: GAME_W - 120 } }).setOrigin(0.5);
    this.bodyTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 40, '', { fontFamily: 'system-ui', fontSize: '22px', color: '#f5e6d8', align: 'center', wordWrap: { width: GAME_W - 130 }, lineSpacing: 8 }).setOrigin(0.5);

    const lion = this.add.image(-90, 180, 'narasimha').setScale(1.0);
    this.tweens.add({ targets: lion, x: GAME_W + 90, duration: 9000, repeat: -1, onRepeat: () => (lion.y = 130 + Math.random() * 120) });

    this.hint = this.add.text(GAME_W / 2, GAME_H - 40, 'tap to continue', { fontFamily: 'system-ui', fontSize: '18px', color: '#ffca6a' }).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.add.text(GAME_W - 30, 26, 'SKIP ▶', { fontFamily: 'system-ui', fontSize: '20px', color: '#e0b090' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this._start());

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
  _start() { this.cameras.main.fadeOut(500, 0, 8, 20); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level4')); }
}
