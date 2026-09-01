import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config.js';
import AudioManager from '../systems/AudioManager.js';
import SaveManager from '../systems/SaveManager.js';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    // --- Background (cover-fit the portrait art) ---
    const bg = this.add.image(GAME_W / 2, GAME_H / 2, 'menuBg');
    const cover = Math.max(GAME_W / bg.width, GAME_H / bg.height);
    bg.setScale(cover);
    // soft vignette for button legibility
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x001018, 0.18);

    // --- Logo ---
    const logo = this.add.image(GAME_W / 2, 250, 'logo');
    logo.setScale(640 / logo.width);
    this.tweens.add({ targets: logo, y: 258, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // --- Buttons (real art) ---
    this._imageButton(GAME_W / 2, 840, 'btnPlay', 430, true, () => {
      AudioManager.unlock();
      AudioManager.click();
      // Quick-play: jump straight into the current world (Chapter 1).
      this.cameras.main.fadeOut(300, 0, 8, 20);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Story'));
    });

    this._imageButton(GAME_W / 2, 1000, 'btnChapters', 380, false, () => {
      AudioManager.unlock();
      AudioManager.click();
      this.scene.start('ChapterSelect');
    });

    this._imageButton(GAME_W / 2, 1140, 'btnSettings', 380, false, () => {
      AudioManager.unlock();
      AudioManager.click();
      this.scene.launch('Settings', { from: 'MainMenu' });
      this.scene.pause();
    });

    // Any tap unlocks audio (browser gesture requirement)
    this.input.once('pointerdown', () => AudioManager.unlock());
  }

  // An image-based button with press feedback; `pulse` gently breathes (paused
  // while pressed so the two animations never fight).
  _imageButton(x, y, key, width, pulse, onClick) {
    const btn = this.add.image(x, y, key).setInteractive({ useHandCursor: true });
    const base = width / btn.width;
    btn.setScale(base);

    let pulseTween = null;
    if (pulse) {
      pulseTween = this.tweens.add({
        targets: btn,
        scaleX: base * 1.03,
        scaleY: base * 1.03,
        duration: 900,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    btn.on('pointerdown', () => {
      if (pulseTween) pulseTween.pause();
      btn.setScale(base * 0.93);
    });
    const release = (fire) => {
      btn.setScale(base);
      if (pulseTween) pulseTween.resume();
      if (fire) onClick();
    };
    btn.on('pointerup', () => release(true));
    btn.on('pointerout', () => release(false));
    return btn;
  }
}
