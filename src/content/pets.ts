import type { ElementId } from './elements';

/** A pet's move. Attacks damage the foe; heals restore the pet's HP. */
export interface Move {
  id: string;
  name: string;
  kind: 'attack' | 'heal';
  /** Damage dealt (attack) or HP restored (heal). */
  power: number;
  emoji: string;
}

export type PetShape = 'wolf' | 'blob';

/** How a form is drawn: a hand-built SVG, or a (generated) raster sprite. */
export type Art =
  | { kind: 'svg'; shape: PetShape }
  | { kind: 'image'; src: string };

/** One evolution stage of a species. */
export interface PetForm {
  name: string;
  art: Art;
}

/** A collectible species: an evolution line plus its moves and theming. */
export interface PetSpecies {
  id: string;
  element: ElementId;
  /** Body/placeholder tint (token or hex). */
  bodyColor: string;
  /** Secondary/shading tint (token or hex). */
  accentColor: string;
  /** Player level at which this species can be used (earn-only; no purchase). */
  unlockLevel: number;
  moves: Move[];
  /** Evolution stages, easiest first. */
  stages: PetForm[];
}

const img = (src: string): Art => ({ kind: 'image', src });

/**
 * Luminex — a frost wolf (Crunch / Heal / Refrigerate / Ice Storm) who evolves
 * Luminex -> Luminite -> Luminaut. Hand-built SVG (the flagship/fallback art).
 */
export const LUMINEX: PetSpecies = {
  id: 'luminex',
  element: 'frost',
  bodyColor: '#f3f6fd',
  accentColor: '#a9b3c6',
  unlockLevel: 1,
  moves: [
    { id: 'crunch', name: 'Crunch', kind: 'attack', power: 1, emoji: '🦷' },
    { id: 'heal', name: 'Heal', kind: 'heal', power: 2, emoji: '💚' },
    { id: 'refrigerate', name: 'Refrigerate', kind: 'attack', power: 1, emoji: '❄️' },
    { id: 'ice-storm', name: 'Ice Storm', kind: 'attack', power: 2, emoji: '🌨️' },
  ],
  stages: [
    { name: 'Luminex', art: { kind: 'svg', shape: 'wolf' } },
    { name: 'Luminite', art: { kind: 'svg', shape: 'wolf' } },
    { name: 'Luminaut', art: { kind: 'svg', shape: 'wolf' } },
  ],
};

/**
 * Image-based species. Original coinages — no names borrowed from other games.
 * Art is generated on free-tier tools per docs/pet-prompts.md and dropped into
 * src/assets/pets/generated/<id>.png; until then a placeholder renders.
 */
const FLAME: PetSpecies = {
  id: 'flickit',
  element: 'flame',
  bodyColor: '#ff8a7a',
  accentColor: '#ffd166',
  unlockLevel: 2,
  moves: [
    { id: 'cinder-nip', name: 'Cinder Nip', kind: 'attack', power: 1, emoji: '🔥' },
    { id: 'warm-glow', name: 'Warm Glow', kind: 'heal', power: 2, emoji: '💛' },
    { id: 'flare-burst', name: 'Flare Burst', kind: 'attack', power: 1, emoji: '✨' },
    { id: 'blaze-rush', name: 'Blaze Rush', kind: 'attack', power: 2, emoji: '🌋' },
  ],
  stages: [
    { name: 'Flickit', art: img('flickit.png') },
    { name: 'Scorchel', art: img('scorchel.png') },
    { name: 'Vulcane', art: img('vulcane.png') },
  ],
};

const TIDE: PetSpecies = {
  id: 'dribblet',
  element: 'tide',
  bodyColor: '#5fbfb0',
  accentColor: '#7cc6fe',
  unlockLevel: 3,
  moves: [
    { id: 'bubble-pop', name: 'Bubble Pop', kind: 'attack', power: 1, emoji: '🫧' },
    { id: 'tide-rest', name: 'Tide Rest', kind: 'heal', power: 2, emoji: '💚' },
    { id: 'wave-slap', name: 'Wave Slap', kind: 'attack', power: 1, emoji: '💧' },
    { id: 'tidal-slam', name: 'Tidal Slam', kind: 'attack', power: 2, emoji: '🌊' },
  ],
  stages: [
    { name: 'Dribblet', art: img('dribblet.png') },
    { name: 'Wavurchin', art: img('wavurchin.png') },
    { name: 'Tidalux', art: img('tidalux.png') },
  ],
};

const LEAF: PetSpecies = {
  id: 'sproutkin',
  element: 'leaf',
  bodyColor: '#7bd389',
  accentColor: '#ffd166',
  unlockLevel: 4,
  moves: [
    { id: 'leaf-snip', name: 'Leaf Snip', kind: 'attack', power: 1, emoji: '🍃' },
    { id: 'sun-soak', name: 'Sun Soak', kind: 'heal', power: 2, emoji: '🌿' },
    { id: 'bramble-lash', name: 'Bramble Lash', kind: 'attack', power: 1, emoji: '🌱' },
    { id: 'petal-storm', name: 'Petal Storm', kind: 'attack', power: 2, emoji: '🌸' },
  ],
  stages: [
    { name: 'Sproutkin', art: img('sproutkin.png') },
    { name: 'Fernox', art: img('fernox.png') },
    { name: 'Bloomara', art: img('bloomara.png') },
  ],
};

const STORM: PetSpecies = {
  id: 'zaplet',
  element: 'storm',
  bodyColor: '#ffd166',
  accentColor: '#b59be8',
  unlockLevel: 5,
  moves: [
    { id: 'spark-nip', name: 'Spark Nip', kind: 'attack', power: 1, emoji: '⚡' },
    { id: 'recharge', name: 'Recharge', kind: 'heal', power: 2, emoji: '💚' },
    { id: 'zap-dash', name: 'Zap Dash', kind: 'attack', power: 1, emoji: '✨' },
    { id: 'thunderclap', name: 'Thunderclap', kind: 'attack', power: 2, emoji: '🌩️' },
  ],
  stages: [
    { name: 'Zaplet', art: img('zaplet.png') },
    { name: 'Voltessa', art: img('voltessa.png') },
  ],
};

const DUSK: PetSpecies = {
  id: 'wispurr',
  element: 'dusk',
  bodyColor: '#b59be8',
  accentColor: '#2b2440',
  unlockLevel: 6,
  moves: [
    { id: 'dusk-pounce', name: 'Dusk Pounce', kind: 'attack', power: 1, emoji: '🌙' },
    { id: 'moon-rest', name: 'Moon Rest', kind: 'heal', power: 2, emoji: '💜' },
    { id: 'night-veil', name: 'Night Veil', kind: 'attack', power: 1, emoji: '✨' },
    { id: 'umbra-burst', name: 'Umbra Burst', kind: 'attack', power: 2, emoji: '🟣' },
  ],
  stages: [
    { name: 'Wispurr', art: img('wispurr.png') },
    { name: 'Umbrisk', art: img('umbrisk.png') },
  ],
};

/** Roster: 6 species / 16 forms total (3+3+3+3+2+2). */
export const PETS: Record<string, PetSpecies> = {
  luminex: LUMINEX,
  flickit: FLAME,
  dribblet: TIDE,
  sproutkin: LEAF,
  zaplet: STORM,
  wispurr: DUSK,
};

export const SPECIES_LIST: PetSpecies[] = Object.values(PETS);

export const STARTER_PET = 'luminex';

/** Total number of pet forms across all species (for tests / display). */
export const TOTAL_FORMS = SPECIES_LIST.reduce((n, s) => n + s.stages.length, 0);

function clampStage(species: PetSpecies, stage: number): number {
  return Math.max(0, Math.min(stage, species.stages.length - 1));
}

/** The form (name + art) for a species at a given evolution stage. */
export function formAt(species: PetSpecies, stage: number): PetForm {
  return species.stages[clampStage(species, stage)];
}

/** The pet's display name at a given evolution stage. */
export function stageName(species: PetSpecies, stage: number): string {
  return formAt(species, stage).name;
}

/** Choose a move for a correct answer: heal when hurt, otherwise attack. */
export function chooseMove(species: PetSpecies, petIsHurt: boolean, rng = Math.random): Move {
  const heals = species.moves.filter((m) => m.kind === 'heal');
  const attacks = species.moves.filter((m) => m.kind === 'attack');
  if (petIsHurt && heals.length > 0 && rng() < 0.45) {
    return heals[Math.floor(rng() * heals.length)];
  }
  return attacks[Math.floor(rng() * attacks.length)];
}
