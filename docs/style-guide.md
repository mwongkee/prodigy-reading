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

## Optional later: image-gen MCP

For in-loop generation, an MCP server can wrap fal.ai / Replicate / Stability
(small free credits exist, then paid per image). Add only when batch automation
is worth the cost — the free web tools above cover the early roadmap.
