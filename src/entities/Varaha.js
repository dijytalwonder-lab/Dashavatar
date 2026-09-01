import Phaser from 'phaser';
import { COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

// Varaha — the mighty boar (Chapter 3). Carries movement forward and introduces
// STRENGTH: a tusk CHARGE that smashes breakable barriers and gores enemies, plus
// a quick GORE swipe. The scene reads `isCharging` to break barriers / deal
// charge damage, and applies the hit area returned by handle() on GORE.
const V = {
  maxHealth: 6,
  speed: 230,
  accel: 840,
  drag: 480,
  invincibleMs: 850,
  chargeSpeed: 660,
  chargeDuration: 360,
  chargeCooldown: 1150,
  goreRange: 94,
  goreCooldown: 430
};

export default class Varaha extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'varaha');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    const targetW = 130;
    this.baseScale = Math.min(1, targetW / this.width);
    this.setScale(this.baseScale);
    const r = this.height * 0.36;
    this.body.setCircle(r, this.width * 0.55 - r, this.height * 0.5 - r);
    this.setDrag(V.drag);
    this.setMaxVelocity(V.chargeSpeed);
    this.setDepth(50);

    this.health = V.maxHealth;
    this.facing = 1;
    this.invincibleUntil = 0;
    this.chargeReadyAt = 0;
    this.chargingUntil = 0;
    this.goreReadyAt = 0;
    this.chargeId = 0; // increments each charge, so a single charge hits a boss once

    this.trail = scene.add.particles(0, 0, 'bubble', {
      lifespan: 700, speed: { min: 6, max: 20 }, scale: { start: 0.5, end: 0 },
      alpha: { start: 0.4, end: 0 }, frequency: 140, follow: this, followOffset: { x: -40, y: 8 }
    });
    this.trail.setDepth(49);
  }

  get isCharging() { return this.scene.time.now < this.chargingUntil; }
  get isInvincible() { return this.isCharging || this.scene.time.now < this.invincibleUntil; }

  handle(controls) {
    const v = controls.vector;
    const now = this.scene.time.now;

    if (controls.consumeDash() && now >= this.chargeReadyAt) this._charge(v);

    if (!this.isCharging) {
      this.setAcceleration(v.x * V.accel, v.y * V.accel);
      const spd = Math.hypot(this.body.velocity.x, this.body.velocity.y);
      if (spd > V.speed) { const s = V.speed / spd; this.setVelocity(this.body.velocity.x * s, this.body.velocity.y * s); }
    } else {
      this.setAcceleration(0, 0);
    }

    if (Math.abs(v.x) > 0.05 || Math.abs(this.body.velocity.x) > 20) {
      const dir = v.x !== 0 ? Math.sign(v.x) : Math.sign(this.body.velocity.x);
      if (dir !== 0) this.facing = dir;
    }
    this.setFlipX(this.facing < 0);

    if (controls.consumeAttack() && now >= this.goreReadyAt && !this.isCharging) return this._gore();
    return null;
  }

  _charge(v) {
    let dx = v.x, dy = v.y;
    if (dx === 0 && dy === 0) { dx = this.facing; dy = 0; }
    const m = Math.hypot(dx, dy) || 1;
    this.setVelocity((dx / m) * V.chargeSpeed, (dy / m) * V.chargeSpeed);
    this.chargingUntil = this.scene.time.now + V.chargeDuration;
    this.chargeReadyAt = this.scene.time.now + V.chargeCooldown;
    this.chargeId++;
    AudioManager.dash();
    this.scene.cameras.main.shake(90, 0.005);
    this.scene.tweens.add({ targets: this, scaleX: this.baseScale * 1.2, scaleY: this.baseScale * 0.85, duration: 130, yoyo: true });
    // tusk glow streak
    const glow = this.scene.add.image(this.x, this.y, 'glow').setScale(1.4).setAlpha(0.5).setTint(0xffca6a).setBlendMode(Phaser.BlendModes.ADD).setDepth(49);
    this.scene.tweens.add({ targets: glow, alpha: 0, duration: V.chargeDuration, onComplete: () => glow.destroy() });
    this._chargeGlow = glow;
  }

  _gore() {
    this.goreReadyAt = this.scene.time.now + V.goreCooldown;
    const hx = this.x + this.facing * 46;
    const hy = this.y;
    const arc = this.scene.add.circle(hx, hy, V.goreRange, 0xffca6a, 0.22).setDepth(48);
    this.scene.tweens.add({ targets: arc, scale: { from: 0.5, to: 1.1 }, alpha: { from: 0.4, to: 0 }, duration: 200, onComplete: () => arc.destroy() });
    AudioManager.swim();
    return { x: hx, y: hy, r: V.goreRange };
  }

  update() {
    if (this._chargeGlow && this._chargeGlow.active) this._chargeGlow.setPosition(this.x, this.y);
  }

  takeDamage(n, fromX, fromY) {
    if (this.isInvincible) return false;
    this.health = Math.max(0, this.health - n);
    this.invincibleUntil = this.scene.time.now + V.invincibleMs;
    AudioManager.hit();
    this.scene.cameras.main.shake(140, 0.012);
    this.scene.cameras.main.flash(120, 90, 20, 20);
    const ang = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(ang) * 320, Math.sin(ang) * 320);
    this.scene.tweens.add({ targets: this, alpha: { from: 0.3, to: 1 }, duration: 130, repeat: 5 });
    return true;
  }

  heal(n) { this.health = Math.min(V.maxHealth, this.health + n); }
  get maxHealth() { return V.maxHealth; }
}
