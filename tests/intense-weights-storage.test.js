import assert from "node:assert/strict";
import test from "node:test";

import {
  clearIntenseWeights,
  loadIntenseWeights,
  saveIntenseWeights,
} from "../src/data/intense-weights-storage.js";
import { INTENSE_WEIGHT_STORAGE_KEY } from "../src/domain/intense-weights.js";

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

test("loadIntenseWeights returns empty weights when storage is missing", function () {
  assert.deepEqual(loadIntenseWeights(null, vocabulary), {
    "1": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
    "2": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
  });
});

test("saveIntenseWeights and loadIntenseWeights round-trip valid data", function () {
  var storage = createMemoryStorage();
  var weights = {
    "1": { attempts: 3, fastCorrect: 2, slowCorrect: 0, wrong: 1, score: 0.75 },
    "2": { attempts: 1, fastCorrect: 0, slowCorrect: 1, wrong: 0, score: -0.75 },
  };

  saveIntenseWeights(storage, weights);

  assert.deepEqual(loadIntenseWeights(storage, vocabulary), weights);
});

test("loadIntenseWeights falls back to empty weights on corrupt JSON", function () {
  var storage = createMemoryStorage();

  storage.setItem(INTENSE_WEIGHT_STORAGE_KEY, "{broken");

  assert.deepEqual(loadIntenseWeights(storage, vocabulary), {
    "1": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
    "2": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
  });
});

test("clearIntenseWeights removes persisted data", function () {
  var storage = createMemoryStorage();

  saveIntenseWeights(storage, {
    "1": { attempts: 1, fastCorrect: 1, slowCorrect: 0, wrong: 0, score: 1 },
    "2": { attempts: 0, fastCorrect: 0, slowCorrect: 0, wrong: 0, score: 0 },
  });
  clearIntenseWeights(storage);

  assert.equal(storage.getItem(INTENSE_WEIGHT_STORAGE_KEY), null);
});
