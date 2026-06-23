import { describe, it, expect } from 'vitest';
import {
  DRAW_TUTORIALS,
  TOOL_INFO,
  tutorialFor,
  type DrawPrimitive,
  type DrawTool,
} from './draw-tutorials';
import { PETS } from './pets';
import { ELEMENT_ORDER } from './elements';
import { color } from '../ui/theme';

const TOOLS: DrawTool[] = ['ellipse', 'rectangle', 'line', 'draw', 'fill'];

function colors(p: DrawPrimitive): string[] {
  return [p.fill, p.stroke].filter((c): c is string => typeof c === 'string');
}

describe('draw tutorials', () => {
  it('has exactly six tutorials, one per element in order, with unique starter ids', () => {
    expect(DRAW_TUTORIALS).toHaveLength(6);
    expect(DRAW_TUTORIALS.map((t) => t.element)).toEqual(ELEMENT_ORDER);

    const petIds = DRAW_TUTORIALS.map((t) => t.petId);
    expect(new Set(petIds).size).toBe(petIds.length);

    for (const t of DRAW_TUTORIALS) {
      const species = PETS[t.petId];
      expect(species).toBeDefined();
      expect(species.element).toBe(t.element);
      expect(t.title).toMatch(/\S/);
    }
  });

  it('gives each tutorial enough well-formed steps', () => {
    for (const t of DRAW_TUTORIALS) {
      expect(t.steps.length).toBeGreaterThanOrEqual(5);
      for (const step of t.steps) {
        expect(step.say.trim().length).toBeGreaterThan(0);
        expect(step.shapes.length).toBeGreaterThanOrEqual(1);
        expect(TOOLS).toContain(step.tool);
      }
    }
  });

  it('uses only colours that resolve to a real CSS colour', () => {
    for (const t of DRAW_TUTORIALS) {
      for (const step of t.steps) {
        for (const shape of step.shapes) {
          for (const c of colors(shape)) {
            const resolved = color(c);
            expect(resolved === 'none' || /^#[0-9a-fA-F]{3,8}$/.test(resolved)).toBe(true);
          }
        }
      }
    }
  });

  it('describes every tool it uses', () => {
    for (const t of DRAW_TUTORIALS) {
      for (const step of t.steps) {
        expect(TOOL_INFO[step.tool]).toBeDefined();
        expect(TOOL_INFO[step.tool].name).toMatch(/\S/);
      }
    }
  });

  it('looks tutorials up by pet id', () => {
    expect(tutorialFor('luminex')).toBe(DRAW_TUTORIALS[0]);
    expect(tutorialFor('wispurr')?.title).toBe('Draw Wispurr');
    expect(tutorialFor('nope')).toBeUndefined();
  });
});
