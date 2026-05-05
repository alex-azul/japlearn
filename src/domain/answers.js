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

function stripAnswerPunctuation(value) {
  return value.replace(/[^a-z0-9]+/g, " ");
}

function isStandaloneAnswerWord(value) {
  return (
    value.length > 2 &&
    ![
      "and",
      "the",
      "for",
      "from",
      "into",
      "not",
      "off",
      "out",
      "that",
      "with",
    ].includes(value)
  );
}

function pushUniqueAnswer(answers, answer) {
  if (answer && !answers.includes(answer)) {
    answers.push(answer);
  }
}

export function normalizeTextAnswer(value) {
  return stripLeadingArticle(collapseWhitespace(value).toLowerCase());
}

export function getAcceptedTextAnswers(meaning, options = {}) {
  var answers = [];

  meaning
    .split(",")
    .forEach(function (fragment) {
      var normalizedFragment = normalizeTextAnswer(fragment);

      pushUniqueAnswer(answers, normalizedFragment);

      if (options.acceptStandaloneWords === true) {
        stripAnswerPunctuation(normalizedFragment)
          .split(" ")
          .filter(isStandaloneAnswerWord)
          .forEach(function (word) {
            pushUniqueAnswer(answers, word);
          });
      }
    });

  return answers;
}

export function isValidTextAnswer(answer, meaning, options = {}) {
  return isValidTextAnswerForMeanings(answer, [meaning], options);
}

export function isValidTextAnswerForMeanings(answer, meanings, options = {}) {
  var normalizedAnswer = normalizeTextAnswer(answer);
  var acceptedAnswers;

  if (!normalizedAnswer) {
    return false;
  }

  acceptedAnswers = meanings.reduce(function (answers, meaning) {
    return answers.concat(getAcceptedTextAnswers(meaning, options));
  }, []);

  return acceptedAnswers.includes(normalizedAnswer);
}
