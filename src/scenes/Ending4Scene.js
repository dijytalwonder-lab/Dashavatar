import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';
import AbilitySystem from '../systems/AbilitySystem.js';

// Chapter 4 ending — the tyrant is slain, Narasimha unlocks FURY, and a hook
// leads toward Chapter 5 (Vamana).
export default class Ending4Scene extends Phaser.Scene {
  constructor() { super('Ending4'); }
  init(data) { this.result = data || {}; }

  create() {
    this.cameras.main.fadeIn(600, 0, 8, 20);
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgMid').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x8a6a5a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x120608, 0.4).setDepth(-9);

    const score = this.result.score || 0;
    AbilitySystem.unlock('fury');
    SaveManager.recordChapter(4, { score });
    AudioManager.win();

    this.add.text(GAME_W / 2, 170, 'Chapter 4 Complete', { fontFamily: 'Georgia, serif', fontSize: '40px', color: '#ffca6a', fontStyle: 'bold' }).setOrigin(0.5).setShadow(0, 3, '#00131f', 6);
    this.add.text(GAME_W / 2, 226, 'The tyrant is slain and Prahlada is safe.\nNarasimha’s roar calms into peace.', { fontFamily: 'system-ui', fontSize: '19px', color: '#f5e6d8', align: 'center', lineSpacing: 6, wordWrap: { width: GAME_W - 80 } }).setOrigin(0.5);

    this.add.rectangle(GAME_W / 2, 420, GAME_W - 90, 140, 0x120608, 0.7).setStrokeStyle(2, COLORS.gold, 0.4);
    const rows = [['🦁 The palace', 'Cleared'], ['⭐ Score', `${score}`]];
    const cl = GAME_W / 2 - (GAME_W - 90) / 2 + 34, cr = GAME_W / 2 + (GAME_W - 90) / 2 - 34;
    rows.forEach((r, i) => {
      const y = 396 + i * 44;
      this.add.text(cl, y, r[0], { fontFamily: 'system-ui', fontSize: '21px', color: '#f5e6d8' }).setOrigin(0, 0.5);
      this.add.text(cr, y, r[1], { fontFamily: 'system-ui', fontSize: '21px', color: '#ffca6a', fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    const ab = this.add.container(GAME_W / 2, 580).setAlpha(0);
    ab.add(this.add.rectangle(0, 0, GAME_W - 110, 60, 0xff7a3a, 0.18).setStrokeStyle(2, 0xff7a3a, 0.7));
    ab.add(this.add.text(0, 0, '🦁  ABILITY UNLOCKED:  FURY', { fontFamily: 'system-ui', fontSize: '22px', color: '#ffd0a0', fontStyle: 'bold' }).setOrigin(0.5));
    this.tweens.add({ targets: ab, alpha: 1, y: 578, duration: 700, delay: 500, ease: 'Back.easeOut' });

    const hook = this.add.text(GAME_W / 2, 720, '', { fontFamily: 'Georgia, serif', fontSize: '21px', color: '#e0b090', fontStyle: 'italic', align: 'center', lineSpacing: 6, wordWrap: { width: GAME_W - 100 } }).setOrigin(0.5);
    this.time.delayedCall(1400, () => this._type(hook, '“Now the demon-king Bali conquers all three worlds. It will take not fury, but wit — and three small steps — to humble him…”'));

    this.time.delayedCall(2600, () => {
      this.add.text(GAME_W / 2, 890, 'Chapter 5 — 👣 Vamana is now unlocked!', { fontFamily: 'system-ui', fontSize: '21px', color: '#9be870', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0).setName('teaser');
      this.tweens.add({ targets: this.children.getByName('teaser'), alpha: 1, duration: 800 });
      this._button(GAME_W / 2 - 145, 1160, 'REPLAY', () => this.scene.start('Level4'), 0x3a5a70);
      this._button(GAME_W / 2 + 145, 1160, 'WORLDS', () => this.scene.start('ChapterSelect'), 0x3a5a70);
    });
  }

  _type(obj, full) { let i = 0; this.time.addEvent({ delay: 30, repeat: full.length - 1, callback: () => { i++; obj.setText(full.slice(0, i)); } }); }
  _button(x, y, label, onClick, color = COLORS.gold) {
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 56, color, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    g.add([bg, this.add.text(0, 0, label, { fontFamily: 'system-ui', fontSize: '24px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5)]);
    bg.setInteractive({ useHandCursor: true }).on('pointerdown', () => g.setScale(0.96)).on('pointerup', () => { g.setScale(1); AudioManager.click(); onClick(); }).on('pointerout', () => g.setScale(1));
    return g;
  }
}
