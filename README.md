# ReadQuest

An **ethical, adaptive reading & writing pet-battler** for kids ages ~6–11.

Like Prodigy — explore a world, collect pets, battle by answering questions — but
focused on **literacy** (phonics, vocabulary, spelling, grammar, comprehension,
writing), with difficulty that **slides to the learner** (no grade picking), a
**parent dashboard** for per-skill progress, and **none of the predatory
monetization** that learning games are criticized for. See [`ETHICS.md`](./ETHICS.md).

## Status

Early vertical slice. Working today:

- **Adaptive engine** (`src/engine/adaptive/`) — Elo-style per-strand rating +
  zone-of-proximal-development item selection, plus a first-launch **placement
  warm-up** that calibrates the starting level from gameplay (never a grade
  prompt). Pure, framework-free, unit-tested.
- **Content model + question bank** (`src/content/`) — ~180 typed question items
  tagged by strand / grade (1-3) / knowledge-component / difficulty / type, with
  roughly ten items per strand per grade so the adaptive selector always has
  somewhere to slide.
- **Pets, bosses & keystones** (`src/content/pets.ts`, `enemies.ts`) — **Luminex**,
  a frost wolf with the moves Crunch / Heal / Refrigerate / Ice Storm, who evolves
  **Luminex → Luminite → Luminaut**. Each region is guarded by a boss (Ice Worm,
  Gerald, Ice Dragon, and others) that drops a **Keystone**; collect all six to
  face **The Puppet Master**, the villain controlling them.
- **Playable battle slice** (`src/ui/`) — answer-to-attack loop wired to the
  adaptive engine, with hand-built modular SVG pets (the wolf evolves on screen).
  Correct answers fire the pet's moves; Heal restores HP. Difficulty slides as you play.
- **Parent dashboard** (`src/dashboard/`) — per-strand level bands, accuracy, and
  focus-area suggestions from the live session.
- **Draw-Along** (`src/ui/DrawAlong.tsx`, `docs/draw-along.md`) — the **Draw** tab
  walks kids through drawing each of the six starter pets shape by shape in the
  free tool [Excalidraw](https://excalidraw.com); the picture builds up as you step.
- **Pet Workshop** (`src/ui/PetWorkshop.tsx`, `src/content/genome.ts`,
  `docs/pet-workshop.md`) — the **Create** tab lets kids build their **own playable
  pet** parametrically: style toggles + sliders + a **Surprise me** seed (a name
  works as a seed too). The polished SVG comes from one parametric rig
  (`src/assets/pets/Creature.tsx`) — no AI, infinite variety, always on-style.
  Saved creatures persist (localStorage), join the Pet Den, and battle/evolve like
  any other pet.

Planned next: Supabase accounts/persistence, more strands & question types,
Claude-graded writing prompts, richer art. See the roadmap in
`/root/.claude/plans/we-want-to-create-eventual-whisper.md` (design doc).

## Tech stack

- **React + TypeScript + Vite** app shell, **Zustand** for state.
- **Adaptive engine**: pure TypeScript (runs client-side now, server-portable later).
- **Vitest** for unit tests.
- Battle visuals are **SVG/React** today; a Phaser scene can replace them later
  without touching the engine or content layers.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm test         # run the unit tests (adaptive engine, content)
npm run build    # type-check + production build
```

## Project layout

```
docs/style-guide.md     art direction + ready-to-paste image-gen prompts
docs/draw-along.md      kid drawing tutorials for the six starter pets (Excalidraw)
docs/pet-workshop.md    the parametric pet creator (genome model + rig + persistence)
docs/skill-catalog.md   strands -> knowledge components -> difficulty ordering
src/engine/adaptive/    Elo rating + item selection (+ tests)
src/content/            question schema + seed bank (+ tests)
src/state/              Zustand session store (ties engine to UI)
src/ui/                 app shell, world map, battle, question cards, SVG pets
src/dashboard/          parent dashboard
```

## Design principles

1. **Learning is never paywalled.** The whole point is free.
2. **No dark patterns aimed at kids** — no loot boxes, FOMO timers, or upsell.
3. **Adapt, don't label.** We meet kids where they are; we never ask their grade
   or tell them they're "behind".

Full rules in [`ETHICS.md`](./ETHICS.md).
