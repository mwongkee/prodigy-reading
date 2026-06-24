import { mulberry32, hashString } from '../engine/rng';
import { ELEMENT_ORDER, type ElementId } from './elements';
import type { Move, PetSpecies } from './pets';

/**
 * A PetGenome is the full parametric description of a kid-created creature: a
 * handful of discrete "style" choices plus continuous 0..1 knobs plus colours.
 * The renderer (assets/pets/Creature.tsx) turns it into a polished SVG, so
 * infinite on-style creatures come from numbers — no AI, no per-variant art.
 */
export interface PetGenome {
  // discrete styles — each maps to a drawn variant in the rig
  bodyShape: BodyShape;
  earStyle: EarStyle;
  eyeStyle: EyeStyle;
  mouthStyle: MouthStyle;
  tailStyle: TailStyle;
  pattern: Pattern;
  // continuous params, normalised 0..1 (the renderer maps them to safe coords)
  bodyW: number;
  bodyH: number;
  earSize: number;
  earAngle: number;
  eyeSize: number;
  eyeSpacing: number;
  legLength: number;
  hornCount: number;
  spikeAmount: number;
  patternDensity: number;
  // colours (hex) + game theming
  bodyColor: string;
  accentColor: string;
  element: ElementId;
}

export type BodyShape = 'round' | 'egg' | 'bean';
export type EarStyle = 'pointy' | 'round' | 'floppy' | 'none';
export type EyeStyle = 'round' | 'big' | 'sleepy' | 'sparkle';
export type MouthStyle = 'smile' | 'fang' | 'cat';
export type TailStyle = 'curl' | 'puff' | 'spike' | 'none';
export type Pattern = 'none' | 'belly' | 'spots' | 'stripes';

export const BODY_SHAPES: BodyShape[] = ['round', 'egg', 'bean'];
export const EAR_STYLES: EarStyle[] = ['pointy', 'round', 'floppy', 'none'];
export const EYE_STYLES: EyeStyle[] = ['round', 'big', 'sleepy', 'sparkle'];
export const MOUTH_STYLES: MouthStyle[] = ['smile', 'fang', 'cat'];
export const TAIL_STYLES: TailStyle[] = ['curl', 'puff', 'spike', 'none'];
export const PATTERNS: Pattern[] = ['none', 'belly', 'spots', 'stripes'];

/** The continuous knobs, for generic UI (sliders) and clamping. */
export const GENOME_SLIDERS = [
  'bodyW',
  'bodyH',
  'earSize',
  'earAngle',
  'eyeSize',
  'eyeSpacing',
  'legLength',
  'hornCount',
  'spikeAmount',
  'patternDensity',
] as const;
export type GenomeSlider = (typeof GENOME_SLIDERS)[number];

/** Per-element default body/accent palette (mirrors the static roster's hues). */
export const ELEMENT_PALETTE: Record<ElementId, { body: string; accent: string }> = {
  frost: { body: '#7cc6fe', accent: '#e9f6ff' },
  flame: { body: '#ff8a7a', accent: '#ffd166' },
  tide: { body: '#5fbfb0', accent: '#7cc6fe' },
  leaf: { body: '#7bd389', accent: '#ffd166' },
  storm: { body: '#ffd166', accent: '#b59be8' },
  dusk: { body: '#b59be8', accent: '#efe7ff' },
};

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);
const pick = <T>(arr: readonly T[], r: number): T => arr[Math.min(arr.length - 1, Math.floor(r * arr.length))];

/** A pleasant, kid-friendly random hex via HSL (mid saturation, light-ish). */
function randomColor(rng: () => number): string {
  const h = Math.floor(rng() * 360);
  const s = 0.55 + rng() * 0.2; // 55–75%
  const l = 0.6 + rng() * 0.12; // 60–72%
  return hslToHex(h, s, l);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

const HEX = /^#[0-9a-f]{6}$/i;

/** A balanced, neutral genome for an element — the Workshop's starting point. */
export function defaultGenome(element: ElementId): PetGenome {
  const pal = ELEMENT_PALETTE[element] ?? ELEMENT_PALETTE.frost;
  return {
    bodyShape: 'round',
    earStyle: 'round',
    eyeStyle: 'round',
    mouthStyle: 'smile',
    tailStyle: 'curl',
    pattern: 'belly',
    bodyW: 0.5,
    bodyH: 0.5,
    earSize: 0.5,
    earAngle: 0.5,
    eyeSize: 0.5,
    eyeSpacing: 0.5,
    legLength: 0.5,
    hornCount: 0,
    spikeAmount: 0.2,
    patternDensity: 0.5,
    bodyColor: pal.body,
    accentColor: pal.accent,
    element,
  };
}

/** Force every field into a valid range/option (keeps creatures on-model). */
export function clampGenome(g: PetGenome): PetGenome {
  const element = ELEMENT_ORDER.includes(g.element) ? g.element : 'frost';
  const opt = <T>(arr: readonly T[], v: T): T => (arr.includes(v) ? v : arr[0]);
  const hex = (c: string, fallback: string): string => (HEX.test(c) ? c : fallback);
  const pal = ELEMENT_PALETTE[element];
  return {
    bodyShape: opt(BODY_SHAPES, g.bodyShape),
    earStyle: opt(EAR_STYLES, g.earStyle),
    eyeStyle: opt(EYE_STYLES, g.eyeStyle),
    mouthStyle: opt(MOUTH_STYLES, g.mouthStyle),
    tailStyle: opt(TAIL_STYLES, g.tailStyle),
    pattern: opt(PATTERNS, g.pattern),
    bodyW: clamp01(g.bodyW),
    bodyH: clamp01(g.bodyH),
    earSize: clamp01(g.earSize),
    earAngle: clamp01(g.earAngle),
    eyeSize: clamp01(g.eyeSize),
    eyeSpacing: clamp01(g.eyeSpacing),
    legLength: clamp01(g.legLength),
    hornCount: clamp01(g.hornCount),
    spikeAmount: clamp01(g.spikeAmount),
    patternDensity: clamp01(g.patternDensity),
    bodyColor: hex(g.bodyColor, pal.body),
    accentColor: hex(g.accentColor, pal.accent),
    element,
  };
}

/** A fully random, valid creature from a seeded RNG. */
export function randomGenome(rng: () => number): PetGenome {
  const element = pick(ELEMENT_ORDER, rng());
  return clampGenome({
    bodyShape: pick(BODY_SHAPES, rng()),
    earStyle: pick(EAR_STYLES, rng()),
    eyeStyle: pick(EYE_STYLES, rng()),
    mouthStyle: pick(MOUTH_STYLES, rng()),
    tailStyle: pick(TAIL_STYLES, rng()),
    pattern: pick(PATTERNS, rng()),
    bodyW: rng(),
    bodyH: rng(),
    earSize: rng(),
    earAngle: rng(),
    eyeSize: rng(),
    eyeSpacing: rng(),
    legLength: rng(),
    hornCount: rng(),
    spikeAmount: rng(),
    patternDensity: rng(),
    bodyColor: randomColor(rng),
    accentColor: randomColor(rng),
    element,
  });
}

/** Deterministic creature from a seed: a number, or a name ("Max" → stable pet). */
export function genomeFromSeed(seed: number | string): PetGenome {
  const n = typeof seed === 'number' ? seed : hashString(seed);
  return randomGenome(mulberry32(n));
}

/** Element-flavoured move names (display only); powers match the static roster. */
const MOVE_FLAVOR: Record<ElementId, { a1: [string, string]; a2: [string, string]; a3: [string, string]; heal: [string, string] }> = {
  frost: { a1: ['Frost Nip', '❄️'], a2: ['Snow Spray', '🌨️'], a3: ['Glacier Slam', '🏔️'], heal: ['Cozy Rest', '💙'] },
  flame: { a1: ['Ember Nip', '🔥'], a2: ['Spark Spray', '✨'], a3: ['Blaze Slam', '🌋'], heal: ['Warm Rest', '💛'] },
  tide: { a1: ['Bubble Nip', '🫧'], a2: ['Splash Spray', '💧'], a3: ['Tidal Slam', '🌊'], heal: ['Calm Rest', '💙'] },
  leaf: { a1: ['Leaf Nip', '🍃'], a2: ['Pollen Spray', '🌼'], a3: ['Bloom Slam', '🌸'], heal: ['Sun Rest', '🌿'] },
  storm: { a1: ['Spark Nip', '⚡'], a2: ['Volt Spray', '🌟'], a3: ['Thunder Slam', '🌩️'], heal: ['Charge Rest', '💚'] },
  dusk: { a1: ['Shadow Nip', '🌙'], a2: ['Star Spray', '✨'], a3: ['Night Slam', '🟣'], heal: ['Moon Rest', '💜'] },
};

/** A valid 4-move set (3 attacks + 1 heal) flavoured by element. */
export function defaultMovesFor(element: ElementId): Move[] {
  const f = MOVE_FLAVOR[element] ?? MOVE_FLAVOR.frost;
  return [
    { id: 'atk-1', name: f.a1[0], kind: 'attack', power: 1, emoji: f.a1[1] },
    { id: 'heal-1', name: f.heal[0], kind: 'heal', power: 2, emoji: f.heal[1] },
    { id: 'atk-2', name: f.a2[0], kind: 'attack', power: 1, emoji: f.a2[1] },
    { id: 'atk-3', name: f.a3[0], kind: 'attack', power: 2, emoji: f.a3[1] },
  ];
}

/**
 * Wrap a genome as a real PetSpecies so it plugs into battle/den/evolution with
 * no special-casing. Three stages share the genome (evolution is shown by the
 * renderer's `stage`). `unlockLevel` is 1 — creating *is* the unlock (no gacha).
 */
export function buildCustomSpecies(genome: PetGenome, name: string, id?: string): PetSpecies {
  const g = clampGenome(genome);
  const trimmed = name.trim() || 'My Pet';
  const speciesId = id ?? `custom-${hashString(trimmed + JSON.stringify(g))}`;
  const art = { kind: 'genome', genome: g } as const;
  return {
    id: speciesId,
    element: g.element,
    bodyColor: g.bodyColor,
    accentColor: g.accentColor,
    unlockLevel: 1,
    moves: defaultMovesFor(g.element),
    stages: [
      { name: trimmed, art },
      { name: trimmed, art },
      { name: trimmed, art },
    ],
    custom: true,
  };
}
