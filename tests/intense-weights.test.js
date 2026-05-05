import assert from "node:assert/strict";
import test from "node:test";

import {
  applyIntenseWeightAnswer,
  createEmptyIntenseWeights,
  createIntenseWeightEntries,
  formatIntenseWeightScore,
  getIntenseWeightMultiplier,
  INTENSE_WEIGHT_MAX_SCORE,
  INTENSE_WEIGHT_MIN_SCORE,
  normalizeIntenseWeights,
  wasIntenseAnswerBeforeHalf,
} from "../src/domain/intense-weights.js";

var vocabulary = [
  { id: 1, kanji: "", furigana: "a", romaji: "a", meaning: "one" },
  { id: 2, kanji: "", furigana: "b", romaji: "b", meaning: "two" },
];

test("createEmptyIntenseWeights initializes all words at neutral score", function () {
  assert.deepEqual(createEmptyIntenseWeights(vocabulary), {
    "1": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
    "2": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
  });
});

test("applyIntenseWeightAnswer rewards fast correct answers and penalizes slow ones", function () {
  var weights = createEmptyIntenseWeights(vocabulary);

  applyIntenseWeightAnswer(weights, 1, {
    isCorrect: true,
    wasFastCorrect: true,
  });
  assert.equal(weights["1"].score, 1);
  assert.equal(weights["1"].fastCorrect, 1);

  applyIntenseWeightAnswer(weights, 1, {
    isCorrect: true,
    wasFastCorrect: false,
  });
  assert.equal(weights["1"].score, 0.25);
  assert.equal(weights["1"].slowCorrect, 1);
});

test("applyIntenseWeightAnswer penalizes wrong answers and clamps score", function () {
  var weights = createEmptyIntenseWeights(vocabulary);
  var index;

  for (index = 0; index < 20; index += 1) {
    applyIntenseWeightAnswer(weights, 1, {
      isCorrect: false,
      wasFastCorrect: false,
    });
  }

  assert.equal(weights["1"].wrong, 20);
  assert.equal(weights["1"].score, INTENSE_WEIGHT_MIN_SCORE);
});

test("wasIntenseAnswerBeforeHalf only treats answers before the midpoint as fast", function () {
  assert.equal(wasIntenseAnswerBeforeHalf(2600, 5000), true);
  assert.equal(wasIntenseAnswerBeforeHalf(2500, 5000), false);
  assert.equal(wasIntenseAnswerBeforeHalf(1000, 5000), false);
});

test("getIntenseWeightMultiplier makes positive scores appear slightly less", function () {
  assert.equal(getIntenseWeightMultiplier({ score: 5 }) < 1, true);
  assert.equal(getIntenseWeightMultiplier({ score: -5 }) > 1, true);
  assert.equal(getIntenseWeightMultiplier({ score: 0 }), 1);
});

test("normalizeIntenseWeights sanitizes payloads and clamps scores", function () {
  assert.deepEqual(
    normalizeIntenseWeights(
      {
        "1": {
          attempts: 2.9,
          fastCorrect: -1,
          slowCorrect: 1,
          wrong: 4,
          score: 100,
        },
      },
      vocabulary
    ),
    {
      "1": {
        attempts: 2,
        fastCorrect: 0,
        slowCorrect: 1,
        wrong: 4,
        score: INTENSE_WEIGHT_MAX_SCORE,
      },
      "2": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
    }
  );
});

test("createIntenseWeightEntries formats scores for display", function () {
  var weights = createEmptyIntenseWeights(vocabulary);
  var entries;

  weights["1"].score = 1;
  entries = createIntenseWeightEntries(vocabulary, weights);

  assert.equal(entries[0].entry.id, 1);
  assert.equal(entries[0].scoreLabel, "+1.00");
  assert.equal(formatIntenseWeightScore(-1.5), "-1.50");
});
