import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, TUNING } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import Controls from '../systems/Controls.js';
import Matsya from '../entities/Matsya.js';

const BOSS_MAX_HP = 12;

export default class BossScene extends Phaser.Scene {
  constructor() {
    super('Boss');
  }

  init(data) {
    this.carry = data || {};
  }

  create() {
    this.cameras.main.fadeIn(600, 0, 8, 20);
    this.physics.world.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);

    // Vast deep-sea backdrop, darkened to an ominous purple for the boss fight.
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgFar').setDepth(-120);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height));
    bg.setTint(0x5a4a7a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1a0820, 0.5).setDepth(-50);
    AudioManager.startAmbient();

    // State
    this.bossHp = BOSS_MAX_HP;
    this.phase = 1;
    this.stunnedUntil = 0;
    this.over = false;
    this.score = this.carry.score || 0;

    // Player
    this.matsya = new Matsya(this, 180, GAME_H / 2);

    // Boss
    this.boss = this.physics.add.image(GAME_W - 220, GAME_H / 2, 'boss').setDepth(40);
    this.boss.setScale(190 / this.boss.height);
    this.boss.body.setAllowGravity(false);
    const br = this.boss.height * 0.36;
    this.boss.body.setCircle(br, this.boss.width / 2 - br, this.boss.height / 2 - br);
    this.boss.setCollideWorldBounds(true);
    this.boss.body.setBounce(1, 1);

    // The stolen Vedas glowing on the boss (small until freed on defeat)
    this.vedas = this.add.image(this.boss.x, this.boss.y + 30, 'scroll').setScale(0.5).setDepth(41);
    this.vedasGlow = this.add.image(this.boss.x, this.boss.y + 30, 'glow').setScale(1.2).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(41);

    // Weak point marker (hidden until stunned)
    this.weak = this.add.image(this.boss.x, this.boss.y, 'weakpoint').setDepth(42).setVisible(false);
    this.tweens.add({ targets: this.weak, angle: 360, duration: 2000, repeat: -1 });

    this.minions = this.physics.add.group();
    this.hazardBalls = this.physics.add.group();

    // Controls
    this.controls = new Controls(this);

    // Overlaps
    this.physics.add.overlap(this.matsya, this.boss, this._touchBoss, null, this);
    this.physics.add.overlap(this.matsya, this.minions, this._touchMinion, null, this);
    this.physics.add.overlap(this.matsya, this.hazardBalls, this._touchBall, null, this);

    this._buildHud();

    // Intro
    AudioManager.bossRoar();
    this._banner('HAYAGRIVA', 'The horse-headed demon holds the Vedas.\nDASH into him to stun — then strike!');

    // Attack timers per phase
    this._startPhaseTimers();

    this.events.on('shutdown', () => this.controls && this.controls.destroy());
  }

  _startPhaseTimers() {
    if (this.chargeTimer) this.chargeTimer.remove();
    if (this.summonTimer) this.summonTimer.remove();
    if (this.whirlTimer) this.whirlTimer.remove();

    if (this.phase === 1) {
      this.chargeTimer = this.time.addEvent({ delay: 2600, loop: true, callback: () => this._charge(260) });
      this.summonTimer = this.time.addEvent({ delay: 4200, loop: true, callback: () => this._summon() });
    } else if (this.phase === 2) {
      this.whirlTimer = this.time.addEvent({ delay: 3200, loop: true, callback: () => this._whirlAttack() });
      this.summonTimer = this.time.addEvent({ delay: 5000, loop: true, callback: () => this._summon() });
    } else {
      this.chargeTimer = this.time.addEvent({ delay: 1500, loop: true, callback: () => this._charge(440) });
    }
  }

  // ---------------- Boss attacks ----------------

  _charge(speed) {
    if (this.over || this._isStunned()) return;
    const ang = Math.atan2(this.matsya.y - this.boss.y, this.matsya.x - this.boss.x);
    this.boss.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
    this.tweens.add({ targets: this.boss, scale: { from: 1.08, to: 1 }, duration: 200 });
    // slow back down
    this.time.delayedCall(700, () => {
      if (this.boss.active && !this._isStunned()) this.boss.setVelocity(this.boss.body.velocity.x * 0.3, this.boss.body.velocity.y * 0.3);
    });
  }

  _summon() {
    if (this.over || this._isStunned()) return;
    const m = this.minions.create(this.boss.x, this.boss.y, 'enemyFish');
    m.body.setAllowGravity(false);
    m.setScale(60 / m.height).setDepth(30);
    const mr = m.height * 0.4;
    m.body.setCircle(mr, m.width / 2 - mr, m.height / 2 - mr);
    m.setData('hp', 1);
    AudioManager.enemyDie();
  }

  _whirlAttack() {
    if (this.over || this._isStunned()) return;
    // spit a spinning hazard ball toward the player
    const ball = this.hazardBalls.create(this.boss.x, this.boss.y, 'glow');
    ball.setScale(0.6).setTint(0x8a2be2).setBlendMode(Phaser.BlendModes.ADD);
    ball.body.setAllowGravity(false);
    ball.body.setCircle(24, 40, 40);
    const ang = Math.atan2(this.matsya.y - this.boss.y, this.matsya.x - this.boss.x);
    ball.setVelocity(Math.cos(ang) * 220, Math.sin(ang) * 220);
    AudioManager.bossRoar();
    this.time.delayedCall(4000, () => ball.active && ball.destroy());
  }

  _isStunned() {
    return this.time.now < this.stunnedUntil;
  }

  _stunBoss() {
    if (this._isStunned()) return;
    this.stunnedUntil = this.time.now + 2600;
    this.boss.setVelocity(0, 0);
    this.boss.setTint(0x88aaff);
    this.weak.setVisible(true);
    AudioManager.bossHit();
    this._floatText(this.boss.x, this.boss.y - 90, 'STUNNED! Strike now!', '#ffe14d');
    this.time.delayedCall(2600, () => {
      if (this.boss.active) {
        this.boss.clearTint();
        this.weak.setVisible(false);
      }
    });
  }

  _hurtBoss(n) {
    this.bossHp = Math.max(0, this.bossHp - n);
    this.score += 200;
    AudioManager.bossHit();
    this.cameras.main.shake(160, 0.01);
    this.boss.setTint(0xff6a6a);
    this.time.delayedCall(100, () => this.boss.active && (this._isStunned() ? this.boss.setTint(0x88aaff) : this.boss.clearTint()));
    this._updateHud();

    if (this.bossHp <= 0) return this._defeatBoss();

    // Phase transitions
    const pct = this.bossHp / BOSS_MAX_HP;
    if (this.phase === 1 && pct <= 0.66) {
      this.phase = 2;
      this._banner('PHASE 2', 'Hayagriva churns the waters into whirlpools!');
      this._startPhaseTimers();
    } else if (this.phase === 2 && pct <= 0.33) {
      this.phase = 3;
      this._banner('PHASE 3', 'Enraged! He charges with fury!');
      AudioManager.bossRoar();
      this._startPhaseTimers();
    }
  }

  // ---------------- Collisions ----------------

  _touchBoss(matsya, boss) {
    if (matsya.isDashing) {
      // Dash into the boss = stun it (teaches offensive dash) + chip 1 dmg —
      // but only ONCE per stun, so holding a dash across frames can't drain him.
      // Real damage comes from Tail-Whipping the weak point while stunned.
      if (!this._isStunned()) {
        this._stunBoss();
        this._hurtBoss(1);
      }
      // bounce player off every frame of contact
      const ang = Math.atan2(matsya.y - boss.y, matsya.x - boss.x);
      matsya.setVelocity(Math.cos(ang) * 380, Math.sin(ang) * 380);
      return;
    }
    if (this._isStunned()) return; // safe to touch while stunned
    if (matsya.takeDamage(1, boss.x, boss.y)) {
      this._updateHud();
      if (matsya.health <= 0) this._die();
    }
  }

  _touchMinion(matsya, m) {
    if (matsya.isDashing) {
      AudioManager.enemyDie();
      this._burst(m.x, m.y, 0xff8a8a);
      m.destroy();
      return;
    }
    if (matsya.takeDamage(1, m.x, m.y)) {
      this._updateHud();
      if (matsya.health <= 0) this._die();
    }
  }

  _touchBall(matsya, ball) {
    if (matsya.isInvincible) return;
    if (matsya.takeDamage(1, ball.x, ball.y)) {
      this._burst(ball.x, ball.y, 0x8a2be2);
      ball.destroy();
      this._updateHud();
      if (matsya.health <= 0) this._die();
    }
  }

  // ---------------- Update ----------------

  update(time, delta) {
    if (this.over) return;
    this.controls.update();
    this.matsya.handleInput(this.controls);

    // Attack (tail whip) — only meaningful when boss is stunned or vs minions
    if (this.controls.consumeAttack()) {
      const hit = this.matsya.tailWhip();
      // minions
      this.minions.getChildren().forEach((m) => {
        if (Phaser.Math.Distance.Between(hit.x, hit.y, m.x, m.y) < hit.r + 16) {
          AudioManager.enemyDie();
          this._burst(m.x, m.y, 0xff8a8a);
          m.destroy();
        }
      });
      // boss weak point (only while stunned)
      if (this._isStunned() && Phaser.Math.Distance.Between(hit.x, hit.y, this.boss.x, this.boss.y) < hit.r + 70) {
        this._hurtBoss(1);
      }
    }

    // Vedas follow boss
    this.vedas.setPosition(this.boss.x + 6, this.boss.y + 20);
    this.vedasGlow.setPosition(this.boss.x + 6, this.boss.y + 20);
    this.weak.setPosition(this.boss.x, this.boss.y);

    // minions home on player
    this.minions.getChildren().forEach((m) => {
      const ang = Math.atan2(this.matsya.y - m.y, this.matsya.x - m.x);
      m.setVelocity(Math.cos(ang) * 130, Math.sin(ang) * 130);
      m.setFlipX(m.body.velocity.x > 0); // faces left by default
    });

    // idle boss drift when not charging/stunned
    if (!this._isStunned() && this.phase !== 3) {
      const speed = Math.hypot(this.boss.body.velocity.x, this.boss.body.velocity.y);
      if (speed < 30) {
        this.boss.setVelocity(Phaser.Math.Between(-40, 40), Phaser.Math.Between(-60, 60));
      }
    }

    this._updateHud();
  }

  // ---------------- Win / lose ----------------

  _defeatBoss() {
    if (this.over) return;
    this.over = true;
    if (this.chargeTimer) this.chargeTimer.remove();
    if (this.summonTimer) this.summonTimer.remove();
    if (this.whirlTimer) this.whirlTimer.remove();
    this.matsya.setVelocity(0, 0);
    this.boss.setVelocity(0, 0);
    AudioManager.win();

    // death throes
    this.tweens.add({
      targets: this.boss,
      angle: 380,
      alpha: 0,
      scale: 0.3,
      duration: 1400,
      ease: 'Quad.easeIn'
    });
    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 220, () => this._burst(this.boss.x + Phaser.Math.Between(-40, 40), this.boss.y + Phaser.Math.Between(-40, 40), 0x8a2be2));
    }

    // Vedas float free and rise
    this.tweens.add({ targets: [this.vedas, this.vedasGlow], y: GAME_H / 2 - 40, scale: 2, duration: 1600, ease: 'Sine.easeOut' });
    this._floatText(GAME_W / 2, GAME_H / 2 - 120, 'The Vedas are restored!', '#ffd257');

    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(900, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('Ending', {
          failed: false,
          counts: this.carry.counts || { sages: 0, seeds: 0, animals: 0, scrolls: 0 },
          score: this.score
        });
      });
    });
  }

  _die() {
    // respawn with full health but keep boss progress (forgiving)
    AudioManager.lose();
    this.matsya.health = TUNING.maxHealth;
    this.matsya.air = TUNING.maxAir;
    this.matsya.setPosition(180, GAME_H / 2);
    this.matsya.setVelocity(0, 0);
    this.matsya.invincibleUntil = this.time.now + 1600;
    this._floatText(GAME_W / 2, GAME_H / 2, 'Matsya endures! Try again!', '#7fd7ff');
    this._updateHud();
  }

  // ---------------- HUD ----------------

  _buildHud() {
    this.hearts = [];
    for (let i = 0; i < TUNING.maxHealth; i++) {
      this.hearts.push(this.add.text(20 + i * 34, 16, '❤', { fontSize: '30px', color: '#ff5a6a' }).setScrollFactor(0).setDepth(500));
    }
    // Boss HP bar
    this.add.text(GAME_W / 2, 20, 'HAYAGRIVA', { fontFamily: 'Georgia, serif', fontSize: '20px', color: '#c98aff', fontStyle: 'bold' }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(500);
    this.bossBarBg = this.add.rectangle(GAME_W / 2, 54, 460, 18, 0x00121f, 0.7).setStrokeStyle(2, 0x8a2be2, 0.9).setScrollFactor(0).setDepth(500);
    this.bossBar = this.add.rectangle(GAME_W / 2 - 228, 54, 456, 12, 0xc94bd4).setOrigin(0, 0.5).setScrollFactor(0).setDepth(500);

    this.dashPip = this.add.text(GAME_W - 220, GAME_H - 176, 'SURGE READY', { fontFamily: 'system-ui', fontSize: '13px', color: '#ffe9b0' }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
  }

  _updateHud() {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setColor(i < this.matsya.health ? '#ff5a6a' : '#3a2630');
    }
    this.bossBar.width = 456 * Phaser.Math.Clamp(this.bossHp / BOSS_MAX_HP, 0, 1);
    const ready = this.time.now >= this.matsya.dashReadyAt;
    this.dashPip.setText(ready ? 'SURGE READY' : 'SURGE…').setColor(ready ? '#9be870' : '#88a0b0');
  }

  // ---------------- FX ----------------

  _burst(x, y, tint = 0xffffff) {
    const p = this.add.particles(x, y, 'bubble', {
      lifespan: 500, speed: { min: 60, max: 180 }, scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 }, quantity: 10, tint
    });
    p.explode(12);
    this.time.delayedCall(600, () => p.destroy());
  }

  _floatText(x, y, msg, color) {
    const t = this.add.text(x, y, msg, { fontFamily: 'system-ui, sans-serif', fontSize: '22px', color, fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(500);
    this.tweens.add({ targets: t, y: y - 50, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  _banner(title, sub) {
    const g = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(500).setScrollFactor(0);
    const a = this.add.text(0, -20, title, { fontFamily: 'Georgia, serif', fontSize: '46px', color: '#c98aff', fontStyle: 'bold' }).setOrigin(0.5);
    const b = this.add.text(0, 34, sub, { fontFamily: 'system-ui, sans-serif', fontSize: '19px', color: '#eaf6ff', align: 'center' }).setOrigin(0.5);
    g.add([a, b]);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400, yoyo: true, hold: 1600, onComplete: () => g.destroy() });
  }
}
