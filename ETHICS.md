# ReadQuest Ethics Charter

These are **non-negotiable product rules**. Every feature and pull request is
reviewed against this document. If a change conflicts with a rule here, the
change is wrong — not the rule.

## 1. Learning is never paywalled

- All educational content and the core gameplay loop are free, forever.
- No skill, region, question type, or pet that affects learning may be locked
  behind payment.

## 2. No exploitative reward mechanics

- **No loot boxes, no gacha, no randomized paid rewards.**
- Pets, cosmetics, and progression are earned **through play only**.
- No pay-to-win. Spending money never makes a child learn or progress faster.

## 3. No dark patterns aimed at children

- No FOMO timers, no guilt-based streaks, no "members get X!" pressure.
- No advertising shown to children. No third-party ad/tracking SDKs.
- Any purchase or marketing UI is **parent-gated** and shown only to adults.

## 4. Adapt, never label

- We never ask a child to pick a grade.
- Difficulty slides to the learner automatically (see `src/engine/adaptive/`).
  A new player may be calibrated by a short, pressure-free **placement warm-up**
  that infers a starting level from gameplay (`src/engine/adaptive/placement.ts`)
  — this is performance-based, never a grade prompt, and correctness is not
  shown during the warm-up.
- Progress is shown to kids as growth, never as "behind" or "below grade".
- Parent-facing reading-level estimates are framed supportively.

## 5. Healthy play by design

- Gentle, guilt-free break reminders; optional parent-set session caps.
- No infinite-engagement mechanics whose purpose is time-on-device for its own sake.

## 6. Privacy first (COPPA / FERPA mindset)

- Collect the minimum data needed to teach and to report to parents.
- Parental consent gates child accounts. Creating, renaming, or removing a kid
  profile is parent-gated (`src/ui/ParentGate.tsx`); choosing who plays is open.
- No selling or sharing of children's data; no behavioral ad profiling.
- Parents can export and delete their child's data at any time.

## 7. If we ever monetize

Exactly one transparent option, and only for things that do **not** affect
learning: cosmetic-only extras and/or advanced parent analytics — via a flat
subscription or one-time purchase. Fully-free, donation, and school-license
models are all acceptable. Manipulative monetization is not.

---

### Release checklist (run before every release)

- [ ] No learning content or core loop is behind a paywall.
- [ ] No loot boxes, gacha, or randomized paid rewards exist anywhere.
- [ ] No FOMO timers / guilt streaks / kid-facing upsell or ads.
- [ ] No grade-selection prompt; difficulty is adaptive.
- [ ] No child-facing "behind/below grade" language.
- [ ] Data collection is minimal; export & delete work; consent is gated.
- [ ] Profile create/rename/delete is parent-gated; picking a player is open.
