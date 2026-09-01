import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';

// Pause — a modal overlay launched on top of a paused gameplay scene. Resume,
// restart, open settings, or quit to the world select.
//   data.from : the gameplay scene key to resume/restart (e.g. 'Level1','Boss')
//   data.ui   : an overlay HUD scene to stop on quit/restart (e.g. 'UIScene')
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  init(data) {
    this.from = (data && data.from) || 'Level1';
    this.ui = (data && data.ui) || null;
  }

  create() {
    this.scene.bringToTop(); // render above the paused gameplay + HUD scenes
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x00060d, 0.7).setInteractive();

    const panelW = GAME_W - 130;
    this.add.rectangle(GAME_W / 2, GAME_H / 2, panelW, 640, 0x0a2a40, 0.98).setStrokeStyle(4, COLORS.gold, 0.9);

    this.add.text(GAME_W / 2, GAME_H / 2 - 250, '⏸  PAUSED', {
      fontFamily: 'Georgia, serif', fontSize: '46px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5);

    let y = GAME_H / 2 - 140;
    const gap = 96;
    this._button(GAME_W / 2, y, 'RESUME', COLORS.gold, '#00263a', () => this._resume());
    this._button(GAME_W / 2, y + gap, 'RESTART', 0x3a5a70, '#eaf6ff', () => this._restart());
    this._button(GAME_W / 2, y + gap * 2, 'SETTINGS', 0x3a5a70, '#eaf6ff', () => this._settings());
    this._button(GAME_W / 2, y + gap * 3, 'WORLDS', 0x7a4a4a, '#ffe0e0', () => this._quit());

    // ESC / hardware back resumes
    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this._resume());
  }

  _resume() {
    AudioManager.click();
    this.scene.resume(this.from);
    this.scene.stop();
  }

  _restart() {
    AudioManager.click();
    if (this.ui) this.scene.stop(this.ui);
    this.scene.stop(this.from);
    this.scene.start(this.from);
  }

  _settings() {
    AudioManager.click();
    // Open settings above this pause menu; it resumes 'Pause' on close.
    this.scene.launch('Settings', { from: 'Pause' });
    this.scene.pause();
  }

  _quit() {
    AudioManager.click();
    AudioManager.stopAmbient();
    if (this.ui) this.scene.stop(this.ui);
    this.scene.stop(this.from);
    this.scene.start('ChapterSelect');
  }

  _button(x, y, label, color, textColor, onClick) {
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 300, 66, color, 0.95).setStrokeStyle(3, 0xffffff, 0.25);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'system-ui, sans-serif', fontSize: '28px', color: textColor, fontStyle: 'bold'
    }).setOrigin(0.5);
    g.add([bg, txt]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => g.setScale(0.96))
      .on('pointerup', () => { g.setScale(1); onClick(); })
      .on('pointerout', () => g.setScale(1));
    return g;
  }
}
