import { QUESTION_BANK } from './bank';
import { WARMUP_LADDER } from '../engine/adaptive/placement';
import type { Question } from './types';
import type { StrandId } from '../engine/adaptive/types';

/**
 * Build the placement warm-up: one question per difficulty rung in WARMUP_LADDER,
 * choosing the nearest-difficulty item and spreading across strands so the
 * warm-up feels varied (strands are never labeled to the child). Hints are
 * stripped so the calibration signal stays clean.
 */
export function buildWarmup(): Question[] {
  const usedIds = new Set<string>();
  const usedStrands = new Set<StrandId>();
  const out: Question[] = [];

  for (const rung of WARMUP_LADDER) {
    const pick = [...QUESTION_BANK]
      .filter((q) => !usedIds.has(q.id))
      .sort((a, b) => {
        const da = Math.abs(a.difficulty - rung);
        const db = Math.abs(b.difficulty - rung);
        if (da !== db) return da - db;
        // Tie-break: prefer a strand we haven't shown yet, for variety.
        const aNew = usedStrands.has(a.strand) ? 1 : 0;
        const bNew = usedStrands.has(b.strand) ? 1 : 0;
        return aNew - bNew;
      })[0];

    if (pick) {
      usedIds.add(pick.id);
      usedStrands.add(pick.strand);
      const { hint: _hint, ...rest } = pick;
      out.push(rest);
    }
  }

  return out;
}
