/** Elemental types. Plain descriptive labels (not creature names) so kids and
 * parents read them as categories, like "fire type". */
export type ElementId = 'frost' | 'flame' | 'tide' | 'leaf' | 'storm' | 'dusk';

export interface ElementMeta {
  id: ElementId;
  name: string;
  /** Theme color token from src/ui/theme.ts. */
  color: string;
  emoji: string;
}

export const ELEMENTS: Record<ElementId, ElementMeta> = {
  frost: { id: 'frost', name: 'Frost', color: 'sky', emoji: '❄️' },
  flame: { id: 'flame', name: 'Flame', color: 'coral', emoji: '🔥' },
  tide: { id: 'tide', name: 'Tide', color: 'sea', emoji: '💧' },
  leaf: { id: 'leaf', name: 'Leaf', color: 'leaf', emoji: '🍃' },
  storm: { id: 'storm', name: 'Storm', color: 'sun', emoji: '⚡' },
  dusk: { id: 'dusk', name: 'Dusk', color: 'grape', emoji: '🌙' },
};

export const ELEMENT_ORDER: ElementId[] = ['frost', 'flame', 'tide', 'leaf', 'storm', 'dusk'];
