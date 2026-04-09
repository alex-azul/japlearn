(function () {
  "use strict";

  function trimText(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function loadVocabulary(rawEntries) {
    return rawEntries
      .map(function (entry) {
        return {
          id: Number(entry.id),
          kanji: trimText(entry.kanji),
          furigana: trimText(entry.furigana),
          romaji: trimText(entry.romaji),
          meaning: trimText(entry.meaning),
        };
      })
      .filter(function (entry) {
        return entry.meaning && (entry.kanji || entry.furigana);
      });
  }

  function getPromptText(entry) {
    return entry.kanji || entry.furigana;
  }

  function getReadingText(entry) {
    return entry.furigana || "";
  }

  function shuffleInPlace(items) {
    for (var index = items.length - 1; index > 0; index -= 1) {
      var swapIndex = Math.floor(Math.random() * (index + 1));
      var current = items[index];
      items[index] = items[swapIndex];
      items[swapIndex] = current;
    }

    return items;
  }

  function buildMeaningPool(entries) {
    var seen = new Set();
    var meanings = [];

    entries.forEach(function (entry) {
      if (!seen.has(entry.meaning)) {
        seen.add(entry.meaning);
        meanings.push(entry.meaning);
      }
    });

    return meanings;
  }

  function createStatsMap(entries) {
    var statsById = new Map();

    entries.forEach(function (entry) {
      statsById.set(entry.id, {
        appearances: 0,
        correct: 0,
        wrong: 0,
        winRate: 0,
      });
    });

    return statsById;
  }

  function clampInteger(value, fallback, minValue, maxValue) {
    var nextValue = Number(value);

    if (!Number.isFinite(nextValue)) {
      nextValue = fallback;
    }

    return Math.max(minValue, Math.min(maxValue, Math.floor(nextValue)));
  }

  function normalizeRange(startValue, endValue, fallbackRange, maxValue) {
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

  function formatRange(range) {
    return range.start + "-" + range.end;
  }

  function getRangeEntries(entries, range) {
    return entries.slice(range.start - 1, range.end);
  }

  function createRunState(range, vocabulary, meaningPool) {
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
      currentOptions: [],
    };
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

  function pickByWeight(weightedItems) {
    var totalWeight = weightedItems.reduce(function (sum, item) {
      return sum + item.weight;
    }, 0);

    var target = Math.random() * totalWeight;

    for (var index = 0; index < weightedItems.length; index += 1) {
      target -= weightedItems[index].weight;

      if (target <= 0) {
        return weightedItems[index].entry;
      }
    }

    return weightedItems[weightedItems.length - 1].entry;
  }

  function pickNextWord(runState) {
    var candidates = getWeightedCandidates(runState);
    var unseen = candidates.filter(function (entry) {
      return runState.statsById.get(entry.id).appearances === 0;
    });

    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }

    var weightedItems = candidates.map(function (entry) {
      var stats = runState.statsById.get(entry.id);
      var weight = 1 + (1 - stats.winRate) * 100 + stats.wrong * 10;

      return { entry: entry, weight: weight };
    });

    return pickByWeight(weightedItems);
  }

  function createOptions(correctMeaning, meaningPool) {
    var distractors = shuffleInPlace(
      meaningPool.filter(function (meaning) {
        return meaning !== correctMeaning;
      })
    ).slice(0, 3);

    return shuffleInPlace([correctMeaning].concat(distractors));
  }

  function formatAccuracy(correctCount, answeredCount) {
    if (answeredCount === 0) {
      return "0%";
    }

    return ((correctCount / answeredCount) * 100).toFixed(1) + "%";
  }

  var vocabulary = loadVocabulary(window.VOCABULARY_DATA || []);
  var meaningPool = buildMeaningPool(vocabulary);

  var dom = {
    errorScreen: document.getElementById("error-screen"),
    errorMessage: document.getElementById("error-message"),
    startScreen: document.getElementById("start-screen"),
    practiceScreen: document.getElementById("practice-screen"),
    reviewScreen: document.getElementById("review-screen"),
    rangeStartInput: document.getElementById("range-start-input"),
    rangeEndInput: document.getElementById("range-end-input"),
    poolSizeDisplay: document.getElementById("pool-size-display"),
    poolTotalDisplay: document.getElementById("pool-total-display"),
    rangeDisplay: document.getElementById("range-display"),
    modeSelect: document.getElementById("mode-select"),
    startButton: document.getElementById("start-button"),
    statRange: document.getElementById("stat-range"),
    statPoolSize: document.getElementById("stat-pool-size"),
    statAnswered: document.getElementById("stat-answered"),
    statAccuracy: document.getElementById("stat-accuracy"),
    promptWord: document.getElementById("prompt-word"),
    optionsList: document.getElementById("options-list"),
    failureEmpty: document.getElementById("failure-empty"),
    failureDetails: document.getElementById("failure-details"),
    failureWord: document.getElementById("failure-word"),
    failureReading: document.getElementById("failure-reading"),
    failureMeaning: document.getElementById("failure-meaning"),
    reviewRange: document.getElementById("review-range"),
    reviewCount: document.getElementById("review-count"),
    reviewTotal: document.getElementById("review-total"),
    reviewGrid: document.getElementById("review-grid"),
    restartButton: document.getElementById("restart-button"),
    backButton: document.getElementById("back-button"),
    reviewBackButton: document.getElementById("review-back-button"),
  };

  var appState = {
    run: null,
    selectedRange: {
      start: 1,
      end: 20,
    },
    selectedMode: "practice",
  };

  function showScreen(screenName) {
    dom.errorScreen.classList.toggle("hidden", screenName !== "error");
    dom.startScreen.classList.toggle("hidden", screenName !== "start");
    dom.practiceScreen.classList.toggle("hidden", screenName !== "practice");
    dom.reviewScreen.classList.toggle("hidden", screenName !== "review");
  }

  function showError(message) {
    dom.errorMessage.textContent = message;
    showScreen("error");
  }

  function updateRangeSelectorDisplay(range) {
    var selectedCount = range.end - range.start + 1;

    dom.poolSizeDisplay.textContent = String(selectedCount);
    dom.poolTotalDisplay.textContent = String(vocabulary.length);
    dom.rangeDisplay.textContent = "Rango " + formatRange(range);
  }

  function syncRangeSelection(writeInputs) {
    var nextRange = normalizeRange(
      dom.rangeStartInput.value,
      dom.rangeEndInput.value,
      appState.selectedRange,
      vocabulary.length
    );

    appState.selectedRange = nextRange;
    updateRangeSelectorDisplay(nextRange);

    if (writeInputs) {
      dom.rangeStartInput.value = String(nextRange.start);
      dom.rangeEndInput.value = String(nextRange.end);
    }

    return nextRange;
  }

  function syncModeSelection() {
    var nextMode = dom.modeSelect.value === "review" ? "review" : "practice";

    appState.selectedMode = nextMode;
    dom.modeSelect.value = nextMode;
    dom.startButton.textContent =
      nextMode === "review" ? "Abrir repaso" : "Empezar pr\u00e1ctica";

    return nextMode;
  }

  function renderStats(runState) {
    dom.statRange.textContent = formatRange(runState.range);
    dom.statPoolSize.textContent = String(runState.poolSize);
    dom.statAnswered.textContent = String(runState.answeredCount);
    dom.statAccuracy.textContent = formatAccuracy(
      runState.correctCount,
      runState.answeredCount
    );
  }

  function renderLastFailure(runState) {
    var hasFailure = Boolean(runState.lastFailure);

    dom.failureEmpty.classList.toggle("hidden", hasFailure);
    dom.failureDetails.classList.toggle("hidden", !hasFailure);

    if (!hasFailure) {
      return;
    }

    dom.failureWord.textContent = runState.lastFailure.prompt;
    dom.failureReading.textContent = runState.lastFailure.furigana;
    dom.failureMeaning.textContent = runState.lastFailure.meaning;
  }

  function renderOptions(runState) {
    dom.optionsList.textContent = "";

    runState.currentOptions.forEach(function (meaning) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.textContent = meaning;
      button.addEventListener("click", function () {
        handleAnswer(meaning);
      });
      dom.optionsList.appendChild(button);
    });
  }

  function renderPractice(runState) {
    dom.promptWord.textContent = getPromptText(runState.currentWord);
    renderStats(runState);
    renderLastFailure(runState);
    renderOptions(runState);
  }

  function renderReview(range) {
    var reviewEntries = getRangeEntries(vocabulary, range);
    var fragment = document.createDocumentFragment();

    dom.reviewRange.textContent = formatRange(range);
    dom.reviewCount.textContent = String(reviewEntries.length);
    dom.reviewTotal.textContent = String(vocabulary.length);
    dom.reviewGrid.textContent = "";

    reviewEntries.forEach(function (entry) {
      var card = document.createElement("article");
      var word = document.createElement("h2");
      var reading = document.createElement("p");
      var meaning = document.createElement("p");

      card.className = "review-item";
      word.className = "review-word japanese-display";
      reading.className = "review-reading";
      meaning.className = "review-meaning";

      word.textContent = getPromptText(entry);
      reading.textContent = getReadingText(entry);
      meaning.textContent = entry.meaning;

      card.appendChild(word);
      card.appendChild(reading);
      card.appendChild(meaning);
      fragment.appendChild(card);
    });

    dom.reviewGrid.appendChild(fragment);
  }

  function advanceQuestion() {
    var runState = appState.run;

    runState.currentWord = pickNextWord(runState);
    runState.currentOptions = createOptions(
      runState.currentWord.meaning,
      runState.meaningPool
    );

    renderPractice(runState);
  }

  function startRun(range) {
    appState.run = createRunState(range, vocabulary, meaningPool);
    showScreen("practice");
    advanceQuestion();
  }

  function startReview(range) {
    appState.run = null;
    renderReview(range);
    showScreen("review");
  }

  function startSelectedMode() {
    var selectedRange = syncRangeSelection(true);
    var selectedMode = syncModeSelection();

    if (selectedMode === "review") {
      startReview(selectedRange);
      return;
    }

    startRun(selectedRange);
  }

  function handleAnswer(selectedMeaning) {
    var runState = appState.run;
    var currentWord = runState.currentWord;
    var stats = runState.statsById.get(currentWord.id);
    var isCorrect = selectedMeaning === currentWord.meaning;

    stats.appearances += 1;

    if (isCorrect) {
      stats.correct += 1;
      runState.correctCount += 1;
    } else {
      stats.wrong += 1;
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

    advanceQuestion();
  }

  function bindEvents() {
    dom.rangeStartInput.addEventListener("input", function () {
      syncRangeSelection(false);
    });
    dom.rangeEndInput.addEventListener("input", function () {
      syncRangeSelection(false);
    });
    dom.rangeStartInput.addEventListener("blur", function () {
      syncRangeSelection(true);
    });
    dom.rangeEndInput.addEventListener("blur", function () {
      syncRangeSelection(true);
    });
    dom.modeSelect.addEventListener("change", syncModeSelection);

    dom.startButton.addEventListener("click", startSelectedMode);

    dom.restartButton.addEventListener("click", function () {
      if (appState.run) {
        startRun(appState.run.range);
      }
    });

    dom.backButton.addEventListener("click", function () {
      appState.run = null;
      syncRangeSelection(true);
      syncModeSelection();
      showScreen("start");
    });

    dom.reviewBackButton.addEventListener("click", function () {
      appState.run = null;
      syncRangeSelection(true);
      syncModeSelection();
      showScreen("start");
    });
  }

  function bootstrap() {
    if (vocabulary.length < 4 || meaningPool.length < 4) {
      showError(
        "No hay suficientes entradas v\u00e1lidas para generar la pr\u00e1ctica."
      );
      return;
    }

    dom.rangeStartInput.max = String(vocabulary.length);
    dom.rangeEndInput.max = String(vocabulary.length);
    appState.selectedRange = {
      start: 1,
      end: Math.min(20, vocabulary.length),
    };
    dom.rangeStartInput.value = String(appState.selectedRange.start);
    dom.rangeEndInput.value = String(appState.selectedRange.end);
    syncRangeSelection(true);
    syncModeSelection();
    bindEvents();
    showScreen("start");
  }

  bootstrap();
})();
