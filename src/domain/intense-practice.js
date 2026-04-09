import { recordChoiceAnswer, createRunState } from "./run.js";
import { createOptions, pickNextWord } from "./selection.js";

export var INTENSE_OPTION_COUNT = 3;
export var INTENSE_TIME_LIMIT_MS = 5000;
export var INTENSE_HIT_TRANSITION_MS = 190;

export function createIntenseSession(range, vocabulary, meaningPool) {
  return {
    run: createRunState(range, vocabulary, meaningPool),
    comboCount: 0,
    isPaused: false,
    pauseReason: "",
    pauseCorrectMeaning: "",
    isTransitioning: false,
    timeLimitMs: INTENSE_TIME_LIMIT_MS,
    timeRemainingMs: INTENSE_TIME_LIMIT_MS,
  };
}

export function advanceIntenseQuestion(session, randomFn = Math.random) {
  var nextWord = pickNextWord(session.run, randomFn);

  session.run.currentWord = nextWord;
  session.run.currentResponseMode = "choice";
  session.run.currentOptions = createOptions(
    nextWord.meaning,
    session.run.meaningPool,
    INTENSE_OPTION_COUNT,
    randomFn
  );
  session.isPaused = false;
  session.pauseReason = "";
  session.pauseCorrectMeaning = "";
  session.isTransitioning = false;
  session.timeRemainingMs = session.timeLimitMs;
  return nextWord;
}

export function submitIntenseAnswer(session, answerValue) {
  var isCorrect = recordChoiceAnswer(session.run, answerValue, {
    promoteOnCorrect: false,
  });

  session.comboCount = isCorrect ? session.comboCount + 1 : 0;
  session.pauseCorrectMeaning = session.run.currentWord.meaning;
  return isCorrect;
}

export function pauseIntenseSession(session, reason) {
  session.isPaused = true;
  session.isTransitioning = false;
  session.pauseReason = reason;
  session.pauseCorrectMeaning = session.run.currentWord
    ? session.run.currentWord.meaning
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
