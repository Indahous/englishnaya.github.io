/* Level 1 — The Library. Present Simple Passive (B2).
   Content lives here, separate from game code, so new levels are easy to add.
   Each headline: `answer` = pieces in correct order, `distractors` = wrong pieces with an explanation. */
window.LEVEL1 = {
  id: 1,
  title: "The Library",
  grammar: "Present Simple Passive: am / is / are + past participle (V3)",
  intro: [
    "Willow Creek Public Library. 2:00 a.m.",
    "Somebody has torn the town's newspapers to pieces. You are the new kid in town, and you are the only one who still reads the news.",
    "Rebuild the headlines. But be careful: Mr. Nobody feeds on sentences that name no one to blame. The more mistakes you make, the stronger he gets."
  ],
  headlines: [
    {
      answer: ["Books", "are stolen", "from the library", "every night"],
      distractors: [
        { text: "is stolen", why: "“Books” is plural, so the verb be must be “are”, not “is”." },
        { text: "steal", why: "That is active. The books don’t steal — they are the ones that are taken. Passive = be + past participle." }
      ],
      note: "Books (plural) → are + stolen. Present Simple Passive = am / is / are + V3."
    },
    {
      answer: ["The old clock", "in the square", "is never repaired"],
      distractors: [
        { text: "are never repaired", why: "“The old clock” is singular, so you need “is”." },
        { text: "never repairs", why: "That is active: the clock would be doing the repairing. We need be + repaired." }
      ],
      note: "Adverbs of frequency (never, always, often) go between be and the participle: is never repaired."
    },
    {
      answer: ["Strange noises", "are heard", "near the river", "after midnight"],
      distractors: [
        { text: "is heard", why: "“Strange noises” is plural, so use “are”." },
        { text: "hear", why: "Noises can’t hear anything. The passive needs be + the past participle: are heard." }
      ],
      note: "hear → heard. The subject is what receives the action: the noises are heard (by someone)."
    },
    {
      answer: ["Lost keys", "are never returned", "to the librarian"],
      distractors: [
        { text: "is never returned", why: "“Lost keys” is plural, so use “are”." },
        { text: "are never return", why: "After be you need the past participle (returned), not the base form (return)." }
      ],
      note: "Regular verbs: V3 = V2 = verb + -ed. return → returned."
    },
    {
      answer: ["Why", "are", "the windows", "never repaired"],
      distractors: [
        { text: "is", why: "“The windows” is plural, so the question needs “are”." },
        { text: "never repair", why: "We need the past participle after be: never repaired." }
      ],
      note: "In questions, be moves before the subject: Why are the windows … repaired?"
    },
    {
      answer: ["Nothing", "is known", "about the missing boy"],
      distractors: [
        { text: "are known", why: "“Nothing” is singular, so use “is”." },
        { text: "is know", why: "The past participle of know is “known”, not “know”." }
      ],
      note: "Nothing is singular → is known. Notice: all six headlines say what happens, but never who does it."
    }
  ],
  secrets: [
    "A red balloon is seen at every disappearance.",
    "The town is watched from the house on the hill.",
    "Names are whispered in the sewers at night.",
    "The same page is torn out of every book.",
    "Nothing is said about it at the town meeting."
  ]
};
