import { describe, it, expect } from 'vitest';
import { QUESTION_BANK } from './bank';
import { gradeResponse } from './grade';
import { STRANDS } from './strands';
import { GRADE_BANDS, type Grade } from './types';
import { STRAND_IDS } from '../engine/adaptive/types';

const GRADES: Grade[] = [1, 2, 3];

describe('QUESTION_BANK integrity', () => {
  it('has unique ids', () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('references a known strand and a sane difficulty for every item', () => {
    for (const q of QUESTION_BANK) {
      expect(STRANDS[q.strand]).toBeDefined();
      expect(q.difficulty).toBeGreaterThan(500);
      expect(q.difficulty).toBeLessThan(1600);
      expect(q.prompt.length).toBeGreaterThan(0);
    }
  });

  it('tags every item with a valid grade (1-3) inside that grade\'s band', () => {
    for (const q of QUESTION_BANK) {
      expect(GRADES).toContain(q.grade);
      const [lo, hi] = GRADE_BANDS[q.grade];
      expect(q.difficulty).toBeGreaterThanOrEqual(lo);
      expect(q.difficulty).toBeLessThanOrEqual(hi);
    }
  });

  it('has well-formed multiple-choice answers', () => {
    for (const q of QUESTION_BANK) {
      if (q.type === 'multiple-choice') {
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
        expect(q.answerIndex).toBeGreaterThanOrEqual(0);
        expect(q.answerIndex).toBeLessThan(q.choices.length);
      }
    }
  });

  it('covers all six strands', () => {
    const covered = new Set(QUESTION_BANK.map((q) => q.strand));
    expect(covered.size).toBe(Object.keys(STRANDS).length);
  });

  it('has a healthy number of items in every strand × grade bucket', () => {
    for (const strand of STRAND_IDS) {
      for (const grade of GRADES) {
        const count = QUESTION_BANK.filter(
          (q) => q.strand === strand && q.grade === grade,
        ).length;
        expect(
          count,
          `expected several items for ${strand} grade ${grade}, found ${count}`,
        ).toBeGreaterThanOrEqual(8);
      }
    }
  });
});

describe('gradeResponse', () => {
  it('grades multiple-choice correctly', () => {
    const q = QUESTION_BANK.find((x) => x.type === 'multiple-choice')!;
    expect(gradeResponse(q, (q as any).answerIndex)).toBe(1);
    expect(gradeResponse(q, 99)).toBe(0);
  });

  it('grades spelling case/space-insensitively', () => {
    const q = QUESTION_BANK.find((x) => x.type === 'spelling')!;
    const ans = (q as any).answer as string;
    expect(gradeResponse(q, `  ${ans.toUpperCase()} `)).toBe(1);
    expect(gradeResponse(q, 'definitely-wrong')).toBe(0);
  });

  it('awards partial credit for word-order', () => {
    const q = QUESTION_BANK.find((x) => x.type === 'word-order')!;
    const answer = (q as any).answer as string[];
    expect(gradeResponse(q, answer)).toBe(1);
    // swap first two tiles -> most still correct, but not full
    const nearly = [answer[1], answer[0], ...answer.slice(2)];
    const score = gradeResponse(q, nearly);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });
});
