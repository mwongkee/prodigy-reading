import type { Question } from './types';

/**
 * Seed question bank for the vertical slice. Small but spread across strands and
 * difficulties so the adaptive engine has somewhere to slide. Later phases
 * replace/augment this with a database-backed, AI-generated bank.
 *
 * Difficulty values follow the KC ratings in docs/skill-catalog.md.
 */
export const QUESTION_BANK: Question[] = [
  // ---- phonics (Phono Shores) ----
  {
    id: 'ph-cvc-1', strand: 'phonics', kc: 'cvc', difficulty: 780,
    type: 'spelling', prompt: 'Spell the word that names a furry pet that says "meow".',
    answer: 'cat', hint: 'It starts with the /k/ sound: c-a-t.',
  },
  {
    id: 'ph-digraph-1', strand: 'phonics', kc: 'digraphs', difficulty: 1000,
    type: 'multiple-choice',
    prompt: 'Which word has the "sh" sound?',
    choices: ['ship', 'top', 'ran', 'bug'], answerIndex: 0,
  },
  {
    id: 'ph-blend-1', strand: 'phonics', kc: 'blends', difficulty: 1120,
    type: 'multiple-choice',
    prompt: 'Which word starts with the "str" blend?',
    choices: ['string', 'sing', 'ring', 'song'], answerIndex: 0,
  },
  {
    id: 'ph-vowelteam-1', strand: 'phonics', kc: 'vowel-teams', difficulty: 1220,
    type: 'spelling', prompt: 'Spell the word for a small boat-trip word: "s_ _ l" that means to travel by wind on water.',
    answer: 'sail', hint: 'It uses the "ai" vowel team.',
  },

  // ---- vocabulary (Vocab Vale) ----
  {
    id: 'vo-syn-1', strand: 'vocabulary', kc: 'synonyms', difficulty: 1000,
    type: 'multiple-choice',
    prompt: 'Which word means the SAME as "happy"?',
    choices: ['glad', 'tired', 'angry', 'cold'], answerIndex: 0,
  },
  {
    id: 'vo-ant-1', strand: 'vocabulary', kc: 'antonyms', difficulty: 1060,
    type: 'multiple-choice',
    prompt: 'Which word is the OPPOSITE of "big"?',
    choices: ['small', 'huge', 'tall', 'wide'], answerIndex: 0,
  },
  {
    id: 'vo-context-1', strand: 'vocabulary', kc: 'context-clues', difficulty: 1210,
    type: 'multiple-choice',
    prompt: 'The puppy was timid, so it hid behind the couch. "Timid" means ___.',
    choices: ['shy', 'loud', 'hungry', 'fast'], answerIndex: 0,
    hint: 'Hiding gives you a clue about how it felt.',
  },

  // ---- spelling (Spellhaven) ----
  {
    id: 'sp-pattern-1', strand: 'spelling', kc: 'common-patterns', difficulty: 1010,
    type: 'spelling', prompt: 'Add -ing to "run" to show it is happening now.',
    answer: 'running', hint: 'Double the last letter before adding -ing.',
  },
  {
    id: 'sp-homophone-1', strand: 'spelling', kc: 'homophones', difficulty: 1300,
    type: 'multiple-choice',
    prompt: 'Pick the right word: "The cat chased ___ tail."',
    choices: ['its', "it's", 'its\'', 'itz'], answerIndex: 0,
    hint: '"it\'s" means "it is".',
  },

  // ---- grammar (Grammar Grove) ----
  {
    id: 'gr-noun-1', strand: 'grammar', kc: 'nouns-verbs', difficulty: 1000,
    type: 'multiple-choice',
    prompt: 'Which word is a NOUN (a person, place, or thing)?',
    choices: ['dog', 'run', 'quickly', 'happy'], answerIndex: 0,
  },
  {
    id: 'gr-sva-1', strand: 'grammar', kc: 'subject-verb-agreement', difficulty: 1210,
    type: 'multiple-choice',
    prompt: 'Choose the correct word: "The birds ___ in the sky."',
    choices: ['fly', 'flies', 'flying', 'flyed'], answerIndex: 0,
  },

  // ---- comprehension (Story Sea) ----
  {
    id: 'co-literal-1', strand: 'comprehension', kc: 'literal-recall', difficulty: 960,
    type: 'multiple-choice',
    prompt: 'Read: "Mia put on her red boots and jumped in the puddle." What color were Mia\'s boots?',
    choices: ['red', 'blue', 'green', 'yellow'], answerIndex: 0,
  },
  {
    id: 'co-inference-1', strand: 'comprehension', kc: 'inference', difficulty: 1340,
    type: 'multiple-choice',
    prompt: 'Read: "Sam grabbed an umbrella before leaving." What was the weather probably like?',
    choices: ['rainy', 'sunny', 'snowy', 'windy'], answerIndex: 0,
    hint: 'Why do people carry umbrellas?',
  },

  // ---- writing (Quill Keep) ----
  {
    id: 'wr-order-1', strand: 'writing', kc: 'word-order', difficulty: 1010,
    type: 'word-order',
    prompt: 'Put the words in order to make a sentence.',
    answer: ['The', 'dog', 'ran', 'fast'],
  },
  {
    id: 'wr-order-2', strand: 'writing', kc: 'sentence-building', difficulty: 1160,
    type: 'word-order',
    prompt: 'Arrange the words into a correct sentence.',
    answer: ['We', 'planted', 'seeds', 'in', 'the', 'garden'],
  },
];
