import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { makeWaterBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// The ten worlds of the campaign. Only Chapter 1 (Matsya) is playable so far;
// the rest are placeholders that unlock as the story is built out. A chapter
// unlocks when the PREVIOUS chapter has been completed.
const CHAPTERS = [
  { n: 1,  emoji: '🐟', name: 'Matsya',       tag: 'Swimming + Rescue',        playable: true },
  { n: 2,  emoji: '🐢', name: 'Kurma',        tag: 'Defense + Survival',       playable: false },
  { n: 3,  emoji: '🐗', name: 'Varaha',       tag: 'Exploration + Boss Combat',playable: false },
  { n: 4,  emoji: '🦁', name: 'Narasimha',    tag: 'Action Combat',            playable: false },
  { n: 5,  emoji: '👣', name: 'Vamana',       tag: 'Puzzle + Strategy',        playable: false },
  { n: 6,  emoji: '🪓', name: 'Parashurama',  tag: 'Weapon Combat',            playable: false },
  { n: 7,  emoji: '🏹', name: 'Rama',         tag: 'Archery + Adventure',      playable: false },
  { n: 8,  emoji: '🪈', name: 'Krishna',      tag: 'Strategy + Choices',       playable: false },
  { n: 9,  emoji: '🧘', name: 'Buddha',       tag: 'Exploration + Morals',     playable: false },
  { n: 10, emoji: '⚔️', name: 'Kalki',        tag: 'Epic Final Battle',        playable: false }
];

export default class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelect');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 8, 20);
    makeWaterBackground(this);

    // Header
    this.add.text(GAME_W / 2, 70, 'CHOOSE YOUR WORLD', {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5);
    this.add.text(GAME_W / 2, 108, 'Each avatar teaches an ability that carries forward', {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#9bd7ef'
    }).setOrigin(0.5);

    // Back button
    this.add.text(28, 40, '‹ BACK', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#9bd7ef'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      AudioManager.click();
      this.scene.start('MainMenu');
    });

    // Chapter rows
    const top = 165;
    const rowH = 104;
    CHAPTERS.forEach((ch, i) => this._row(ch, top + i * rowH));

    // Toast line
    this.toast = this.add.text(GAME_W / 2, GAME_H - 26, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#ffb3b3'
    }).setOrigin(0.5).setAlpha(0);
  }

  _isUnlocked(n) {
    if (n === 1) return true;
    const prev = SaveManager.data.chapters[n - 1];
    return !!(prev && prev.completed);
  }

  _row(ch, y) {
    const unlocked = this._isUnlocked(ch.n);
    const done = SaveManager.data.chapters[ch.n] && SaveManager.data.chapters[ch.n].completed;
    const w = GAME_W - 60;

    const g = this.add.container(GAME_W / 2, y);
    const bg = this.add
      .rectangle(0, 0, w, 92, unlocked ? 0x0a3a5c : 0x0a2233, unlocked ? 0.85 : 0.55)
      .setStrokeStyle(2, unlocked ? COLORS.gold : 0x2a4a5a, unlocked ? 0.8 : 0.5);
    g.add(bg);

    // Avatar emoji medallion
    const medal = this.add.circle(-w / 2 + 55, 0, 34, unlocked ? 0x146c94 : 0x0e2a3a, 0.9)
      .setStrokeStyle(2, unlocked ? COLORS.air : 0x33586a, 0.7);
    const emoji = this.add.text(-w / 2 + 55, 0, ch.emoji, { fontSize: '34px' }).setOrigin(0.5);
    if (!unlocked) emoji.setAlpha(0.35);
    g.add([medal, emoji]);

    // Title + tag
    const titleColor = unlocked ? '#eaf6ff' : '#5b7686';
    const title = this.add.text(-w / 2 + 105, -16, `${ch.n}. ${ch.name}`, {
      fontFamily: 'Georgia, serif', fontSize: '26px', color: titleColor, fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    const tag = this.add.text(-w / 2 + 105, 16, ch.tag, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: unlocked ? '#9bd7ef' : '#4a6575'
    }).setOrigin(0, 0.5);
    g.add([title, tag]);

    // Status marker on the right
    let marker;
    if (done) {
      marker = this.add.text(w / 2 - 40, 0, '✓', { fontSize: '34px', color: '#4be86b', fontStyle: 'bold' }).setOrigin(0.5);
    } else if (unlocked) {
      marker = this.add.text(w / 2 - 40, 0, '▶', { fontSize: '30px', color: '#ffd257' }).setOrigin(0.5);
    } else {
      marker = this.add.text(w / 2 - 40, 0, '🔒', { fontSize: '28px' }).setOrigin(0.5).setAlpha(0.7);
    }
    g.add(marker);

    // Interaction
    bg.setInteractive({ useHandCursor: unlocked });
    bg.on('pointerover', () => unlocked && g.setScale(1.02));
    bg.on('pointerout', () => g.setScale(1));
    bg.on('pointerdown', () => {
      if (!unlocked) {
        AudioManager.hit();
        this._shake(g);
        this._showToast(`🔒 Complete Chapter ${ch.n - 1} to unlock ${ch.name}`);
        return;
      }
      AudioManager.click();
      if (ch.playable) {
        // Chapter 1 -> its story intro, then the level
        this.cameras.main.fadeOut(300, 0, 8, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Story'));
      } else {
        this._showToast(`${ch.emoji} ${ch.name} — coming soon!`);
      }
    });

    return g;
  }

  _shake(obj) {
    const x0 = obj.x;
    this.tweens.add({ targets: obj, x: x0 - 8, duration: 50, yoyo: true, repeat: 3, onComplete: () => (obj.x = x0) });
  }

  _showToast(msg) {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 600 });
  }
}
