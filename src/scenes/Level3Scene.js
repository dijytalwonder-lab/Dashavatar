import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import { makeSegmentedBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';
import Controls from '../systems/Controls.js';
import Varaha from '../entities/Varaha.js';

// Chapter 3 — Varaha: Exploration + Boss Combat. Descend through the deep,
// CHARGE (Strength) to smash stone barriers and gore enemies, collect Earth
// relics, then reach Hiranyaksha, defeat him, and lift the Earth to the light.
const WORLD_W = 5200;
const SEG = { two: 1700, three: 3400 };
const BOSS_X = WORLD_W - GAME_W; // camera locks here for the finale
const RELIC_GOAL = 6;
const BOSS_HP = 8;

export default class Level3Scene extends Phaser.Scene {
  constructor() { super('Level3'); }

  create() {
    this.cameras.main.fadeIn(500, 0, 8, 20);
    this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);
    this.bgLayers = makeSegmentedBackground(this, SEG.two, SEG.three);
    AudioManager.startAmbient();

    this.relics = 0; this.score = 0; this.phase = 'explore'; this.over = false;
    this.checkpointX = 140;

    this.barriers = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.relicGroup = this.physics.add.group();
    this.hazards = this.physics.add.staticGroup();

    this._buildWorld();

    this.varaha = new Varaha(this, this.checkpointX, GAME_H / 2);
    this.cameras.main.startFollow(this.varaha, true, 0.1, 0.1, -80, 0);
    this.cameras.main.setDeadzone(90, 360);

    this.controls = new Controls(this, { dashLabel: 'CHARGE', attackLabel: 'GORE' });
    this._buildHud();

    // Collisions
    this.physics.add.collider(this.varaha, this.barriers, null, this._barrierProcess, this);
    this.physics.add.overlap(this.varaha, this.enemies, this._touchEnemy, null, this);
    this.physics.add.overlap(this.varaha, this.relicGroup, this._collect, null, this);
    this.physics.add.overlap(this.varaha, this.hazards, this._touchHazard, null, this);

    this._toast('Tap CHARGE to smash stone & gore foes · GORE for a quick strike', 3400);
    this.time.delayedCall(3800, () => this._toast('Find the Earth in the deep', 2600));

    this.events.on('shutdown', () => { this.scene.stop('Pause'); this.controls && this.controls.destroy(); });
  }

  _buildWorld() {
    this._label(700, 'The Twilight Depths', 'Segment 1 · learn to CHARGE');
    this._label(SEG.two + 700, 'The Sunken Caverns', 'Segment 2 · explore & smash');
    this._label(SEG.three + 700, 'Rasatala', 'Segment 3 · the abyss');

    // Breakable barriers (full-height stone gates) — charge to break
    [1150, 2500, 3700, 4300].forEach((x) => this._barrierWall(x));

    // Enemies
    [520, 900, 1500, 2000, 2400, 2900, 3300, 3800, 4200].forEach((x, i) =>
      this._addEnemy(x, 300 + (i % 3) * 260));

    // Relics
    [400, 1350, 1900, 2700, 3200, 4100].forEach((x, i) => this._addRelic(x, 220 + (i % 4) * 200));

    // Hazards (floor/ceiling spikes)
    this.hazards.create(800, GAME_H - 30, 'caveSpike').refreshBody();
    this.hazards.create(2200, 40, 'caveSpike').setFlipY(true).refreshBody();
    this.hazards.create(3100, GAME_H - 30, 'caveSpike').refreshBody();

    // Sanctuary/earth marker glow at the far end
    this.endGlow = this.add.image(BOSS_X + GAME_W / 2, GAME_H / 2, 'glow').setScale(4).setAlpha(0.25).setTint(0x8fd0ff).setDepth(2);
  }

  _label(x, title, sub) {
    this.add.text(x, 210, title, { fontFamily: 'Georgia, serif', fontSize: '30px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0.45);
    this.add.text(x, 246, sub, { fontFamily: 'system-ui', fontSize: '16px', color: '#9bd7ef' }).setOrigin(0.5).setAlpha(0.45);
  }

  _barrierWall(x) {
    // stack blocks to fill the height, gapless
    for (let y = 75; y < GAME_H; y += 150) {
      const b = this.barriers.create(x, y, 'breakRock');
      b.setData('wall', x);
    }
  }

  _addEnemy(x, y) {
    const e = this.enemies.create(x, y, 'deepEnemy');
    e.body.setAllowGravity(false);
    e.setScale(0.95).setDepth(30);
    const r = e.height * 0.4; e.body.setCircle(r, e.width / 2 - r, e.height / 2 - r);
    e.setData('hp', 2); e.setData('baseX', x);
    return e;
  }

  _addRelic(x, y) {
    const r = this.relicGroup.create(x, y, 'relic');
    r.body.setAllowGravity(false);
    r.body.setCircle(18, r.width / 2 - 18, r.height / 2 - 18);
    this.tweens.add({ targets: r, y: y - 12, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const glow = this.add.image(x, y, 'glow').setScale(0.7).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    r.setData('glow', glow);
    this.tweens.add({ targets: glow, y: y - 12, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return r;
  }

  // Barrier is solid — unless Varaha is charging, which smashes it (pass through).
  _barrierProcess(varaha, barrier) {
    if (varaha.isCharging) {
      if (!barrier.getData('broken')) { barrier.setData('broken', true); this._pendingBreak = this._pendingBreak || []; this._pendingBreak.push(barrier); }
      return false; // no separation -> plow through
    }
    return true;
  }

  _touchEnemy(varaha, enemy) {
    if (varaha.isCharging || varaha.isInvincible) {
      this._hurtEnemy(enemy, varaha.isCharging ? 3 : 1);
      return;
    }
    if (varaha.takeDamage(1, enemy.x, enemy.y)) { this._pushHud(); if (varaha.health <= 0) this._die(); }
  }

  _touchHazard(varaha, hz) {
    if (varaha.isInvincible) return;
    if (varaha.takeDamage(1, hz.x, hz.y)) { this._pushHud(); if (varaha.health <= 0) this._die(); }
  }

  _hurtEnemy(e, dmg) {
    const hp = (e.getData('hp') || 1) - dmg;
    e.setData('hp', hp);
    e.setTintFill(0xffffff); this.time.delayedCall(80, () => e.active && e.clearTint());
    const ang = Math.atan2(e.y - this.varaha.y, e.x - this.varaha.x);
    e.setVelocity(Math.cos(ang) * 260, Math.sin(ang) * 260);
    if (hp <= 0) { AudioManager.enemyDie(); this._burst(e.x, e.y, 0xff8a8a); this.score += 120; const g = e.getData('glow'); if (g) g.destroy(); e.destroy(); this._pushHud(); }
  }

  _collect(varaha, r) {
    this.relics++; this.score += 200;
    AudioManager.collect();
    this._float(r.x, r.y, 'Relic +1', '#7fe0a0');
    this._burst(r.x, r.y, 0x7fe0a0);
    const g = r.getData('glow'); if (g) g.destroy();
    r.destroy(); this._pushHud();
  }

  // ---------------- Update ----------------
  update(time, delta) {
    if (this.over) return;
    if (this.bgLayers) this.bgLayers.update(this.cameras.main.scrollX);
    this.controls.update();
    const gore = this.varaha.handle(this.controls);
    this.varaha.update();
    if (gore) this._applyGore(gore);

    // process barrier breaks
    if (this._pendingBreak && this._pendingBreak.length) {
      this._pendingBreak.forEach((b) => { if (b.active) { this._burst(b.x, b.y, 0xbfae8a); AudioManager.bossHit(); this.score += 30; b.destroy(); } });
      this._pendingBreak = [];
      this.cameras.main.shake(120, 0.008);
    }

    // enemies AI (explore phase)
    if (this.phase === 'explore') {
      const px = this.varaha.x, py = this.varaha.y;
      this.enemies.getChildren().forEach((e) => {
        const d = Phaser.Math.Distance.Between(e.x, e.y, px, py);
        if (d < 340) { const a = Math.atan2(py - e.y, px - e.x); e.setVelocity(Math.cos(a) * 130, Math.sin(a) * 130); }
        else { const base = e.getData('baseX'); e.setVelocity(Math.sin(time / 700 + base) * 60, Math.cos(time / 900 + base) * 30); }
        e.setFlipX(e.body.velocity.x > 0); // sprite faces left
      });
      if (this.varaha.x > BOSS_X + 120) this._startBoss();
    }

    if (this.phase === 'boss') this._updateBoss(time, delta);
    this._pushHud();
  }

  _applyGore(hit) {
    this.enemies.getChildren().forEach((e) => {
      if (Phaser.Math.Distance.Between(hit.x, hit.y, e.x, e.y) < hit.r + 18) this._hurtEnemy(e, 1);
    });
    if (this.phase === 'boss' && this.boss && this.boss.active) {
      if (Phaser.Math.Distance.Between(hit.x, hit.y, this.boss.x, this.boss.y) < hit.r + 70) this._hurtBoss(1);
    }
  }

  // ---------------- Boss (Hiranyaksha) ----------------
  _startBoss() {
    this.phase = 'boss';
    this.cameras.main.stopFollow();
    this.cameras.main.pan(BOSS_X + GAME_W / 2, GAME_H / 2, 600, 'Sine.easeInOut');
    this.physics.world.setBounds(BOSS_X, 0, GAME_W, GAME_H);
    this.varaha.setCollideWorldBounds(true);
    this.enemies.clear(true, true);

    this.bossHp = BOSS_HP;
    // The captured Earth floats behind the boss
    this.earth = this.add.image(BOSS_X + GAME_W - 90, 240, 'earth').setDepth(20).setScale(0.9);
    this.tweens.add({ targets: this.earth, y: 260, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.boss = this.physics.add.image(BOSS_X + GAME_W / 2 + 120, GAME_H / 2, 'hiranyaksha').setDepth(25).setScale(0.92);
    this.boss.body.setAllowGravity(false);
    const br = this.boss.height * 0.34; this.boss.body.setCircle(br, this.boss.width / 2 - br, this.boss.height / 2 - br);
    this.boss.setData('state', 'idle');
    this.physics.add.overlap(this.varaha, this.boss, this._touchBoss, null, this);

    AudioManager.bossRoar();
    this._banner('HIRANYAKSHA', 'He holds the Earth! CHARGE to break his guard.');
    this._updateHud();
    this.time.delayedCall(1400, () => this._bossNext());
  }

  _bossNext() {
    if (this.over || this.bossHp <= 0 || !this.boss) return;
    // hover toward Varaha's row, then lunge
    this.boss.setData('state', 'move');
    const ty = Phaser.Math.Clamp(this.varaha.y, 160, GAME_H - 200);
    this.tweens.add({
      targets: this.boss, y: ty, x: BOSS_X + GAME_W / 2 + Phaser.Math.Between(-40, 120), duration: 700,
      onComplete: () => {
        if (this.over || this.bossHp <= 0) return;
        this.boss.setData('state', 'lunge');
        const a = Math.atan2(this.varaha.y - this.boss.y, this.varaha.x - this.boss.x);
        this.boss.setVelocity(Math.cos(a) * 460, Math.sin(a) * 460);
        this.time.delayedCall(1500, () => this._bossNext());
      }
    });
  }

  _touchBoss(varaha, boss) {
    if (varaha.isCharging) {
      // Only the first contact of a given charge deals damage.
      if (this._lastBossChargeId !== varaha.chargeId) {
        this._lastBossChargeId = varaha.chargeId;
        this._hurtBoss(2);
      }
      const a = Math.atan2(varaha.y - boss.y, varaha.x - boss.x);
      varaha.setVelocity(Math.cos(a) * 380, Math.sin(a) * 380);
      boss.setVelocity(Math.cos(a) * -260, Math.sin(a) * -260);
      return;
    }
    if (boss.getData('state') === 'lunge' && !varaha.isInvincible) {
      if (varaha.takeDamage(2, boss.x, boss.y)) { this._pushHud(); if (varaha.health <= 0) this._die(); }
    }
  }

  _hurtBoss(n) {
    this.bossHp = Math.max(0, this.bossHp - n);
    this.score += 200;
    AudioManager.bossHit();
    this.boss.setTintFill(0xffffff); this.time.delayedCall(90, () => this.boss.active && this.boss.clearTint());
    this.cameras.main.shake(160, 0.01);
    this._updateHud();
    if (this.bossHp <= 0) this._defeatBoss();
  }

  _updateBoss(time) {
    if (!this.boss || !this.boss.active) return;
    this.boss.setFlipX(this.varaha.x > this.boss.x);
    if (this.boss.getData('state') === 'lunge') {
      // slow after lunging
      this.boss.setVelocity(this.boss.body.velocity.x * 0.97, this.boss.body.velocity.y * 0.97);
    }
  }

  _defeatBoss() {
    if (this.over) return;
    this.over = true;
    AudioManager.win();
    this.boss.setVelocity(0, 0);
    this.tweens.add({ targets: this.boss, angle: 360, alpha: 0, scale: 0.3, duration: 1400 });
    for (let i = 0; i < 4; i++) this.time.delayedCall(i * 200, () => this._burst(this.boss.x + Phaser.Math.Between(-40, 40), this.boss.y, 0xffca6a));
    // Varaha lifts the Earth into the light
    this.tweens.add({ targets: this.earth, x: this.varaha.x, y: this.varaha.y - 90, scale: 1.1, duration: 1400, ease: 'Sine.easeInOut' });
    this._float(GAME_W / 2 + this.cameras.main.scrollX, GAME_H / 2 - 160, 'The Earth is lifted to the light!', '#8fd0ff');
    this.time.delayedCall(2400, () => {
      this.cameras.main.fadeOut(900, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Ending3', { relics: this.relics, score: this.score }));
    });
  }

  _die() {
    AudioManager.lose();
    this.varaha.health = this.varaha.maxHealth;
    this.varaha.setPosition(this.phase === 'boss' ? BOSS_X + 120 : this.checkpointX, GAME_H / 2);
    this.varaha.setVelocity(0, 0);
    this.varaha.invincibleUntil = this.time.now + 1600;
    this._banner('Struck down!', 'Rise, Varaha — the Earth still waits.');
    this._pushHud();
  }

  // ---------------- HUD ----------------
  _buildHud() {
    const d = 600;
    const pb = this.add.image(42, 42, 'pauseBtn').setScrollFactor(0).setDepth(d).setInteractive({ useHandCursor: true });
    const pbBase = 58 / pb.width; pb.setScale(pbBase);
    pb.on('pointerup', () => { pb.setScale(pbBase); this._pause(); }).on('pointerdown', () => pb.setScale(pbBase * 0.9)).on('pointerout', () => pb.setScale(pbBase));
    this.hearts = [];
    for (let i = 0; i < this.varaha.maxHealth; i++) this.hearts.push(this.add.text(70 + i * 30, 18, '❤', { fontSize: '26px', color: '#ff5a6a' }).setScrollFactor(0).setDepth(d));
    this.relicText = this.add.text(GAME_W - 20, 20, '', { fontFamily: 'system-ui', fontSize: '20px', color: '#7fe0a0', align: 'right' }).setOrigin(1, 0).setScrollFactor(0).setDepth(d);
    // boss bar
    this.bossLabel = this.add.text(GAME_W / 2, 66, 'HIRANYAKSHA', { fontFamily: 'Georgia, serif', fontSize: '19px', color: '#ffca6a', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(d).setVisible(false);
    this.bossBarBg = this.add.rectangle(GAME_W / 2, 90, 320, 16, 0x00121f, 0.7).setStrokeStyle(2, COLORS.gold, 0.8).setScrollFactor(0).setDepth(d).setVisible(false);
    this.bossBar = this.add.rectangle(GAME_W / 2 - 158, 90, 316, 10, 0xd9a13c).setOrigin(0, 0.5).setScrollFactor(0).setDepth(d).setVisible(false);
  }

  _pushHud() {
    for (let i = 0; i < this.hearts.length; i++) this.hearts[i].setColor(i < this.varaha.health ? '#ff5a6a' : '#3a2630');
    this.relicText.setText(`🌍 ${this.relics}/${RELIC_GOAL}`);
  }
  _updateHud() {
    const boss = this.phase === 'boss';
    [this.bossLabel, this.bossBarBg, this.bossBar].forEach((o) => o.setVisible(boss));
    if (boss) this.bossBar.width = 316 * Phaser.Math.Clamp((this.bossHp || 0) / BOSS_HP, 0, 1);
  }

  _pause() { if (this.scene.isActive('Pause')) return; this.scene.pause(); this.scene.launch('Pause', { from: 'Level3' }); }

  // ---------------- FX ----------------
  _burst(x, y, tint = 0xffffff) {
    const p = this.add.particles(x, y, 'bubble', { lifespan: 500, speed: { min: 60, max: 180 }, scale: { start: 0.8, end: 0 }, alpha: { start: 0.9, end: 0 }, quantity: 10, tint });
    p.explode(10); this.time.delayedCall(600, () => p.destroy());
  }
  _float(x, y, msg, color) {
    const t = this.add.text(x, y, msg, { fontFamily: 'system-ui', fontSize: '20px', color, fontStyle: 'bold' }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }
  _toast(msg, dur = 2200) {
    if (!this._toastTxt) this._toastTxt = this.add.text(GAME_W / 2, GAME_H - 92, '', { fontFamily: 'system-ui', fontSize: '19px', color: '#7fd7ff', backgroundColor: '#00121fcc', padding: { x: 14, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(210);
    this._toastTxt.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this._toastTxt);
    this.tweens.add({ targets: this._toastTxt, alpha: 0, delay: dur, duration: 500 });
  }
  _banner(title, sub) {
    const g = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(300).setScrollFactor(0);
    const a = this.add.text(0, -20, title, { fontFamily: 'Georgia, serif', fontSize: '42px', color: '#ffd257', fontStyle: 'bold' }).setOrigin(0.5);
    const b = this.add.text(0, 30, sub, { fontFamily: 'system-ui', fontSize: '20px', color: '#eaf6ff', align: 'center', wordWrap: { width: GAME_W - 120 } }).setOrigin(0.5);
    g.add([a, b]); g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400, yoyo: true, hold: 1500, onComplete: () => g.destroy() });
  }
}
