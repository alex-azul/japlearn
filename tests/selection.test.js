import assert from "node:assert/strict";
import test from "node:test";

import {
  createOptions,
  normalizeRange,
  pickNextWord,
} from "../src/domain/selection.js";

function createEntry(id, meaning) {
  return {
    id: id,
    kanji: "K" + id,
    furigana: "f" + id,
    romaji: "r" + id,
    meaning: meaning,
  };
}

function createStats(entries, appearances = 1) {
  return new Map(
    entries.map(function (entry) {
      return [
        entry.id,
        {
          appearances: appearances,
          correct: appearances,
          wrong: 0,
          winRate: appearances === 0 ? 0 : 1,
          responseMode: "choice",
        },
      ];
    })
  );
}

test("normalizeRange clamps values and fixes inverted ranges", function () {
  assert.deepEqual(normalizeRange(0, 100, { start: 5, end: 10 }, 20), {
    start: 1,
    end: 20,
  });
  assert.deepEqual(normalizeRange(12, 3, { start: 5, end: 10 }, 20), {
    start: 12,
    end: 12,
  });
});

test("createOptions always returns one correct answer plus three distractors", function () {
  var options = createOptions(
    "correct",
    ["correct", "one", "two", "three", "four"],
    function () {
      return 0;
    }
  );

  assert.equal(options.length, 4);
  assert.equal(options.includes("correct"), true);
  assert.equal(new Set(options).size, 4);
});

test("pickNextWord prioritizes unseen entries", function () {
  var entries = [
    createEntry(1, "one"),
    createEntry(2, "two"),
    createEntry(3, "three"),
  ];
  var runState = {
    runPool: entries,
    statsById: createStats(entries, 1),
    lastWordId: null,
  };

  runState.statsById.get(2).appearances = 0;
  runState.statsById.get(2).correct = 0;
  runState.statsById.get(2).winRate = 0;

  assert.equal(
    pickNextWord(runState, function () {
      return 0;
    }).id,
    2
  );
});

test("pickNextWord avoids repeating the last word when the pool is larger than four", function () {
  var entries = [
    createEntry(1, "one"),
    createEntry(2, "two"),
    createEntry(3, "three"),
    createEntry(4, "four"),
    createEntry(5, "five"),
  ];
  var runState = {
    runPool: entries,
    statsById: createStats(entries, 1),
    lastWordId: 1,
  };

  assert.notEqual(
    pickNextWord(runState, function () {
      return 0;
    }).id,
    1
  );
});
