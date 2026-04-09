import { getPromptText, getReadingText, isValidTextAnswer } from "./answers.js";
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

export function recordAnswer(runState, answerValue) {
  var currentWord = runState.currentWord;
  var stats = runState.statsById.get(currentWord.id);
  var isTextMode = runState.currentResponseMode === "text";
  var isCorrect = isTextMode
    ? isValidTextAnswer(answerValue, currentWord.meaning)
    : answerValue === currentWord.meaning;

  stats.appearances += 1;

  if (isCorrect) {
    stats.correct += 1;
    runState.correctCount += 1;
    stats.responseMode = "text";
  } else {
    stats.wrong += 1;
    stats.responseMode = "choice";
    runState.lastFailure = {
      kanji: currentWord.kanji,
      furigana: getReadingText(currentWord),
      prompt: getPromptText(currentWord),
      meaning: currentWord.meaning,
    };
  }

  stats.winRate = stats.correct / stats.appearances;
  runState.answeredCount += 1;
  runState.lastWordId = currentWord.id;

  return isCorrect;
}
