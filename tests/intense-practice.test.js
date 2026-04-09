import assert from "node:assert/strict";
import test from "node:test";

import {
  advanceIntenseQuestion,
  createIntenseSession,
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
