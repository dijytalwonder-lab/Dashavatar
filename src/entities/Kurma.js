import Phaser from 'phaser';
import { COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

// Kurma — the tortoise (Chapter 2). Carries SWIMMING forward (momentum movement)
// and introduces DEFENSE: hold SHELL to retract into an invulnerable shell —
// immobile, and limited by a shell-stamina bar. A quick BASH shoves nearby
// hazards away. Reads a Controls instance each frame via handle().
const K = {
  maxHealth: 5,
  speed: 195,
  accel: 720,
  drag: 520,
  invincibleMs: 900,
  staminaMax: 100,
  staminaDrain: 32,  // per second while shelled
  staminaRegen: 20,  // per second while out
  staminaMinToEnter: 12,
  bashCooldown: 950,
  bashRange: 96
};

export default class Kurma extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'kurma');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    const targetW = 118;
    this.baseScale = Math.min(1, targetW / this.width);
    this.setScale(this.baseScale);
    const r = this.height * 0.4;
    this.body.setCircle(r, this.width * 0.5 - r, this.height * 0.5 - r);
    this.setDrag(K.drag);
    this.setMaxVelocity(K.speed * 1.4);
    this.setDepth(50);

    this.health = K.maxHealth;
    this.stamina = K.staminaMax;
    this.shelled = false;
    this.invincibleUntil = 0;
    this.bashReadyAt = 0;
    this.facing = 1;

    // Gold shield bubble shown while shelled
    this.shield = scene.add.circle(x, y, 62, COLORS.gold, 0.18)
      .setStrokeStyle(3, COLORS.gold, 0.8).setDepth(51).setVisible(false);
  }

  get isInvincible() {
    return this.shelled || this.scene.time.now < this.invincibleUntil;
  }

  handle(controls, dt) {
    const now = this.scene.time.now;
    const wantShell = controls.isDashHeld();

    // Enter/stay/exit shell
    if (wantShell && (this.shelled || this.stamina > K.staminaMinToEnter)) {
      if (!this.shelled) this._enterShell();
      this.stamina = Math.max(0, this.stamina - K.staminaDrain * dt);
      if (this.stamina <= 0) this._exitShell();
    } else if (this.shelled) {
      this._exitShell();
    }
    if (!this.shelled) this.stamina = Math.min(K.staminaMax, this.stamina + K.staminaRegen * dt);

    // Movement (disabled while shelled)
    const v = controls.vector;
    if (this.shelled) {
      this.setAcceleration(0, 0);
      this.setVelocity(this.body.velocity.x * 0.85, this.body.velocity.y * 0.85);
    } else {
      this.setAcceleration(v.x * K.accel, v.y * K.accel);
      const spd = Math.hypot(this.body.velocity.x, this.body.velocity.y);
      if (spd > K.speed) { const s = K.speed / spd; this.setVelocity(this.body.velocity.x * s, this.body.velocity.y * s); }
      if (Math.abs(v.x) > 0.05) this.facing = Math.sign(v.x);
      this.setFlipX(this.facing < 0);
    }

    // Shield visual follows
    this.shield.setPosition(this.x, this.y).setVisible(this.shelled);
    if (this.shelled) this.shield.setScale(0.96 + Math.sin(now / 120) * 0.05);

    // Bash (tap)
    if (controls.consumeAttack() && !this.shelled && now >= this.bashReadyAt) {
      return this._bash();
    }
    return null;
  }

  _enterShell() {
    this.shelled = true;
    this.setTexture('kurmaShell');
    this.setAngle(0);
    AudioManager.click();
    this.scene.tweens.add({ targets: this, scaleX: this.baseScale * 1.05, scaleY: this.baseScale * 0.9, duration: 120, yoyo: true });
  }

  _exitShell() {
    this.shelled = false;
    this.setTexture('kurma');
    this.setFlipX(this.facing < 0);
  }

  _bash() {
    this.bashReadyAt = this.scene.time.now + K.bashCooldown;
    AudioManager.dash();
    const ring = this.scene.add.circle(this.x, this.y, K.bashRange, COLORS.kurmaSkin, 0.22).setDepth(48);
    this.scene.tweens.add({ targets: ring, scale: { from: 0.4, to: 1.1 }, alpha: { from: 0.4, to: 0 }, duration: 240, onComplete: () => ring.destroy() });
    return { x: this.x, y: this.y, r: K.bashRange };
  }

  takeDamage(n, fromX, fromY) {
    if (this.isInvincible) {
      // Blocked while shelled — small feedback, no damage.
      if (this.shelled) {
        this.scene.cameras.main.shake(60, 0.004);
        this.shield.setScale(1.15);
      }
      return false;
    }
    this.health = Math.max(0, this.health - n);
    this.invincibleUntil = this.scene.time.now + K.invincibleMs;
    AudioManager.hit();
    this.scene.cameras.main.shake(140, 0.012);
    this.scene.cameras.main.flash(120, 90, 20, 20);
    const ang = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(ang) * 300, Math.sin(ang) * 300);
    this.scene.tweens.add({ targets: this, alpha: { from: 0.3, to: 1 }, duration: 130, repeat: 5 });
    return true;
  }

  heal(n) { this.health = Math.min(K.maxHealth, this.health + n); }

  get maxHealth() { return K.maxHealth; }
  get staminaMax() { return K.staminaMax; }
}
