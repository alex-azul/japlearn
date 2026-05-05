import { trimText } from "../shared/text.js";

function formatRadicalReading(entry) {
  var variants = trimText(entry.variants);
  var strokes = Number(entry.strokes);
  var strokeLabel =
    Number.isFinite(strokes) && strokes > 0 ? strokes + " trazos" : "";

  if (variants && strokeLabel) {
    return "Var. " + variants + " - " + strokeLabel;
  }

  return variants ? "Var. " + variants : strokeLabel;
}

export function loadRadicals(rawRadicals = []) {
  return rawRadicals
    .map(function (entry) {
      var strokes = Number(entry.strokes);

      return {
        id: Number(entry.id),
        kanji: trimText(entry.radical),
        radical: trimText(entry.radical),
        variants: trimText(entry.variants),
        strokes: Number.isFinite(strokes) ? strokes : 0,
        furigana: formatRadicalReading(entry),
        romaji: "",
        meaning: trimText(entry.name),
        mnemonic: trimText(entry.mnemonic),
        kind: trimText(entry.kind),
      };
    })
    .filter(function (entry) {
      return entry.id && entry.radical && entry.meaning;
    });
}
