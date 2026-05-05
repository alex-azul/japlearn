import {
  createEmptyIntenseWeights,
  INTENSE_WEIGHT_STORAGE_KEY,
  normalizeIntenseWeights,
} from "../domain/intense-weights.js";

function canUseStorage(storage) {
  return Boolean(storage && typeof storage.getItem === "function");
}

export function loadIntenseWeights(storage, vocabulary) {
  return loadIntenseWeightsWithKey(
    storage,
    vocabulary,
    INTENSE_WEIGHT_STORAGE_KEY
  );
}

export function loadIntenseWeightsWithKey(storage, vocabulary, storageKey) {
  if (!canUseStorage(storage)) {
    return createEmptyIntenseWeights(vocabulary);
  }

  try {
    var payload = storage.getItem(storageKey);

    if (!payload) {
      return createEmptyIntenseWeights(vocabulary);
    }

    return normalizeIntenseWeights(JSON.parse(payload), vocabulary);
  } catch (error) {
    return createEmptyIntenseWeights(vocabulary);
  }
}

export function saveIntenseWeights(storage, weightsById) {
  saveIntenseWeightsWithKey(storage, weightsById, INTENSE_WEIGHT_STORAGE_KEY);
}

export function saveIntenseWeightsWithKey(storage, weightsById, storageKey) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.setItem(storageKey, JSON.stringify(weightsById));
}

export function clearIntenseWeights(storage) {
  clearIntenseWeightsWithKey(storage, INTENSE_WEIGHT_STORAGE_KEY);
}

export function clearIntenseWeightsWithKey(storage, storageKey) {
  if (!canUseStorage(storage)) {
    return;
  }

  storage.removeItem(storageKey);
}
