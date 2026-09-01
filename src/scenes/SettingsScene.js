import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// Settings — a modal overlay launched on top of a paused scene. Ornate gold/blue
// panel matching the game UI: settings emblem header, sliding toggle switches,
// and a 2-step reset-progress confirmation dialog.
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  init(data) {
    this.from = (data && data.from) || 'MainMenu';
  }

  create() {
    this.scene.bringToTop();

    // Dim backdrop (eats clicks)
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000814, 0.74).setInteractive();

    const cx = GAME_W / 2;
    const cy = GAME_H / 2;
    const W = 612;
    const H = 730;

    this._ornatePanel(cx, cy, W, H);

    // Header emblem (the SETTINGS button art)
    const header = this.add.image(cx, cy - H / 2 + 66, 'btnSettings');
    header.setScale(380 / header.width);

    const left = cx - W / 2 + 54;
    const right = cx + W / 2 - 54;

    // --- Sound row ---
    let rowY = cy - H / 2 + 190;
    this._rowLabel(left, rowY, '🔊  Sound');
    this._soundToggle = this._toggle(right - 38, rowY, SaveManager.soundOn, (on) => {
      AudioManager.unlock();
      if (on !== SaveManager.soundOn) AudioManager.toggle();
      if (on) AudioManager.startAmbient();
    });
    this._divider(cx, rowY + 46, W - 80);

    // --- How to play ---
    rowY += 96;
    this.add.text(cx, rowY, 'HOW TO PLAY', {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', color: '#7fb0cf', fontStyle: 'bold'
    }).setOrigin(0.5);
    rowY += 40;
    [
      ['🕹️', 'Drag the left side to swim'],
      ['⚡', 'SURGE to dash through danger'],
      ['🌀', 'TAIL WHIP to strike enemies']
    ].forEach(([ic, txt], i) => {
      const y = rowY + i * 40;
      this.add.text(left, y, ic, { fontSize: '22px' }).setOrigin(0, 0.5);
      this.add.text(left + 44, y, txt, {
        fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#dff1ff'
      }).setOrigin(0, 0.5);
    });
    this._divider(cx, rowY + 132, W - 80);

    // --- Reset progress ---
    rowY += 180;
    this._dangerButton(cx, rowY, 'RESET PROGRESS', () => this._confirmReset());

    // Version
    this.add.text(cx, cy + H / 2 - 84, 'Dashavatara · Chapter 1 · Matsya', {
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#5f8ba3'
    }).setOrigin(0.5);

    // Close
    this._goldButton(cx, cy + H / 2 - 44, 'CLOSE', 200, () => this._close());

    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this._close());
  }

  _close() {
    AudioManager.click();
    this.scene.resume(this.from);
    this.scene.stop();
  }

  // ---------- Ornate panel ----------
  _ornatePanel(cx, cy, w, h) {
    const g = this.add.graphics();
    const x = cx - w / 2;
    const y = cy - h / 2;
    // shadow
    g.fillStyle(0x000000, 0.35);
    g.fillRoundedRect(x + 6, y + 10, w, h, 26);
    // outer gold frame
    g.fillStyle(COLORS.gold, 1);
    g.fillRoundedRect(x, y, w, h, 26);
    // inner deep-blue fill
    g.fillStyle(0x0a2c44, 1);
    g.fillRoundedRect(x + 8, y + 8, w - 16, h - 16, 20);
    // subtle inner highlight border
    g.lineStyle(2, 0x2f6f9c, 0.8);
    g.strokeRoundedRect(x + 16, y + 16, w - 32, h - 32, 16);
    // top sheen
    g.fillStyle(0xffffff, 0.05);
    g.fillRoundedRect(x + 16, y + 16, w - 32, 60, 16);

    // corner diamonds
    [[x + 20, y + 20], [x + w - 20, y + 20], [x + 20, y + h - 20], [x + w - 20, y + h - 20]].forEach(([dx, dy]) => {
      const d = this.add.rectangle(dx, dy, 16, 16, COLORS.gold).setAngle(45).setStrokeStyle(2, 0xfff2cc, 0.9);
      const c = this.add.rectangle(dx, dy, 6, 6, 0x1e6bd6).setAngle(45);
    });
  }

  _rowLabel(x, y, text) {
    return this.add.text(x, y, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: '#eaf6ff', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
  }

  _divider(cx, y, w) {
    const g = this.add.graphics();
    g.lineStyle(2, COLORS.gold, 0.35);
    g.lineBetween(cx - w / 2, y, cx + w / 2, y);
  }

  // ---------- Sliding toggle switch ----------
  _toggle(x, y, initialOn, onChange) {
    const w = 82, h = 40, r = h / 2;
    let on = initialOn;
    const track = this.add.graphics();
    const draw = () => {
      track.clear();
      track.fillStyle(on ? COLORS.hpGreen : 0x4a6474, 1);
      track.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
      track.lineStyle(2, 0xffffff, 0.25);
      track.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    };
    const knob = this.add.circle(0, y, r - 5, 0xffffff).setStrokeStyle(2, 0x00121f, 0.15);
    const label = this.add.text(x, y, '', { fontFamily: 'system-ui', fontSize: '13px', color: '#00121f', fontStyle: 'bold' }).setOrigin(0.5);
    const place = (animate) => {
      const tx = on ? x + w / 2 - r : x - w / 2 + r;
      if (animate) this.tweens.add({ targets: knob, x: tx, duration: 150, ease: 'Quad.easeOut' });
      else knob.x = tx;
      label.setText(on ? 'ON' : 'OFF').setX(on ? x - 12 : x + 12).setColor(on ? '#0a3a1e' : '#dfeef5');
    };
    draw(); place(false);
    const hit = this.add.rectangle(x, y, w + 14, h + 14, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      on = !on;
      draw(); place(true);
      AudioManager.click();
      onChange(on);
    });
    return { get on() { return on; } };
  }

  _goldButton(x, y, label, w, onClick) {
    const g = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.gold, 1); bg.fillRoundedRect(-w / 2, -30, w, 60, 14);
    bg.lineStyle(3, 0xfff2cc, 0.9); bg.strokeRoundedRect(-w / 2, -30, w, 60, 14);
    const txt = this.add.text(0, 0, label, { fontFamily: 'system-ui', fontSize: '26px', color: '#00263a', fontStyle: 'bold' }).setOrigin(0.5);
    g.add([bg, txt]);
    const hit = this.add.rectangle(x, y, w, 60, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => g.setScale(0.96)).on('pointerup', () => { g.setScale(1); onClick(); }).on('pointerout', () => g.setScale(1));
    return g;
  }

  _dangerButton(x, y, label, onClick) {
    const w = 300;
    const g = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x7a3a3a, 1); bg.fillRoundedRect(-w / 2, -30, w, 60, 14);
    bg.lineStyle(2, 0xff9a9a, 0.7); bg.strokeRoundedRect(-w / 2, -30, w, 60, 14);
    const txt = this.add.text(0, 0, '🗑  ' + label, { fontFamily: 'system-ui', fontSize: '22px', color: '#ffe0e0', fontStyle: 'bold' }).setOrigin(0.5);
    g.add([bg, txt]);
    const hit = this.add.rectangle(x, y, w, 60, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => g.setScale(0.96)).on('pointerup', () => { g.setScale(1); onClick(); }).on('pointerout', () => g.setScale(1));
    return g;
  }

  // ---------- Reset confirmation dialog ----------
  _confirmReset() {
    AudioManager.click();
    if (this._dialog) return;
    const cx = GAME_W / 2, cy = GAME_H / 2;
    const d = this.add.container(0, 0).setDepth(100);
    this._dialog = d;

    d.add(this.add.rectangle(cx, cy, GAME_W, GAME_H, 0x000814, 0.6).setInteractive());

    const w = 520, h = 300;
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.4); g.fillRoundedRect(cx - w / 2 + 5, cy - h / 2 + 8, w, h, 20);
    g.fillStyle(0xb23a3a, 1); g.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 20);
    g.fillStyle(0x0a2c44, 1); g.fillRoundedRect(cx - w / 2 + 7, cy - h / 2 + 7, w - 14, h - 14, 16);
    d.add(g);

    d.add(this.add.text(cx, cy - h / 2 + 52, '⚠  Reset Progress?', {
      fontFamily: 'Georgia, serif', fontSize: '30px', color: '#ff9a9a', fontStyle: 'bold'
    }).setOrigin(0.5));
    d.add(this.add.text(cx, cy - 6, 'All chapters, scores and unlocked\nabilities will be erased. This cannot be undone.', {
      fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#eaf6ff', align: 'center', lineSpacing: 6
    }).setOrigin(0.5));

    // Cancel
    const cancel = this.add.container(cx - 118, cy + h / 2 - 52);
    const cbg = this.add.graphics(); cbg.fillStyle(0x3a5a70, 1); cbg.fillRoundedRect(-100, -28, 200, 56, 12);
    cbg.lineStyle(2, 0xffffff, 0.25); cbg.strokeRoundedRect(-100, -28, 200, 56, 12);
    cancel.add([cbg, this.add.text(0, 0, 'CANCEL', { fontFamily: 'system-ui', fontSize: '22px', color: '#eaf6ff', fontStyle: 'bold' }).setOrigin(0.5)]);
    const cancelHit = this.add.rectangle(cx - 118, cy + h / 2 - 52, 200, 56, 0, 0).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { AudioManager.click(); this._closeDialog(); });
    d.add([cancel, cancelHit]);

    // Confirm reset
    const conf = this.add.container(cx + 118, cy + h / 2 - 52);
    const rbg = this.add.graphics(); rbg.fillStyle(0xd14b4b, 1); rbg.fillRoundedRect(-100, -28, 200, 56, 12);
    rbg.lineStyle(2, 0xffd0d0, 0.5); rbg.strokeRoundedRect(-100, -28, 200, 56, 12);
    conf.add([rbg, this.add.text(0, 0, 'RESET', { fontFamily: 'system-ui', fontSize: '22px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5)]);
    const confHit = this.add.rectangle(cx + 118, cy + h / 2 - 52, 200, 56, 0, 0).setInteractive({ useHandCursor: true })
      .on('pointerup', () => { AudioManager.hit(); SaveManager.resetAll(); this._closeDialog(); this._flashDone(); });
    d.add([conf, confHit]);

    d.setScale(0.9).setAlpha(0);
    this.tweens.add({ targets: d, scale: 1, alpha: 1, duration: 180, ease: 'Back.easeOut' });
  }

  _closeDialog() {
    if (!this._dialog) return;
    this._dialog.destroy(); // hit zones live inside the container, destroyed too
    this._dialog = null;
  }

  _flashDone() {
    const t = this.add.text(GAME_W / 2, GAME_H / 2, 'Progress reset', {
      fontFamily: 'system-ui', fontSize: '26px', color: '#9be870', fontStyle: 'bold',
      backgroundColor: '#00121fcc', padding: { x: 18, y: 10 }
    }).setOrigin(0.5).setDepth(120);
    this.tweens.add({ targets: t, alpha: 0, y: '-=30', delay: 900, duration: 600, onComplete: () => t.destroy() });
    // refresh sound toggle state display if it changed (it doesn't), and restart scene visuals unaffected
  }
}
