# Draw-Along: draw your own ReadQuest pets

Step-by-step, shape-by-shape guides for drawing the **six starter pets** — one per
element. They're written for kids ages ~6–11 and use one free tool:
**[Excalidraw](https://excalidraw.com)** (no login, no install, works in any
browser). The pet you draw matches its in-game art, and **reading the steps in
order is part of the practice** (sequencing + following instructions).

These are also built into the app — open the **Draw** tab to step through the same
tutorials with a picture that builds up as you go (`src/ui/DrawAlong.tsx`, data in
`src/content/draw-tutorials.ts`).

> All six pets are **original** ReadQuest characters. Draw them, remix them, make
> them yours.

---

## Get Excalidraw ready

1. Open **https://excalidraw.com** — a blank page appears. Nothing to sign up for.
2. The **toolbar** is at the top. The tools we use:
   - **Select** — press `V` (move and resize things)
   - **Rectangle** — press `R`
   - **Ellipse** (circles & ovals) — press `O`
   - **Line** — press `L`
   - **Draw** (free pencil) — press `P`
3. **Colours:** click a tool or a shape, and a panel opens on the **left**. Set the
   **Stroke** (the outline) and the **Background** (the fill). For a solid colour,
   set **Fill** to the solid square. Each pet below lists its colours.
4. **Make a triangle** (for ears and flames): Excalidraw has no triangle tool, so
   use the **Line** tool — click the three corners, then click the **first dot
   again** to close the shape.
5. **Move or resize:** press `V`, then drag a shape or its corner handles.
6. **Oops?** Press **Ctrl+Z** (Mac: **Cmd+Z**) to undo.

**Tip — keep your art (optional, for grown-ups):** Excalidraw can **Export image**
(top-left menu) as a PNG. Save it 512×512 with a transparent background as
`<pet-id>.png` (e.g. `flickit.png`) into `src/assets/pets/generated/` and the
child's own drawing shows up in the game — see `docs/pet-prompts.md`.

---

## ❄️ Draw Luminex  *(Frost — body `#f3f6fd`, snout `#a9b3c6`, cheeks sky-blue)*

1. **Ellipse (O).** Pick a light-blue Background. Drag a big round **head** in the
   middle. *(Hold Shift for a neat circle.)*
2. **Line (L).** Make a pointy **ear**: click three corners, then click the first
   dot to close it. Do it twice for two ears.
3. **Ellipse (O).** Draw a smaller round **body** under the head and a fluffy oval
   **tail** on the side.
4. **Ellipse (O).** Add two big dark **eyes**, each with a tiny white **sparkle**.
5. **Ellipse (O).** Add a grey oval **snout** with a little dark **nose** on top.
6. **Colour 🎨.** Add two frosty blue **cheeks** (small circles). 🎉 You drew Luminex!

## 🔥 Draw Flickit  *(Flame — body `#ff8a7a`, belly cream, tail `#ffd166`)*

1. **Ellipse (O).** Warm-orange Background. Drag a big round **head**.
2. **Line (L).** Make two tall, pointy **fox ears** (three clicks each, then close).
3. **Ellipse (O).** Draw a round **body**, then a smaller cream oval **belly** on top.
4. **Ellipse (O).** Add two sparkly **eyes** and a tiny dark **nose**.
5. **Line (L).** Draw a **flame tail** — zig up to a point and back down — and fill
   it sunny yellow.
6. **Colour 🎨.** Add two rosy **cheeks**. 🎉 You drew Flickit!

## 💧 Draw Dribblet  *(Tide — body `#5fbfb0`, fins sky-blue, white shine)*

1. **Ellipse (O).** Teal Background. Drag one big round **body**.
2. **Line (L).** Add a pointy **water-drop tip** on top (a little triangle).
3. **Ellipse (O).** Draw a small **fin** on each side in sky-blue.
4. **Ellipse (O).** Add two sparkly **eyes**, then a curved **smile** with the Line tool.
5. **Ellipse (O).** Draw a small white **shine** near the top so it looks glossy.
6. **Colour 🎨.** Float a few little **bubbles** around it (small circles). 🎉 You drew
   Dribblet!

## 🍃 Draw Sproutkin  *(Leaf — body `#7bd389`, leaves green, cheeks rosy)*

1. **Ellipse (O).** Fresh-green Background. Drag a big round **body**.
2. **Rectangle (R) + Ellipse (O).** Draw a thin **stem** up top and two **leaf**
   ovals at its tip.
3. **Ellipse (O).** Add two big sparkly **eyes**.
4. **Line (L).** Draw a happy curved **smile**.
5. **Ellipse (O).** Give it two little **feet** at the bottom (small ovals).
6. **Colour 🎨.** Finish with two rosy **cheeks**. 🎉 You drew Sproutkin!

## ⚡ Draw Zaplet  *(Storm — body `#ffd166`, bolt & cheeks electric blue)*

1. **Ellipse (O).** Bright-yellow Background. Build a wide fluffy **cloud body**
   from three round ovals.
2. **Line (L).** Make two sharp, spiky **ears** on top.
3. **Ellipse (O).** Add two sparkly **eyes** and a small **smile**.
4. **Line (L).** Draw a **lightning-bolt tail** — zig-zag down to a point — and fill
   it electric blue.
5. **Colour 🎨.** Add two blue lightning **cheeks** (small circles).
6. **Line (L).** Sprinkle a tiny **spark star** nearby. 🎉 You drew Zaplet!

## 🌙 Draw Wispurr  *(Dusk — body `#b59be8`, eyes glowing yellow, starry specks)*

1. **Ellipse (O).** Soft-purple Background. Draw a round **head** near the top.
2. **Line (L).** Add two pointy **cat ears** (three clicks each).
3. **Draw (P).** Under the head, draw a wavy, wispy **smoke tail** that curls down
   like an **S**.
4. **Ellipse (O).** Give it two big **glowing eyes** (yellow) with white **sparkles**.
5. **Line (L).** Add a tiny **smile** below the eyes.
6. **Colour 🎨.** Scatter a few **starry speckles** (tiny dots). 🎉 You drew Wispurr!

---

Want the full evolved forms too? Those use AI-generated art — see
`docs/pet-prompts.md` and `docs/style-guide.md`.
