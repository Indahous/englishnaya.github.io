/* Level 2 — Derry. Past Simple Passive (B2). All story text is original.
   Content is kept separate from game code so it is easy to review and edit. */
window.LEVEL2 = {
  id: 2,
  title: "Derry",
  grammar: "Past Simple Passive: was / were + past participle (V3)",

  prologue: [
    {
      art: "town",
      kicker: "DERRY, MAINE · OCTOBER",
      text: "Derry, Maine. October. For three days the town was drowned in rain. The streets were flooded, the windows were fogged, and every door was locked against the storm."
    },
    {
      art: "kitchen",
      kicker: "A KITCHEN ON WITCHAM STREET",
      text: "In a kitchen on Witcham Street, a paper boat was made. It was folded slowly by Bill Denbro and left to dry beside the stove."
    },
    {
      art: "door",
      kicker: "THE FRONT DOOR",
      text: "The boat was given to Georgie. Then the front door was closed by Georgie, and he ran out into the rain."
    },
    {
      art: "street",
      kicker: "THE RAINY STREETS",
      text: "The boat was set on the water. It was carried through the rainy streets by the gutter river, past lamps and fences, toward the end of the road."
    },
    {
      art: "drain",
      kicker: "THE STORM DRAIN",
      text: "At the end of the street, the water was swallowed by a storm drain. The little boat was pulled in. Something shone in the dark below the grate."
    },
    {
      art: "balloon",
      kicker: "THE CASE IS OPENED",
      text: "Nobody was warned. Nothing was explained. A whisper was heard from the drain, and a case was opened. Now it is your turn."
    }
  ],

  scenes: [
    {
      name: "Fold the Page",
      place: "Kitchen, Witcham Street",
      banner: "kitchen",
      instr: "Fold each active sentence into a passive one. The OBJECT of the active sentence becomes the new SUBJECT.",
      note: "Active → passive: the object moves to the front, the verb becomes was / were + V3, and the old subject goes after “by”."
    },
    {
      name: "Can It Be Passive?",
      place: "The Front Door",
      banner: "door",
      instr: "Sort each sentence. Only verbs with an object can be made passive.",
      note: "Intransitive verbs (left, sailed, stopped, arrived, ran) have no object, so they have no passive."
    },
    {
      name: "The Gutter Race",
      place: "The Rainy Streets of Derry",
      banner: "street",
      instr: "Choose the correct form to keep the paper boat afloat. Every mistake pushes it toward the drain.",
      note: "Match was / were to the subject of the sentence, then add the past participle: was carried, were filled."
    },
    {
      name: "The Flashlight",
      place: "The Storm Drain",
      banner: "drain",
      instr: "It is dark down here. Move your light and click the 5 mistakes in the passive forms.",
      note: "Check three things: was / were agreement, the past participle (found, heard), and the tense (was, not is)."
    },
    {
      name: "The Interrogation",
      place: "Beneath Derry",
      banner: "balloon",
      instr: "Part 1: decide whether “by …” should stay or go. Part 2: build the final statements.",
      note: "Keep “by + agent” only when it is important or surprising. Drop it when the agent is obvious, unknown or unimportant."
    }
  ],

  /* Scene 1: active -> passive. r = role: s subject, v verb, o object, io indirect object */
  s1: [
    {
      active: [{ t: "Bill Denbro", r: "s" }, { t: "made", r: "v" }, { t: "a paper boat.", r: "o" }],
      answer: ["A paper boat", "was made", "by Bill Denbro"],
      roles: ["o", "v", "s"],
      distractors: [
        { text: "were made", why: "“A paper boat” is singular, so the verb is “was”." },
        { text: "made", why: "That is still the active verb. A passive verb is was / were + past participle." }
      ],
      note: "Object → subject: “a paper boat” moves to the front. made → was made."
    },
    {
      active: [{ t: "Georgie", r: "s" }, { t: "closed", r: "v" }, { t: "the front door.", r: "o" }],
      answer: ["The front door", "was closed", "by Georgie"],
      roles: ["o", "v", "s"],
      distractors: [
        { text: "is closed", why: "The story happened in the past, so use was / were, not is." },
        { text: "were closed", why: "“The front door” is singular, so use “was”." }
      ],
      note: "Past Simple Passive = was / were + V3. The doer (Georgie) goes after “by”."
    },
    {
      active: [{ t: "Bill", r: "s" }, { t: "gave", r: "v" }, { t: "Georgie", r: "io" }, { t: "a paper boat.", r: "o" }],
      answer: ["Georgie", "was given", "a paper boat", "by Bill"],
      roles: ["io", "v", "o", "s"],
      distractors: [
        { text: "gave", why: "That is active again. The passive is “was given”." },
        { text: "was gived", why: "The past participle of give is “given”, not “gived”." }
      ],
      note: "With two objects, either can become the subject. Here the person comes first: Georgie was given a paper boat."
    },
    {
      active: [{ t: "The storm", r: "s" }, { t: "flooded", r: "v" }, { t: "the streets of Derry.", r: "o" }],
      answer: ["The streets of Derry", "were flooded", "by the storm"],
      roles: ["o", "v", "s"],
      distractors: [
        { text: "was flooded", why: "“The streets” is plural, so use “were”." },
        { text: "flooded", why: "That is active. Add be: were flooded." }
      ],
      note: "A plural object becomes a plural subject, so the verb changes too: were flooded."
    }
  ],

  /* Scene 2: sort the cards. yes = passive is possible (the verb has an object) */
  s2: [
    { text: "Georgie closed the front door.", verb: "closed", yes: true, passive: "The front door was closed by Georgie.", why: "“Closed” has an object (the front door), so it can be passive." },
    { text: "Georgie left quickly.", verb: "left", yes: false, why: "“Left” has no object here. Nothing receives the action, so there is no passive." },
    { text: "Bill made a paper boat.", verb: "made", yes: true, passive: "A paper boat was made by Bill.", why: "“Made” has an object (a paper boat), so it can be passive." },
    { text: "The boat sailed down the street.", verb: "sailed", yes: false, why: "“Sailed” has no object. The boat does the action itself, so there is no passive." },
    { text: "Bill gave Georgie the boat.", verb: "gave", yes: true, passive: "Georgie was given the boat by Bill.", why: "“Gave” has objects (Georgie, the boat), so it can be passive." },
    { text: "The rain stopped.", verb: "stopped", yes: false, why: "“Stopped” has no object here, so there is no passive." },
    { text: "The storm broke a window.", verb: "broke", yes: true, passive: "A window was broken by the storm.", why: "“Broke” has an object (a window), so it can be passive." },
    { text: "The boy ran into the rain.", verb: "ran", yes: false, why: "“Ran” has no object (into the rain is a place, not an object), so there is no passive." }
  ],

  /* Scene 3: the gutter race. Each junction is a place on the map. */
  s3: [
    {
      place: "Witcham Street",
      before: "The paper boat",
      after: "down Witcham Street by the rainwater.",
      base: "carry",
      answer: "was carried",
      options: [
        { t: "was carried", ok: true },
        { t: "were carried", why: "“The paper boat” is singular, so you need “was”." },
        { t: "carried", why: "That is active. The boat does not carry anything — it is carried." }
      ]
    },
    {
      place: "Main Street",
      before: "The gutters of Main Street",
      after: "with leaves and water.",
      base: "fill",
      answer: "were filled",
      options: [
        { t: "was filled", why: "“The gutters” is plural, so you need “were”." },
        { t: "were filled", ok: true },
        { t: "filled", why: "That is active. The gutters receive the action: they were filled." }
      ]
    },
    {
      place: "Bassey Park",
      before: "Dozens of leaves",
      after: "aside by the little boat.",
      base: "push",
      answer: "were pushed",
      options: [
        { t: "was pushed", why: "“Dozens of leaves” is plural, so you need “were”." },
        { t: "were pushed", ok: true },
        { t: "pushed", why: "That is active. The leaves receive the action: they were pushed." }
      ]
    },
    {
      place: "Kissing Bridge",
      before: "The old wooden bridge",
      after: "by lightning for a second.",
      base: "light",
      answer: "was lit",
      options: [
        { t: "was lit", ok: true },
        { t: "were lit", why: "“The old wooden bridge” is singular, so you need “was”." },
        { t: "lit", why: "That is active. With “by lightning” we need the passive: was lit." }
      ]
    },
    {
      place: "The Storm Drain",
      before: "At the end of the street, the boat",
      after: "into the sewer.",
      base: "sweep",
      answer: "was swept",
      options: [
        { t: "was swept", ok: true },
        { t: "were swept", why: "“The boat” is singular, so you need “was”." },
        { t: "swept", why: "That is active. The boat does not sweep anything — it is swept away." }
      ]
    }
  ],

  /* Scene 4: find 5 mistakes. Plain strings are correct words; objects are mistakes. */
  s4: [
    ["The", "tunnel", "was", "flooded", "by", "the", "storm."],
    ["Dark", "water", { w: "were", fix: "was", why: "“Water” is singular, so the verb is “was pushed”." }, "pushed", "through", "the", "pipes."],
    ["The", "walls", { w: "was", fix: "were", why: "“The walls” is plural, so the verb is “were covered”." }, "covered", "with", "green", "slime."],
    ["A", "paper", "boat", "was", { w: "find", fix: "found", why: "After was we need the past participle: found." }, "in", "the", "dark."],
    ["Strange", "lights", "were", "seen,", "and", "strange", "sounds", "were", { w: "heared.", fix: "heard.", why: "The past participle of hear is heard." }],
    ["A", "whisper", { w: "is", fix: "was", why: "“Last night” is past time, so we need the past: was heard." }, "heard", "from", "the", "drain", "last", "night."],
    ["Nothing", "was", "said", "about", "it", "by", "anyone."]
  ],
  s4whispers: [
    "… nobody was told …",
    "… who was it, who was it …",
    "… the boat was taken …",
    "… nothing was seen …"
  ],

  /* Scene 5, part 1: keep or drop the "by ..." phrase */
  s5keep: [
    {
      text: "The paper boat was made by Bill Denbro.",
      keep: true,
      why: "Keep it: we care WHO made the boat. The agent is important information."
    },
    {
      text: "The front door was closed by someone.",
      keep: false,
      why: "Drop it: “by someone” tells us nothing. The agent is unknown or unimportant."
    },
    {
      text: "English is spoken by people in Maine.",
      keep: false,
      why: "Drop it: it is obvious that people speak a language."
    },
    {
      text: "The last page was torn out by the town librarian.",
      keep: true,
      why: "Keep it: the agent is new and surprising information."
    },
    {
      text: "The streets were flooded by water.",
      keep: false,
      why: "Drop it: floods are made of water, so the agent adds nothing."
    }
  ],

  /* Scene 5, part 2: build the final statements */
  s5build: [
    {
      answer: ["Who", "was", "the boat", "made by"],
      distractors: [
        { text: "were", why: "“The boat” is singular, so the question needs “was”." },
        { text: "make", why: "After was we need the past participle: made." }
      ],
      sentence: "Who was the boat made by?"
    },
    {
      answer: ["Where", "was", "the boat", "taken"],
      distractors: [
        { text: "did", why: "Passive questions use be (was), not do (did)." },
        { text: "take", why: "After was we need the past participle: taken." }
      ],
      sentence: "Where was the boat taken?"
    },
    {
      answer: ["Something", "was heard", "in the drain"],
      distractors: [
        { text: "were heard", why: "“Something” is singular, so use “was”." },
        { text: "heared", why: "The past participle of hear is heard." }
      ],
      sentence: "Something was heard in the drain."
    }
  ],

  secrets: [
    "DERRY DAILY NEWS: The Standpipe was closed after dark. Nobody was told why.",
    "DERRY DAILY NEWS: A paper boat was seen in the gutter of Main Street.",
    "DERRY DAILY NEWS: Strange voices were heard from the drains last night.",
    "DERRY DAILY NEWS: The Barrens were searched, but nothing was found.",
    "DERRY DAILY NEWS: The same date was marked in the library records 27 years ago."
  ],

  story: [
    "A paper boat was made by Bill Denbro.",
    "The front door was closed by Georgie.",
    "The boat was carried through the rainy streets and was swept into the sewer.",
    "Something was heard in the drain."
  ]
};
