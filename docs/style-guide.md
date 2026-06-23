# Art & Style Guide

This guide locks the visual identity so that art from any source — hand-written
SVG, free-tier AI image tools, or commissioned work — stays consistent.

## The look: "cozy creatures"

- Friendly, **rounded** shapes; no sharp/scary edges (audience is 6–11).
- **Flat color with soft gradients**; subtle, not glossy.
- **Consistent line weight** where outlines are used (~3–4px at 256px artboard).
- **Bright but calm** — saturated accents on muted backgrounds; never neon/harsh
  (avoid overstimulation).
- Big, expressive eyes on pets; clear silhouettes that read at small sizes.

## Palette

| Token         | Hex       | Use                              |
| ------------- | --------- | -------------------------------- |
| `ink`         | `#2b2440` | outlines, primary text           |
| `paper`       | `#fbf7ef` | backgrounds, cards               |
| `sky`         | `#7cc6fe` | UI primary, Phono Shores         |
| `leaf`        | `#7bd389` | success, Grammar Grove           |
| `sun`         | `#ffd166` | rewards/XP, Vocab Vale           |
| `coral`       | `#ff8a7a` | gentle alerts, Quill Keep        |
| `grape`       | `#b59be8` | magic/FX, Spellhaven             |
| `sea`         | `#5fbfb0` | Story Sea                        |

These are mirrored in `src/ui/theme.ts` — keep them in sync.

## Pets: modular SVG system

Pets are built from layered parts so they can recolor, evolve, and animate
cheaply, all from code (free, version-controlled, scalable):

- **Layers:** `body` → `belly` → `face (eyes/mouth)` → `accent (ears/fins/horn)`.
- Colors come from CSS variables / props so one shape recolors into many pets.
- **Evolution** = swap/add accent layers + bump scale, not new files.
- **States:** idle, attack, hurt, happy — driven by CSS transforms/keyframes.

Keep pet SVGs in `src/assets/pets/`.

## When to use AI image generation (free-tier workflow)

Use AI images for things SVG is poor at: **region background scenes, splash/
title art, concept exploration**. Recommended free options, used in slow batches:

- **Bing Image Creator / Microsoft Designer** (DALL·E, free daily credits)
- **Leonardo.ai** (free daily tokens), **Playground**, **Mage.space**, **Tensor.art**
- **Google Gemini / Whisk** (free tiers)
- **Stable Diffusion locally** (ComfyUI / Automatic1111) if a GPU is available —
  free + unlimited, and the most consistent via a fixed seed + a style LoRA.

### Consistency rules

- Reuse one **style suffix** on every prompt (below).
- Fix the **seed** across a batch; reuse a **reference image** for new assets.
- Post-process: remove backgrounds with free `rembg`; nudge colors toward the
  palette above.

### Prompt template

```
<subject>, <pose/scene>, children's storybook game art, cozy rounded shapes,
flat colors with soft gradients, soft warm lighting, friendly and gentle,
clean simple background, high detail, --style suffix-->
[STYLE SUFFIX] palette of soft sky blue, warm cream, sunny yellow, gentle coral,
soft purple; cohesive cute creature-collector game art; no text, no watermark
```

Example (Phono Shores background):
```
a sunlit sandy shore with gentle tide pools and rounded rocks, distant soft
hills, [STYLE SUFFIX]
```

## Pet sprites — the locked style (for AI generation)

The 16-pet roster (see `docs/pet-prompts.md`) is generated on free-tier tools in
a **creature-collector style** inspired by the *general look* of games like
Prodigy — **but every creature is original**. Do **not** reproduce or reference
any existing game's named characters; we borrow only the art style, palette feel,
and animation energy.

**Target look (from the user's references):** chibi proportions (big head, small
body), large glossy eyes with a bright sparkle, smooth cel-shading with soft
gradients and a glossy rim-light, a soft medium outline, vibrant element-keyed
palette, a lively 3/4 full-body standing pose, subtle elemental aura/FX.

### Locked style suffix (paste after every pet subject)

```
chibi creature-collector mascot, original character, big head small body, large
expressive glossy eyes with a sparkle highlight, smooth cel-shading, soft
gradients, glossy rim light, clean soft outline, vibrant colors, cute and
friendly, dynamic 3/4 full-body standing pose, subtle elemental aura, centered,
full body in frame, plain flat background, high quality, crisp, sticker-like
```

### Negative prompt

```
text, watermark, signature, logo, copyrighted character, existing game mascot,
realistic, photorealistic, scary, gore, blurry, low quality, extra limbs,
deformed, cluttered background, multiple characters
```

### Spec & consistency

- Output square; export **512×512 transparent PNG**. Name the file the pet's id
  (e.g. `flickit.png`) and drop it in `src/assets/pets/generated/`.
- For an evolution line, **keep the same seed** and reuse the base prompt, only
  changing the size/horns/aura wording per stage, so the three forms look related.
- Free tools: **Bing Image Creator / DALL·E**, **Leonardo.ai**, **Playground**;
  for the most consistent results use **local Stable Diffusion (ComfyUI/A1111)**
  with a fixed seed (+ optional style LoRA).
- Post-process: remove the background with **`rembg`** (free), then drop the PNG
  in. It replaces the placeholder automatically — no code change.

## Optional later: image-gen MCP

For in-loop generation, an MCP server can wrap fal.ai / Replicate / Stability
(small free credits exist, then paid per image). Add only when batch automation
is worth the cost — the free web tools above cover the early roadmap.
