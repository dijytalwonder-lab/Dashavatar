// SaveManager — persistent progress for the whole Dashavatara campaign.
// Uses localStorage (works in the browser and inside the Capacitor WebView).
// Chapters 2-10 read/write the SAME save object, so build shared here once.

const KEY = 'dashavatara_save_v1';

const DEFAULT_SAVE = {
  version: 1,
  chapter: 1,
  // Abilities unlocked across the campaign. Matsya grants "swimming".
  abilities: {
    swimming: false,
    defense: false,
    strength: false,
    fury: false,
    strategy: false,
    weaponMastery: false,
    precision: false,
    tactics: false,
    compassion: false
  },
  // Per-chapter best results.
  chapters: {
    1: { completed: false, bestScore: 0, sages: 0, seeds: 0, animals: 0, scrolls: 0 }
  },
  totalScore: 0,
  sound: true
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class SaveManagerClass {
  constructor() {
    this.data = this.load();
  }

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return deepClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      // Merge so new fields in DEFAULT_SAVE survive across versions.
      return this._merge(deepClone(DEFAULT_SAVE), parsed);
    } catch (e) {
      console.warn('[SaveManager] load failed, using defaults', e);
      return deepClone(DEFAULT_SAVE);
    }
  }

  _merge(base, over) {
    for (const k in over) {
      if (
        over[k] &&
        typeof over[k] === 'object' &&
        !Array.isArray(over[k]) &&
        base[k]
      ) {
        this._merge(base[k], over[k]);
      } else {
        base[k] = over[k];
      }
    }
    return base;
  }

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn('[SaveManager] save failed', e);
    }
  }

  // --- Abilities ---
  unlockAbility(key) {
    if (key in this.data.abilities) {
      this.data.abilities[key] = true;
      this.save();
    }
  }

  hasAbility(key) {
    return !!this.data.abilities[key];
  }

  // --- Chapter results ---
  recordChapter(chapter, result) {
    const c = this.data.chapters[chapter] || {
      completed: false,
      bestScore: 0,
      sages: 0,
      seeds: 0,
      animals: 0,
      scrolls: 0
    };
    c.completed = true;
    c.bestScore = Math.max(c.bestScore, result.score || 0);
    c.sages = Math.max(c.sages, result.sages || 0);
    c.seeds = Math.max(c.seeds, result.seeds || 0);
    c.animals = Math.max(c.animals, result.animals || 0);
    c.scrolls = Math.max(c.scrolls, result.scrolls || 0);
    this.data.chapters[chapter] = c;
    this.data.totalScore = Math.max(this.data.totalScore, result.score || 0);
    if (this.data.chapter < chapter + 1) this.data.chapter = chapter + 1;
    this.save();
  }

  // --- Sound preference ---
  get soundOn() {
    return this.data.sound !== false;
  }
  set soundOn(v) {
    this.data.sound = !!v;
    this.save();
  }

  resetAll() {
    this.data = deepClone(DEFAULT_SAVE);
    this.save();
  }
}

// Singleton — one save shared by every scene/chapter.
const SaveManager = new SaveManagerClass();
export default SaveManager;
