import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// The ten worlds. World 1 (Matsya) is a large featured card built from real art;
// the rest are locked tiles awaiting their own assets. A world unlocks when the
// previous one is completed, but only Chapter 1 is playable so far.
const WORLDS = [
  { n: 1,  emoji: '🐟', name: 'Matsya',      sub: 'The Great Flood',   tag: 'Swimming + Rescue',         art: 'worldMatsya', playable: true },
  { n: 2,  emoji: '🐢', name: 'Kurma',       sub: 'The Churning Sea',  tag: 'Defense + Survival', story: 'Story2' },
  { n: 3,  emoji: '🐗', name: 'Varaha',      sub: 'The Sunken Earth',  tag: 'Exploration + Boss' },
  { n: 4,  emoji: '🦁', name: 'Narasimha',   sub: 'The Pillar',        tag: 'Action Combat' },
  { n: 5,  emoji: '👣', name: 'Vamana',      sub: 'Three Steps',       tag: 'Puzzle + Strategy' },
  { n: 6,  emoji: '🪓', name: 'Parashurama', sub: 'The Warrior',       tag: 'Weapon Combat' },
  { n: 7,  emoji: '🏹', name: 'Rama',        sub: 'The Exile',         tag: 'Archery + Adventure' },
  { n: 8,  emoji: '🪈', name: 'Krishna',     sub: 'The Charioteer',    tag: 'Strategy + Choices' },
  { n: 9,  emoji: '🧘', name: 'Buddha',      sub: 'The Awakening',     tag: 'Exploration + Morals' },
  { n: 10, emoji: '⚔️', name: 'Kalki',       sub: 'The Final Age',     tag: 'Epic Final Battle' }
];

export default class ChapterSelectScene extends Phaser.Scene {
  constructor() {
    super('ChapterSelect');
  }

  create() {
    this.cameras.main.fadeIn(300, 0, 8, 20);

    // Deep underwater base + dim
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgFar').setDepth(-10);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x35618a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x03121f, 0.55).setDepth(-9);

    // Header
    this.add.text(GAME_W / 2, 58, 'CHOOSE YOUR WORLD', {
      fontFamily: 'Georgia, serif', fontSize: '34px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5).setShadow(0, 3, '#00131f', 6);
    this.add.text(GAME_W / 2, 96, 'Ten avatars · one connected journey', {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#9bd7ef'
    }).setOrigin(0.5);

    // Back button
    this.add.text(26, 40, '‹ BACK', {
      fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#9bd7ef'
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => {
      AudioManager.click();
      this.scene.start('MainMenu');
    });

    // Featured world 1 card
    this._featuredCard(WORLDS[0], GAME_W / 2, 320);

    // "More Worlds" divider
    this.add.text(GAME_W / 2, 548, 'MORE WORLDS', {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#7fb0cf', fontStyle: 'bold'
    }).setOrigin(0.5);

    // Locked grid (worlds 2-10) — ornate padlock plaques
    const cols = 3, tileW = 214, tileH = 150, gx = 8, gy = 14;
    const gridW = cols * tileW + (cols - 1) * gx;
    const startX = (GAME_W - gridW) / 2 + tileW / 2;
    const startY = 646;
    WORLDS.slice(1).forEach((w, i) => {
      const cx = startX + (i % cols) * (tileW + gx);
      const cy = startY + Math.floor(i / cols) * (tileH + gy);
      if (this._isUnlocked(w.n) && w.story) this._playableTile(w, cx, cy, tileW, tileH);
      else this._lockedTile(w, cx, cy, tileW, tileH);
    });

    // Toast
    this.toast = this.add.text(GAME_W / 2, GAME_H - 24, '', {
      fontFamily: 'system-ui, sans-serif', fontSize: '17px', color: '#ffd9a0'
    }).setOrigin(0.5).setAlpha(0);
  }

  _isUnlocked(n) {
    if (n === 1) return true;
    const prev = SaveManager.data.chapters[n - 1];
    return !!(prev && prev.completed);
  }

  // ---- Featured card (World 1) ----
  _featuredCard(w, cx, cy) {
    const cardW = 664, cardH = 380;
    const done = SaveManager.data.chapters[1] && SaveManager.data.chapters[1].completed;

    const g = this.add.container(cx, cy);

    // Art, cover-cropped to the card
    const img = this.add.image(0, 0, w.art);
    const tex = this.textures.get(w.art).getSourceImage();
    const scale = Math.max(cardW / tex.width, cardH / tex.height);
    const cropW = cardW / scale, cropH = cardH / scale;
    img.setCrop((tex.width - cropW) / 2, (tex.height - cropH) / 2, cropW, cropH);
    img.setScale(scale);
    g.add(img);

    // Bottom gradient for text legibility
    const grad = this.add.graphics();
    grad.fillGradientStyle(0x000000, 0x000000, 0x00121f, 0x00121f, 0, 0, 0.9, 0.9);
    grad.fillRect(-cardW / 2, cardH / 2 - 150, cardW, 150);
    g.add(grad);

    // Frame
    const frame = this.add.rectangle(0, 0, cardW, cardH).setStrokeStyle(4, COLORS.gold, 0.95);
    g.add(frame);

    // World tag (top-left)
    const tag = this.add.container(-cardW / 2 + 62, -cardH / 2 + 34);
    tag.add(this.add.rectangle(0, 0, 108, 40, 0x00121f, 0.7).setStrokeStyle(2, COLORS.gold, 0.8));
    tag.add(this.add.text(0, 0, 'WORLD 1', { fontFamily: 'system-ui', fontSize: '17px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(0.5));
    g.add(tag);

    // Status badge (top-right)
    if (done) {
      const b = this.add.container(cardW / 2 - 44, -cardH / 2 + 34);
      b.add(this.add.circle(0, 0, 22, 0x1a3a2a, 0.85).setStrokeStyle(2, COLORS.hpGreen, 0.9));
      b.add(this.add.text(0, 0, '✓', { fontSize: '26px', color: '#4be86b', fontStyle: 'bold' }).setOrigin(0.5));
      g.add(b);
    }

    // Titles (bottom-left)
    g.add(this.add.text(-cardW / 2 + 26, cardH / 2 - 96, `${w.emoji}  ${w.name}`, {
      fontFamily: 'Georgia, serif', fontSize: '40px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0, 0.5).setShadow(0, 2, '#000', 6));
    g.add(this.add.text(-cardW / 2 + 28, cardH / 2 - 58, w.sub, {
      fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#bfe6ff', fontStyle: 'italic'
    }).setOrigin(0, 0.5));
    g.add(this.add.text(-cardW / 2 + 28, cardH / 2 - 30, `⚔ ${w.tag}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#9bd7ef'
    }).setOrigin(0, 0.5));

    // Play badge (bottom-right)
    const play = this.add.container(cardW / 2 - 92, cardH / 2 - 60);
    const pbg = this.add.rectangle(0, 0, 140, 62, COLORS.gold, 0.95).setStrokeStyle(3, 0xfff2cc, 0.9);
    play.add(pbg);
    play.add(this.add.text(0, 0, done ? 'REPLAY' : 'PLAY  ▶', {
      fontFamily: 'system-ui, sans-serif', fontSize: done ? '22px' : '24px', color: '#00263a', fontStyle: 'bold'
    }).setOrigin(0.5));
    g.add(play);

    // Whole card is tappable
    frame.setInteractive(new Phaser.Geom.Rectangle(-cardW / 2, -cardH / 2, cardW, cardH), Phaser.Geom.Rectangle.Contains);
    frame.on('pointerover', () => g.setScale(1.015));
    frame.on('pointerout', () => g.setScale(1));
    frame.on('pointerdown', () => g.setScale(0.99));
    frame.on('pointerup', () => {
      g.setScale(1);
      AudioManager.unlock();
      AudioManager.click();
      this.cameras.main.fadeOut(300, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Story'));
    });

    // gentle glow pulse on the frame
    this.tweens.add({ targets: frame, alpha: { from: 1, to: 0.6 }, duration: 1200, yoyo: true, repeat: -1 });
  }

  // ---- Playable tile (an unlocked world with content but no world-art yet) ----
  _playableTile(w, cx, cy, tw, th) {
    const done = SaveManager.data.chapters[w.n] && SaveManager.data.chapters[w.n].completed;
    const g = this.add.container(cx, cy);
    const bg = this.add.rectangle(0, 0, tw, th, 0x0a3a5c, 0.9).setStrokeStyle(3, COLORS.gold, 0.9);
    g.add(bg);
    g.add(this.add.circle(0, -38, 30, 0x146c94, 0.95).setStrokeStyle(2, COLORS.air, 0.7));
    g.add(this.add.text(0, -38, w.emoji, { fontSize: '32px' }).setOrigin(0.5));
    g.add(this.add.text(0, 8, `${w.n}. ${w.name}`, { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5));
    g.add(this.add.text(0, 32, w.tag, { fontFamily: 'system-ui', fontSize: '12px', color: '#9bd7ef', align: 'center', wordWrap: { width: tw - 24 } }).setOrigin(0.5));
    g.add(this.add.text(0, 60, done ? '✓ PLAY AGAIN' : 'PLAY  ▶', { fontFamily: 'system-ui', fontSize: '16px', color: done ? '#4be86b' : '#ffd257', fontStyle: 'bold' }).setOrigin(0.5));
    this.tweens.add({ targets: bg, alpha: { from: 0.9, to: 0.7 }, duration: 1300, yoyo: true, repeat: -1 });

    bg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => g.setScale(1.03)).on('pointerout', () => g.setScale(1))
      .on('pointerup', () => {
        AudioManager.click();
        this.cameras.main.fadeOut(300, 0, 8, 20);
        this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start(w.story));
      });
  }

  // ---- Locked tile (Worlds 2-10) — ornate locked-world plaque ----
  _lockedTile(w, cx, cy, tw, th) {
    const g = this.add.container(cx, cy);

    // The padlock sign fills the tile width
    const sign = this.add.image(0, -8, 'lockedWorld');
    sign.setScale((tw + 8) / sign.width);
    g.add(sign);
    const sh = sign.displayHeight;

    // "WORLD N" on the top wooden area (above the padlock)
    g.add(this.add.text(0, -sh * 0.16, `WORLD ${w.n}`, {
      fontFamily: 'Georgia, serif', fontSize: '15px', color: '#5a3a12', fontStyle: 'bold'
    }).setOrigin(0.5));

    // Avatar name below the sign, with a faded emoji
    g.add(this.add.text(0, sh / 2 - 2, `${w.emoji} ${w.name}`, {
      fontFamily: 'Georgia, serif', fontSize: '18px', color: '#cdae6a', fontStyle: 'bold'
    }).setOrigin(0.5, 0));

    sign.setInteractive({ useHandCursor: false });
    sign.on('pointerdown', () => {
      AudioManager.hit();
      this._shake(g, cx);
      this._toast(`🔒 ${w.emoji} ${w.name} — coming soon`);
    });
  }

  _shake(obj, x0) {
    this.tweens.add({ targets: obj, x: x0 - 6, duration: 45, yoyo: true, repeat: 3, onComplete: () => (obj.x = x0) });
  }

  _toast(msg) {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1600, duration: 600 });
  }
}
