import type { Question } from './types';

/**
 * Grade a learner's response, returning correctness in [0, 1].
 *
 * Word-order awards partial credit (fraction of tiles in the right place) so a
 * nearly-right sentence still powers a partial attack — this feeds smoothly
 * into the Elo `effectiveScore`.
 */
export function gradeResponse(question: Question, response: unknown): number {
  switch (question.type) {
    case 'multiple-choice':
      return response === question.answerIndex ? 1 : 0;

    case 'spelling':
      return normalize(String(response ?? '')) === normalize(question.answer)
        ? 1
        : 0;

    case 'word-order': {
      const given = Array.isArray(response) ? (response as string[]) : [];
      const answer = question.answer;
      if (given.length !== answer.length) return 0;
      let matches = 0;
      for (let i = 0; i < answer.length; i++) {
        if (normalize(given[i]) === normalize(answer[i])) matches++;
      }
      return answer.length === 0 ? 0 : matches / answer.length;
    }
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
