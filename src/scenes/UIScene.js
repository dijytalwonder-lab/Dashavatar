import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS, TUNING } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// UIScene — the HUD, drawn as an overlay scene on top of gameplay. Reads state
// each frame from registry.get('hud') so it works for both Level1 and Boss.
export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
  }

  init(data) {
    this.level = data && data.level; // the gameplay scene to pause
  }

  create() {
    // Pause button (top-left)
    this._pauseBtn = this.add.container(34, 36);
    const pbBg = this.add.circle(0, 0, 24, 0x00121f, 0.55).setStrokeStyle(2, COLORS.air, 0.6);
    const pbIcon = this.add.text(0, -1, '❚❚', { fontFamily: 'system-ui', fontSize: '18px', color: '#bdf0ff', fontStyle: 'bold' }).setOrigin(0.5);
    this._pauseBtn.add([pbBg, pbIcon]);
    pbBg.setInteractive(new Phaser.Geom.Circle(0, 0, 26), Phaser.Geom.Circle.Contains)
      .on('pointerdown', () => this._pauseBtn.setScale(0.9))
      .on('pointerup', () => { this._pauseBtn.setScale(1); this._openPause(); })
      .on('pointerout', () => this._pauseBtn.setScale(1));

    // Health hearts (shifted right of the pause button)
    this.hearts = [];
    for (let i = 0; i < TUNING.maxHealth; i++) {
      const h = this.add.text(70 + i * 32, 18, '❤', { fontSize: '28px', color: '#ff5a6a' });
      this.hearts.push(h);
    }

    // Air meter
    this.add.text(70, 58, 'AIR', { fontFamily: 'system-ui', fontSize: '15px', color: '#bdf0ff' });
    this.airBg = this.add.rectangle(108, 66, 150, 14, 0x00121f, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, COLORS.air, 0.5);
    this.airBar = this.add.rectangle(109, 66, 148, 10, COLORS.air).setOrigin(0, 0.5);

    // Objective checklist (top-right)
    this.objText = this.add
      .text(GAME_W - 20, 16, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '18px',
        color: '#eaf6ff',
        align: 'right',
        lineSpacing: 4
      })
      .setOrigin(1, 0);

    // Score
    this.scoreText = this.add
      .text(GAME_W / 2, 18, '', { fontFamily: 'Georgia, serif', fontSize: '22px', color: '#ffd257' })
      .setOrigin(0.5, 0);

    // Boat health bar (hidden until escort)
    this.boatGroup = this.add.container(GAME_W / 2, GAME_H - 40).setVisible(false);
    const bLabel = this.add.text(-140, -14, "Manu's Boat", { fontFamily: 'system-ui', fontSize: '15px', color: '#ffd9b0' });
    this.boatBg = this.add.rectangle(-140, 8, 280, 16, 0x00121f, 0.7).setOrigin(0, 0.5).setStrokeStyle(2, COLORS.boat, 0.8);
    this.boatBar = this.add.rectangle(-138, 8, 276, 12, COLORS.hpGreen).setOrigin(0, 0.5);
    this.boatGroup.add([bLabel, this.boatBg, this.boatBar]);

    // Dash cooldown pip near controls (bottom-right)
    this.dashPip = this.add.text(GAME_W - 220, GAME_H - 176, 'SURGE READY', {
      fontFamily: 'system-ui', fontSize: '13px', color: '#ffe9b0'
    }).setOrigin(0.5);

    // Sound toggle
    this.soundBtn = this.add
      .text(GAME_W - 20, GAME_H - 30, SaveManager.soundOn ? '🔊' : '🔇', { fontSize: '26px' })
      .setOrigin(1, 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', (p) => {
        p.event.stopPropagation();
        const on = AudioManager.toggle();
        this.soundBtn.setText(on ? '🔊' : '🔇');
      });

    // Toast line
    this.toast = this.add
      .text(GAME_W / 2, GAME_H - 90, '', {
        fontFamily: 'system-ui, sans-serif',
        fontSize: '20px',
        color: '#7fd7ff',
        backgroundColor: '#00121fcc',
        padding: { x: 14, y: 8 }
      })
      .setOrigin(0.5)
      .setAlpha(0);
  }

  _openPause() {
    if (!this.level || this.scene.isActive('Pause')) return;
    AudioManager.click();
    this.level.scene.pause();
    this.scene.launch('Pause', { from: this.level.scene.key, ui: 'UIScene' });
  }

  update() {
    const hud = this.registry.get('hud');
    if (!hud) return;

    // hearts
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setColor(i < hud.health ? '#ff5a6a' : '#3a2630');
    }

    // air
    const airPct = Phaser.Math.Clamp(hud.air / hud.maxAir, 0, 1);
    this.airBar.width = 148 * airPct;
    this.airBar.fillColor = airPct < 0.3 ? COLORS.danger : COLORS.air;

    // objectives
    const c = hud.counts;
    const o = hud.objectives;
    const line = (emoji, label, have, need) =>
      `${have >= need ? '✅' : '⬜'} ${emoji} ${label} ${have}/${need}`;
    this.objText.setText([
      line('🧙', 'Sages', c.sages, o.sages),
      line('🌱', 'Seeds', c.seeds, o.seeds),
      line('🐾', 'Animals', c.animals, o.animals),
      line('📜', 'Vedas', c.scrolls, o.scrolls)
    ]);

    this.scoreText.setText(`Score  ${hud.score}`);

    // boat
    if (hud.boatActive) {
      this.boatGroup.setVisible(true);
      const pct = Phaser.Math.Clamp(hud.boatHealth / hud.boatMax, 0, 1);
      this.boatBar.width = 276 * pct;
      this.boatBar.fillColor = pct < 0.3 ? COLORS.danger : pct < 0.6 ? COLORS.gold : COLORS.hpGreen;
    } else {
      this.boatGroup.setVisible(false);
    }

    // dash pip
    const ready = hud.now >= hud.dashReadyAt;
    this.dashPip.setText(ready ? 'SURGE READY' : 'SURGE…').setColor(ready ? '#9be870' : '#88a0b0');

    // toast
    const t = this.registry.get('toast');
    if (t && this.time.now < t.until) {
      this.toast.setText(t.msg).setAlpha(1);
    } else {
      this.toast.setAlpha(Math.max(0, this.toast.alpha - 0.04));
    }
  }
}
