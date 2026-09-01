import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import Controls from '../systems/Controls.js';
import Kurma from '../entities/Kurma.js';

// Chapter 2 — Kurma: the Churning of the Ocean. A single-screen DEFENSE +
// SURVIVAL arena. Survive the churn (a meter fills with time) while rocks fall
// and halahala poison waves surge — hold SHELL to block, move to dodge, BASH to
// shove rocks, and collect the sacred treasures that rise. At full churn the
// asura Rahu attacks the rising amrita; block his lunges to defeat him.
const CHURN = { rate: 100 / 68, boss: 100 }; // % per second
const TREASURE_GOAL = 8;

export default class Level2Scene extends Phaser.Scene {
  constructor() { super('Level2'); }

  create() {
    this.cameras.main.fadeIn(500, 0, 8, 20);
    this.physics.world.setBounds(0, 60, GAME_W, GAME_H - 60);

    // Backdrop (reuse the underwater scenes; static single here)
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgFar').setDepth(-120);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x4a6f88);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x03121f, 0.28).setDepth(-115);
    AudioManager.startAmbient();

    // Mount Mandara + Vasuki, churning at the top
    this.vasuki = this.add.image(GAME_W / 2, 150, 'vasuki').setDepth(4).setScale(1.4);
    this.mandara = this.add.image(GAME_W / 2, 130, 'mandara').setDepth(5).setScale(0.9);
    this.tweens.add({ targets: this.mandara, angle: { from: -4, to: 4 }, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.vasuki, angle: { from: 3, to: -3 }, duration: 1200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // State
    this.churn = 0;
    this.treasures = 0;
    this.score = 0;
    this.phase = 'survive'; // 'survive' -> 'boss' -> done
    this.over = false;

    // Groups
    this.rocks = this.physics.add.group();
    this.treasureGroup = this.physics.add.group();
    this.poisons = [];

    // Player
    this.kurma = new Kurma(this, GAME_W / 2, GAME_H - 260);

    // Controls (relabelled for Kurma)
    this.controls = new Controls(this, { dashLabel: 'SHELL', attackLabel: 'BASH' });

    this._buildHud();

    // Overlaps
    this.physics.add.overlap(this.kurma, this.rocks, this._hitRock, null, this);
    this.physics.add.overlap(this.kurma, this.treasureGroup, this._collect, null, this);

    // Spawners
    this.rockTimer = this.time.addEvent({ delay: 1300, loop: true, callback: () => this._spawnRock() });
    this.treasureTimer = this.time.addEvent({ delay: 5200, loop: true, callback: () => this._spawnTreasure() });
    this.poisonTimer = this.time.addEvent({ delay: 12000, startAt: 6000, loop: true, callback: () => this._poisonWave() });

    this._toast('Hold SHELL to retract & block · move to dodge', 3200);
    this.time.delayedCall(3600, () => this._toast('Tap BASH to shove rocks · collect the treasures', 3000));

    this.events.on('shutdown', () => { this.scene.stop('Pause'); this.controls && this.controls.destroy(); });
  }

  // ---------------- Spawns ----------------
  _spawnRock() {
    if (this.over || this.phase !== 'survive') return;
    const x = Phaser.Math.Between(60, GAME_W - 60);
    const r = this.rocks.create(x, 210, 'rock');
    r.body.setAllowGravity(false);
    r.setScale(Phaser.Math.FloatBetween(0.7, 1.15));
    const rr = r.width * 0.34; r.body.setCircle(rr, r.width / 2 - rr, r.height / 2 - rr);
    const speed = 150 + this.churn * 2.2;
    r.setVelocity(Phaser.Math.Between(-40, 40), speed);
    r.setAngularVelocity(Phaser.Math.Between(-120, 120));
    r.setData('dmg', 1);
  }

  _spawnTreasure() {
    if (this.over || this.phase !== 'survive' || this.churn < 18) return;
    const x = Phaser.Math.Between(80, GAME_W - 80);
    const t = this.treasureGroup.create(x, GAME_H - 20, 'treasure');
    t.body.setAllowGravity(false);
    t.setVelocity(Phaser.Math.Between(-20, 20), -70);
    t.setData('heal', Math.random() < 0.25);
    const glow = this.add.image(x, t.y, 'glow').setScale(0.7).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(9);
    t.setData('glow', glow);
    // remove if it drifts off the top
    t.setData('born', this.time.now);
  }

  _poisonWave() {
    if (this.over || this.phase !== 'survive' || this.churn < 26) return;
    // Telegraph, then a wide poison surge from the churn.
    this._toast('☠ HALAHALA! SHELL UP!', 1400);
    this.cameras.main.flash(200, 40, 90, 20);
    this.time.delayedCall(1200, () => {
      if (this.over) return;
      const count = 5;
      for (let i = 0; i < count; i++) {
        const px = (GAME_W / count) * (i + 0.5) + Phaser.Math.Between(-30, 30);
        const p = this.add.image(px, 200, 'poison').setDepth(30).setScale(0.4).setAlpha(0.9);
        this.tweens.add({ targets: p, y: GAME_H + 40, scale: 1.5, duration: 1600, ease: 'Quad.easeIn' });
        this.poisons.push({ obj: p, dmg: 2 });
      }
      AudioManager.bossRoar();
      this.time.delayedCall(1700, () => { this.poisons.forEach((q) => q.obj && q.obj.destroy()); this.poisons = []; });
    });
  }

  // ---------------- Collisions ----------------
  _hitRock(kurma, rock) {
    if (kurma.isInvincible) return;
    if (kurma.takeDamage(rock.getData('dmg') || 1, rock.x, rock.y)) {
      this._burst(rock.x, rock.y, 0x9a8a70);
      rock.destroy();
      this._pushHud();
      if (kurma.health <= 0) this._die();
    }
  }

  _collect(kurma, t) {
    this.treasures++;
    this.score += 200;
    if (t.getData('heal')) { kurma.heal(1); this._float(t.x, t.y, '+1 ❤', '#ff8a8a'); }
    else this._float(t.x, t.y, 'Ratna +1', '#ffe08a');
    AudioManager.collect();
    const glow = t.getData('glow'); if (glow) glow.destroy();
    this._burst(t.x, t.y, 0xffe08a);
    t.destroy();
    this._pushHud();
  }

  // ---------------- Update ----------------
  update(time, delta) {
    if (this.over) return;
    const dt = delta / 1000;
    this.controls.update();
    const bash = this.kurma.handle(this.controls, dt);
    if (bash) this._doBash(bash);

    // Churn progress (survival)
    if (this.phase === 'survive') {
      this.churn = Math.min(100, this.churn + CHURN.rate * dt);
      if (this.churn >= CHURN.boss) this._startBoss();
    }

    // Rock cleanup + treasure drift/cleanup
    this.rocks.getChildren().forEach((r) => { if (r.y > GAME_H + 40) r.destroy(); });
    this.treasureGroup.getChildren().forEach((t) => {
      const glow = t.getData('glow'); if (glow) glow.setPosition(t.x, t.y);
      if (t.y < 150 || this.time.now - t.getData('born') > 9000) { if (glow) glow.destroy(); t.destroy(); }
    });

    // Poison damage
    for (const q of this.poisons) {
      if (q.obj && q.obj.active && !this.kurma.isInvincible) {
        if (Phaser.Math.Distance.Between(q.obj.x, q.obj.y, this.kurma.x, this.kurma.y) < q.obj.displayWidth * 0.45) {
          if (this.kurma.takeDamage(q.dmg, q.obj.x, q.obj.y)) { this._pushHud(); if (this.kurma.health <= 0) this._die(); }
        }
      }
    }

    if (this.phase === 'boss') this._updateBoss(time, dt);

    this._pushHud();
  }

  _doBash(hit) {
    this.rocks.getChildren().forEach((r) => {
      if (Phaser.Math.Distance.Between(hit.x, hit.y, r.x, r.y) < hit.r + 20) {
        const ang = Math.atan2(r.y - hit.y, r.x - hit.x);
        r.setVelocity(Math.cos(ang) * 360, Math.sin(ang) * 360 - 120);
        this._burst(r.x, r.y, 0xbfe6ff);
        this.score += 20;
      }
    });
  }

  // ---------------- Boss finale (Rahu) ----------------
  _startBoss() {
    this.phase = 'boss';
    this.rockTimer.remove(); this.poisonTimer.remove(); this.treasureTimer.remove();
    this.poisons.forEach((q) => q.obj && q.obj.destroy()); this.poisons = [];
    this.rocks.clear(true, true);
    this._banner('THE AMRITA RISES', 'But the asura Rahu comes to seize it!');

    // Rising amrita pot
    this.pot = this.add.image(GAME_W / 2, 250, 'amritaPot').setDepth(20).setScale(0);
    this.tweens.add({ targets: this.pot, scale: 1.1, y: 240, duration: 900, ease: 'Back.easeOut' });
    this.potGlow = this.add.image(GAME_W / 2, 240, 'glow').setScale(2).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(19);
    this.tweens.add({ targets: this.potGlow, scale: 2.4, alpha: 0.7, duration: 1000, yoyo: true, repeat: -1 });

    // Rahu
    this.rahuHp = 3;
    this.rahu = this.physics.add.image(GAME_W / 2, -140, 'asura').setDepth(25).setScale(0.9);
    this.rahu.body.setAllowGravity(false);
    this.rahu.setData('state', 'intro');
    this.tweens.add({ targets: this.rahu, y: 200, duration: 1200, ease: 'Quad.easeOut', onComplete: () => this._rahuNextLunge() });
    AudioManager.bossRoar();

    this.physics.add.overlap(this.kurma, this.rahu, this._rahuTouch, null, this);
    this._updateHud();
  }

  _rahuNextLunge() {
    if (this.over || this.rahuHp <= 0) return;
    this.rahu.setData('state', 'telegraph');
    // hover to a random x, then lunge down at Kurma's row
    const tx = Phaser.Math.Between(120, GAME_W - 120);
    this.tweens.add({ targets: this.rahu, x: tx, y: 190, duration: 700, onComplete: () => {
      if (this.over || this.rahuHp <= 0) return;
      this._toast('Rahu lunges — SHELL to block!', 1000);
      this.time.delayedCall(650, () => {
        if (this.over || this.rahuHp <= 0) return;
        this.rahu.setData('state', 'lunge');
        const ang = Math.atan2(this.kurma.y - this.rahu.y, this.kurma.x - this.rahu.x);
        this.rahu.setVelocity(Math.cos(ang) * 520, Math.sin(ang) * 520);
        AudioManager.bossRoar();
      });
    } });
  }

  _rahuTouch(kurma, rahu) {
    if (rahu.getData('state') !== 'lunge') return;
    if (kurma.shelled) {
      // Blocked! Repel Rahu and damage him.
      this.rahuHp--;
      this._blockFx(kurma.x, kurma.y);
      AudioManager.bossHit();
      this.cameras.main.shake(200, 0.014);
      rahu.setData('state', 'recoil');
      const ang = Math.atan2(rahu.y - kurma.y, rahu.x - kurma.x);
      rahu.setVelocity(Math.cos(ang) * 480, Math.sin(ang) * 480 - 200);
      this._updateHud();
      if (this.rahuHp <= 0) return this._defeatRahu();
      this.time.delayedCall(900, () => this._rahuNextLunge());
    } else {
      // Unblocked hit
      if (kurma.takeDamage(2, rahu.x, rahu.y)) {
        rahu.setData('state', 'recoil');
        rahu.setVelocity(0, -260);
        this._updateHud();
        if (kurma.health <= 0) return this._die();
        this.time.delayedCall(900, () => this._rahuNextLunge());
      }
    }
  }

  _updateBoss(time, dt) {
    if (this.rahu && this.rahu.active) {
      this.rahu.setFlipX(this.kurma.x < this.rahu.x);
      // slow drift when not lunging
      if (this.rahu.getData('state') === 'recoil') {
        this.rahu.setVelocity(this.rahu.body.velocity.x * 0.94, this.rahu.body.velocity.y * 0.94);
      }
    }
  }

  _defeatRahu() {
    if (this.over) return;
    this.over = true;
    AudioManager.win();
    this.rahu.setVelocity(0, 0);
    this.tweens.add({ targets: this.rahu, angle: 380, alpha: 0, scale: 0.3, y: '-=120', duration: 1400, ease: 'Quad.easeIn' });
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 200, () => this._burst(this.rahu.x + Phaser.Math.Between(-40, 40), this.rahu.y, 0xff6a9a));
    this.tweens.add({ targets: [this.pot, this.potGlow], y: GAME_H / 2 - 60, scale: 1.8, duration: 1500, ease: 'Sine.easeOut' });
    this._float(GAME_W / 2, GAME_H / 2 - 140, 'The Amrita is secured!', '#fff2b0');
    this.time.delayedCall(2200, () => {
      this.cameras.main.fadeOut(900, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Ending2', { failed: false, treasures: this.treasures, score: this.score }));
    });
  }

  // ---------------- Win/Lose ----------------
  _die() {
    // forgiving respawn (keep churn/treasures)
    AudioManager.lose();
    this.kurma.health = this.kurma.maxHealth;
    this.kurma.stamina = this.kurma.staminaMax;
    this.kurma.setPosition(GAME_W / 2, GAME_H - 260);
    this.kurma.setVelocity(0, 0);
    this.kurma.invincibleUntil = this.time.now + 1600;
    this._banner('Overwhelmed!', 'Steady the shell — keep bearing the churn.');
    this._pushHud();
  }

  // ---------------- HUD ----------------
  _buildHud() {
    const d = 600;
    // pause
    const pb = this.add.image(42, 42, 'pauseBtn').setScrollFactor(0).setDepth(d).setInteractive({ useHandCursor: true });
    const pbBase = 58 / pb.width; pb.setScale(pbBase);
    pb.on('pointerup', () => { pb.setScale(pbBase); this._pause(); }).on('pointerdown', () => pb.setScale(pbBase * 0.9)).on('pointerout', () => pb.setScale(pbBase));

    this.hearts = [];
    for (let i = 0; i < this.kurma.maxHealth; i++) this.hearts.push(this.add.text(70 + i * 32, 18, '❤', { fontSize: '28px', color: '#ff5a6a' }).setDepth(d));

    // Churn meter (top)
    this.add.text(GAME_W / 2, 66, 'CHURN', { fontFamily: 'system-ui', fontSize: '13px', color: '#ffe08a', fontStyle: 'bold' }).setOrigin(0.5, 1).setDepth(d);
    this.churnBg = this.add.rectangle(GAME_W / 2, 82, 320, 16, 0x00121f, 0.7).setStrokeStyle(2, COLORS.gold, 0.6).setDepth(d);
    this.churnBar = this.add.rectangle(GAME_W / 2 - 158, 82, 316, 10, COLORS.gold).setOrigin(0, 0.5).setDepth(d);

    // Treasure counter (top-right)
    this.treasureText = this.add.text(GAME_W - 20, 20, '', { fontFamily: 'system-ui', fontSize: '20px', color: '#ffe08a', align: 'right' }).setOrigin(1, 0).setDepth(d);

    // Shell stamina (bottom-center)
    this.add.text(GAME_W / 2, GAME_H - 60, 'SHELL', { fontFamily: 'system-ui', fontSize: '13px', color: '#9be870', fontStyle: 'bold' }).setOrigin(0.5, 1).setDepth(d);
    this.stamBg = this.add.rectangle(GAME_W / 2, GAME_H - 44, 260, 16, 0x00121f, 0.7).setStrokeStyle(2, COLORS.kurmaSkin, 0.7).setDepth(d);
    this.stamBar = this.add.rectangle(GAME_W / 2 - 128, GAME_H - 44, 256, 10, COLORS.hpGreen).setOrigin(0, 0.5).setDepth(d);

    // Boss HP (hidden until boss)
    this.rahuLabel = this.add.text(GAME_W / 2, 104, 'RAHU', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#ff8ab0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(d).setVisible(false);
    this.rahuBarBg = this.add.rectangle(GAME_W / 2, 126, 260, 14, 0x00121f, 0.7).setStrokeStyle(2, 0xff6a9a, 0.8).setDepth(d).setVisible(false);
    this.rahuBar = this.add.rectangle(GAME_W / 2 - 128, 126, 256, 9, 0xff6a9a).setOrigin(0, 0.5).setDepth(d).setVisible(false);
  }

  _pushHud() {
    for (let i = 0; i < this.hearts.length; i++) this.hearts[i].setColor(i < this.kurma.health ? '#ff5a6a' : '#3a2630');
    this.churnBar.width = 316 * Phaser.Math.Clamp(this.churn / 100, 0, 1);
    this.stamBar.width = 256 * Phaser.Math.Clamp(this.kurma.stamina / this.kurma.staminaMax, 0, 1);
    this.stamBar.fillColor = this.kurma.stamina < 20 ? COLORS.danger : this.kurma.shelled ? COLORS.gold : COLORS.hpGreen;
    this.treasureText.setText(`💎 ${this.treasures}/${TREASURE_GOAL}`);
  }

  _updateHud() {
    const boss = this.phase === 'boss';
    [this.rahuLabel, this.rahuBarBg, this.rahuBar].forEach((o) => o.setVisible(boss));
    if (boss && this.rahuBar) this.rahuBar.width = 256 * Phaser.Math.Clamp((this.rahuHp || 0) / 3, 0, 1);
  }

  _pause() {
    if (this.scene.isActive('Pause')) return;
    this.scene.pause();
    this.scene.launch('Pause', { from: 'Level2' });
  }

  // ---------------- FX ----------------
  _burst(x, y, tint = 0xffffff) {
    const p = this.add.particles(x, y, 'bubble', { lifespan: 500, speed: { min: 60, max: 180 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 }, quantity: 10, tint });
    p.explode(10); this.time.delayedCall(600, () => p.destroy());
  }

  _blockFx(x, y) {
    const ring = this.add.circle(x, y, 70, COLORS.gold, 0.4).setDepth(60);
    this.tweens.add({ targets: ring, scale: { from: 0.6, to: 1.6 }, alpha: { from: 0.6, to: 0 }, duration: 300, onComplete: () => ring.destroy() });
    this._float(x, y - 40, 'BLOCKED!', '#ffd257');
  }

  _float(x, y, msg, color) {
    const t = this.add.text(x, y, msg, { fontFamily: 'system-ui', fontSize: '20px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  _toast(msg, dur = 2200) {
    if (!this._toastTxt) this._toastTxt = this.add.text(GAME_W / 2, GAME_H - 92, '', { fontFamily: 'system-ui', fontSize: '20px', color: '#7fd7ff', backgroundColor: '#00121fcc', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(210);
    this._toastTxt.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this._toastTxt);
    this.tweens.add({ targets: this._toastTxt, alpha: 0, delay: dur, duration: 500 });
  }

  _banner(title, sub) {
    const g = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(300);
    const a = this.add.text(0, -20, title, { fontFamily: 'Georgia, serif', fontSize: '42px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(0.5);
    const b = this.add.text(0, 30, sub, { fontFamily: 'system-ui', fontSize: '20px', color: '#eaf6ff', align: 'center', wordWrap: { width: GAME_W - 120 } }).setOrigin(0.5);
    g.add([a, b]); g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400, yoyo: true, hold: 1500, onComplete: () => g.destroy() });
  }
}
