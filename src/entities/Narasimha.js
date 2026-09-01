import Phaser from 'phaser';
import { COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

// Narasimha — the man-lion (Chapter 4). Fast ACTION COMBAT: a CLAW combo (main
// damage, builds the Fury meter on every hit) and FURY — once the meter is full,
// unleash a rage: an AoE shockwave plus a few seconds of faster, invulnerable,
// harder-hitting claws. handle() returns an action for the scene to apply:
//   { kind:'claw',  x,y,r, dmg }
//   { kind:'fury',  x,y,r, dmg }   (shockwave)
const N = {
  maxHealth: 6,
  speed: 265, accel: 920, drag: 540,
  invincibleMs: 800,
  clawCooldown: 210, clawRange: 88,
  comboWindow: 620,
  furyMax: 100, furyGainPerHit: 13,
  rageDuration: 3200
};

export default class Narasimha extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'narasimha');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true);

    const targetW = 116;
    this.baseScale = Math.min(1, targetW / this.width);
    this.setScale(this.baseScale);
    const r = this.height * 0.34;
    this.body.setCircle(r, this.width * 0.5 - r, this.height * 0.55 - r);
    this.setDrag(N.drag);
    this.setMaxVelocity(N.speed * 1.3);
    this.setDepth(50);

    this.health = N.maxHealth;
    this.fury = 0;
    this.facing = 1;
    this.combo = 0;
    this.comboAt = 0;
    this.clawReadyAt = 0;
    this.invincibleUntil = 0;
    this.ragingUntil = 0;
  }

  get isRaging() { return this.scene.time.now < this.ragingUntil; }
  get isInvincible() { return this.isRaging || this.scene.time.now < this.invincibleUntil; }

  handle(controls) {
    const v = controls.vector;
    const now = this.scene.time.now;

    this.setAcceleration(v.x * N.accel, v.y * N.accel);
    const spd = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    if (spd > N.speed) { const s = N.speed / spd; this.setVelocity(this.body.velocity.x * s, this.body.velocity.y * s); }
    if (Math.abs(v.x) > 0.05) this.facing = Math.sign(v.x);
    this.setFlipX(this.facing < 0);

    // Fury unleash
    if (controls.consumeDash() && this.fury >= N.furyMax) return this._unleashFury();

    // Claw
    if (controls.consumeAttack() && now >= this.clawReadyAt) return this._claw(now);
    return null;
  }

  _claw(now) {
    this.combo = now < this.comboAt + N.comboWindow ? Math.min(this.combo + 1, 3) : 1;
    this.comboAt = now;
    this.clawReadyAt = now + (this.isRaging ? N.clawCooldown * 0.6 : N.clawCooldown);
    const hx = this.x + this.facing * 44;
    const hy = this.y;
    let dmg = this.combo >= 3 ? 2 : 1;
    if (this.isRaging) dmg += 1;
    const arc = this.scene.add.circle(hx, hy, N.clawRange, this.isRaging ? 0xff7a3a : 0xffca6a, 0.24).setDepth(48);
    this.scene.tweens.add({ targets: arc, scale: { from: 0.5, to: 1.1 }, alpha: { from: 0.45, to: 0 }, duration: 180, onComplete: () => arc.destroy() });
    // claw-slash lines
    AudioManager.swim();
    this.scene.tweens.add({ targets: this, scaleX: this.baseScale * (this.facing < 0 ? -1.1 : 1.1), duration: 90, yoyo: true });
    return { kind: 'claw', x: hx, y: hy, r: N.clawRange, dmg };
  }

  _unleashFury() {
    this.fury = 0;
    this.ragingUntil = this.scene.time.now + N.rageDuration;
    this.setTint(0xff8a5a);
    AudioManager.bossRoar();
    this.scene.cameras.main.shake(200, 0.012);
    this.scene.cameras.main.flash(160, 120, 40, 10);
    const ring = this.scene.add.circle(this.x, this.y, 150, 0xff6a2a, 0.35).setDepth(47);
    this.scene.tweens.add({ targets: ring, scale: { from: 0.3, to: 1.4 }, alpha: { from: 0.5, to: 0 }, duration: 380, onComplete: () => ring.destroy() });
    this.scene.time.delayedCall(N.rageDuration, () => { if (this.active && !this.isRaging) this.clearTint(); });
    return { kind: 'fury', x: this.x, y: this.y, r: 170, dmg: 3 };
  }

  onHit() { if (!this.isRaging) this.fury = Math.min(N.furyMax, this.fury + N.furyGainPerHit); }

  takeDamage(n, fromX, fromY) {
    if (this.isInvincible) return false;
    this.health = Math.max(0, this.health - n);
    this.invincibleUntil = this.scene.time.now + N.invincibleMs;
    AudioManager.hit();
    this.scene.cameras.main.shake(140, 0.012);
    this.scene.cameras.main.flash(120, 90, 20, 20);
    const ang = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(ang) * 320, Math.sin(ang) * 320);
    this.scene.tweens.add({ targets: this, alpha: { from: 0.3, to: 1 }, duration: 130, repeat: 4 });
    return true;
  }

  heal(n) { this.health = Math.min(N.maxHealth, this.health + n); }
  get maxHealth() { return N.maxHealth; }
  get furyMax() { return N.furyMax; }
}
