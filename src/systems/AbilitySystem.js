// AbilitySystem — the "learn one ability, carry it forward" spine of the campaign.
// Chapter 1 teaches SWIMMING (free movement + Surge dash). Later chapters add
// Defense, Strength, Fury, etc. and query this system to gate their mechanics.
//
// Each ability declares an id, a display name, an emoji, and the chapter that
// grants it. Kept as data so the ending screen + future chapters render from it.

import SaveManager from './SaveManager.js';

export const ABILITY_DEFS = [
  { id: 'swimming',      name: 'Swimming',        emoji: '🐟', chapter: 1,  desc: 'Move freely through water and Surge-dash through danger.' },
  { id: 'defense',       name: 'Defense',         emoji: '🐢', chapter: 2,  desc: 'Raise a shell shield to endure any blow.' },
  { id: 'strength',      name: 'Strength',        emoji: '🐗', chapter: 3,  desc: 'Charge and lift the world itself.' },
  { id: 'fury',          name: 'Fury',            emoji: '🦁', chapter: 4,  desc: 'Unleash rending claws in close combat.' },
  { id: 'strategy',      name: 'Strategy',        emoji: '👣', chapter: 5,  desc: 'Bend the battlefield with clever steps.' },
  { id: 'weaponMastery', name: 'Weapon Mastery',  emoji: '🪓', chapter: 6,  desc: 'Wield the sacred axe with perfect form.' },
  { id: 'precision',     name: 'Precision',       emoji: '🏹', chapter: 7,  desc: 'Loose a flawless arrow at any foe.' },
  { id: 'tactics',       name: 'Tactical Mind',   emoji: '🪈', chapter: 8,  desc: 'Guide the war through wisdom and choice.' },
  { id: 'compassion',    name: 'Compassion',      emoji: '🧘', chapter: 9,  desc: 'End conflict without violence.' }
];

class AbilitySystemClass {
  isUnlocked(id) {
    return SaveManager.hasAbility(id);
  }

  unlock(id) {
    SaveManager.unlockAbility(id);
  }

  def(id) {
    return ABILITY_DEFS.find((a) => a.id === id) || null;
  }

  unlockedList() {
    return ABILITY_DEFS.filter((a) => this.isUnlocked(a.id));
  }
}

const AbilitySystem = new AbilitySystemClass();
export default AbilitySystem;
