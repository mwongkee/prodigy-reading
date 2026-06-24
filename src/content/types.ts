import type { Rating, StrandId } from '../engine/adaptive/types';

/** Question formats supported by the MVP slice. More can be added later. */
export type QuestionType = 'multiple-choice' | 'spelling' | 'word-order';

/** Target school grade for a question. Used for authoring/reporting; the
 * adaptive engine still selects purely on Elo difficulty. */
export type Grade = 1 | 2 | 3;

/** Elo difficulty band each grade is authored into. Also handy for seeding a
 * brand-new learner near their grade instead of the global midpoint. */
export const GRADE_BANDS: Record<Grade, [number, number]> = {
  1: [700, 950],
  2: [960, 1200],
  3: [1220, 1480],
};

interface BaseQuestion {
  id: string;
  strand: StrandId;
  /** Target grade (1-3). */
  grade: Grade;
  /** Knowledge component id from docs/skill-catalog.md (for reporting). */
  kc: string;
  /** Elo difficulty. Drives adaptive selection. */
  difficulty: Rating;
  /** The instruction/clue shown to the child. */
  prompt: string;
  /** Optional kid-friendly hint. */
  hint?: string;
}

/** Pick the one right option. */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple-choice';
  choices: string[];
  answerIndex: number;
}

/** Type the correctly spelled word. */
export interface SpellingQuestion extends BaseQuestion {
  type: 'spelling';
  answer: string;
}

/** Drag word tiles into the correct sentence order. */
export interface WordOrderQuestion extends BaseQuestion {
  type: 'word-order';
  /** The correct sentence as ordered tokens. */
  answer: string[];
}

export type Question =
  | MultipleChoiceQuestion
  | SpellingQuestion
  | WordOrderQuestion;
