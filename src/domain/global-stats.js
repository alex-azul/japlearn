export var GLOBAL_STATS_STORAGE_KEY = "japlearn2.global-stats.v1";

function createEmptyWordStats() {
  return {
    appearances: 0,
    correct: 0,
    wrong: 0,
  };
}

export function createEmptyGlobalStats(vocabulary) {
  var statsById = {};

  vocabulary.forEach(function (entry) {
    statsById[String(entry.id)] = createEmptyWordStats();
  });

  return statsById;
}

export function normalizeGlobalStats(rawStats, vocabulary) {
  var safeStats = rawStats && typeof rawStats === "object" ? rawStats : {};
  var normalized = {};

  vocabulary.forEach(function (entry) {
    var nextId = String(entry.id);
    var wordStats = safeStats[nextId] || {};

    normalized[nextId] = {
      appearances: Number.isFinite(wordStats.appearances)
        ? Math.max(0, Math.floor(wordStats.appearances))
        : 0,
      correct: Number.isFinite(wordStats.correct)
        ? Math.max(0, Math.floor(wordStats.correct))
        : 0,
      wrong: Number.isFinite(wordStats.wrong)
        ? Math.max(0, Math.floor(wordStats.wrong))
        : 0,
    };
  });

  return normalized;
}

export function applyGlobalAnswer(statsById, wordId, isCorrect) {
  var nextId = String(wordId);
  var currentStats = statsById[nextId] || createEmptyWordStats();

  statsById[nextId] = {
    appearances: currentStats.appearances + 1,
    correct: currentStats.correct + (isCorrect ? 1 : 0),
    wrong: currentStats.wrong + (isCorrect ? 0 : 1),
  };

  return statsById[nextId];
}

export function getWordAccuracy(wordStats) {
  if (!wordStats || wordStats.appearances === 0) {
    return 0;
  }

  return wordStats.correct / wordStats.appearances;
}

export function formatWordAccuracy(wordStats) {
  if (!wordStats || wordStats.appearances === 0) {
    return "\u2014";
  }

  return (getWordAccuracy(wordStats) * 100).toFixed(1) + "%";
}

export function createStatsScreenEntries(vocabulary, statsById) {
  return vocabulary.map(function (entry) {
    var wordStats = statsById[String(entry.id)] || createEmptyWordStats();

    return {
      entry: entry,
      stats: wordStats,
      accuracy: getWordAccuracy(wordStats),
      accuracyLabel: formatWordAccuracy(wordStats),
    };
  });
}
