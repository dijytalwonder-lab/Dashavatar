// Global game constants for Dashavatara Chapter 1: Matsya
// Base resolution is landscape 1280x720, scaled with FIT to fill any device.

// Portrait (vertical) mobile resolution — 9:16.
export const GAME_W = 720;
export const GAME_H = 1280;

// Colors (mythic underwater palette)
export const COLORS = {
  deepWater: 0x041627,
  midWater: 0x0a3a5c,
  shallowWater: 0x146c94,
  surface: 0x8fe3ff,
  gold: 0xffd257,
  goldDark: 0xd99a1c,
  matsya: 0x3fc1c9,
  matsyaFin: 0x1d7a8c,
  sage: 0xffe3b3,
  seed: 0x9be870,
  animal: 0xf2a65a,
  scroll: 0xf5e6c8,
  enemy: 0xc94b4b,
  eel: 0x7a4bc9,
  boss: 0x2a1a3a,
  bossHorse: 0x6b3f2a,
  danger: 0xff4d4d,
  boat: 0x8b5a2b,
  air: 0x7fd7ff,
  hpGreen: 0x4be86b,
  ink: 0xeaf6ff
};

// Ability keys — carried forward across chapters via SaveManager.
export const ABILITIES = {
  SWIMMING: 'swimming' // unlocked at the end of Chapter 1
};

// Level tuning
export const TUNING = {
  matsyaSpeed: 240,
  matsyaAccel: 900,
  matsyaDrag: 420,
  dashSpeed: 620,
  dashCooldown: 1200, // ms
  dashDuration: 260, // ms
  maxHealth: 5,
  maxAir: 100,
  airDrainPerSec: 6, // only drains outside water pockets / near surface segments
  airRefillPerSec: 40,
  invincibleMs: 900,
  boatMaxHealth: 100
};

// Objective targets for the level HUD checklist
export const OBJECTIVES = {
  sages: 5,
  seeds: 6,
  animals: 4,
  scrolls: 5
};
