import type { ElementId } from './elements';

/**
 * Draw-Along: kid-friendly, click-by-click tutorials for drawing the six starter
 * pets in **Excalidraw** (https://excalidraw.com — free, no login, shape-based).
 *
 * One data model drives two outputs:
 *  - the in-app screen (src/ui/DrawAlong.tsx) renders the `shapes` cumulatively so
 *    the pet builds up step by step, and
 *  - docs/draw-along.md mirrors the same steps as written instructions.
 *
 * Following the numbered steps is also reading practice (sequencing +
 * instruction-following), which keeps this on-theme for ReadQuest.
 *
 * Each step names the Excalidraw `tool` to use and the SVG primitives it adds.
 * Primitives live on a 0..100 viewBox; colours are theme tokens, hex, or 'none'.
 */

/** The Excalidraw tool a step uses. 'fill' = set a Background colour (no tool). */
export type DrawTool = 'ellipse' | 'rectangle' | 'line' | 'draw' | 'fill';

/** Toolbar hint for a tool: how it shows up in Excalidraw. */
export interface ToolInfo {
  name: string;
  /** Excalidraw keyboard shortcut, '' when the action is a panel, not a tool. */
  key: string;
  emoji: string;
}

export const TOOL_INFO: Record<DrawTool, ToolInfo> = {
  ellipse: { name: 'Ellipse', key: 'O', emoji: '⭕' },
  rectangle: { name: 'Rectangle', key: 'R', emoji: '▭' },
  line: { name: 'Line', key: 'L', emoji: '📐' },
  draw: { name: 'Draw', key: 'P', emoji: '✏️' },
  fill: { name: 'Colour', key: '', emoji: '🎨' },
};

/** A drawing primitive on a 0..100 viewBox. */
export type DrawPrimitive =
  | { s: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: string; stroke?: string }
  | { s: 'rect'; x: number; y: number; w: number; h: number; r?: number; fill?: string; stroke?: string }
  | { s: 'poly'; points: [number, number][]; closed?: boolean; fill?: string; stroke?: string };

export interface DrawStep {
  tool: DrawTool;
  /** Early-reader, click-by-click instruction. */
  say: string;
  /** Optional gentle tip / encouragement. */
  tip?: string;
  /** Primitives added at this step (drawn on top of the previous steps). */
  shapes: DrawPrimitive[];
}

export interface DrawTutorial {
  /** Starter species id (stage-0) in PETS. */
  petId: string;
  title: string;
  element: ElementId;
  steps: DrawStep[];
}

// Shared little helpers so every pet's eyes/mouth feel consistent.
const eyes = (lx: number, rx: number, y: number): DrawPrimitive[] => [
  { s: 'ellipse', cx: lx, cy: y, rx: 4, ry: 5, fill: 'ink' },
  { s: 'ellipse', cx: rx, cy: y, rx: 4, ry: 5, fill: 'ink' },
  { s: 'ellipse', cx: lx - 1, cy: y - 1.6, rx: 1.2, ry: 1.4, fill: '#ffffff', stroke: 'none' },
  { s: 'ellipse', cx: rx - 1, cy: y - 1.6, rx: 1.2, ry: 1.4, fill: '#ffffff', stroke: 'none' },
];
const smile = (y: number): DrawPrimitive => ({
  s: 'poly',
  points: [
    [45, y],
    [50, y + 4],
    [55, y],
  ],
  closed: false,
  stroke: 'ink',
});

/** ❄️ Luminex — a light frost wolf cub. */
const LUMINEX_DRAW: DrawTutorial = {
  petId: 'luminex',
  title: 'Draw Luminex',
  element: 'frost',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for the Ellipse tool. In the left panel pick a light-blue Background. Drag a big round head in the middle.',
      tip: 'Hold Shift while you drag to make a neat circle.',
      shapes: [{ s: 'ellipse', cx: 50, cy: 40, rx: 22, ry: 20, fill: '#f3f6fd' }],
    },
    {
      tool: 'line',
      say: 'Press L for the Line tool. Make a pointy ear: click three corners, then click the first dot again to close it. Do it twice for two ears.',
      tip: 'Excalidraw has no triangle tool — three lines make one!',
      shapes: [
        { s: 'poly', points: [[32, 24], [40, 8], [48, 22]], closed: true, fill: '#f3f6fd' },
        { s: 'poly', points: [[52, 22], [60, 8], [68, 24]], closed: true, fill: '#f3f6fd' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Back to Ellipse (O). Draw a smaller round body under the head, and a fluffy oval tail on the side.',
      shapes: [
        { s: 'ellipse', cx: 50, cy: 73, rx: 16, ry: 15, fill: '#f3f6fd' },
        { s: 'ellipse', cx: 74, cy: 74, rx: 7, ry: 6, fill: '#f3f6fd' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Make two big dark eyes with the Ellipse tool, then add a tiny white dot in each for a sparkle.',
      tip: 'Big shiny eyes make pets look friendly.',
      shapes: eyes(42, 58, 40),
    },
    {
      tool: 'ellipse',
      say: 'Add a grey oval snout in the middle, with a little dark nose on top.',
      shapes: [
        { s: 'ellipse', cx: 50, cy: 49, rx: 7, ry: 5, fill: '#a9b3c6' },
        { s: 'ellipse', cx: 50, cy: 46, rx: 2, ry: 1.6, fill: 'ink' },
      ],
    },
    {
      tool: 'fill',
      say: 'Finish with two frosty blue cheeks. Pick a sky-blue Background and draw two small circles. You drew Luminex!',
      shapes: [
        { s: 'ellipse', cx: 33, cy: 48, rx: 3, ry: 3, fill: 'sky', stroke: 'none' },
        { s: 'ellipse', cx: 67, cy: 48, rx: 3, ry: 3, fill: 'sky', stroke: 'none' },
      ],
    },
  ],
};

/** 🔥 Flickit — a fluffy ember fox cub. */
const FLICKIT_DRAW: DrawTutorial = {
  petId: 'flickit',
  title: 'Draw Flickit',
  element: 'flame',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for Ellipse and pick a warm orange Background. Drag a big round head in the middle.',
      shapes: [{ s: 'ellipse', cx: 50, cy: 42, rx: 21, ry: 19, fill: '#ff8a7a' }],
    },
    {
      tool: 'line',
      say: 'Press L for Line. Make two tall, pointy fox ears — click three corners and close each one.',
      tip: 'Fox ears are taller and skinnier than wolf ears.',
      shapes: [
        { s: 'poly', points: [[30, 28], [34, 6], [48, 24]], closed: true, fill: '#ff8a7a' },
        { s: 'poly', points: [[52, 24], [66, 6], [70, 28]], closed: true, fill: '#ff8a7a' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'With Ellipse, draw a round body below, then a smaller cream oval on top for the fluffy belly.',
      shapes: [
        { s: 'ellipse', cx: 50, cy: 73, rx: 15, ry: 14, fill: '#ff8a7a' },
        { s: 'ellipse', cx: 50, cy: 76, rx: 8, ry: 9, fill: '#ffe8d6' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Add two big sparkly eyes and a tiny dark nose.',
      shapes: [...eyes(42, 58, 42), { s: 'ellipse', cx: 50, cy: 50, rx: 2, ry: 1.6, fill: 'ink' }],
    },
    {
      tool: 'line',
      say: 'Press L again and draw a flame-shaped tail with the Line tool — zig up to a point and back down. Fill it sunny yellow.',
      tip: 'A flame is just a wobbly triangle going up.',
      shapes: [
        { s: 'poly', points: [[64, 80], [70, 64], [74, 72], [80, 60], [78, 80]], closed: true, fill: 'sun' },
      ],
    },
    {
      tool: 'fill',
      say: 'Add two rosy cheeks with small circles. You drew Flickit!',
      shapes: [
        { s: 'ellipse', cx: 34, cy: 50, rx: 3, ry: 2.5, fill: 'coral', stroke: 'none' },
        { s: 'ellipse', cx: 66, cy: 50, rx: 3, ry: 2.5, fill: 'coral', stroke: 'none' },
      ],
    },
  ],
};

/** 💧 Dribblet — a glossy water-droplet creature. */
const DRIBBLET_DRAW: DrawTutorial = {
  petId: 'dribblet',
  title: 'Draw Dribblet',
  element: 'tide',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for Ellipse and pick a teal Background. Drag one big round body in the middle.',
      shapes: [{ s: 'ellipse', cx: 50, cy: 52, rx: 24, ry: 25, fill: '#5fbfb0' }],
    },
    {
      tool: 'line',
      say: 'Press L for Line. Add a pointy water-drop tip on top — three clicks make a little triangle.',
      shapes: [{ s: 'poly', points: [[42, 28], [50, 6], [58, 28]], closed: true, fill: '#5fbfb0' }],
    },
    {
      tool: 'ellipse',
      say: 'With Ellipse, draw a small fin on each side in sky-blue.',
      shapes: [
        { s: 'ellipse', cx: 24, cy: 56, rx: 6, ry: 10, fill: 'sky' },
        { s: 'ellipse', cx: 76, cy: 56, rx: 6, ry: 10, fill: 'sky' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Add two big sparkly eyes, then a curved smile under them with the Line tool.',
      shapes: [...eyes(42, 58, 48), smile(58)],
    },
    {
      tool: 'ellipse',
      say: 'Make a shiny highlight: draw a small white oval near the top so the body looks glossy.',
      tip: 'A white shine makes it look wet and shiny.',
      shapes: [{ s: 'ellipse', cx: 40, cy: 38, rx: 4, ry: 6, fill: '#ffffff', stroke: 'none' }],
    },
    {
      tool: 'fill',
      say: 'Float a few little bubbles around Dribblet with small circles. You drew Dribblet!',
      shapes: [
        { s: 'ellipse', cx: 18, cy: 30, rx: 2, ry: 2, fill: 'sky', stroke: 'none' },
        { s: 'ellipse', cx: 84, cy: 34, rx: 2.5, ry: 2.5, fill: 'sky', stroke: 'none' },
        { s: 'ellipse', cx: 80, cy: 78, rx: 2, ry: 2, fill: 'sky', stroke: 'none' },
      ],
    },
  ],
};

/** 🍃 Sproutkin — a round seedling sprite. */
const SPROUTKIN_DRAW: DrawTutorial = {
  petId: 'sproutkin',
  title: 'Draw Sproutkin',
  element: 'leaf',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for Ellipse and pick a fresh green Background. Drag a big round body.',
      shapes: [{ s: 'ellipse', cx: 50, cy: 54, rx: 22, ry: 22, fill: '#7bd389' }],
    },
    {
      tool: 'ellipse',
      say: 'Draw a thin stem going up (use the Rectangle tool, R) and two leaf ovals at the top with Ellipse.',
      tip: 'Tilt the ovals a little so they look like real leaves.',
      shapes: [
        { s: 'rect', x: 49, y: 18, w: 2, h: 18, fill: 'leaf' },
        { s: 'ellipse', cx: 43, cy: 18, rx: 5, ry: 9, fill: 'leaf' },
        { s: 'ellipse', cx: 57, cy: 18, rx: 5, ry: 9, fill: 'leaf' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Add two big sparkly eyes in the middle of the body.',
      shapes: eyes(42, 58, 52),
    },
    {
      tool: 'line',
      say: 'Press L for Line and draw a happy curved smile under the eyes.',
      shapes: [smile(62)],
    },
    {
      tool: 'ellipse',
      say: 'Give Sproutkin two little feet at the bottom with small ovals.',
      shapes: [
        { s: 'ellipse', cx: 42, cy: 77, rx: 5, ry: 3, fill: 'leaf' },
        { s: 'ellipse', cx: 58, cy: 77, rx: 5, ry: 3, fill: 'leaf' },
      ],
    },
    {
      tool: 'fill',
      say: 'Finish with two rosy cheeks. You drew Sproutkin!',
      shapes: [
        { s: 'ellipse', cx: 34, cy: 58, rx: 3, ry: 2.5, fill: 'coral', stroke: 'none' },
        { s: 'ellipse', cx: 66, cy: 58, rx: 3, ry: 2.5, fill: 'coral', stroke: 'none' },
      ],
    },
  ],
};

/** ⚡ Zaplet — a fluffy spark cloud-kit. */
const ZAPLET_DRAW: DrawTutorial = {
  petId: 'zaplet',
  title: 'Draw Zaplet',
  element: 'storm',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for Ellipse and pick a bright yellow Background. Draw a wide fluffy body from three round ovals so it looks like a cloud.',
      shapes: [
        { s: 'ellipse', cx: 50, cy: 52, rx: 22, ry: 18, fill: '#ffd166' },
        { s: 'ellipse', cx: 32, cy: 52, rx: 10, ry: 9, fill: '#ffd166' },
        { s: 'ellipse', cx: 68, cy: 52, rx: 10, ry: 9, fill: '#ffd166' },
      ],
    },
    {
      tool: 'line',
      say: 'Press L for Line. Make two sharp, spiky ears on top — three clicks each.',
      shapes: [
        { s: 'poly', points: [[34, 36], [40, 16], [46, 36]], closed: true, fill: '#ffd166' },
        { s: 'poly', points: [[54, 36], [60, 16], [66, 36]], closed: true, fill: '#ffd166' },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Add two big sparkly eyes and a small smile.',
      shapes: [...eyes(42, 58, 50), smile(60)],
    },
    {
      tool: 'line',
      say: 'Draw a lightning-bolt tail with the Line tool — zig-zag down to a point. Fill it electric blue.',
      tip: 'A lightning bolt is a zig-zag: down, across, down, across.',
      shapes: [
        {
          s: 'poly',
          points: [[72, 44], [80, 44], [74, 56], [82, 56], [70, 76], [74, 60], [66, 60]],
          closed: true,
          fill: 'sky',
        },
      ],
    },
    {
      tool: 'fill',
      say: 'Add two blue lightning cheeks with small circles.',
      shapes: [
        { s: 'ellipse', cx: 32, cy: 56, rx: 3, ry: 3, fill: 'sky', stroke: 'none' },
        { s: 'ellipse', cx: 68, cy: 56, rx: 3, ry: 3, fill: 'sky', stroke: 'none' },
      ],
    },
    {
      tool: 'line',
      say: 'Sprinkle a tiny spark star nearby with a few short lines. You drew Zaplet!',
      shapes: [
        {
          s: 'poly',
          points: [[86, 24], [87, 29], [92, 30], [87, 31], [86, 36], [85, 31], [80, 30], [85, 29]],
          closed: true,
          fill: 'sun',
        },
      ],
    },
  ],
};

/** 🌙 Wispurr — a tiny shadow kitten-wisp. */
const WISPURR_DRAW: DrawTutorial = {
  petId: 'wispurr',
  title: 'Draw Wispurr',
  element: 'dusk',
  steps: [
    {
      tool: 'ellipse',
      say: 'Press O for Ellipse and pick a soft purple Background. Draw a round head near the top.',
      shapes: [{ s: 'ellipse', cx: 50, cy: 38, rx: 21, ry: 19, fill: '#b59be8' }],
    },
    {
      tool: 'line',
      say: 'Press L for Line and add two pointy cat ears with three clicks each.',
      shapes: [
        { s: 'poly', points: [[32, 24], [36, 6], [48, 22]], closed: true, fill: '#b59be8' },
        { s: 'poly', points: [[52, 22], [64, 6], [68, 24]], closed: true, fill: '#b59be8' },
      ],
    },
    {
      tool: 'draw',
      say: 'Press P for the Draw pencil. Under the head, draw a wavy, wispy smoke tail that curls down like an S.',
      tip: 'The Draw tool is free — just wiggle as you go.',
      shapes: [
        {
          s: 'poly',
          points: [[50, 56], [60, 66], [46, 74], [60, 82], [48, 90]],
          closed: false,
          stroke: '#b59be8',
        },
      ],
    },
    {
      tool: 'ellipse',
      say: 'Give Wispurr two big glowing eyes — draw them yellow, then add a white sparkle in each.',
      tip: 'Glowing eyes make it look magical in the dark.',
      shapes: [
        { s: 'ellipse', cx: 42, cy: 38, rx: 4.5, ry: 5.5, fill: 'sun' },
        { s: 'ellipse', cx: 58, cy: 38, rx: 4.5, ry: 5.5, fill: 'sun' },
        { s: 'ellipse', cx: 42, cy: 39, rx: 2, ry: 2.5, fill: 'ink' },
        { s: 'ellipse', cx: 58, cy: 39, rx: 2, ry: 2.5, fill: 'ink' },
        { s: 'ellipse', cx: 41, cy: 36.5, rx: 1, ry: 1.2, fill: '#ffffff', stroke: 'none' },
        { s: 'ellipse', cx: 57, cy: 36.5, rx: 1, ry: 1.2, fill: '#ffffff', stroke: 'none' },
      ],
    },
    {
      tool: 'line',
      say: 'Add a tiny smile below the eyes with the Line tool.',
      shapes: [smile(47)],
    },
    {
      tool: 'fill',
      say: 'Scatter a few starry speckles with tiny dots. You drew Wispurr!',
      shapes: [
        { s: 'ellipse', cx: 24, cy: 30, rx: 1.5, ry: 1.5, fill: 'sun', stroke: 'none' },
        { s: 'ellipse', cx: 76, cy: 32, rx: 1.5, ry: 1.5, fill: 'sun', stroke: 'none' },
        { s: 'ellipse', cx: 30, cy: 58, rx: 1.2, ry: 1.2, fill: 'sun', stroke: 'none' },
        { s: 'ellipse', cx: 72, cy: 56, rx: 1.2, ry: 1.2, fill: 'sun', stroke: 'none' },
      ],
    },
  ],
};

/** Six tutorials, one per element, in ELEMENT_ORDER. */
export const DRAW_TUTORIALS: DrawTutorial[] = [
  LUMINEX_DRAW,
  FLICKIT_DRAW,
  DRIBBLET_DRAW,
  SPROUTKIN_DRAW,
  ZAPLET_DRAW,
  WISPURR_DRAW,
];

export function tutorialFor(petId: string): DrawTutorial | undefined {
  return DRAW_TUTORIALS.find((t) => t.petId === petId);
}
