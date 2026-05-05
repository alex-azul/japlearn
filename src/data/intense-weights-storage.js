import {
  createEmptyIntenseWeights,
  INTENSE_WEIGHT_STORAGE_KEY,
  normalizeIntenseWeights,
} from "../domain/intense-weights.js";

function canUseStorage(storage) {
  return Boolean(storage && typeof storage.getItem === "function");
}

export function loadIntenseWeights(storage, vocabulary) {
  if (!canUseStorage(storage)) {
    return createEmptyIntenseWeights(vocabulary);
  }

  try {
    var payload = storage.getItem(INTENSE_WEIGHT_STORAGE_KEY);

    if (!payload) {
      return createEmptyIntenseWeights(vocabulary);
    }

    return normalizeIntenseWeights(JSON.parse(payload), vocabulary);
  } catch (error) {
    return createEmptyIntenseWeights(vocabulary);
  }
}

export function saveIntenseWeights(storage, weightsById) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.setItem(INTENSE_WEIGHT_STORAGE_KEY, JSON.stringify(weightsById));
}

export function clearIntenseWeights(storage) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.removeItem(INTENSE_WEIGHT_STORAGE_KEY);
}
