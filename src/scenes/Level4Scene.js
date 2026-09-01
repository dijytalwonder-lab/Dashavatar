import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import Controls from '../systems/Controls.js';
import Narasimha from '../entities/Narasimha.js';

// Chapter 4 — Narasimha: Action Combat. A palace arena. Clear waves of asura
// guards with CLAW combos (builds the Fury meter), unleash FURY (rage shockwave
// + a few seconds of brutal invulnerable claws), then face Hiranyakashipu — whose
// boon shields him at the end, so only FURY can deliver the final blow.
const WAVES = [4, 5, 6];
const BOSS_HP = 10;
const BOON_HP = 3; // at/below this the boon shields him; only Fury breaks it

export default class Level4Scene extends Phaser.Scene {
  constructor() { super('Level4'); }

  create() {
    this.cameras.main.fadeIn(500, 0, 8, 20);
    this.physics.world.setBounds(0, 90, GAME_W, GAME_H - 150);

    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'bgMid').setDepth(-120);
    bg.setScale(Math.max(GAME_W / bg.width, GAME_H / bg.height)).setTint(0x8a5a4a);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x1a0810, 0.4).setDepth(-115);
    // Palace pillars (the famous pillar motif)
    this.add.image(120, GAME_H / 2, 'pillar').setDepth(-40).setAlpha(0.7);
    this.add.image(GAME_W - 120, GAME_H / 2, 'pillar').setDepth(-40).setAlpha(0.7);
    AudioManager.startAmbient();

    this.wave = 0; this.score = 0; this.phase = 'waves'; this.over = false; this.boon = false;
    this.enemies = this.physics.add.group();

    this.nara = new Narasimha(this, GAME_W / 2, GAME_H - 320);
    this.controls = new Controls(this, { dashLabel: 'FURY', attackLabel: 'CLAW' });
    this._buildHud();

    this.physics.add.overlap(this.nara, this.enemies, this._touchEnemy, null, this);

    this._toast('CLAW to attack (builds Fury) · fill Fury then tap FURY!', 3400);
    this.time.delayedCall(900, () => this._spawnWave());

    this.events.on('shutdown', () => { this.scene.stop('Pause'); this.controls && this.controls.destroy(); });
  }

  // ---------------- Waves ----------------
  _spawnWave() {
    const count = WAVES[this.wave];
    this._waveFullySpawned = false;
    this._banner(`WAVE ${this.wave + 1}`, `${count} asura guards attack!`);
    for (let i = 0; i < count; i++) {
      this.time.delayedCall(300 + i * 250, () => {
        if (this.over) return;
        const edge = Phaser.Math.Between(0, 2);
        const x = edge === 0 ? 40 : edge === 1 ? GAME_W - 40 : Phaser.Math.Between(80, GAME_W - 80);
        const y = edge === 2 ? 140 : Phaser.Math.Between(160, GAME_H - 260);
        this._addGuard(x, y);
      });
    }
    this.time.delayedCall(300 + count * 250 + 60, () => (this._waveFullySpawned = true));
    this._updateHud();
  }

  _addGuard(x, y) {
    const e = this.enemies.create(x, y, 'asuraGuard');
    e.body.setAllowGravity(false);
    e.setScale(0.95).setDepth(30);
    const r = e.width * 0.42; e.body.setCircle(r, e.width / 2 - r, e.height / 2 - r);
    e.setData('hp', 2); e.setData('nextHitAt', 0);
    e.setAlpha(0); this.tweens.add({ targets: e, alpha: 1, duration: 300 });
    return e;
  }

  _touchEnemy(nara, e) {
    if (nara.isRaging) { this._hurtEnemy(e, 2); return; } // rage body shreds
    const now = this.time.now;
    if (e.getData('nextHitAt') <= now && !nara.isInvincible) {
      e.setData('nextHitAt', now + 800);
      if (nara.takeDamage(1, e.x, e.y)) { this._pushHud(); if (nara.health <= 0) this._die(); }
    }
  }

  _hurtEnemy(e, dmg) {
    const hp = (e.getData('hp') || 1) - dmg;
    e.setData('hp', hp);
    e.setTintFill(0xffffff); this.time.delayedCall(70, () => e.active && e.clearTint());
    const a = Math.atan2(e.y - this.nara.y, e.x - this.nara.x);
    e.setVelocity(Math.cos(a) * 220, Math.sin(a) * 220);
    this.nara.onHit();
    if (hp <= 0) { AudioManager.enemyDie(); this._burst(e.x, e.y, 0xc89aff); this.score += 100; e.destroy(); }
    this._pushHud();
  }

  // ---------------- Update ----------------
  update(time) {
    if (this.over) return;
    this.controls.update();
    const act = this.nara.handle(this.controls);
    if (act) this._applyAction(act);

    // enemy AI: chase
    this.enemies.getChildren().forEach((e) => {
      const a = Math.atan2(this.nara.y - e.y, this.nara.x - e.x);
      const sp = 96 + this.wave * 12;
      e.setVelocity(Math.cos(a) * sp, Math.sin(a) * sp);
      e.setFlipX(this.nara.x > e.x); // sprite faces left
    });

    // wave progression (only once the wave has fully spawned)
    if (this.phase === 'waves' && this._waveFullySpawned && this.enemies.countActive(true) === 0 && !this._waveTransition) {
      this._waveTransition = true;
      this.time.delayedCall(700, () => {
        this._waveTransition = false;
        this.wave++;
        if (this.wave < WAVES.length) this._spawnWave();
        else this._startBoss();
      });
    }

    if (this.phase === 'boss') this._updateBoss(time);
    this._pushHud();
  }

  _applyAction(act) {
    // enemies
    this.enemies.getChildren().forEach((e) => {
      if (Phaser.Math.Distance.Between(act.x, act.y, e.x, e.y) < act.r + 20) this._hurtEnemy(e, act.dmg);
    });
    // boss
    if (this.phase === 'boss' && this.boss && this.boss.active) {
      if (Phaser.Math.Distance.Between(act.x, act.y, this.boss.x, this.boss.y) < act.r + 66) {
        if (this.boon) {
          if (act.kind === 'fury') this._finisher();
          else { this.nara.onHit(); this._shieldClink(this.boss.x, this.boss.y); } // claw charges Fury, no damage
        } else {
          this._hurtBoss(act.dmg);
        }
      }
    }
  }

  _shieldClink(x, y) {
    const ring = this.add.circle(x, y, 60, 0xffe14d, 0.35).setDepth(60);
    this.tweens.add({ targets: ring, scale: { from: 0.7, to: 1.2 }, alpha: { from: 0.5, to: 0 }, duration: 200, onComplete: () => ring.destroy() });
  }

  // ---------------- Boss (Hiranyakashipu) ----------------
  _startBoss() {
    this.phase = 'boss';
    this.bossHp = BOSS_HP;
    this.boss = this.physics.add.image(GAME_W / 2, 260, 'hiranyakashipu').setDepth(25).setScale(0.9);
    this.boss.body.setAllowGravity(false);
    const br = this.boss.height * 0.32; this.boss.body.setCircle(br, this.boss.width / 2 - br, this.boss.height / 2 - br);
    this.boss.body.setBounce(1, 1); this.boss.setCollideWorldBounds(true);
    this.boss.setData('state', 'idle');
    this.physics.add.overlap(this.nara, this.boss, this._touchBoss, null, this);
    AudioManager.bossRoar();
    this._banner('HIRANYAKASHIPU', 'The tyrant himself! Claw him down.');
    this._updateHud();
    this.time.delayedCall(1400, () => this._bossNext());
  }

  _bossNext() {
    if (this.over || this.bossHp <= 0 || !this.boss || this.boon) return;
    this.boss.setData('state', 'move');
    this.tweens.add({
      targets: this.boss, x: Phaser.Math.Clamp(this.nara.x, 120, GAME_W - 120), y: Phaser.Math.Clamp(this.nara.y - 40, 180, GAME_H - 260), duration: 620,
      onComplete: () => {
        if (this.over || this.bossHp <= 0 || this.boon) return;
        this.boss.setData('state', 'lunge');
        const a = Math.atan2(this.nara.y - this.boss.y, this.nara.x - this.boss.x);
        this.boss.setVelocity(Math.cos(a) * 440, Math.sin(a) * 440);
        this.time.delayedCall(1300, () => this._bossNext());
      }
    });
  }

  _touchBoss(nara, boss) {
    if (boss.getData('state') === 'lunge' && !nara.isInvincible) {
      if (nara.takeDamage(2, boss.x, boss.y)) { this._pushHud(); if (nara.health <= 0) this._die(); }
    }
  }

  _hurtBoss(n) {
    this.bossHp = Math.max(0, this.bossHp - n);
    this.score += 150; AudioManager.bossHit();
    this.nara.onHit(); // clawing the tyrant also builds Fury
    this.boss.setTintFill(0xffffff); this.time.delayedCall(80, () => this.boss.active && (this.boon ? this.boss.setTint(0xffe14d) : this.boss.clearTint()));
    this.cameras.main.shake(120, 0.008);
    this._updateHud();
    if (this.bossHp <= BOON_HP && !this.boon) this._enterBoon();
  }

  _enterBoon() {
    this.boon = true;
    this.boss.setTint(0xffe14d);
    this.boss.setVelocity(0, 0); this.boss.setData('state', 'boon');
    AudioManager.bossRoar();
    this._banner('THE BOON SHIELDS HIM', 'No weapon can harm him — only your FURY!');
    this._toast('Fill Fury with CLAWS, then FURY to end him!', 4000);
    this._updateHud();
  }

  _updateBoss() {
    if (!this.boss || !this.boss.active) return;
    this.boss.setFlipX(this.nara.x < this.boss.x);
    if (this.boss.getData('state') === 'lunge') this.boss.setVelocity(this.boss.body.velocity.x * 0.97, this.boss.body.velocity.y * 0.97);
    if (this.boon) {
      // pulsing golden shield
      const s = 0.9 + Math.sin(this.time.now / 150) * 0.04; this.boss.setScale(s);
    }
  }

  _finisher() {
    if (this.over) return;
    this.over = true;
    this.boss.clearTint();
    AudioManager.win();
    this._banner('FURY UNLEASHED', 'Neither man nor beast — the tyrant falls!');
    this.cameras.main.shake(400, 0.02); this.cameras.main.flash(300, 255, 180, 80);
    this.nara.ragingUntil = this.time.now + 1500; this.nara.setTint(0xff8a5a);
    this.tweens.add({ targets: this.boss, angle: 400, alpha: 0, scale: 0.2, duration: 1500, ease: 'Quad.easeIn' });
    for (let i = 0; i < 6; i++) this.time.delayedCall(i * 150, () => this._burst(this.boss.x + Phaser.Math.Between(-50, 50), this.boss.y + Phaser.Math.Between(-40, 40), 0xffca6a));
    this.time.delayedCall(2400, () => {
      this.cameras.main.fadeOut(900, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Ending4', { score: this.score, wave: WAVES.length }));
    });
  }

  _die() {
    AudioManager.lose();
    this.nara.health = this.nara.maxHealth;
    this.nara.setPosition(GAME_W / 2, GAME_H - 320);
    this.nara.setVelocity(0, 0);
    this.nara.invincibleUntil = this.time.now + 1600;
    this._banner('Struck down!', 'Rise, Narasimha — your fury is not spent.');
    this._pushHud();
  }

  // ---------------- HUD ----------------
  _buildHud() {
    const d = 600;
    const pb = this.add.image(42, 42, 'pauseBtn').setDepth(d).setInteractive({ useHandCursor: true });
    const pbBase = 58 / pb.width; pb.setScale(pbBase);
    pb.on('pointerup', () => { pb.setScale(pbBase); this._pause(); }).on('pointerdown', () => pb.setScale(pbBase * 0.9)).on('pointerout', () => pb.setScale(pbBase));
    this.hearts = [];
    for (let i = 0; i < this.nara.maxHealth; i++) this.hearts.push(this.add.text(70 + i * 30, 18, '❤', { fontSize: '26px', color: '#ff5a6a' }).setDepth(d));
    this.waveText = this.add.text(GAME_W / 2, 20, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#ffca6a', fontStyle: 'bold' }).setOrigin(0.5, 0).setDepth(d);

    // Fury meter (bottom)
    this.add.text(GAME_W / 2, GAME_H - 60, 'FURY', { fontFamily: 'system-ui', fontSize: '13px', color: '#ff8a4a', fontStyle: 'bold' }).setOrigin(0.5, 1).setDepth(d);
    this.furyBg = this.add.rectangle(GAME_W / 2, GAME_H - 44, 300, 16, 0x00121f, 0.7).setStrokeStyle(2, 0xff7a3a, 0.7).setDepth(d);
    this.furyBar = this.add.rectangle(GAME_W / 2 - 148, GAME_H - 44, 296, 10, 0xff7a3a).setOrigin(0, 0.5).setDepth(d);
    this.furyReady = this.add.text(GAME_W / 2, GAME_H - 72, '', { fontFamily: 'system-ui', fontSize: '14px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(0.5).setDepth(d);

    // Boss bar
    this.bossLabel = this.add.text(GAME_W / 2, 60, 'HIRANYAKASHIPU', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#ff9ab0', fontStyle: 'bold' }).setOrigin(0.5).setDepth(d).setVisible(false);
    this.bossBarBg = this.add.rectangle(GAME_W / 2, 84, 320, 15, 0x00121f, 0.7).setStrokeStyle(2, 0xff6a9a, 0.8).setDepth(d).setVisible(false);
    this.bossBar = this.add.rectangle(GAME_W / 2 - 158, 84, 316, 10, 0xd94b6a).setOrigin(0, 0.5).setDepth(d).setVisible(false);
  }

  _pushHud() {
    for (let i = 0; i < this.hearts.length; i++) this.hearts[i].setColor(i < this.nara.health ? '#ff5a6a' : '#3a2630');
    const fpct = Phaser.Math.Clamp(this.nara.fury / this.nara.furyMax, 0, 1);
    this.furyBar.width = 296 * fpct;
    const full = fpct >= 1;
    this.furyBar.fillColor = this.nara.isRaging ? 0xffca4d : full ? 0xff5a2a : 0xff7a3a;
    this.furyReady.setText(this.nara.isRaging ? 'RAGING!' : full ? 'FURY READY — tap FURY!' : '');
  }

  _updateHud() {
    if (this.phase === 'boss') { this.waveText.setText('THE TYRANT'); [this.bossLabel, this.bossBarBg, this.bossBar].forEach((o) => o.setVisible(true)); this.bossBar.width = 316 * Phaser.Math.Clamp((this.bossHp || 0) / BOSS_HP, 0, 1); this.bossBar.fillColor = this.boon ? 0xffe14d : 0xd94b6a; }
    else this.waveText.setText(`WAVE ${this.wave + 1} / ${WAVES.length}`);
  }

  _pause() { if (this.scene.isActive('Pause')) return; this.scene.pause(); this.scene.launch('Pause', { from: 'Level4' }); }

  // ---------------- FX ----------------
  _burst(x, y, tint = 0xffffff) {
    const p = this.add.particles(x, y, 'bubble', { lifespan: 500, speed: { min: 60, max: 180 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 }, quantity: 10, tint });
    p.explode(10); this.time.delayedCall(600, () => p.destroy());
  }
  _toast(msg, dur = 2200) {
    if (!this._toastTxt) this._toastTxt = this.add.text(GAME_W / 2, GAME_H - 96, '', { fontFamily: 'system-ui', fontSize: '19px', color: '#ffca6a', backgroundColor: '#120608cc', padding: { x: 14, y: 8 } }).setOrigin(0.5).setDepth(210);
    this._toastTxt.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this._toastTxt);
    this.tweens.add({ targets: this._toastTxt, alpha: 0, delay: dur, duration: 500 });
  }
  _banner(title, sub) {
    const g = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(300);
    const a = this.add.text(0, -20, title, { fontFamily: 'Georgia, serif', fontSize: '40px', color: '#ffca6a', fontStyle: 'bold' }).setOrigin(0.5);
    const b = this.add.text(0, 30, sub, { fontFamily: 'system-ui', fontSize: '20px', color: '#f5e6d8', align: 'center', wordWrap: { width: GAME_W - 120 } }).setOrigin(0.5);
    g.add([a, b]); g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400, yoyo: true, hold: 1400, onComplete: () => g.destroy() });
  }
}
