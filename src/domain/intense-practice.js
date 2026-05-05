import { getPromptText } from "./answers.js";
import { createRunState, recordChoiceAnswer, recordTextAnswer } from "./run.js";
import { createOptions, pickNextWord } from "./selection.js";
import { getIntenseWeightMultiplier } from "./intense-weights.js";

export var INTENSE_OPTION_COUNT = 3;
export var INTENSE_TIME_LIMIT_MS = 5000;
export var INTENSE_HARD_TIME_LIMIT_MS = INTENSE_TIME_LIMIT_MS * 2;
export var INTENSE_HIT_TRANSITION_MS = 190;

function pushUnique(items, value) {
  if (!items.includes(value)) {
    items.push(value);
  }
}

export function createMeaningsByPrompt(vocabulary) {
  var meaningsByPrompt = {};

  vocabulary.forEach(function (entry) {
    var prompt = getPromptText(entry);

    if (!meaningsByPrompt[prompt]) {
      meaningsByPrompt[prompt] = [];
    }

    pushUnique(meaningsByPrompt[prompt], entry.meaning);
  });

  return meaningsByPrompt;
}

function getAcceptedMeaningsForWord(session, word) {
  var prompt = getPromptText(word);
  var meanings = session.meaningsByPrompt[prompt];

  return meanings && meanings.length > 0 ? meanings : [word.meaning];
}

function formatAcceptedMeanings(meanings) {
  return meanings.join(" / ");
}

export function createIntenseSession(
  range,
  vocabulary,
  meaningPool,
  intenseWeightsById = {},
  options = {}
) {
  var answerMode = options.answerMode === "text" ? "text" : "choice";
  var timeLimitMs =
    answerMode === "text" ? INTENSE_HARD_TIME_LIMIT_MS : INTENSE_TIME_LIMIT_MS;

  return {
    run: createRunState(range, vocabulary, meaningPool),
    intenseWeightsById: intenseWeightsById,
    answerMode: answerMode,
    dataKind: options.dataKind || "vocabulary",
    promptLabel: options.promptLabel || "",
    meaningsByPrompt:
      options.meaningsByPrompt || createMeaningsByPrompt(vocabulary),
    currentAcceptedMeanings: [],
    comboCount: 0,
    isPaused: false,
    pauseReason: "",
    pauseCorrectMeaning: "",
    isTransitioning: false,
    timeLimitMs: timeLimitMs,
    timeRemainingMs: timeLimitMs,
  };
}

export function advanceIntenseQuestion(session, randomFn = Math.random) {
  var nextWord = pickNextWord(session.run, randomFn, {
    prioritizeUnseen: false,
    getWeightMultiplier: function (entry) {
      return getIntenseWeightMultiplier(
        session.intenseWeightsById[String(entry.id)]
      );
    },
  });

  session.run.currentWord = nextWord;
  session.run.currentResponseMode = session.answerMode;
  session.currentAcceptedMeanings = getAcceptedMeaningsForWord(session, nextWord);
  session.run.currentOptions =
    session.answerMode === "choice"
      ? createOptions(
          nextWord.meaning,
          session.run.meaningPool,
          INTENSE_OPTION_COUNT,
          randomFn
        )
      : [];
  session.isPaused = false;
  session.pauseReason = "";
  session.pauseCorrectMeaning = "";
  session.isTransitioning = false;
  session.timeRemainingMs = session.timeLimitMs;
  return nextWord;
}

export function submitIntenseAnswer(session, answerValue) {
  var isCorrect =
    session.answerMode === "text"
      ? recordTextAnswer(
          session.run,
          answerValue,
          session.currentAcceptedMeanings,
          {
            acceptStandaloneWords: true,
            responseModeOnCorrect: "text",
            responseModeOnWrong: "text",
          }
        )
      : recordChoiceAnswer(session.run, answerValue, {
          promoteOnCorrect: false,
        });

  session.comboCount = isCorrect ? session.comboCount + 1 : 0;
  session.pauseCorrectMeaning =
    session.answerMode === "text"
      ? formatAcceptedMeanings(session.currentAcceptedMeanings)
      : session.run.currentWord.meaning;
  return isCorrect;
}

export function pauseIntenseSession(session, reason) {
  session.isPaused = true;
  session.isTransitioning = false;
  session.pauseReason = reason;
  session.pauseCorrectMeaning = session.run.currentWord
    ? session.answerMode === "text"
      ? formatAcceptedMeanings(session.currentAcceptedMeanings)
      : session.run.currentWord.meaning
    : "";

  if (reason === "timeout") {
    session.timeRemainingMs = 0;
  }
}

export function startIntenseTransition(session) {
  session.isPaused = false;
  session.pauseReason = "";
  session.pauseCorrectMeaning = "";
  session.isTransitioning = true;
}
