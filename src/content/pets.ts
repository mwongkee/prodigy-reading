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

/** A collectible pet species with a three-stage evolution line. */
export interface PetSpecies {
  id: string;
  /** Names for evolution stages 0, 1, 2. */
  stageNames: [string, string, string];
  element: string;
  shape: PetShape;
  /** Main fur/body color (token or hex). */
  bodyColor: string;
  /** Secondary/shading color (token or hex). */
  accentColor: string;
  moves: Move[];
}

/**
 * Luminex — a frost wolf who fights with bite and blizzard, and can mend itself.
 * Evolves: Luminex -> Luminite -> Luminaut.
 */
export const LUMINEX: PetSpecies = {
  id: 'luminex',
  stageNames: ['Luminex', 'Luminite', 'Luminaut'],
  element: 'frost',
  shape: 'wolf',
  bodyColor: '#f3f6fd', // icy white
  accentColor: '#a9b3c6', // wolf grey
  moves: [
    { id: 'crunch', name: 'Crunch', kind: 'attack', power: 1, emoji: '🦷' },
    { id: 'heal', name: 'Heal', kind: 'heal', power: 2, emoji: '💚' },
    { id: 'refrigerate', name: 'Refrigerate', kind: 'attack', power: 1, emoji: '❄️' },
    { id: 'ice-storm', name: 'Ice Storm', kind: 'attack', power: 2, emoji: '🌨️' },
  ],
};

export const PETS: Record<string, PetSpecies> = {
  luminex: LUMINEX,
};

export const STARTER_PET = 'luminex';

/** The pet's display name at a given evolution stage. */
export function stageName(species: PetSpecies, stage: number): string {
  const i = Math.max(0, Math.min(stage, species.stageNames.length - 1));
  return species.stageNames[i];
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
