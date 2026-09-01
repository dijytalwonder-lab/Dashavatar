// Controls — a reusable floating virtual joystick + action buttons for touch,
// with a full keyboard fallback for desktop testing. Any gameplay scene creates
// one: `this.controls = new Controls(this)`, then reads it each update().
//
//   controls.vector      -> {x, y} movement direction (magnitude 0..1)
//   controls.consumeDash()   -> true once when Dash was pressed
//   controls.consumeAttack() -> true once when Attack was pressed
//
// Keyboard: WASD / arrows = move, SPACE = dash, J = attack.

import { GAME_W, GAME_H, COLORS } from '../config.js';

const JOY_RADIUS = 78;
const THUMB_RADIUS = 42;

export default class Controls {
  constructor(scene, opts = {}) {
    this.scene = scene;
    // Button labels (default to Matsya's; other avatars can relabel).
    this.dashText = opts.dashLabel || 'SURGE';
    this.attackText = opts.attackLabel || 'TAIL\nWHIP';
    this.vector = { x: 0, y: 0 };
    this._dashQueued = false;
    this.dashDown = false;
    this._attackQueued = false;

    this.joyPointerId = null;
    this.joyBaseX = 0;
    this.joyBaseY = 0;

    this._buildJoystick();
    this._buildButtons();
    this._bindPointer();
    this._bindKeyboard();
  }

  // --- Joystick (left half, floating) ---
  _buildJoystick() {
    const d = 1000;
    this.joyBase = this.scene.add
      .circle(0, 0, JOY_RADIUS, 0xffffff, 0.12)
      .setStrokeStyle(3, COLORS.air, 0.5)
      .setScrollFactor(0)
      .setDepth(d)
      .setVisible(false);
    this.joyThumb = this.scene.add
      .circle(0, 0, THUMB_RADIUS, COLORS.air, 0.55)
      .setScrollFactor(0)
      .setDepth(d + 1)
      .setVisible(false);
  }

  _buildButtons() {
    const d = 1000;
    // Dash button
    this.dashBtn = this.scene.add
      .circle(GAME_W - 220, GAME_H - 110, 56, COLORS.gold, 0.28)
      .setStrokeStyle(3, COLORS.gold, 0.8)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive({ useHandCursor: true });
    this.dashLabel = this.scene.add
      .text(GAME_W - 220, GAME_H - 110, this.dashText, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#ffe9b0',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 1);

    // Attack button
    this.atkBtn = this.scene.add
      .circle(GAME_W - 90, GAME_H - 160, 62, COLORS.enemy, 0.3)
      .setStrokeStyle(3, 0xff9a9a, 0.85)
      .setScrollFactor(0)
      .setDepth(d)
      .setInteractive({ useHandCursor: true });
    this.atkLabel = this.scene.add
      .text(GAME_W - 90, GAME_H - 160, this.attackText, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#ffd9d9',
        align: 'center',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(d + 1);

    this.dashBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this._dashQueued = true;
      this.dashDown = true; // held state (e.g. Kurma's shell)
      this._flash(this.dashBtn);
    });
    this.dashBtn.on('pointerup', () => (this.dashDown = false));
    this.dashBtn.on('pointerout', () => (this.dashDown = false));
    this.atkBtn.on('pointerdown', (p) => {
      p.event.stopPropagation();
      this._attackQueued = true;
      this._flash(this.atkBtn);
    });
  }

  _flash(btn) {
    this.scene.tweens.add({
      targets: btn,
      scale: { from: 0.82, to: 1 },
      duration: 160,
      ease: 'Quad.easeOut'
    });
  }

  _bindPointer() {
    const input = this.scene.input;

    input.on('pointerdown', (p) => {
      // Only the left half of the screen drives the joystick.
      if (this.joyPointerId !== null) return;
      if (p.x > GAME_W / 2) return;
      this.joyPointerId = p.id;
      this.joyBaseX = p.x;
      this.joyBaseY = p.y;
      this.joyBase.setPosition(p.x, p.y).setVisible(true);
      this.joyThumb.setPosition(p.x, p.y).setVisible(true);
    });

    input.on('pointermove', (p) => {
      if (p.id !== this.joyPointerId) return;
      this._updateThumb(p.x, p.y);
    });

    const release = (p) => {
      if (p.id !== this.joyPointerId) return;
      this.joyPointerId = null;
      this.vector.x = 0;
      this.vector.y = 0;
      this.joyBase.setVisible(false);
      this.joyThumb.setVisible(false);
    };
    input.on('pointerup', release);
    input.on('pointerupoutside', release);
  }

  _updateThumb(px, py) {
    let dx = px - this.joyBaseX;
    let dy = py - this.joyBaseY;
    const dist = Math.hypot(dx, dy);
    const max = JOY_RADIUS;
    if (dist > max) {
      dx = (dx / dist) * max;
      dy = (dy / dist) * max;
    }
    this.joyThumb.setPosition(this.joyBaseX + dx, this.joyBaseY + dy);
    this.vector.x = dx / max;
    this.vector.y = dy / max;
  }

  _bindKeyboard() {
    const kb = this.scene.input.keyboard;
    if (!kb) return;
    this.keys = kb.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      up2: Phaser.Input.Keyboard.KeyCodes.UP,
      down2: Phaser.Input.Keyboard.KeyCodes.DOWN,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE,
      attack: Phaser.Input.Keyboard.KeyCodes.J
    });
    kb.on('keydown-SPACE', () => { this._dashQueued = true; this.dashDown = true; });
    kb.on('keyup-SPACE', () => (this.dashDown = false));
    kb.on('keydown-J', () => (this._attackQueued = true));
  }

  // Is the primary action button currently held (e.g. Kurma's shell)?
  isDashHeld() {
    return !!this.dashDown || (this.keys && this.keys.dash && this.keys.dash.isDown);
  }

  // Merge keyboard direction into the vector (called each frame).
  _keyboardVector() {
    if (!this.keys) return null;
    let x = 0;
    let y = 0;
    if (this.keys.left.isDown || this.keys.left2.isDown) x -= 1;
    if (this.keys.right.isDown || this.keys.right2.isDown) x += 1;
    if (this.keys.up.isDown || this.keys.up2.isDown) y -= 1;
    if (this.keys.down.isDown || this.keys.down2.isDown) y += 1;
    if (x === 0 && y === 0) return null;
    const m = Math.hypot(x, y) || 1;
    return { x: x / m, y: y / m };
  }

  update() {
    // Keyboard overrides joystick when the joystick isn't active.
    if (this.joyPointerId === null) {
      const kv = this._keyboardVector();
      if (kv) this.vector = kv;
      else if (!this._touchActive()) this.vector = { x: 0, y: 0 };
    }
  }

  _touchActive() {
    return this.joyPointerId !== null;
  }

  consumeDash() {
    if (this._dashQueued) {
      this._dashQueued = false;
      return true;
    }
    return false;
  }

  consumeAttack() {
    if (this._attackQueued) {
      this._attackQueued = false;
      return true;
    }
    return false;
  }

  setVisible(v) {
    [this.dashBtn, this.dashLabel, this.atkBtn, this.atkLabel].forEach((o) =>
      o.setVisible(v)
    );
    if (!v) {
      this.joyBase.setVisible(false);
      this.joyThumb.setVisible(false);
    }
  }

  destroy() {
    [
      this.joyBase,
      this.joyThumb,
      this.dashBtn,
      this.dashLabel,
      this.atkBtn,
      this.atkLabel
    ].forEach((o) => o && o.destroy());
  }
}
