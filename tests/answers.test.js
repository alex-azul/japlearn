import assert from "node:assert/strict";
import test from "node:test";

import {
  getAcceptedTextAnswers,
  isValidTextAnswer,
  normalizeTextAnswer,
} from "../src/domain/answers.js";

test("normalizeTextAnswer normalizes case, spaces and leading articles", function () {
  assert.equal(normalizeTextAnswer("  THE   BEST "), "best");
  assert.equal(normalizeTextAnswer(" a pair of glasses "), "pair of glasses");
});

test("getAcceptedTextAnswers splits comma-separated meanings", function () {
  assert.deepEqual(getAcceptedTextAnswers("light, bright"), [
    "light",
    "bright",
  ]);
});

test("isValidTextAnswer accepts any normalized comma-separated synonym", function () {
  assert.equal(isValidTextAnswer("bright", "light, bright"), true);
  assert.equal(
    isValidTextAnswer("  the   best ", "No. 1, the best, the first"),
    true
  );
  assert.equal(isValidTextAnswer("pair of glasses", "a pair of glasses"), true);
});

test("isValidTextAnswer rejects partial substrings and empty answers", function () {
  assert.equal(isValidTextAnswer("glass", "a pair of glasses"), false);
  assert.equal(isValidTextAnswer("glasses", "a pair of glasses"), false);
  assert.equal(isValidTextAnswer("   ", "light, bright"), false);
});
