import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

// Settings — a modal overlay launched on top of a paused scene (menu or, later,
// an in-game pause). Sound toggle + reset progress + close.
export default class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  init(data) {
    this.from = (data && data.from) || 'MainMenu';
  }

  create() {
    // Dim backdrop (also eats clicks so the scene beneath doesn't get them)
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000814, 0.72)
      .setInteractive();

    // Panel
    const panelW = GAME_W - 120;
    const panel = this.add.rectangle(GAME_W / 2, GAME_H / 2, panelW, 640, 0x0a2a40, 0.98)
      .setStrokeStyle(4, COLORS.gold, 0.9);

    this.add.text(GAME_W / 2, GAME_H / 2 - 260, 'SETTINGS', {
      fontFamily: 'Georgia, serif', fontSize: '44px', color: '#ffd257', fontStyle: 'bold'
    }).setOrigin(0.5);

    // --- Sound row ---
    this.add.text(GAME_W / 2 - panelW / 2 + 50, GAME_H / 2 - 140, 'Sound', {
      fontFamily: 'system-ui, sans-serif', fontSize: '30px', color: '#eaf6ff'
    }).setOrigin(0, 0.5);
    this._soundBtn = this._pill(GAME_W / 2 + panelW / 2 - 130, GAME_H / 2 - 140,
      SaveManager.soundOn ? 'ON' : 'OFF', SaveManager.soundOn ? COLORS.hpGreen : 0x8a4a4a, () => {
        AudioManager.unlock();
        const on = AudioManager.toggle();
        this._soundBtn.label.setText(on ? 'ON' : 'OFF');
        this._soundBtn.bg.fillColor = on ? COLORS.hpGreen : 0x8a4a4a;
        AudioManager.click();
      });

    // --- Reset progress row ---
    this.add.text(GAME_W / 2 - panelW / 2 + 50, GAME_H / 2 - 40, 'Progress', {
      fontFamily: 'system-ui, sans-serif', fontSize: '30px', color: '#eaf6ff'
    }).setOrigin(0, 0.5);
    this._resetBtn = this._pill(GAME_W / 2 + panelW / 2 - 130, GAME_H / 2 - 40, 'RESET', 0x8a4a4a, () => {
      AudioManager.click();
      if (this._confirming) {
        SaveManager.resetAll();
        this._resetBtn.label.setText('DONE');
        this._resetBtn.bg.fillColor = COLORS.hpGreen;
        this._confirming = false;
      } else {
        this._confirming = true;
        this._resetBtn.label.setText('SURE?');
        this._resetBtn.bg.fillColor = COLORS.danger;
        this.time.delayedCall(2500, () => {
          if (this._confirming && this._resetBtn.label.active) {
            this._resetBtn.label.setText('RESET');
            this._resetBtn.bg.fillColor = 0x8a4a4a;
            this._confirming = false;
          }
        });
      }
    });

    // --- Info ---
    this.add.text(GAME_W / 2, GAME_H / 2 + 70,
      'Swim with the joystick.\nSURGE to dash · TAIL WHIP to strike.', {
        fontFamily: 'system-ui, sans-serif', fontSize: '20px', color: '#9bd7ef',
        align: 'center', lineSpacing: 8
      }).setOrigin(0.5);

    this.add.text(GAME_W / 2, GAME_H / 2 + 175, 'Dashavatara · Chapter 1 · Matsya', {
      fontFamily: 'system-ui, sans-serif', fontSize: '16px', color: '#5f8ba3'
    }).setOrigin(0.5);

    // --- Close ---
    this._pill(GAME_W / 2, GAME_H / 2 + 250, 'CLOSE', COLORS.gold, () => this._close(), '#00263a', 200);

    // Hardware/esc back
    this.input.keyboard && this.input.keyboard.on('keydown-ESC', () => this._close());
  }

  _close() {
    AudioManager.click();
    this.scene.resume(this.from);
    this.scene.stop();
  }

  _pill(x, y, text, color, onClick, textColor = '#ffffff', w = 150) {
    const g = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, w, 58, color, 1).setStrokeStyle(2, 0xffffff, 0.3);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'system-ui, sans-serif', fontSize: '26px', color: textColor, fontStyle: 'bold'
    }).setOrigin(0.5);
    g.add([bg, label]);
    bg.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => g.setScale(0.94))
      .on('pointerup', () => { g.setScale(1); onClick(); })
      .on('pointerout', () => g.setScale(1));
    return { container: g, bg, label };
  }
}
