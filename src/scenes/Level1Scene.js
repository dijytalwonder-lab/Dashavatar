import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, TUNING, OBJECTIVES } from '../config.js';
import { makeWaterBackground } from '../systems/Background.js';
import AudioManager from '../systems/AudioManager.js';
import Controls from '../systems/Controls.js';
import Matsya from '../entities/Matsya.js';

const WORLD_W = 5400;

// Segment boundaries (x): Rising Waters | Deep Flood | Guard the Boat
const SEG = { one: 0, two: 1700, three: 3500, end: WORLD_W };

export default class Level1Scene extends Phaser.Scene {
  constructor() {
    super('Level1');
  }

  create() {
    this.cameras.main.fadeIn(500, 0, 8, 20);
    this.physics.world.setBounds(0, 0, WORLD_W, GAME_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, GAME_H);

    makeWaterBackground(this, WORLD_W);
    AudioManager.startAmbient();

    // Run state (persists across checkpoint respawns within this attempt)
    this.counts = { sages: 0, seeds: 0, animals: 0, scrolls: 0 };
    this.score = 0;
    this.boatHealth = TUNING.boatMaxHealth;
    this.checkpointX = 120;
    this.checkpointY = GAME_H / 2;
    this.gameOver = false;
    this.boatActive = false;

    // Groups
    this.pickups = this.physics.add.group();
    this.hazards = this.physics.add.staticGroup();
    this.enemies = this.physics.add.group();
    this.currents = [];
    this.whirlpools = [];
    this.airPockets = [];

    this._buildSegment1();
    this._buildSegment2();
    this._buildSegment3();
    this._buildEndGate();

    // Player
    this.matsya = new Matsya(this, this.checkpointX, this.checkpointY);
    this.cameras.main.startFollow(this.matsya, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(220, 160);

    // Controls
    this.controls = new Controls(this);

    // Overlaps
    this.physics.add.overlap(this.matsya, this.pickups, this._collect, null, this);
    this.physics.add.overlap(this.matsya, this.enemies, this._touchEnemy, null, this);
    this.physics.add.overlap(this.matsya, this.hazards, this._touchHazard, null, this);

    // Launch HUD scene on top
    this.scene.launch('UIScene', { level: this });
    this._pushHud();

    // Tutorial toasts
    this._toast('Swim with the joystick →', 2600);
    this.time.delayedCall(3000, () => this._toast('Reach the glowing gate at the far right', 2600));
    this.time.delayedCall(6200, () => this._toast('Tap SURGE to dash through danger', 2600));

    // segment tracking for one-time events
    this._segAnnounced = { two: false, three: false };

    this.events.on('shutdown', () => {
      this.scene.stop('UIScene');
      this.controls && this.controls.destroy();
    });
  }

  // ---------------- Segment builders ----------------

  _label(x, title, subtitle) {
    this.add
      .text(x, 70, title, {
        fontFamily: 'Georgia, serif',
        fontSize: '30px',
        color: '#ffd257',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setAlpha(0.5);
    this.add
      .text(x, 104, subtitle, {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '16px',
        color: '#9bd7ef'
      })
      .setOrigin(0.5)
      .setAlpha(0.5);
  }

  _buildSegment1() {
    this._label(700, 'Rising Waters', 'Segment 1 · learn to swim');
    // gentle: 2 sages, 2 seeds, an air pocket
    this._addPickup('sage', 520, 300);
    this._addPickup('sage', 1150, 460);
    this._addPickup('seed', 780, 520);
    this._addPickup('seed', 1350, 220);
    this._addAirPocket(980, 140);
    // a couple of decorative coral (non-lethal here spaced low)
    this.hazards.create(600, GAME_H - 30, 'coral').refreshBody();
  }

  _buildSegment2() {
    this._label(SEG.two + 700, 'The Deep Flood', 'Segment 2 · currents & creatures');
    // currents (push zones)
    this._addCurrent(SEG.two + 200, 200, 360, 320, 120, 0);
    this._addCurrent(SEG.two + 900, 260, 300, 300, -90, -30);
    // whirlpools
    this._addWhirlpool(SEG.two + 620, 430, 120);
    this._addWhirlpool(SEG.two + 1300, 250, 110);
    // coral hazards
    this.hazards.create(SEG.two + 480, GAME_H - 30, 'coral').refreshBody();
    this.hazards.create(SEG.two + 1050, 40, 'coral').setFlipY(true).refreshBody();
    this.hazards.create(SEG.two + 1500, GAME_H - 30, 'coral').refreshBody();
    // pickups: 2 sages, 2 seeds, 2 animals, 3 scrolls
    this._addPickup('sage', SEG.two + 350, 470);
    this._addPickup('sage', SEG.two + 1450, 500);
    this._addPickup('seed', SEG.two + 700, 160);
    this._addPickup('seed', SEG.two + 1150, 560);
    this._addPickup('animal', SEG.two + 520, 300);
    this._addPickup('animal', SEG.two + 1250, 380);
    this._addPickup('scroll', SEG.two + 260, 220);
    this._addPickup('scroll', SEG.two + 820, 520);
    this._addPickup('scroll', SEG.two + 1550, 220);
    // enemies
    this._addEnemyFish(SEG.two + 450, 250);
    this._addEnemyFish(SEG.two + 950, 450);
    this._addEnemyFish(SEG.two + 1350, 200);
    this._addEel(SEG.two + 700, 380);
    this._addEel(SEG.two + 1200, 480);
  }

  _buildSegment3() {
    this._label(SEG.three + 700, "Guarding Manu's Boat", 'Segment 3 · protect the boat');
    // pickups: 1 sage, 2 seeds, 2 animals, 2 scrolls
    this._addPickup('sage', SEG.three + 300, 300);
    this._addPickup('seed', SEG.three + 600, 500);
    this._addPickup('seed', SEG.three + 1200, 220);
    this._addPickup('animal', SEG.three + 450, 180);
    this._addPickup('animal', SEG.three + 1000, 520);
    this._addPickup('scroll', SEG.three + 800, 320);
    this._addPickup('scroll', SEG.three + 1400, 420);

    // Manu's boat — drifts slowly to the right along the surface
    this.boat = this.physics.add.image(SEG.three + 200, 120, 'boat').setDepth(40);
    this.boat.body.setAllowGravity(false);
    this.boat.setImmovable(true);
    this.boat.setData('maxHealth', TUNING.boatMaxHealth);
    // gentle bob
    this.tweens.add({ targets: this.boat, y: '+=10', duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  _buildEndGate() {
    this.gate = this.add.container(SEG.end - 160, GAME_H / 2);
    const pillar1 = this.add.rectangle(-60, 0, 24, 360, COLORS.gold, 0.5);
    const pillar2 = this.add.rectangle(60, 0, 24, 360, COLORS.gold, 0.5);
    const arch = this.add.image(0, 0, 'glow').setScale(3).setAlpha(0.6).setBlendMode(Phaser.BlendModes.ADD);
    this.gateText = this.add
      .text(0, -210, 'SANCTUARY', { fontFamily: 'Georgia, serif', fontSize: '26px', color: '#ffd257', fontStyle: 'bold' })
      .setOrigin(0.5);
    this.gate.add([arch, pillar1, pillar2, this.gateText]);
    this.tweens.add({ targets: arch, scale: { from: 2.6, to: 3.2 }, alpha: { from: 0.4, to: 0.7 }, duration: 1400, yoyo: true, repeat: -1 });

    this.gateZone = this.add.zone(SEG.end - 160, GAME_H / 2, 160, 400);
    this.physics.add.existing(this.gateZone, true);
  }

  // ---------------- Object factories ----------------

  _addPickup(kind, x, y) {
    const p = this.pickups.create(x, y, kind);
    p.setData('kind', kind);
    p.body.setAllowGravity(false);
    p.body.setCircle(18, p.width / 2 - 18, p.height / 2 - 18);
    // gentle float
    this.tweens.add({ targets: p, y: y - 12, duration: 1600 + Math.random() * 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const glow = this.add.image(x, y, 'glow').setScale(kind === 'scroll' ? 1.1 : 0.8).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    p.setData('glow', glow);
    this.tweens.add({ targets: glow, y: y - 12, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    return p;
  }

  _addAirPocket(x, y) {
    const a = this.add.image(x, y, 'airPocket').setDepth(6);
    this.tweens.add({ targets: a, scale: { from: 0.9, to: 1.1 }, duration: 1500, yoyo: true, repeat: -1 });
    this.airPockets.push({ x, y, r: 60 });
    this.add.text(x, y + 46, 'AIR', { fontFamily: 'system-ui', fontSize: '14px', color: '#bdf0ff' }).setOrigin(0.5);
  }

  _addCurrent(x, y, w, h, vx, vy) {
    const rect = new Phaser.Geom.Rectangle(x, y, w, h);
    this.currents.push({ rect, vx, vy });
    // visual: faint directional streaks
    const g = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x8fe3ff, 0.05).setDepth(2);
    const arrows = this.add.particles(0, 0, 'bubble', {
      x: { min: x, max: x + w },
      y: { min: y, max: y + h },
      lifespan: 1200,
      speedX: vx * 1.2,
      speedY: vy * 1.2,
      scale: { start: 0.4, end: 0 },
      alpha: { start: 0.3, end: 0 },
      frequency: 90
    }).setDepth(2);
  }

  _addWhirlpool(x, y, r) {
    this.whirlpools.push({ x, y, r });
    const spiral = this.add.image(x, y, 'glow').setScale(r / 28).setAlpha(0.2).setTint(0x4fd0ff).setDepth(2);
    this.tweens.add({ targets: spiral, angle: 360, duration: 3000, repeat: -1 });
    this.add.circle(x, y, r, 0x2a6f9c, 0.08).setDepth(1);
  }

  _addEnemyFish(x, y) {
    const e = this.enemies.create(x, y, 'enemyFish');
    e.setData('type', 'fish');
    e.setData('hp', 2);
    e.setData('homeY', y);
    e.body.setAllowGravity(false);
    e.body.setCircle(22, 14, 2);
    e.setData('baseX', x);
    return e;
  }

  _addEel(x, y) {
    const e = this.enemies.create(x, y, 'eel');
    e.setData('type', 'eel');
    e.setData('hp', 3);
    e.setData('homeY', y);
    e.setData('phase', Math.random() * Math.PI * 2);
    e.body.setAllowGravity(false);
    e.body.setSize(60, 20);
    e.setData('lungeUntil', 0);
    return e;
  }

  // ---------------- Collisions ----------------

  _collect(matsya, pickup) {
    const kind = pickup.getData('kind'); // singular: sage|seed|animal|scroll
    const countKey = { sage: 'sages', seed: 'seeds', animal: 'animals', scroll: 'scrolls' }[kind];
    this.counts[countKey]++;
    const pts = kind === 'scroll' ? 250 : kind === 'sage' ? 150 : 100;
    this.score += pts;

    // pop effect
    const glow = pickup.getData('glow');
    if (glow) glow.destroy();
    if (kind === 'sage') {
      AudioManager.rescue();
      this._floatText(pickup.x, pickup.y, 'Sage rescued!', '#ffe3b3');
    } else if (kind === 'scroll') {
      AudioManager.scroll();
      this._floatText(pickup.x, pickup.y, 'Veda +1', '#ffd257');
    } else {
      AudioManager.collect();
      this._floatText(pickup.x, pickup.y, kind === 'seed' ? 'Seed saved' : 'Animal saved', '#9be870');
    }
    this._burst(pickup.x, pickup.y);
    pickup.destroy();
    this._pushHud();
  }

  _touchEnemy(matsya, enemy) {
    if (matsya.isDashing) {
      // dashing through an enemy damages it
      this._hurtEnemy(enemy, 2);
      return;
    }
    if (matsya.takeDamage(1, enemy.x, enemy.y)) {
      this._pushHud();
      if (matsya.health <= 0) this._die();
    }
  }

  _touchHazard(matsya, hazard) {
    if (matsya.isInvincible) return;
    if (matsya.takeDamage(1, hazard.x, hazard.y)) {
      this._pushHud();
      if (matsya.health <= 0) this._die();
    }
  }

  _hurtEnemy(enemy, dmg) {
    const hp = enemy.getData('hp') - dmg;
    enemy.setData('hp', hp);
    enemy.setTint(0xffffff);
    this.time.delayedCall(90, () => enemy.active && enemy.clearTint());
    if (hp <= 0) {
      AudioManager.enemyDie();
      this._burst(enemy.x, enemy.y, 0xff8a8a);
      this.score += 120;
      enemy.destroy();
      this._pushHud();
    }
  }

  // ---------------- Update loop ----------------

  update(time, delta) {
    if (this.gameOver) return;
    const dt = delta / 1000;
    this.controls.update();
    this.matsya.handleInput(this.controls);

    // Attack (tail whip)
    if (this.controls.consumeAttack()) {
      const hit = this.matsya.tailWhip();
      this.enemies.getChildren().forEach((e) => {
        if (Phaser.Math.Distance.Between(hit.x, hit.y, e.x, e.y) < hit.r + 20) {
          this._hurtEnemy(e, 1);
          // knock enemy back
          const ang = Math.atan2(e.y - hit.y, e.x - hit.x);
          e.setVelocity(Math.cos(ang) * 220, Math.sin(ang) * 220);
        }
      });
    }

    this._applyCurrents();
    this._applyWhirlpools();
    this._handleAir(dt);
    this._updateEnemies(time, delta);
    this._segmentEvents();
    this._updateBoat(dt);
    this._checkGate();

    this._pushHud();
  }

  _applyCurrents() {
    const b = this.matsya.body;
    for (const c of this.currents) {
      if (Phaser.Geom.Rectangle.Contains(c.rect, this.matsya.x, this.matsya.y)) {
        b.velocity.x += c.vx * 0.06;
        b.velocity.y += c.vy * 0.06;
      }
    }
  }

  _applyWhirlpools() {
    for (const w of this.whirlpools) {
      const d = Phaser.Math.Distance.Between(w.x, w.y, this.matsya.x, this.matsya.y);
      if (d < w.r && !this.matsya.isDashing) {
        const ang = Math.atan2(this.matsya.y - w.y, this.matsya.x - w.x);
        const pull = (1 - d / w.r) * 220;
        // inward + tangential swirl
        this.matsya.body.velocity.x += (-Math.cos(ang) * pull + Math.cos(ang + Math.PI / 2) * pull * 0.6) * 0.05;
        this.matsya.body.velocity.y += (-Math.sin(ang) * pull + Math.sin(ang + Math.PI / 2) * pull * 0.6) * 0.05;
      }
    }
  }

  _handleAir(dt) {
    // Air drains only in the "deep" segment (2). Refill near air pockets or at surface.
    let nearAir = this.matsya.y < 90; // surface line
    for (const a of this.airPockets) {
      if (Phaser.Math.Distance.Between(a.x, a.y, this.matsya.x, this.matsya.y) < a.r) nearAir = true;
    }
    const inDeep = this.matsya.x >= SEG.two && this.matsya.x < SEG.three;
    if (nearAir) {
      this.matsya.refillAir(dt);
    } else if (inDeep) {
      const empty = this.matsya.drainAir(dt);
      if (empty && !this.matsya.isInvincible) {
        // suffocating: lose health slowly
        if (this.matsya.takeDamage(1, this.matsya.x, this.matsya.y + 100)) {
          if (this.matsya.health <= 0) this._die();
        }
      }
    } else {
      this.matsya.refillAir(dt * 0.5);
    }
  }

  _updateEnemies(time, delta) {
    const px = this.matsya.x;
    const py = this.matsya.y;
    this.enemies.getChildren().forEach((e) => {
      const type = e.getData('type');
      const dist = Phaser.Math.Distance.Between(e.x, e.y, px, py);
      if (type === 'fish') {
        if (dist < 320) {
          // chase
          const ang = Math.atan2(py - e.y, px - e.x);
          e.setVelocity(Math.cos(ang) * 140, Math.sin(ang) * 140);
          e.setFlipX(px < e.x);
        } else {
          // patrol around baseX
          const base = e.getData('baseX');
          e.setVelocity(Math.sin(time / 700 + base) * 60, Math.cos(time / 900 + base) * 30);
        }
      } else if (type === 'eel') {
        const home = e.getData('homeY');
        const phase = e.getData('phase');
        if (dist < 220 && time > e.getData('lungeUntil')) {
          e.setData('lungeUntil', time + 1600);
          const ang = Math.atan2(py - e.y, px - e.x);
          e.setVelocity(Math.cos(ang) * 300, Math.sin(ang) * 300);
        } else if (time > e.getData('lungeUntil') - 1200) {
          // drift back to patrol
          e.setVelocity(Math.sin(time / 500 + phase) * 40, (home - e.y) * 1.2);
        }
        e.setFlipX(e.body.velocity.x < 0);
      }
    });
  }

  _segmentEvents() {
    if (!this._segAnnounced.two && this.matsya.x >= SEG.two) {
      this._segAnnounced.two = true;
      this.checkpointX = SEG.two + 60;
      this.checkpointY = GAME_H / 2;
      this._banner('THE DEEP FLOOD', 'Currents pull. Watch your AIR.');
      this._toast('Currents push you — SURGE to break free', 2800);
    }
    if (!this._segAnnounced.three && this.matsya.x >= SEG.three) {
      this._segAnnounced.three = true;
      this.checkpointX = SEG.three + 60;
      this.checkpointY = GAME_H / 2;
      this.boatActive = true;
      this._banner("GUARD MANU'S BOAT", 'Stop the creatures before they reach it!');
      this._startBoatWaves();
    }
  }

  // Escort: spawn waves of enemies that home on the boat.
  _startBoatWaves() {
    this.boatWave = this.time.addEvent({
      delay: 2600,
      loop: true,
      callback: () => {
        if (this.gameOver || !this.boat || !this.boat.active) return;
        const fromTop = Math.random() < 0.5;
        const sx = Phaser.Math.Clamp(this.boat.x + Phaser.Math.Between(200, 700), SEG.three, WORLD_W - 40);
        const sy = fromTop ? 80 : GAME_H - 80;
        const e = this._addEnemyFish(sx, sy);
        e.setData('targetBoat', true);
      }
    });
  }

  _updateBoat(dt) {
    if (!this.boat || !this.boat.active) return;
    if (this.boatActive) {
      // drift slowly toward the gate
      this.boat.x = Math.min(SEG.end - 260, this.boat.x + 22 * dt);
    }
    // boat-targeting enemies swim at the boat; on contact they damage it
    this.enemies.getChildren().forEach((e) => {
      if (!e.getData('targetBoat')) return;
      const ang = Math.atan2(this.boat.y - e.y, this.boat.x - e.x);
      e.setVelocity(Math.cos(ang) * 120, Math.sin(ang) * 120);
      if (Phaser.Math.Distance.Between(e.x, e.y, this.boat.x, this.boat.y) < 70) {
        this._damageBoat(6);
        this._burst(e.x, e.y, 0xff8a8a);
        e.destroy();
      }
    });
  }

  _damageBoat(n) {
    this.boatHealth = Math.max(0, this.boatHealth - n);
    AudioManager.hit();
    this.cameras.main.shake(120, 0.008);
    this._floatText(this.boat.x, this.boat.y - 40, 'Boat hit!', '#ff8a8a');
    this._pushHud();
    if (this.boatHealth <= 0) this._fail('The boat was lost to the flood!');
  }

  _checkGate() {
    const atGate = this.matsya.x > SEG.end - 240;
    if (!atGate) return;
    if (this._objectivesComplete()) {
      if (!this._enteringGate) {
        this._enteringGate = true;
        this._win();
      }
    } else {
      if (!this._gateWarnAt || this.time.now > this._gateWarnAt) {
        this._gateWarnAt = this.time.now + 2000;
        const r = this._remainingText();
        this._toast(`The gate is sealed — still need: ${r}`, 1800);
      }
    }
  }

  _objectivesComplete() {
    return (
      this.counts.sages >= OBJECTIVES.sages &&
      this.counts.seeds >= OBJECTIVES.seeds &&
      this.counts.animals >= OBJECTIVES.animals &&
      this.counts.scrolls >= OBJECTIVES.scrolls
    );
  }

  _remainingText() {
    const parts = [];
    if (this.counts.sages < OBJECTIVES.sages) parts.push(`${OBJECTIVES.sages - this.counts.sages} sage`);
    if (this.counts.seeds < OBJECTIVES.seeds) parts.push(`${OBJECTIVES.seeds - this.counts.seeds} seed`);
    if (this.counts.animals < OBJECTIVES.animals) parts.push(`${OBJECTIVES.animals - this.counts.animals} animal`);
    if (this.counts.scrolls < OBJECTIVES.scrolls) parts.push(`${OBJECTIVES.scrolls - this.counts.scrolls} Veda`);
    return parts.join(', ');
  }

  // ---------------- Win / lose ----------------

  _win() {
    AudioManager.win();
    this.matsya.setVelocity(0, 0);
    this._banner('SANCTUARY REACHED', 'All life is saved. Now — the Vedas.');
    this.cameras.main.fadeOut(900, 0, 8, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Boss', {
        counts: this.counts,
        score: this.score,
        boatHealth: this.boatHealth
      });
    });
  }

  _die() {
    // respawn at last checkpoint (forgiving — keep collected items)
    AudioManager.lose();
    this.matsya.health = TUNING.maxHealth;
    this.matsya.air = TUNING.maxAir;
    this.matsya.setPosition(this.checkpointX, this.checkpointY);
    this.matsya.setVelocity(0, 0);
    this.matsya.invincibleUntil = this.time.now + 1500;
    this._banner('You were overwhelmed…', 'Respawning at the last checkpoint.');
    this._pushHud();
  }

  _fail(reason) {
    if (this.gameOver) return;
    this.gameOver = true;
    AudioManager.lose();
    this.matsya.setVelocity(0, 0);
    if (this.boatWave) this.boatWave.remove();
    this.scene.stop('UIScene');
    this.scene.start('Ending', { failed: true, reason, counts: this.counts, score: this.score });
  }

  // ---------------- HUD + FX helpers ----------------

  _pushHud() {
    this.registry.set('hud', {
      health: this.matsya ? this.matsya.health : TUNING.maxHealth,
      maxHealth: TUNING.maxHealth,
      air: this.matsya ? this.matsya.air : TUNING.maxAir,
      maxAir: TUNING.maxAir,
      counts: { ...this.counts },
      objectives: OBJECTIVES,
      score: this.score,
      boatActive: this.boatActive,
      boatHealth: this.boatHealth,
      boatMax: TUNING.boatMaxHealth,
      dashReadyAt: this.matsya ? this.matsya.dashReadyAt : 0,
      now: this.time.now
    });
  }

  _burst(x, y, tint = 0xffffff) {
    const p = this.add.particles(x, y, 'bubble', {
      lifespan: 500,
      speed: { min: 60, max: 180 },
      scale: { start: 0.8, end: 0 },
      alpha: { start: 0.9, end: 0 },
      quantity: 10,
      tint
    });
    p.explode(10);
    this.time.delayedCall(600, () => p.destroy());
  }

  _floatText(x, y, msg, color) {
    const t = this.add
      .text(x, y, msg, { fontFamily: 'system-ui, sans-serif', fontSize: '18px', color, fontStyle: 'bold' })
      .setOrigin(0.5)
      .setDepth(200);
    this.tweens.add({ targets: t, y: y - 46, alpha: 0, duration: 900, onComplete: () => t.destroy() });
  }

  _toast(msg, dur = 2200) {
    this.registry.set('toast', { msg, until: this.time.now + dur });
  }

  // Screen-space banner (scrollFactor 0 so it stays centered as the camera moves).
  _banner(title, sub) {
    const g = this.add.container(GAME_W / 2, GAME_H / 2).setDepth(300).setScrollFactor(0);
    const a = this.add
      .text(0, -20, title, { fontFamily: 'Georgia, serif', fontSize: '44px', color: '#ffd257', fontStyle: 'bold' })
      .setOrigin(0.5);
    const b = this.add
      .text(0, 30, sub, { fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#eaf6ff' })
      .setOrigin(0.5);
    g.add([a, b]);
    g.setAlpha(0);
    this.tweens.add({ targets: g, alpha: 1, duration: 400, yoyo: true, hold: 1400, onComplete: () => g.destroy() });
  }
}
