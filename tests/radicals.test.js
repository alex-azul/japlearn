import assert from "node:assert/strict";
import test from "node:test";

import { loadRadicals } from "../src/data/radicals.js";

test("loadRadicals maps radical rows to practice entries", function () {
  var radicals = loadRadicals([
    {
      id: 9,
      radical: "人",
      variants: "亻",
      strokes: 2,
      name: "persona",
      mnemonic: "人 abre dos piernas; asocialo con persona.",
      kind: "kangxi",
    },
  ]);

  assert.deepEqual(radicals, [
    {
      id: 9,
      kanji: "人",
      radical: "人",
      variants: "亻",
      strokes: 2,
      furigana: "Var. 亻 - 2 trazos",
      romaji: "",
      meaning: "persona",
      mnemonic: "人 abre dos piernas; asocialo con persona.",
      kind: "kangxi",
    },
  ]);
});
