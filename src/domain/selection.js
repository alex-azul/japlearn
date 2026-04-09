function shuffleInPlace(items, randomFn) {
  var index;
  var swapIndex;
  var current;

  for (index = items.length - 1; index > 0; index -= 1) {
    swapIndex = Math.floor(randomFn() * (index + 1));
    current = items[index];
    items[index] = items[swapIndex];
    items[swapIndex] = current;
  }

  return items;
}

function getWeightedCandidates(runState) {
  var candidates = runState.runPool;

  if (runState.runPool.length > 4 && runState.lastWordId !== null) {
    var filtered = runState.runPool.filter(function (entry) {
      return entry.id !== runState.lastWordId;
    });

    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  return candidates;
}

function pickByWeight(weightedItems, randomFn) {
  var totalWeight = weightedItems.reduce(function (sum, item) {
    return sum + item.weight;
  }, 0);
  var target = randomFn() * totalWeight;
  var index;

  for (index = 0; index < weightedItems.length; index += 1) {
    target -= weightedItems[index].weight;

    if (target <= 0) {
      return weightedItems[index].entry;
    }
  }

  return weightedItems[weightedItems.length - 1].entry;
}

export function clampInteger(value, fallback, minValue, maxValue) {
  var nextValue = Number(value);

  if (!Number.isFinite(nextValue)) {
    nextValue = fallback;
  }

  return Math.max(minValue, Math.min(maxValue, Math.floor(nextValue)));
}

export function normalizeRange(startValue, endValue, fallbackRange, maxValue) {
  var nextStart = clampInteger(startValue, fallbackRange.start, 1, maxValue);
  var nextEnd = clampInteger(endValue, fallbackRange.end, 1, maxValue);

  if (nextEnd < nextStart) {
    nextEnd = nextStart;
  }

  return {
    start: nextStart,
    end: nextEnd,
  };
}

export function formatRange(range) {
  return range.start + "-" + range.end;
}

export function getRangeEntries(entries, range) {
  return entries.slice(range.start - 1, range.end);
}

export function pickNextWord(runState, randomFn = Math.random) {
  var candidates = getWeightedCandidates(runState);
  var unseen = candidates.filter(function (entry) {
    return runState.statsById.get(entry.id).appearances === 0;
  });

  if (unseen.length > 0) {
    return unseen[Math.floor(randomFn() * unseen.length)];
  }

  var weightedItems = candidates.map(function (entry) {
    var stats = runState.statsById.get(entry.id);
    var weight = 1 + (1 - stats.winRate) * 100 + stats.wrong * 10;

    return { entry: entry, weight: weight };
  });

  return pickByWeight(weightedItems, randomFn);
}

export function createOptions(
  correctMeaning,
  meaningPool,
  optionCount = 4,
  randomFn = Math.random
) {
  var resolvedOptionCount = optionCount;
  var resolvedRandomFn = randomFn;
  var distractorCount;
  var distractors;

  if (typeof optionCount === "function") {
    resolvedOptionCount = 4;
    resolvedRandomFn = optionCount;
  }

  distractorCount = Math.max(resolvedOptionCount - 1, 0);
  distractors = shuffleInPlace(
    meaningPool.filter(function (meaning) {
      return meaning !== correctMeaning;
    }),
    resolvedRandomFn
  ).slice(0, distractorCount);

  return shuffleInPlace([correctMeaning].concat(distractors), resolvedRandomFn);
}
