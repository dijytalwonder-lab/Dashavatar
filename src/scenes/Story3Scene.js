import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

const PANELS = [
  { title: 'The Earth is stolen', body: 'The demon HIRANYAKSHA, drunk on power, seizes Bhudevi — the Earth herself — and drags her down into the cosmic ocean.' },
  { title: 'Darkness below', body: 'He hides her in Rasatala, the deepest abyss, where no light has ever reached.' },
  { title: 'Varaha descends', body: 'Vishnu takes the form of VARAHA, a colossal boar, and plunges into the depths to find her.' },
  { title: 'Break through', body: 'The way down is sealed with ancient stone. Only raw STRENGTH — a charging tusk — can smash a path.' },
  { title: 'Lift the world', body: 'Find the Earth, defeat Hiranyaksha, and raise Bhudevi back into the light upon your tusks.' }
];

export default class Story3Scene extends Phaser.Scene {
  constructor() { super('Story3'); }

  create() {
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgFar').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x3a4a6a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x060814, 0.45).setDepth(-9);
    AudioManager.startAmbient();

    this.index = 0;
    this.add.rectangle(GAME_W / 2, GAME_H / 2 + 40, GAME_W - 70, 340, 0x00121f, 0.74).setStrokeStyle(2, COLORS.gold, 0.4);
    this.titleTxt = this.add.text(GAME_W / 2, GAME_H / 2 - 90, '', { fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffd257', fontStyle: 'bold', align: 'center', wordWrap: { width: GAME_W - 120 } }).setOrigin(0.5);
    this.bodyTxt = this.add.text(GAME_W / 2, GAME_H / 2 + 40, '', { fontFamily: 'system-ui', fontSize: '23px', color: '#eaf6ff', align: 'center', wordWrap: { width: GAME_W - 130 }, lineSpacing: 8 }).setOrigin(0.5);

    const boar = this.add.image(-90, 180, 'varaha').setScale(1.0);
    this.tweens.add({ targets: boar, x: GAME_W + 90, duration: 10000, repeat: -1, onRepeat: () => (boar.y = 130 + Math.random() * 120) });

    this.hint = this.add.text(GAME_W / 2, GAME_H - 40, 'tap to continue', { fontFamily: 'system-ui', fontSize: '18px', color: '#ffd257' }).setOrigin(0.5);
    this.tweens.add({ targets: this.hint, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
    this.add.text(GAME_W - 30, 26, 'SKIP ▶', { fontFamily: 'system-ui', fontSize: '20px', color: '#9bd7ef' }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this._start());

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
  _start() { this.cameras.main.fadeOut(500, 0, 8, 20); this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Level3')); }
}
