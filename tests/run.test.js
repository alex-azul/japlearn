import assert from "node:assert/strict";
import test from "node:test";

import {
  createRunState,
  recordAnswer,
  recordChoiceAnswer,
} from "../src/domain/run.js";

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
    furigana: "akarui",
    romaji: "akarui",
    meaning: "light, bright",
  },
  {
    id: 3,
    kanji: "",
    furigana: "megane",
    romaji: "megane",
    meaning: "a pair of glasses",
  },
  {
    id: 4,
    kanji: "",
    furigana: "ame",
    romaji: "ame",
    meaning: "rain",
  },
];

var meaningPool = vocabulary.map(function (entry) {
  return entry.meaning;
});

function createRun() {
  return createRunState({ start: 1, end: 4 }, vocabulary, meaningPool);
}

test("createRunState initializes each word in choice mode", function () {
  var runState = createRun();

  assert.equal(runState.poolSize, 4);
  assert.equal(runState.statsById.get(1).responseMode, "choice");
  assert.equal(runState.statsById.get(2).responseMode, "choice");
});

test("recordAnswer promotes a multiple-choice success to text mode", function () {
  var runState = createRun();

  runState.currentWord = vocabulary[0];
  runState.currentResponseMode = "choice";

  assert.equal(recordAnswer(runState, "blue"), true);
  assert.equal(runState.statsById.get(1).responseMode, "text");
  assert.equal(runState.correctCount, 1);
});

test("recordAnswer keeps text mode after a text success", function () {
  var runState = createRun();

  runState.statsById.get(2).responseMode = "text";
  runState.currentWord = vocabulary[1];
  runState.currentResponseMode = "text";

  assert.equal(recordAnswer(runState, "bright"), true);
  assert.equal(runState.statsById.get(2).responseMode, "text");
});

test("recordAnswer degrades a text failure back to choice and stores the failure", function () {
  var runState = createRun();

  runState.statsById.get(3).responseMode = "text";
  runState.currentWord = vocabulary[2];
  runState.currentResponseMode = "text";

  assert.equal(recordAnswer(runState, "glasses"), false);
  assert.equal(runState.statsById.get(3).responseMode, "choice");
  assert.equal(runState.lastFailure.meaning, "a pair of glasses");
});

test("recordAnswer keeps failed multiple-choice words in choice mode", function () {
  var runState = createRun();

  runState.currentWord = vocabulary[3];
  runState.currentResponseMode = "choice";

  assert.equal(recordAnswer(runState, "blue"), false);
  assert.equal(runState.statsById.get(4).responseMode, "choice");
  assert.equal(runState.answeredCount, 1);
});

test("recordChoiceAnswer can keep successful words in choice mode", function () {
  var runState = createRun();

  runState.currentWord = vocabulary[0];
  runState.currentResponseMode = "choice";

  assert.equal(
    recordChoiceAnswer(runState, "blue", {
      promoteOnCorrect: false,
    }),
    true
  );
  assert.equal(runState.statsById.get(1).responseMode, "choice");
});
