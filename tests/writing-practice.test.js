import assert from "node:assert/strict";
import test from "node:test";

import {
  createWritingSession,
  getCurrentWritingEntry,
  getRemainingCount,
  isValidWritingCopyAnswer,
  normalizeWritingCopy,
  submitWritingAnswer,
} from "../src/domain/writing-practice.js";

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
    furigana: "ichiban",
    romaji: "ichiban",
    meaning: "the best, the first",
  },
];

test("normalizeWritingCopy ignores case and repeated whitespace only", function () {
  assert.equal(normalizeWritingCopy("  THE   BEST,   THE FIRST "), "the best, the first");
});

test("isValidWritingCopyAnswer requires the full visible meaning", function () {
  assert.equal(isValidWritingCopyAnswer(" LIGHT,   BRIGHT ", "light, bright"), true);
  assert.equal(
    isValidWritingCopyAnswer("the best the first", "the best, the first"),
    false
  );
  assert.equal(isValidWritingCopyAnswer("best, the first", "the best, the first"), false);
});

test("createWritingSession creates a linear session for the selected range", function () {
  var session = createWritingSession({ start: 2, end: 3 }, vocabulary);

  assert.equal(session.poolSize, 2);
  assert.equal(getCurrentWritingEntry(session).id, 2);
  assert.equal(getRemainingCount(session), 2);
});

test("submitWritingAnswer advances in order and completes after the last entry", function () {
  var session = createWritingSession({ start: 1, end: 2 }, vocabulary);

  assert.equal(submitWritingAnswer(session, "BLUE"), true);
  assert.equal(session.completedCount, 1);
  assert.equal(getCurrentWritingEntry(session).id, 2);

  assert.equal(submitWritingAnswer(session, "light, bright"), true);
  assert.equal(session.isComplete, true);
  assert.equal(getCurrentWritingEntry(session), null);
  assert.equal(getRemainingCount(session), 0);
});
