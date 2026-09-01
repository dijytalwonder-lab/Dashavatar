import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';
import AbilitySystem from '../systems/AbilitySystem.js';

// Chapter 2 ending — the amrita is won, Kurma unlocks DEFENSE, and a hook leads
// toward Chapter 3 (Varaha).
export default class Ending2Scene extends Phaser.Scene {
  constructor() { super('Ending2'); }
  init(data) { this.result = data || {}; }

  create() {
    this.cameras.main.fadeIn(600, 0, 8, 20);
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgNear').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x6a8fae);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x03121f, 0.35).setDepth(-9);

    const treasures = this.result.treasures || 0;
    const score = this.result.score || 0;

    AbilitySystem.unlock('defense');
    SaveManager.recordChapter(2, { score, treasures });
    AudioManager.win();

    this.add.text(GAME_W / 2, 170, 'Chapter 2 Complete', {
      fontFamily: 'Georgia, serif', fontSize: '40px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 3, '#00131f', 6);

    this.add.text(GAME_W / 2, 226, 'Kurma bore the mountain and the amrita rose.\nThe devas drink, and their strength returns.', {
      fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#eaf6ff', align: 'center', lineSpacing: 6, wordWrap: { width: GAME_W - 80 }
    }).setOrigin(0.5);

    // Results card
    this.add.rectangle(GAME_W / 2, 430, GAME_W - 90, 180, 0x00121f, 0.7).setStrokeStyle(2, COLORS.gold, 0.4);
    const rows = [['🐢 The churning', 'Endured'], ['💎 Treasures gathered', `${treasures}`], ['⭐ Score', `${score}`]];
    const cl = GAME_W / 2 - (GAME_W - 90) / 2 + 34, cr = GAME_W / 2 + (GAME_W - 90) / 2 - 34;
    rows.forEach((r, i) => {
      const y = 384 + i * 44;
      this.add.text(cl, y, r[0], { fontFamily: 'system-ui', fontSize: '21px', color: '#eaf6ff' }).setOrigin(0, 0.5);
      this.add.text(cr, y, r[1], { fontFamily: 'system-ui', fontSize: '21px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    // Ability unlocked
    const ab = this.add.container(GAME_W / 2, 600).setAlpha(0);
    ab.add(this.add.rectangle(0, 0, GAME_W - 110, 60, COLORS.gold, 0.16).setStrokeStyle(2, COLORS.gold, 0.7));
    ab.add(this.add.text(0, 0, '🐢  ABILITY UNLOCKED:  DEFENSE', { fontFamily: 'system-ui', fontSize: '22px', color: '#ffe9b0', fontStyle: 'bold' }).setOrigin(0.5));
    this.tweens.add({ targets: ab, alpha: 1, y: 598, duration: 700, delay: 500, ease: 'Back.easeOut' });

    // Hook
    const hook = this.add.text(GAME_W / 2, 730, '', {
      fontFamily: 'Georgia, serif', fontSize: '21px', color: '#9bd7ef', fontStyle: 'italic', align: 'center', lineSpacing: 6, wordWrap: { width: GAME_W - 100 }
    }).setOrigin(0.5);
    this.time.delayedCall(1400, () => this._type(hook, '“But a demon has dragged the Earth beneath the sea. Who will lift it back into the light?”'));

    this.time.delayedCall(2600, () => {
      this.add.text(GAME_W / 2, 900, 'Chapter 3 — 🐗 Varaha is now unlocked!', {
        fontFamily: 'system-ui', fontSize: '21px', color: '#9be870', fontStyle: 'bold'
      }).setOrigin(0.5).setAlpha(0).setName('teaser');
      this.tweens.add({ targets: this.children.getByName('teaser'), alpha: 1, duration: 800 });
      this._button(GAME_W / 2 - 145, 1160, 'REPLAY', () => this.scene.start('Level2'), 0x3a5a70);
      this._button(GAME_W / 2 + 145, 1160, 'WORLDS', () => this.scene.start('ChapterSelect'), 0x3a5a70);
    });
  }

  _type(obj, full) {
    let i = 0;
    this.time.addEvent({ delay: 34, repeat: full.length - 1, callback: () => { i++; obj.setText(full.slice(0, i)); } });
  }

  _button(x, y, label, onClick, color = COLORS.gold) {
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 200, 56, color, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    g.add([bg, this.add.text(0, 0, label, { fontFamily: 'system-ui', fontSize: '24px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5)]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => g.setScale(0.96))
      .on('pointerup', () => { g.setScale(1); AudioManager.click(); onClick(); })
      .on('pointerout', () => g.setScale(1));
    return g;
  }
}
