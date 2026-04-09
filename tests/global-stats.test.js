import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGlobalAnswer,
  createEmptyGlobalStats,
  createStatsScreenEntries,
  formatWordAccuracy,
  normalizeGlobalStats,
} from "../src/domain/global-stats.js";

var vocabulary = [
  { id: 1, kanji: "", furigana: "a", romaji: "a", meaning: "one" },
  { id: 2, kanji: "", furigana: "b", romaji: "b", meaning: "two" },
];

test("createEmptyGlobalStats initializes all words at zero", function () {
  assert.deepEqual(createEmptyGlobalStats(vocabulary), {
    "1": { appearances: 0, correct: 0, wrong: 0 },
    "2": { appearances: 0, correct: 0, wrong: 0 },
  });
});

test("applyGlobalAnswer increments appearances and result counters", function () {
  var stats = createEmptyGlobalStats(vocabulary);

  applyGlobalAnswer(stats, 1, true);
  applyGlobalAnswer(stats, 1, false);

  assert.deepEqual(stats["1"], {
    appearances: 2,
    correct: 1,
    wrong: 1,
  });
});

test("normalizeGlobalStats sanitizes invalid payloads", function () {
  assert.deepEqual(
    normalizeGlobalStats(
      {
        "1": { appearances: 2.8, correct: -1, wrong: 3 },
      },
      vocabulary
    ),
    {
      "1": { appearances: 2, correct: 0, wrong: 3 },
      "2": { appearances: 0, correct: 0, wrong: 0 },
    }
  );
});

test("formatWordAccuracy handles empty and non-empty stats", function () {
  assert.equal(formatWordAccuracy({ appearances: 0, correct: 0, wrong: 0 }), "\u2014");
  assert.equal(formatWordAccuracy({ appearances: 4, correct: 3, wrong: 1 }), "75.0%");
});

test("createStatsScreenEntries keeps vocabulary order and derives accuracy", function () {
  var entries = createStatsScreenEntries(
    vocabulary,
    {
      "1": { appearances: 2, correct: 1, wrong: 1 },
      "2": { appearances: 0, correct: 0, wrong: 0 },
    }
  );

  assert.equal(entries[0].entry.id, 1);
  assert.equal(entries[0].accuracyLabel, "50.0%");
  assert.equal(entries[1].entry.id, 2);
  assert.equal(entries[1].accuracyLabel, "\u2014");
});
