import {
  createEmptyGlobalStats,
  GLOBAL_STATS_STORAGE_KEY,
  normalizeGlobalStats,
} from "../domain/global-stats.js";

function canUseStorage(storage) {
  return Boolean(storage && typeof storage.getItem === "function");
}

export function loadGlobalStats(storage, vocabulary) {
  if (!canUseStorage(storage)) {
    return createEmptyGlobalStats(vocabulary);
  }

  try {
    var payload = storage.getItem(GLOBAL_STATS_STORAGE_KEY);

    if (!payload) {
      return createEmptyGlobalStats(vocabulary);
    }

    return normalizeGlobalStats(JSON.parse(payload), vocabulary);
  } catch (error) {
    return createEmptyGlobalStats(vocabulary);
  }
}

export function saveGlobalStats(storage, statsById) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.setItem(GLOBAL_STATS_STORAGE_KEY, JSON.stringify(statsById));
}

export function clearGlobalStats(storage) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.removeItem(GLOBAL_STATS_STORAGE_KEY);
}
