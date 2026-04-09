import { collapseWhitespace } from "../shared/text.js";

export function getPromptText(entry) {
  return entry.kanji || entry.furigana;
}

export function getReadingText(entry) {
  return entry.furigana || "";
}

function stripLeadingArticle(value) {
  return value.replace(/^(a|an|the)\s+/i, "");
}

export function normalizeTextAnswer(value) {
  return stripLeadingArticle(collapseWhitespace(value).toLowerCase());
}

export function getAcceptedTextAnswers(meaning) {
  return meaning
    .split(",")
    .map(function (fragment) {
      return normalizeTextAnswer(fragment);
    })
    .filter(function (fragment) {
      return fragment.length > 0;
    });
}

export function isValidTextAnswer(answer, meaning) {
  var normalizedAnswer = normalizeTextAnswer(answer);

  if (!normalizedAnswer) {
    return false;
  }

  return getAcceptedTextAnswers(meaning).includes(normalizedAnswer);
}
