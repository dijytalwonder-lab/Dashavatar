import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, OBJECTIVES } from '../config.js';
import { makeWaterBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';
import AbilitySystem from '../systems/AbilitySystem.js';

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  init(data) {
    this.result = data || {};
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 8, 20);
    makeWaterBackground(this);

    if (this.result.failed) {
      this._fail();
    } else {
      this._success();
    }
  }

  // ---------------- Failure ----------------
  _fail() {
    AudioManager.stopAmbient();
    AudioManager.lose();
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x2a0810, 0.4);
    this.add.text(GAME_W / 2, 400, 'The Flood Prevailed', {
      fontFamily: 'Georgia, serif', fontSize: '44px', color: '#ff8a8a', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 480, this.result.reason || 'Matsya could not save everyone in time.', {
      fontFamily: 'system-ui, sans-serif', fontSize: '22px', color: '#eaf6ff', align: 'center',
      lineSpacing: 6, wordWrap: { width: GAME_W - 120 }
    }).setOrigin(0.5);

    this._button(GAME_W / 2, 680, 'TRY AGAIN', () => {
      AudioManager.click();
      this.scene.start('Level1');
    });
    this._button(GAME_W / 2, 780, 'WORLDS', () => {
      AudioManager.click();
      this.scene.start('ChapterSelect');
    }, 0x3a5a70);
  }

  // ---------------- Success ----------------
  _success() {
    const counts = this.result.counts || { sages: 0, seeds: 0, animals: 0, scrolls: 0 };
    const score = this.result.score || 0;

    // Persist progress + unlock the chapter's ability
    AbilitySystem.unlock('swimming');
    SaveManager.recordChapter(1, {
      score,
      sages: counts.sages,
      seeds: counts.seeds,
      animals: counts.animals,
      scrolls: counts.scrolls
    });

    AudioManager.win();

    // Cinematic line 1: the flood recedes
    this.add.text(GAME_W / 2, 170, 'Chapter 1 Complete', {
      fontFamily: 'Georgia, serif', fontSize: '40px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 226, 'The flood recedes. Manu, the sages, the seeds\nand the creatures are safe.', {
      fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#eaf6ff', align: 'center',
      lineSpacing: 6, wordWrap: { width: GAME_W - 80 }
    }).setOrigin(0.5);

    // Results card
    const card = this.add.rectangle(GAME_W / 2, 480, GAME_W - 90, 280, 0x00121f, 0.7).setStrokeStyle(2, COLORS.air, 0.4);
    const rows = [
      ['🧙 Sages rescued', `${counts.sages}/${OBJECTIVES.sages}`],
      ['🌱 Seeds saved', `${counts.seeds}/${OBJECTIVES.seeds}`],
      ['🐾 Animals gathered', `${counts.animals}/${OBJECTIVES.animals}`],
      ['📜 Vedas recovered', `${counts.scrolls}/${OBJECTIVES.scrolls}`],
      ['⭐ Score', `${score}`]
    ];
    const cardLeft = GAME_W / 2 - (GAME_W - 90) / 2 + 34;
    const cardRight = GAME_W / 2 + (GAME_W - 90) / 2 - 34;
    rows.forEach((r, i) => {
      const y = 384 + i * 44;
      this.add.text(cardLeft, y, r[0], { fontFamily: 'system-ui', fontSize: '21px', color: '#eaf6ff' }).setOrigin(0, 0.5);
      this.add.text(cardRight, y, r[1], { fontFamily: 'system-ui', fontSize: '21px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(1, 0.5);
    });

    // Ability unlocked banner
    const ab = this.add.container(GAME_W / 2, 700).setAlpha(0);
    const abBg = this.add.rectangle(0, 0, GAME_W - 110, 60, COLORS.gold, 0.16).setStrokeStyle(2, COLORS.gold, 0.7);
    const abTxt = this.add.text(0, 0, '🐟  ABILITY UNLOCKED:  SWIMMING', {
      fontFamily: 'system-ui, sans-serif', fontSize: '22px', color: '#ffe9b0', fontStyle: 'bold'
    }).setOrigin(0.5);
    ab.add([abBg, abTxt]);
    this.tweens.add({ targets: ab, alpha: 1, y: 698, duration: 700, delay: 500, ease: 'Back.easeOut' });

    // The disturbing sequel hook (fades in after a beat)
    const hook = this.add.text(GAME_W / 2, 830, '', {
      fontFamily: 'Georgia, serif', fontSize: '21px', color: '#9bd7ef', fontStyle: 'italic', align: 'center',
      lineSpacing: 6, wordWrap: { width: GAME_W - 100 }
    }).setOrigin(0.5);
    this.time.delayedCall(1400, () => {
      this._typewriter(hook, '“The flood was not the beginning. Something deeper still disturbs the balance of creation…”');
    });

    // Buttons + Chapter 2 teaser
    this.time.delayedCall(2600, () => {
      this._teaser();
      this._button(GAME_W / 2 - 145, 1160, 'REPLAY', () => {
        AudioManager.click();
        this.scene.start('Level1');
      }, 0x3a5a70, 0.9);
      this._button(GAME_W / 2 + 145, 1160, 'WORLDS', () => {
        AudioManager.click();
        this.scene.start('ChapterSelect');
      }, 0x3a5a70, 0.9);
    });
  }

  _teaser() {
    const t = this.add.text(GAME_W / 2, 1000, 'Chapter 2 — 🐢 Kurma is now unlocked!', {
      fontFamily: 'system-ui, sans-serif', fontSize: '21px', color: '#9be870', fontStyle: 'bold'
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, duration: 800 });
  }

  _typewriter(textObj, full) {
    let i = 0;
    this.time.addEvent({
      delay: 34,
      repeat: full.length - 1,
      callback: () => {
        i++;
        textObj.setText(full.slice(0, i));
      }
    });
  }

  _button(x, y, label, onClick, color = COLORS.gold, scale = 1) {
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 220 * scale, 58 * scale, color, 0.9).setStrokeStyle(3, 0xffffff, 0.3);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, sans-serif', fontSize: `${26 * scale}px`,
      color: color === COLORS.gold ? '#00263a' : '#eaf6ff', fontStyle: 'bold'
    }).setOrigin(0.5);
    g.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => g.setScale(1.05))
      .on('pointerout', () => g.setScale(1))
      .on('pointerdown', () => { g.setScale(0.96); onClick(); });
    return g;
  }
}
