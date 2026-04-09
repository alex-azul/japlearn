import { trimText } from "../shared/text.js";

export function loadVocabulary(rawEntries = []) {
  return rawEntries
    .map(function (entry) {
      return {
        id: Number(entry.id),
        kanji: trimText(entry.kanji),
        furigana: trimText(entry.furigana),
        romaji: trimText(entry.romaji),
        meaning: trimText(entry.meaning),
      };
    })
    .filter(function (entry) {
      return entry.meaning && (entry.kanji || entry.furigana);
    });
}

export function buildMeaningPool(entries) {
  var seen = new Set();
  var meanings = [];

  entries.forEach(function (entry) {
    if (!seen.has(entry.meaning)) {
      seen.add(entry.meaning);
      meanings.push(entry.meaning);
    }
  });

  return meanings;
}
