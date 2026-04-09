import assert from "node:assert/strict";
import test from "node:test";

import {
  clearGlobalStats,
  loadGlobalStats,
  saveGlobalStats,
} from "../src/data/global-stats-storage.js";

var vocabulary = [
  { id: 1, kanji: "", furigana: "a", romaji: "a", meaning: "one" },
  { id: 2, kanji: "", furigana: "b", romaji: "b", meaning: "two" },
];

function createMemoryStorage() {
  var store = new Map();

  return {
    getItem: function (key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem: function (key, value) {
      store.set(key, String(value));
    },
    removeItem: function (key) {
      store.delete(key);
    },
  };
}

test("loadGlobalStats returns empty stats when storage is missing", function () {
  assert.deepEqual(loadGlobalStats(null, vocabulary), {
    "1": { appearances: 0, correct: 0, wrong: 0 },
    "2": { appearances: 0, correct: 0, wrong: 0 },
  });
});

test("saveGlobalStats and loadGlobalStats round-trip valid data", function () {
  var storage = createMemoryStorage();
  var stats = {
    "1": { appearances: 3, correct: 2, wrong: 1 },
    "2": { appearances: 1, correct: 1, wrong: 0 },
  };

  saveGlobalStats(storage, stats);

  assert.deepEqual(loadGlobalStats(storage, vocabulary), stats);
});

test("loadGlobalStats falls back to empty stats on corrupt JSON", function () {
  var storage = createMemoryStorage();

  storage.setItem("japlearn2.global-stats.v1", "{broken");

  assert.deepEqual(loadGlobalStats(storage, vocabulary), {
    "1": { appearances: 0, correct: 0, wrong: 0 },
    "2": { appearances: 0, correct: 0, wrong: 0 },
  });
});

test("clearGlobalStats removes persisted data", function () {
  var storage = createMemoryStorage();

  saveGlobalStats(storage, {
    "1": { appearances: 1, correct: 1, wrong: 0 },
    "2": { appearances: 0, correct: 0, wrong: 0 },
  });
  clearGlobalStats(storage);

  assert.equal(storage.getItem("japlearn2.global-stats.v1"), null);
});
