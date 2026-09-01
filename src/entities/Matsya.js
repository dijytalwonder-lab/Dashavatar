import Phaser from 'phaser';
import { TUNING, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

// Matsya — the player fish. Momentum-based swimming, a Surge dash (i-frames +
// burst), and a Tail Whip melee. Health + air live here; the scene decides when
// air drains (surface segments) and reads `health`/`air` for the HUD.
export default class Matsya extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    // Animated swim-cycle spritesheet (falls back to the static hero texture).
    const animated = scene.textures.exists('matsyaSwim');
    super(scene, x, y, animated ? 'matsyaSwim' : 'matsya');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.hasAnims = animated && scene.anims.exists('matsya-swim');
    if (this.hasAnims) this.play('matsya-swim');

    this.setCollideWorldBounds(true);
    // Scale to a good gameplay size (~130px wide) and fit a circular hitbox over
    // the fish's head/body (head sits on the right of each frame).
    const targetW = 132;
    this.baseScale = Math.min(1, targetW / this.width);
    this.setScale(this.baseScale);
    const r = this.height * 0.32;
    this.body.setCircle(r, this.width * 0.6 - r, this.height * 0.5 - r);
    this.setDrag(TUNING.matsyaDrag);
    this.setMaxVelocity(TUNING.dashSpeed);
    this.setDepth(50);

    this.health = TUNING.maxHealth;
    this.air = TUNING.maxAir;
    this.invincibleUntil = 0;
    this.dashReadyAt = 0;
    this.dashingUntil = 0;
    this.facing = 1;

    // Bubble trail while swimming
    this.trail = scene.add.particles(0, 0, 'bubble', {
      lifespan: 900,
      speed: { min: 6, max: 24 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 0.5, end: 0 },
      frequency: 120,
      follow: this,
      followOffset: { x: -46, y: 0 }
    });
    this.trail.setDepth(49);
  }

  get isDashing() {
    return this.scene.time.now < this.dashingUntil;
  }

  get isInvincible() {
    return this.scene.time.now < this.invincibleUntil;
  }

  handleInput(controls) {
    const v = controls.vector;
    const now = this.scene.time.now;

    // Dash
    if (controls.consumeDash() && now >= this.dashReadyAt) {
      this._dash(v);
    }

    // Revert to the swim cycle once the dash whirlpool ends.
    if (this.hasAnims && !this.isDashing) {
      const cur = this.anims.currentAnim && this.anims.currentAnim.key;
      if (cur === 'matsya-dash') this.play('matsya-swim');
    }

    if (!this.isDashing) {
      const ax = v.x * TUNING.matsyaAccel;
      const ay = v.y * TUNING.matsyaAccel;
      this.setAcceleration(ax, ay);
      // cap normal (non-dash) speed
      const speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
      if (speed > TUNING.matsyaSpeed) {
        const s = TUNING.matsyaSpeed / speed;
        this.setVelocity(this.body.velocity.x * s, this.body.velocity.y * s);
      }
    } else {
      this.setAcceleration(0, 0);
    }

    // Facing / tilt
    if (Math.abs(v.x) > 0.05 || Math.abs(this.body.velocity.x) > 20) {
      const dir = v.x !== 0 ? Math.sign(v.x) : Math.sign(this.body.velocity.x);
      if (dir !== 0) this.facing = dir;
    }
    this.setFlipX(this.facing < 0);
    const targetAngle = Phaser.Math.Clamp(this.body.velocity.y * 0.05, -20, 20) * this.facing;
    this.setAngle(Phaser.Math.Linear(this.angle, targetAngle, 0.15));

    // Swim animation beats faster the quicker Matsya moves.
    if (this.anims && this.anims.isPlaying) {
      const spd = Math.hypot(this.body.velocity.x, this.body.velocity.y);
      this.anims.timeScale = Phaser.Math.Clamp(0.6 + spd / 260, 0.6, 2.2);
    }

    // occasional swim sfx
    if (Math.hypot(v.x, v.y) > 0.4 && Math.random() < 0.03) AudioManager.swim();
  }

  _dash(v) {
    let dx = v.x;
    let dy = v.y;
    if (dx === 0 && dy === 0) {
      dx = this.facing;
      dy = 0;
    }
    const m = Math.hypot(dx, dy) || 1;
    this.setVelocity((dx / m) * TUNING.dashSpeed, (dy / m) * TUNING.dashSpeed);
    this.dashingUntil = this.scene.time.now + TUNING.dashDuration;
    this.dashReadyAt = this.scene.time.now + TUNING.dashCooldown;
    this.invincibleUntil = Math.max(this.invincibleUntil, this.scene.time.now + TUNING.dashDuration);
    AudioManager.dash();
    // Become a spinning water whirlpool for the dash.
    if (this.hasAnims) this.play('matsya-dash');
    // dash streak (squash relative to the sprite's base scale)
    this.scene.tweens.add({
      targets: this,
      scaleX: this.baseScale * 1.18,
      scaleY: this.baseScale * 0.82,
      duration: 120,
      yoyo: true
    });
    this.scene.cameras.main.shake(80, 0.004);
  }

  // Tail-whip melee: returns a circular hit area in front of the fish for the
  // scene to test against enemies. Brief visual pulse.
  tailWhip() {
    const range = 70;
    const hx = this.x + this.facing * 40;
    const hy = this.y;
    const ring = this.scene.add
      .circle(hx, hy, range, COLORS.air, 0.25)
      .setDepth(48);
    this.scene.tweens.add({
      targets: ring,
      scale: { from: 0.5, to: 1.1 },
      alpha: { from: 0.4, to: 0 },
      duration: 220,
      onComplete: () => ring.destroy()
    });
    // Golden power-strike pose, then back to swimming (unless mid-dash).
    if (this.hasAnims && !this.isDashing) {
      this.play('matsya-attack');
      this.once('animationcomplete-matsya-attack', () => {
        if (!this.isDashing) this.play('matsya-swim');
      });
    }
    AudioManager.swim();
    return { x: hx, y: hy, r: range };
  }

  takeDamage(amount, fromX, fromY) {
    if (this.isInvincible) return false;
    this.health = Math.max(0, this.health - amount);
    this.invincibleUntil = this.scene.time.now + TUNING.invincibleMs;
    AudioManager.hit();
    this.scene.cameras.main.shake(140, 0.012);
    this.scene.cameras.main.flash(120, 90, 20, 20);
    // knockback away from source
    const ang = Math.atan2(this.y - fromY, this.x - fromX);
    this.setVelocity(Math.cos(ang) * 360, Math.sin(ang) * 360);
    // blink
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.3, to: 1 },
      duration: 130,
      repeat: 5
    });
    return true;
  }

  heal(n) {
    this.health = Math.min(TUNING.maxHealth, this.health + n);
  }

  drainAir(dt) {
    this.air = Math.max(0, this.air - TUNING.airDrainPerSec * dt);
    return this.air <= 0;
  }

  refillAir(dt) {
    this.air = Math.min(TUNING.maxAir, this.air + TUNING.airRefillPerSec * dt);
  }
}
