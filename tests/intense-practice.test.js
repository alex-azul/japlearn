import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceIntenseQuestion,
  createMeaningsByPrompt,
  createIntenseSession,
  INTENSE_HARD_TIME_LIMIT_MS,
  INTENSE_TIME_LIMIT_MS,
  pauseIntenseSession,
  startIntenseTransition,
  submitIntenseAnswer,
} from "../src/domain/intense-practice.js";

var vocabulary = [
  {
    id: 1,
    kanji: "",
    furigana: "aoi",
    romaji: "aoi",
    meaning: "blue",
  },
  {
    id: 2,
    kanji: "",
    furigana: "akai",
    romaji: "akai",
    meaning: "red",
  },
  {
    id: 3,
    kanji: "",
    furigana: "shiroi",
    romaji: "shiroi",
    meaning: "white",
  },
  {
    id: 4,
    kanji: "",
    furigana: "kuroi",
    romaji: "kuroi",
    meaning: "black",
  },
];

var meaningPool = vocabulary.map(function (entry) {
  return entry.meaning;
});

test("createIntenseSession initializes combo and time limit", function () {
  var session = createIntenseSession({ start: 1, end: 4 }, vocabulary, meaningPool);

  assert.equal(session.comboCount, 0);
  assert.equal(session.timeLimitMs, INTENSE_TIME_LIMIT_MS);
  assert.equal(session.run.poolSize, 4);
});

test("hard intense mode initializes with double time", function () {
  var session = createIntenseSession(
    { start: 1, end: 4 },
    vocabulary,
    meaningPool,
    {},
    {
      answerMode: "text",
    }
  );

  assert.equal(session.timeLimitMs, INTENSE_HARD_TIME_LIMIT_MS);
  assert.equal(session.timeRemainingMs, INTENSE_HARD_TIME_LIMIT_MS);
});

test("advanceIntenseQuestion always prepares a choice question with three options", function () {
  var session = createIntenseSession({ start: 1, end: 4 }, vocabulary, meaningPool);

  advanceIntenseQuestion(session, function () {
    return 0;
  });

  assert.equal(session.run.currentResponseMode, "choice");
  assert.equal(session.run.currentOptions.length, 3);
  assert.equal(session.run.currentOptions.includes(session.run.currentWord.meaning), true);
  assert.equal(session.isPaused, false);
  assert.equal(session.isTransitioning, false);
});

test("submitIntenseAnswer keeps response mode in choice and increments combo", function () {
  var session = createIntenseSession({ start: 1, end: 4 }, vocabulary, meaningPool);

  advanceIntenseQuestion(session, function () {
    return 0;
  });

  assert.equal(submitIntenseAnswer(session, session.run.currentWord.meaning), true);
  assert.equal(session.comboCount, 1);
  assert.equal(session.run.statsById.get(session.run.currentWord.id).responseMode, "choice");
});

test("failed intense answers reset combo and can pause on timeout", function () {
  var session = createIntenseSession({ start: 1, end: 4 }, vocabulary, meaningPool);

  advanceIntenseQuestion(session, function () {
    return 0;
  });
  session.comboCount = 3;

  assert.equal(submitIntenseAnswer(session, "wrong"), false);
  assert.equal(session.comboCount, 0);

  pauseIntenseSession(session, "timeout");
  assert.equal(session.isPaused, true);
  assert.equal(session.timeRemainingMs, 0);
  assert.equal(session.pauseCorrectMeaning, session.run.currentWord.meaning);
});

test("startIntenseTransition flags the session as animating", function () {
  var session = createIntenseSession({ start: 1, end: 4 }, vocabulary, meaningPool);

  startIntenseTransition(session);

  assert.equal(session.isTransitioning, true);
  assert.equal(session.isPaused, false);
});

test("createMeaningsByPrompt groups meanings for visually identical prompts", function () {
  var duplicateVocabulary = [
    { id: 1, kanji: "", furigana: "hashi", romaji: "hashi", meaning: "bridge" },
    {
      id: 2,
      kanji: "",
      furigana: "hashi",
      romaji: "hashi",
      meaning: "chopsticks",
    },
  ];

  assert.deepEqual(createMeaningsByPrompt(duplicateVocabulary).hashi, [
    "bridge",
    "chopsticks",
  ]);
});

test("hard intense mode accepts any meaning for the same visible prompt", function () {
  var duplicateVocabulary = [
    { id: 1, kanji: "", furigana: "hashi", romaji: "hashi", meaning: "bridge" },
    {
      id: 2,
      kanji: "",
      furigana: "hashi",
      romaji: "hashi",
      meaning: "chopsticks",
    },
    { id: 3, kanji: "", furigana: "ao", romaji: "ao", meaning: "blue" },
    { id: 4, kanji: "", furigana: "aka", romaji: "aka", meaning: "red" },
  ];
  var session = createIntenseSession(
    { start: 1, end: 4 },
    duplicateVocabulary,
    duplicateVocabulary.map(function (entry) {
      return entry.meaning;
    }),
    {},
    {
      answerMode: "text",
    }
  );

  advanceIntenseQuestion(session, function () {
    return 0;
  });

  assert.equal(session.answerMode, "text");
  assert.equal(session.run.currentOptions.length, 0);
  assert.equal(submitIntenseAnswer(session, "chopsticks"), true);
  assert.equal(session.pauseCorrectMeaning, "bridge / chopsticks");
});

test("hard intense mode accepts standalone meaning words", function () {
  var openVocabulary = [
    { id: 1, kanji: "", furigana: "akeru", romaji: "akeru", meaning: "to open" },
    { id: 2, kanji: "", furigana: "aoi", romaji: "aoi", meaning: "blue" },
    { id: 3, kanji: "", furigana: "akai", romaji: "akai", meaning: "red" },
    { id: 4, kanji: "", furigana: "shiroi", romaji: "shiroi", meaning: "white" },
  ];
  var session = createIntenseSession(
    { start: 1, end: 4 },
    openVocabulary,
    openVocabulary.map(function (entry) {
      return entry.meaning;
    }),
    {},
    {
      answerMode: "text",
    }
  );

  advanceIntenseQuestion(session, function () {
    return 0;
  });

  assert.equal(session.run.currentWord.meaning, "to open");
  assert.equal(submitIntenseAnswer(session, "open"), true);
});
