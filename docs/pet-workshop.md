# Pet Workshop — the parametric pet creator

The **Create** tab lets a child build their own pet and actually *play* with it.
No AI, no gacha, no drawing skill required — and every result looks like it
belongs in the game.

The trick is **parametric / procedural generation**: instead of a library of
hand-drawn parts, there is *one* smart vector "rig" (`Creature.tsx`) whose shapes
are driven by **numbers**. Move the numbers → a different creature. Because the
rig constrains every shape to a safe range, the output is always on-style and
polished, no matter who is driving.

- **Sliders + style toggles** = deliberate building.
- **🎲 Surprise me** rolls a random *seed* → a full creature (the procedural part).
- A **name is also a seed** ("Max" always makes the same pet — deterministic and
  shareable).

## The genome

A pet is fully described by a `PetGenome` (`src/content/genome.ts`):

| Group | Fields | Notes |
| ----- | ------ | ----- |
| **Style** (discrete) | `bodyShape`, `earStyle`, `eyeStyle`, `mouthStyle`, `tailStyle`, `pattern` | each maps to a drawn variant in the rig |
| **Knobs** (continuous `0..1`) | `bodyW`, `bodyH`, `earSize`, `earAngle`, `eyeSize`, `eyeSpacing`, `legLength`, `hornCount`, `spikeAmount`, `patternDensity` | the renderer maps these to safe coordinate ranges |
| **Theming** | `bodyColor`, `accentColor` (hex), `element` | colour pickers + element chips |

Key helpers (all pure and unit-tested in `genome.test.ts`):

- `randomGenome(rng)` / `genomeFromSeed(seed)` — a seed (number **or** name) →
  a complete, valid creature. Uses the shared `mulberry32` + `hashString`
  (`src/engine/rng.ts`).
- `clampGenome(g)` — forces every field into range / valid option. This is what
  guarantees quality: a creature literally cannot go off-model.
- `defaultGenome(element)` — a balanced starting point.
- `defaultMovesFor(element)` — a valid 4-move set (3 attacks + 1 heal), flavoured
  by element, so battle logic (`chooseMove`) always works.
- `buildCustomSpecies(genome, name, id?)` — wraps a genome as a real `PetSpecies`.

## How it renders

`Creature.tsx` draws on the shared `200×200` viewBox in the house style (soft
radial-gradient body, 4px ink outline, round joins). It honours the same
**mood** (face swaps + cheeks) and **stage** (scale + evolution sparkles) hooks as
the rest of the pets, so a custom creature animates in battle and grows at levels
3 and 6 exactly like the static roster. `Pet.tsx` dispatches the new art kind:

```ts
// src/content/pets.ts
export type Art =
  | { kind: 'svg'; shape: PetShape }
  | { kind: 'image'; src: string }
  | { kind: 'genome'; genome: PetGenome };   // ← kid-created creatures
```

## How a creation becomes a playable, saved pet

1. **Save** → `buildCustomSpecies(genome, name)` produces a `PetSpecies` with
   `unlockLevel: 1` (creating *is* the unlock — see ETHICS), element-flavoured
   moves, and three genome-backed stages.
2. `store.addCustomPet(species)` pushes it onto `customPets` and selects it.
3. Every gameplay lookup goes through `resolveSpecies(id, customPets)`
   (`src/state/store.ts`) — creations first, then the static `PETS` roster — so
   battle, the Pet Den, the world-map header, moves and evolution all "just work".
4. **Persistence:** the store is wrapped in zustand's `persist` middleware with
   `partialize` so **only** `{ customPets, speciesId }` is saved to
   `localStorage['readquest.creations']`. Creations and the active pet survive a
   refresh; volatile battle/learner state is not persisted.

Creations appear under **Pet Den → ✨ Your Creations**, selectable like any pet.

## Ethics

On-brand with the rest of ReadQuest (see `ETHICS.md`): creating a pet is **free
and earned by play** — no AI, no loot boxes, no purchase, no FOMO. The child owns
the result outright (it's just data they authored). The Draw-Along tab
(`docs/draw-along.md`) remains the complementary "make it on paper" activity; the
Workshop is the in-game creation path.

## Extending the rig

Add a new part style by extending the relevant union + array in `genome.ts`
(e.g. a `wings` style) and a matching `render*` branch in `Creature.tsx`. Keep
every shape inside the existing coordinate bounds and use palette tokens / ink so
new parts stay on-style. Re-run `npm test` — the genome invariants will flag any
option you forgot to handle.
