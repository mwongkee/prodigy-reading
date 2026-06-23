import type { StrandId } from '../engine/adaptive/types';

/** Player-facing presentation for each strand. Mirrors docs/skill-catalog.md. */
export interface StrandMeta {
  id: StrandId;
  region: string;
  blurb: string;
  /** Theme color token from src/ui/theme.ts. */
  color: string;
  emoji: string;
}

export const STRANDS: Record<StrandId, StrandMeta> = {
  phonics: {
    id: 'phonics', region: 'Phono Shores', color: 'sky', emoji: '🐚',
    blurb: 'Letter sounds, decoding, and sight words.',
  },
  vocabulary: {
    id: 'vocabulary', region: 'Vocab Vale', color: 'sun', emoji: '🍂',
    blurb: 'What words mean — synonyms, antonyms, and clues.',
  },
  spelling: {
    id: 'spelling', region: 'Spellhaven', color: 'grape', emoji: '✨',
    blurb: 'Spelling words correctly.',
  },
  grammar: {
    id: 'grammar', region: 'Grammar Grove', color: 'leaf', emoji: '🌳',
    blurb: 'Sentence mechanics and parts of speech.',
  },
  comprehension: {
    id: 'comprehension', region: 'Story Sea', color: 'sea', emoji: '🌊',
    blurb: 'Understanding what you read.',
  },
  writing: {
    id: 'writing', region: 'Quill Keep', color: 'coral', emoji: '🪶',
    blurb: 'Building sentences and short paragraphs.',
  },
};
