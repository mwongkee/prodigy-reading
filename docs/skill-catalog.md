# Skill Catalog

ReadQuest organizes literacy into six **strands**. Each strand is broken into
ordered **knowledge components (KCs)** from easiest to hardest. The adaptive
engine tracks a separate ability rating per strand, so a learner can be advanced
in one strand and still building another.

Difficulty is expressed as an **Elo rating** (default seed ~1000, roughly the
middle of the ages 6–11 range). Higher = harder.

| Strand id      | Player-facing region | What it teaches                          |
| -------------- | -------------------- | ---------------------------------------- |
| `phonics`      | Phono Shores         | letter sounds, decoding, sight words     |
| `vocabulary`   | Vocab Vale           | word meaning, synonyms/antonyms          |
| `spelling`     | Spellhaven           | encoding words correctly                 |
| `grammar`      | Grammar Grove        | sentence mechanics, parts of speech      |
| `comprehension`| Story Sea            | understanding what is read               |
| `writing`      | Quill Keep           | sentence & short-paragraph construction  |

## Knowledge components (ordered easy → hard)

### phonics (Phono Shores)
1. `cvc` — consonant-vowel-consonant words (cat, dog)  ~800
2. `sight-words` — high-frequency words (the, said)     ~900
3. `digraphs` — sh, ch, th, wh                          ~1000
4. `blends` — bl, str, mp                               ~1100
5. `vowel-teams` — ai, ee, oa                           ~1200
6. `multisyllable` — breaking longer words              ~1350

### vocabulary (Vocab Vale)
1. `picture-word` — match word to meaning               ~850
2. `synonyms`                                            ~1000
3. `antonyms`                                            ~1050
4. `context-clues` — infer meaning from a sentence      ~1200
5. `shades-of-meaning` — happy/glad/thrilled            ~1350

### spelling (Spellhaven)
1. `cvc-spelling`                                        ~850
2. `common-patterns` — -ing, -ed endings                ~1000
3. `tricky-words` — irregular spellings                 ~1150
4. `homophones` — there/their/they're                   ~1300

### grammar (Grammar Grove)
1. `sentence-vs-fragment`                                ~950
2. `nouns-verbs`                                         ~1000
3. `capitalization-punctuation`                          ~1050
4. `subject-verb-agreement`                              ~1200
5. `tenses`                                              ~1300

### comprehension (Story Sea)
1. `literal-recall` — find the stated fact              ~950
2. `sequence` — what happened first/next                ~1050
3. `main-idea`                                           ~1200
4. `inference`                                           ~1350
5. `cause-effect`                                        ~1400

### writing (Quill Keep)
1. `word-order` — arrange words into a sentence         ~1000
2. `sentence-building`                                   ~1150
3. `expand-sentence` — add detail                       ~1300
4. `short-paragraph` (Claude-graded, later phase)       ~1450

## Mapping ratings to friendly bands (parent-facing)

Ratings are shown to parents as supportive bands, never as grades or "behind":

| Rating range | Band label    |
| ------------ | ------------- |
| < 950        | Exploring     |
| 950–1099     | Building      |
| 1100–1249    | Growing       |
| 1250–1399    | Confident     |
| ≥ 1400       | Soaring       |

These bands and KC ratings are the single source of truth; keep
`src/content/strands.ts` in sync with this file.
