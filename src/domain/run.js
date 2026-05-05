import {
  getPromptText,
  getReadingText,
  isValidTextAnswerForMeanings,
} from "./answers.js";
import { getRangeEntries } from "./selection.js";

function createStatsMap(entries) {
  var statsById = new Map();

  entries.forEach(function (entry) {
    statsById.set(entry.id, {
      appearances: 0,
      correct: 0,
      wrong: 0,
      winRate: 0,
      responseMode: "choice",
    });
  });

  return statsById;
}

export function createRunState(range, vocabulary, meaningPool) {
  var runRange = {
    start: range.start,
    end: range.end,
  };
  var runPool = getRangeEntries(vocabulary, runRange);

  return {
    range: runRange,
    poolSize: runPool.length,
    runPool: runPool,
    meaningPool: meaningPool,
    statsById: createStatsMap(runPool),
    answeredCount: 0,
    correctCount: 0,
    lastFailure: null,
    lastWordId: null,
    currentWord: null,
    currentResponseMode: "choice",
    currentOptions: [],
  };
}

export function formatAccuracy(correctCount, answeredCount) {
  if (answeredCount === 0) {
    return "0%";
  }

  return ((correctCount / answeredCount) * 100).toFixed(1) + "%";
}

function updateFailure(runState, currentWord) {
  runState.lastFailure = {
    kanji: currentWord.kanji,
    furigana: getReadingText(currentWord),
    prompt: getPromptText(currentWord),
    meaning: currentWord.meaning,
  };
}

function finalizeAnswer(runState, currentWord, stats, isCorrect) {
  stats.winRate = stats.correct / stats.appearances;
  runState.answeredCount += 1;
  runState.lastWordId = currentWord.id;
  return isCorrect;
}

export function recordChoiceAnswer(
  runState,
  answerValue,
  options = {
    promoteOnCorrect: true,
  }
) {
  var currentWord = runState.currentWord;
  var stats = runState.statsById.get(currentWord.id);
  var isCorrect = answerValue === currentWord.meaning;
  var promoteOnCorrect = options.promoteOnCorrect !== false;

  stats.appearances += 1;

  if (isCorrect) {
    stats.correct += 1;
    runState.correctCount += 1;
    stats.responseMode = promoteOnCorrect ? "text" : "choice";
  } else {
    stats.wrong += 1;
    stats.responseMode = "choice";
    updateFailure(runState, currentWord);
  }

  return finalizeAnswer(runState, currentWord, stats, isCorrect);
}

export function recordTextAnswer(
  runState,
  answerValue,
  acceptedMeanings,
  options = {}
) {
  var currentWord = runState.currentWord;
  var stats = runState.statsById.get(currentWord.id);
  var meanings =
    Array.isArray(acceptedMeanings) && acceptedMeanings.length > 0
      ? acceptedMeanings
      : [currentWord.meaning];
  var isCorrect = isValidTextAnswerForMeanings(answerValue, meanings);

  stats.appearances += 1;

  if (isCorrect) {
    stats.correct += 1;
    runState.correctCount += 1;
    stats.responseMode = options.responseModeOnCorrect || "text";
  } else {
    stats.wrong += 1;
    stats.responseMode = options.responseModeOnWrong || "choice";
    updateFailure(runState, currentWord);
  }

  return finalizeAnswer(runState, currentWord, stats, isCorrect);
}

function recordTextModeAnswer(runState, answerValue) {
  return recordTextAnswer(runState, answerValue, [runState.currentWord.meaning]);
}

export function recordAnswer(runState, answerValue) {
  if (runState.currentResponseMode === "text") {
    return recordTextModeAnswer(runState, answerValue);
  }

  return recordChoiceAnswer(runState, answerValue, {
    promoteOnCorrect: true,
  });
}
