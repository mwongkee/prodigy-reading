import type { Rating, StrandId } from '../engine/adaptive/types';

/** Question formats supported by the MVP slice. More can be added later. */
export type QuestionType = 'multiple-choice' | 'spelling' | 'word-order';

interface BaseQuestion {
  id: string;
  strand: StrandId;
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
