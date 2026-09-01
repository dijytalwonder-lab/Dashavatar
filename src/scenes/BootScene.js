import Phaser from 'phaser';

// BootScene — minimal: set scaling defaults, then hand off to Preload.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.scale.lockOrientation && this.scale.lockOrientation('landscape');
    this.scene.start('Preload');
  }
}
