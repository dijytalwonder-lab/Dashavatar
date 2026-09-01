import Phaser from 'phaser';
import { GAME_W, GAME_H, COLORS } from './config.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import MainMenuScene from './scenes/MainMenuScene.js';
import ChapterSelectScene from './scenes/ChapterSelectScene.js';
import SettingsScene from './scenes/SettingsScene.js';
import PauseScene from './scenes/PauseScene.js';
import StoryScene from './scenes/StoryScene.js';
import Level1Scene from './scenes/Level1Scene.js';
import BossScene from './scenes/BossScene.js';
import EndingScene from './scenes/EndingScene.js';
import UIScene from './scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: COLORS.deepWater,
  width: GAME_W,
  height: GAME_H,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: {
    antialias: true,
    roundPixels: false
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // underwater: no gravity, momentum-based swimming
      debug: false
    }
  },
  input: {
    activePointers: 3 // allow joystick + button multitouch
  },
  scene: [
    BootScene,
    PreloadScene,
    MainMenuScene,
    ChapterSelectScene,
    SettingsScene,
    PauseScene,
    StoryScene,
    Level1Scene,
    BossScene,
    EndingScene,
    UIScene
  ]
};

const game = new Phaser.Game(config);

// Remove the HTML boot placeholder once Phaser is ready.
game.events.once('ready', () => {
  const boot = document.getElementById('boot');
  if (boot) boot.remove();
});

// Debug hook (matches convention from other projects on this machine).
window.game = game;
