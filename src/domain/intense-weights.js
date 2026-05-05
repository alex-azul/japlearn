export var INTENSE_WEIGHT_STORAGE_KEY = "japlearn2.intense-weights.v1";
export var INTENSE_HARD_WEIGHT_STORAGE_KEY =
  "japlearn2.intense-hard-weights.v1";
export var RADICAL_INTENSE_WEIGHT_STORAGE_KEY =
  "japlearn2.radical-intense-weights.v1";
export var INTENSE_WEIGHT_MIN_SCORE = -12;
export var INTENSE_WEIGHT_MAX_SCORE = 12;
export var INTENSE_FAST_CORRECT_DELTA = 1;
export var INTENSE_SLOW_CORRECT_DELTA = -0.75;
export var INTENSE_WRONG_DELTA = -1.25;

function createEmptyIntenseWordWeight() {
  return {
    attempts: 0,
    fastCorrect: 0,
    slowCorrect: 0,
    wrong: 0,
    score: 0,
  };
}

function clampScore(value) {
  var nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    nextValue = 0;
  }

  nextValue = Math.max(
    INTENSE_WEIGHT_MIN_SCORE,
    Math.min(INTENSE_WEIGHT_MAX_SCORE, nextValue)
  );

  return Math.round(nextValue * 100) / 100;
}

function normalizeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function createEmptyIntenseWeights(vocabulary) {
  var weightsById = {};

  vocabulary.forEach(function (entry) {
    weightsById[String(entry.id)] = createEmptyIntenseWordWeight();
  });

  return weightsById;
}

export function normalizeIntenseWeights(rawWeights, vocabulary) {
  var safeWeights = rawWeights && typeof rawWeights === "object" ? rawWeights : {};
  var normalized = {};

  vocabulary.forEach(function (entry) {
    var nextId = String(entry.id);
    var wordWeight = safeWeights[nextId] || {};

    normalized[nextId] = {
      attempts: normalizeCount(wordWeight.attempts),
      fastCorrect: normalizeCount(wordWeight.fastCorrect),
      slowCorrect: normalizeCount(wordWeight.slowCorrect),
      wrong: normalizeCount(wordWeight.wrong),
      score: clampScore(wordWeight.score),
    };
  });

  return normalized;
}

export function wasIntenseAnswerBeforeHalf(timeRemainingMs, timeLimitMs) {
  if (!Number.isFinite(timeRemainingMs) || !Number.isFinite(timeLimitMs)) {
    return false;
  }

  return timeRemainingMs > timeLimitMs / 2;
}

export function applyIntenseWeightAnswer(weightsById, wordId, result) {
  var nextId = String(wordId);
  var currentWeight = weightsById[nextId] || createEmptyIntenseWordWeight();
  var isCorrect = Boolean(result && result.isCorrect);
  var wasFastCorrect = Boolean(result && result.wasFastCorrect);
  var delta = isCorrect
    ? wasFastCorrect
      ? INTENSE_FAST_CORRECT_DELTA
      : INTENSE_SLOW_CORRECT_DELTA
    : INTENSE_WRONG_DELTA;

  weightsById[nextId] = {
    attempts: currentWeight.attempts + 1,
    fastCorrect: currentWeight.fastCorrect + (isCorrect && wasFastCorrect ? 1 : 0),
    slowCorrect: currentWeight.slowCorrect + (isCorrect && !wasFastCorrect ? 1 : 0),
    wrong: currentWeight.wrong + (isCorrect ? 0 : 1),
    score: clampScore(currentWeight.score + delta),
  };

  return weightsById[nextId];
}

export function getIntenseWeightMultiplier(wordWeight) {
  var score = wordWeight ? clampScore(wordWeight.score) : 0;

  return 1 - score * 0.02;
}

export function formatIntenseWeightScore(score) {
  var safeScore = clampScore(score);

  if (safeScore > 0) {
    return "+" + safeScore.toFixed(2);
  }

  return safeScore.toFixed(2);
}

export function createIntenseWeightEntries(vocabulary, weightsById) {
  return vocabulary.map(function (entry) {
    var weight = weightsById[String(entry.id)] || createEmptyIntenseWordWeight();

    return {
      entry: entry,
      weight: weight,
      score: weight.score,
      scoreLabel: formatIntenseWeightScore(weight.score),
      multiplier: getIntenseWeightMultiplier(weight),
    };
  });
}
