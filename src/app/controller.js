import {
  clearGlobalStats,
  loadGlobalStats,
  saveGlobalStats,
} from "../data/global-stats-storage.js";
import {
  clearIntenseWeights,
  clearIntenseWeightsWithKey,
  loadIntenseWeights,
  loadIntenseWeightsWithKey,
  saveIntenseWeights,
  saveIntenseWeightsWithKey,
} from "../data/intense-weights-storage.js";
import { loadRadicals } from "../data/radicals.js";
import { buildMeaningPool, loadVocabulary } from "../data/vocabulary.js";
import {
  applyGlobalAnswer,
  createEmptyGlobalStats,
  createStatsScreenEntries,
} from "../domain/global-stats.js";
import {
  applyIntenseWeightAnswer,
  createEmptyIntenseWeights,
  createIntenseWeightEntries,
  INTENSE_HARD_WEIGHT_STORAGE_KEY,
  RADICAL_INTENSE_WEIGHT_STORAGE_KEY,
  wasIntenseAnswerBeforeHalf,
} from "../domain/intense-weights.js";
import {
  advanceIntenseQuestion,
  createMeaningsByPrompt,
  createIntenseSession,
  INTENSE_HIT_TRANSITION_MS,
  pauseIntenseSession,
  startIntenseTransition,
  submitIntenseAnswer,
} from "../domain/intense-practice.js";
import { createRunState, recordAnswer } from "../domain/run.js";
import {
  createOptions,
  getRangeEntries,
  normalizeRange,
  pickNextWord,
} from "../domain/selection.js";
import {
  createWritingSession,
  submitWritingAnswer,
} from "../domain/writing-practice.js";
import { trimText } from "../shared/text.js";
import { getDomRefs, showScreen } from "../ui/dom.js";
import { createIntenseFeedback } from "../ui/intense-feedback.js";
import {
  renderError,
  renderIntensePractice,
  renderIntenseWeightsScreen,
  renderIntenseTimer,
  renderPractice,
  renderReview,
  renderStatsScreen,
  renderStartSelection,
  renderWritingPractice,
  writeStartRangeInputs,
} from "../ui/render.js";
import { createScratchpad } from "../ui/scratchpad.js";
import { syncThemeSelection } from "../ui/theme.js";

export function createApp(options = {}) {
  var rawVocabulary = options.rawVocabulary || [];
  var rawRadicals = options.rawRadicals || [];
  var doc = options.document || document;
  var view = doc.defaultView || (typeof window !== "undefined" ? window : null);
  var randomFn = options.randomFn || Math.random;
  var storage =
    options.storage ||
    (typeof window !== "undefined" ? window.localStorage : null);
  var confirmFn =
    options.confirm ||
    (typeof window !== "undefined" && typeof window.confirm === "function"
      ? window.confirm.bind(window)
      : function () {
          return false;
        });
  var vocabulary = loadVocabulary(rawVocabulary);
  var radicals = loadRadicals(rawRadicals);
  var meaningPool = buildMeaningPool(vocabulary);
  var radicalMeaningPool = buildMeaningPool(radicals);
  var meaningsByPrompt = createMeaningsByPrompt(vocabulary);
  var radicalMeaningsByPrompt = createMeaningsByPrompt(radicals);
  var dom = getDomRefs(doc);
  var scratchpad = createScratchpad(dom.writing.canvas, {
    view: view,
    getStrokeStyle: function (canvas) {
      var computedStyle = view.getComputedStyle(canvas);
      var cssValue = computedStyle.getPropertyValue("--scratchpad-ink").trim();

      return cssValue || "#111111";
    },
  });
  var appState = {
    run: null,
    intenseSession: null,
    intenseTimerFrameId: null,
    intenseTransitionTimeoutId: null,
    intenseDeadlineAt: 0,
    writingSession: null,
    writingDraftAnswer: "",
    writingFeedbackMessage: "",
    reviewMarkedWordIds: new Set(),
    screen: "start",
    selectedTheme: "system",
    selectedRange: {
      start: 1,
      end: 1,
    },
    selectedMode: "practice",
    globalStats: createEmptyGlobalStats(vocabulary),
    intenseWeights: createEmptyIntenseWeights(vocabulary),
    intenseHardWeights: createEmptyIntenseWeights(vocabulary),
    radicalIntenseWeights: createEmptyIntenseWeights(radicals),
    intenseWeightsMode: "normal",
    intenseWeightsSort: "worst",
  };
  var intenseFeedback = createIntenseFeedback(dom.intense, {
    view: view,
    storage: storage,
  });

  function setScreen(screenName) {
    appState.screen = screenName;
    showScreen(dom, screenName);
  }

  function isRadicalMode(mode) {
    return mode === "radicals-review" || mode === "radicals-intense";
  }

  function getStartTotal(mode = appState.selectedMode) {
    return isRadicalMode(mode) ? radicals.length : vocabulary.length;
  }

  function syncStartRangeLimits(mode = appState.selectedMode) {
    var total = getStartTotal(mode);

    dom.start.rangeStartInput.max = String(total);
    dom.start.rangeEndInput.max = String(total);
  }

  function renderStart() {
    renderStartSelection(dom, {
      range: appState.selectedRange,
      mode: appState.selectedMode,
      total: getStartTotal(),
    });
  }

  function renderWritingPage() {
    renderWritingPractice(dom, {
      session: appState.writingSession,
      draftAnswer: appState.writingDraftAnswer,
      feedbackMessage: appState.writingFeedbackMessage,
    });
  }

  function renderIntensePage() {
    if (!appState.intenseSession) {
      return;
    }

    renderIntensePractice(dom, {
      session: appState.intenseSession,
    });
  }

  function getStatsSummary(entries) {
    return entries.reduce(
      function (summary, item) {
        if (item.stats.appearances > 0) {
          summary.trackedCount += 1;
        }

        summary.totalAppearances += item.stats.appearances;
        summary.totalCorrect += item.stats.correct;
        summary.totalWrong += item.stats.wrong;
        return summary;
      },
      {
        trackedCount: 0,
        totalAppearances: 0,
        totalCorrect: 0,
        totalWrong: 0,
      }
    );
  }

  function renderStatsPage() {
    var entries = createStatsScreenEntries(vocabulary, appState.globalStats);

    renderStatsScreen(dom, {
      entries: entries,
      summary: getStatsSummary(entries),
    });
  }

  function getIntenseWeightsSummary(entries) {
    return entries.reduce(
      function (summary, item) {
        if (item.weight.attempts > 0) {
          summary.trackedCount += 1;
        }

        if (item.score < 0) {
          summary.needsPracticeCount += 1;
        } else if (item.score > 0) {
          summary.strongCount += 1;
        }

        summary.totalAttempts += item.weight.attempts;
        summary.totalScore += item.score;
        return summary;
      },
      {
        trackedCount: 0,
        needsPracticeCount: 0,
        strongCount: 0,
        totalAttempts: 0,
        totalScore: 0,
      }
    );
  }

  function getActiveIntenseWeights() {
    return appState.intenseWeightsMode === "hard"
      ? appState.intenseHardWeights
      : appState.intenseWeights;
  }

  function getIntenseWeightsTitle() {
    return appState.intenseWeightsMode === "hard"
      ? "Ponderaci\u00f3n modo intenso hard"
      : "Ponderaci\u00f3n modo intenso";
  }

  function sortIntenseWeightEntries(entries) {
    var sortedEntries = entries.slice();

    if (appState.intenseWeightsSort === "vocabulary") {
      return sortedEntries;
    }

    sortedEntries.sort(function (left, right) {
      var scoreDelta =
        appState.intenseWeightsSort === "best"
          ? right.score - left.score
          : left.score - right.score;

      return scoreDelta || left.entry.id - right.entry.id;
    });

    return sortedEntries;
  }

  function renderIntenseWeightsPage() {
    var entries = createIntenseWeightEntries(
      vocabulary,
      getActiveIntenseWeights()
    );

    renderIntenseWeightsScreen(dom, {
      entries: sortIntenseWeightEntries(entries),
      summary: getIntenseWeightsSummary(entries),
      mode: appState.intenseWeightsMode,
      sort: appState.intenseWeightsSort,
      title: getIntenseWeightsTitle(),
    });
  }

  function applyTheme(theme) {
    appState.selectedTheme = syncThemeSelection(dom, theme);
  }

  function resetWritingState() {
    appState.writingSession = null;
    appState.writingDraftAnswer = "";
    appState.writingFeedbackMessage = "";
    scratchpad.clear();
  }

  function resetReviewState() {
    appState.reviewMarkedWordIds = new Set();
  }

  function stopIntenseTimer() {
    if (
      appState.intenseTimerFrameId !== null &&
      view &&
      typeof view.cancelAnimationFrame === "function"
    ) {
      view.cancelAnimationFrame(appState.intenseTimerFrameId);
    }

    appState.intenseTimerFrameId = null;
    appState.intenseDeadlineAt = 0;
  }

  function stopIntenseTransition() {
    if (
      appState.intenseTransitionTimeoutId !== null &&
      view &&
      typeof view.clearTimeout === "function"
    ) {
      view.clearTimeout(appState.intenseTransitionTimeoutId);
    }

    appState.intenseTransitionTimeoutId = null;
  }

  function clearIntenseState() {
    stopIntenseTimer();
    stopIntenseTransition();
    intenseFeedback.clear();
    appState.intenseSession = null;
  }

  function recordGlobalAnswerResult(wordId, isCorrect) {
    applyGlobalAnswer(appState.globalStats, wordId, isCorrect);
    saveGlobalStats(storage, appState.globalStats);
  }

  function recordIntenseWeightResult(
    wordId,
    isCorrect,
    timeRemainingMs,
    timeLimitMs
  ) {
    var session = appState.intenseSession;
    var isHard = session && session.answerMode === "text";
    var weights = isHard ? appState.intenseHardWeights : appState.intenseWeights;

    if (session && session.dataKind === "radical") {
      applyIntenseWeightAnswer(appState.radicalIntenseWeights, wordId, {
        isCorrect: isCorrect,
        wasFastCorrect:
          isCorrect &&
          wasIntenseAnswerBeforeHalf(timeRemainingMs, timeLimitMs),
      });
      saveIntenseWeightsWithKey(
        storage,
        appState.radicalIntenseWeights,
        RADICAL_INTENSE_WEIGHT_STORAGE_KEY
      );
      return;
    }

    applyIntenseWeightAnswer(weights, wordId, {
      isCorrect: isCorrect,
      wasFastCorrect:
        isCorrect &&
        wasIntenseAnswerBeforeHalf(timeRemainingMs, timeLimitMs),
    });

    if (isHard) {
      saveIntenseWeightsWithKey(
        storage,
        weights,
        INTENSE_HARD_WEIGHT_STORAGE_KEY
      );
      return;
    }

    saveIntenseWeights(storage, weights);
  }

  function syncRangeSelection(writeInputs = false) {
    var nextRange = normalizeRange(
      dom.start.rangeStartInput.value,
      dom.start.rangeEndInput.value,
      appState.selectedRange,
      getStartTotal()
    );

    appState.selectedRange = nextRange;

    if (writeInputs) {
      writeStartRangeInputs(dom, nextRange);
    }

    renderStart();
    return nextRange;
  }

  function syncModeSelection() {
    var nextMode =
      dom.start.modeSelect.value === "review"
        ? "review"
        : dom.start.modeSelect.value === "intense"
          ? "intense"
        : dom.start.modeSelect.value === "intense-hard"
          ? "intense-hard"
        : dom.start.modeSelect.value === "writing"
          ? "writing"
        : dom.start.modeSelect.value === "radicals-review"
          ? "radicals-review"
        : dom.start.modeSelect.value === "radicals-intense"
          ? "radicals-intense"
          : "practice";

    appState.selectedMode = nextMode;
    syncStartRangeLimits(nextMode);
    appState.selectedRange = normalizeRange(
      appState.selectedRange.start,
      appState.selectedRange.end,
      appState.selectedRange,
      getStartTotal(nextMode)
    );
    writeStartRangeInputs(dom, appState.selectedRange);
    renderStart();
    return nextMode;
  }

  function advanceQuestion() {
    var runState = appState.run;
    var nextWord = pickNextWord(runState, randomFn);

    runState.currentWord = nextWord;
    runState.currentResponseMode = runState.statsById.get(nextWord.id).responseMode;
    runState.currentOptions =
      runState.currentResponseMode === "choice"
        ? createOptions(nextWord.meaning, runState.meaningPool, randomFn)
        : [];

    renderPractice(dom, runState);
  }

  function startRun(range) {
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    appState.run = createRunState(range, vocabulary, meaningPool);
    setScreen("practice");
    advanceQuestion();
  }

  function updateIntenseTimer(now) {
    var session = appState.intenseSession;

    if (
      !session ||
      appState.screen !== "intense" ||
      session.isPaused ||
      session.isTransitioning
    ) {
      appState.intenseTimerFrameId = null;
      return;
    }

    session.timeRemainingMs = Math.max(appState.intenseDeadlineAt - now, 0);
    renderIntenseTimer(dom, session.timeRemainingMs / session.timeLimitMs);

    if (session.timeRemainingMs <= 0) {
      appState.intenseTimerFrameId = null;
      handleIntenseAnswer("", "timeout");
      return;
    }

    appState.intenseTimerFrameId = view.requestAnimationFrame(updateIntenseTimer);
  }

  function startIntenseTimer() {
    if (
      !appState.intenseSession ||
      !view ||
      typeof view.requestAnimationFrame !== "function"
    ) {
      return;
    }

    stopIntenseTimer();
    appState.intenseDeadlineAt =
      view.performance.now() + appState.intenseSession.timeLimitMs;
    renderIntenseTimer(dom, 1);
    appState.intenseTimerFrameId = view.requestAnimationFrame(updateIntenseTimer);
  }

  function getCurrentIntenseTimeRemaining() {
    if (
      appState.intenseSession &&
      appState.intenseDeadlineAt > 0 &&
      view &&
      view.performance &&
      typeof view.performance.now === "function"
    ) {
      return Math.max(appState.intenseDeadlineAt - view.performance.now(), 0);
    }

    return appState.intenseSession ? appState.intenseSession.timeRemainingMs : 0;
  }

  function beginIntenseTransition() {
    stopIntenseTimer();
    stopIntenseTransition();
    startIntenseTransition(appState.intenseSession);
    renderIntensePage();
    appState.intenseTransitionTimeoutId = view.setTimeout(function () {
      appState.intenseTransitionTimeoutId = null;

      if (!appState.intenseSession || appState.screen !== "intense") {
        return;
      }

      advanceIntenseQuestion(appState.intenseSession, randomFn);
      renderIntensePage();
      startIntenseTimer();
    }, INTENSE_HIT_TRANSITION_MS);
  }

  function startIntense(range, answerMode = "choice") {
    var resolvedAnswerMode = answerMode === "text" ? "text" : "choice";

    appState.run = null;
    resetWritingState();
    resetReviewState();
    clearIntenseState();
    appState.intenseSession = createIntenseSession(
      range,
      vocabulary,
      meaningPool,
      resolvedAnswerMode === "text"
        ? appState.intenseHardWeights
        : appState.intenseWeights,
      {
        answerMode: resolvedAnswerMode,
        meaningsByPrompt: meaningsByPrompt,
      }
    );
    advanceIntenseQuestion(appState.intenseSession, randomFn);
    setScreen("intense");
    renderIntensePage();
    startIntenseTimer();
  }

  function startRadicalIntense(range) {
    appState.run = null;
    resetWritingState();
    resetReviewState();
    clearIntenseState();
    appState.intenseSession = createIntenseSession(
      range,
      radicals,
      radicalMeaningPool,
      appState.radicalIntenseWeights,
      {
        dataKind: "radical",
        promptLabel: "Radicales intenso",
        meaningsByPrompt: radicalMeaningsByPrompt,
      }
    );
    advanceIntenseQuestion(appState.intenseSession, randomFn);
    setScreen("intense");
    renderIntensePage();
    startIntenseTimer();
  }

  function startWriting(range) {
    appState.run = null;
    clearIntenseState();
    resetReviewState();
    appState.writingSession = createWritingSession(range, vocabulary);
    appState.writingDraftAnswer = "";
    appState.writingFeedbackMessage = "";
    setScreen("writing");
    renderWritingPage();
    scratchpad.resize();
    scratchpad.clear();
  }

  function startReview(range) {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    renderReview(dom, {
      entries: getRangeEntries(vocabulary, range),
      markedWordIds: appState.reviewMarkedWordIds,
      range: range,
      total: vocabulary.length,
    });
    setScreen("review");
  }

  function startRadicalsReview(range) {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    renderReview(dom, {
      entries: getRangeEntries(radicals, range),
      markedWordIds: appState.reviewMarkedWordIds,
      range: range,
      total: radicals.length,
    });
    setScreen("review");
  }

  function startStats() {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    renderStatsPage();
    setScreen("stats");
  }

  function startIntenseWeights() {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    renderIntenseWeightsPage();
    setScreen("intenseWeights");
  }

  function startSelectedMode() {
    var selectedRange = syncRangeSelection(true);
    var selectedMode = syncModeSelection();

    if (selectedMode === "review") {
      startReview(selectedRange);
      return;
    }

    if (selectedMode === "intense") {
      startIntense(selectedRange);
      return;
    }

    if (selectedMode === "intense-hard") {
      startIntense(selectedRange, "text");
      return;
    }

    if (selectedMode === "writing") {
      startWriting(selectedRange);
      return;
    }

    if (selectedMode === "radicals-review") {
      startRadicalsReview(selectedRange);
      return;
    }

    if (selectedMode === "radicals-intense") {
      startRadicalIntense(selectedRange);
      return;
    }

    startRun(selectedRange);
  }

  function handleAnswer(answerValue) {
    var isCorrect;

    if (!appState.run) {
      return;
    }

    isCorrect = recordAnswer(appState.run, answerValue);
    recordGlobalAnswerResult(appState.run.currentWord.id, isCorrect);
    advanceQuestion();
  }

  function handleIntenseAnswer(answerValue, failureReason = "wrong") {
    var currentWordId;
    var isCorrect;
    var timeRemainingMs;
    var timeLimitMs;

    if (
      !appState.intenseSession ||
      appState.intenseSession.isPaused ||
      appState.intenseSession.isTransitioning
    ) {
      return;
    }

    timeRemainingMs = getCurrentIntenseTimeRemaining();
    timeLimitMs = appState.intenseSession.timeLimitMs;
    appState.intenseSession.timeRemainingMs = timeRemainingMs;
    stopIntenseTimer();
    currentWordId = appState.intenseSession.run.currentWord.id;
    isCorrect = submitIntenseAnswer(appState.intenseSession, answerValue);

    if (appState.intenseSession.dataKind !== "radical") {
      recordGlobalAnswerResult(currentWordId, isCorrect);
    }

    recordIntenseWeightResult(
      currentWordId,
      isCorrect,
      timeRemainingMs,
      timeLimitMs
    );

    if (isCorrect) {
      beginIntenseTransition();
      intenseFeedback.triggerCorrect(appState.intenseSession.comboCount);
      return;
    }

    intenseFeedback.clear();
    pauseIntenseSession(appState.intenseSession, failureReason);
    renderIntensePage();
  }

  function handleOptionClick(event) {
    var optionButton = event.target.closest(".option-button[data-answer]");

    if (!optionButton || !dom.practice.optionsList.contains(optionButton)) {
      return;
    }

    handleAnswer(optionButton.dataset.answer || "");
  }

  function handleTextSubmit(event) {
    var answer;

    event.preventDefault();

    if (!appState.run || appState.run.currentResponseMode !== "text") {
      return;
    }

    answer = trimText(dom.practice.textAnswerInput.value);

    if (!answer) {
      dom.practice.textAnswerInput.focus();
      return;
    }

    handleAnswer(answer);
  }

  function handleIntenseOptionClick(event) {
    var optionButton = event.target.closest(".intense-option-button[data-answer]");

    if (!optionButton || !dom.intense.optionsList.contains(optionButton)) {
      return;
    }

    handleIntenseAnswer(optionButton.dataset.answer || "");
  }

  function handleIntenseTextSubmit(event) {
    var answer;

    event.preventDefault();

    if (
      !appState.intenseSession ||
      appState.intenseSession.answerMode !== "text" ||
      appState.intenseSession.isPaused ||
      appState.intenseSession.isTransitioning
    ) {
      return;
    }

    answer = trimText(dom.intense.textAnswerInput.value);

    if (!answer) {
      dom.intense.textAnswerInput.focus();
      return;
    }

    handleIntenseAnswer(answer);
  }

  function handleIntenseResume() {
    if (!appState.intenseSession || !appState.intenseSession.isPaused) {
      return;
    }

    advanceIntenseQuestion(appState.intenseSession, randomFn);
    renderIntensePage();
    startIntenseTimer();
  }

  function handleGlobalKeyDown(event) {
    var optionIndex = {
      Digit1: 0,
      Numpad1: 0,
      Digit2: 1,
      Numpad2: 1,
      Digit3: 2,
      Numpad3: 2,
    }[event.code];
    var answerValue;

    if (
      optionIndex === undefined ||
      event.repeat ||
      appState.screen !== "intense" ||
      !appState.intenseSession ||
      appState.intenseSession.isPaused ||
      appState.intenseSession.isTransitioning
    ) {
      return;
    }

    answerValue = appState.intenseSession.run.currentOptions[optionIndex];

    if (!answerValue) {
      return;
    }

    event.preventDefault();
    handleIntenseAnswer(answerValue);
  }

  function handleWritingSubmit(event) {
    event.preventDefault();

    if (!appState.writingSession || appState.writingSession.isComplete) {
      return;
    }

    appState.writingDraftAnswer = dom.writing.answerInput.value;

    if (submitWritingAnswer(appState.writingSession, appState.writingDraftAnswer)) {
      appState.writingDraftAnswer = "";
      appState.writingFeedbackMessage = "";
      renderWritingPage();
      scratchpad.clear();
      return;
    }

    appState.writingFeedbackMessage =
      "Copia el significado completo tal como aparece.";
    renderWritingPage();
  }

  function handleWritingInput() {
    appState.writingDraftAnswer = dom.writing.answerInput.value;
  }

  function toggleReviewMark(card) {
    var wordId = card.dataset.wordId;
    var isMarked;

    if (!wordId) {
      return;
    }

    if (appState.reviewMarkedWordIds.has(wordId)) {
      appState.reviewMarkedWordIds.delete(wordId);
      isMarked = false;
    } else {
      appState.reviewMarkedWordIds.add(wordId);
      isMarked = true;
    }

    card.classList.toggle("is-marked", isMarked);
    card.setAttribute("aria-pressed", isMarked ? "true" : "false");
  }

  function handleReviewGridClick(event) {
    var card =
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".review-item[data-word-id]");

    if (!card || !dom.review.grid.contains(card)) {
      return;
    }

    toggleReviewMark(card);
  }

  function handleReviewGridKeyDown(event) {
    var card;

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    card =
      event.target &&
      typeof event.target.closest === "function" &&
      event.target.closest(".review-item[data-word-id]");

    if (!card || !dom.review.grid.contains(card)) {
      return;
    }

    event.preventDefault();
    toggleReviewMark(card);
  }

  function goBackToStart() {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    resetReviewState();
    syncRangeSelection(true);
    syncModeSelection();
    setScreen("start");
  }

  function resetStats() {
    if (!confirmFn("Esto borrara todos los stats globales. Continuar?")) {
      return;
    }

    appState.globalStats = createEmptyGlobalStats(vocabulary);
    clearGlobalStats(storage);
    saveGlobalStats(storage, appState.globalStats);
    renderStatsPage();
  }

  function resetIntenseWeights() {
    var isHard = appState.intenseWeightsMode === "hard";
    var message = isHard
      ? "Esto borrara las ponderaciones del modo intenso hard. Continuar?"
      : "Esto borrara las ponderaciones del modo intenso. Continuar?";

    if (
      !confirmFn(message)
    ) {
      return;
    }

    if (isHard) {
      appState.intenseHardWeights = createEmptyIntenseWeights(vocabulary);
      clearIntenseWeightsWithKey(storage, INTENSE_HARD_WEIGHT_STORAGE_KEY);
      saveIntenseWeightsWithKey(
        storage,
        appState.intenseHardWeights,
        INTENSE_HARD_WEIGHT_STORAGE_KEY
      );
    } else {
      appState.intenseWeights = createEmptyIntenseWeights(vocabulary);
      clearIntenseWeights(storage);
      saveIntenseWeights(storage, appState.intenseWeights);
    }

    if (
      appState.intenseSession &&
      ((isHard && appState.intenseSession.answerMode === "text") ||
        (!isHard && appState.intenseSession.answerMode === "choice"))
    ) {
      appState.intenseSession.intenseWeightsById = isHard
        ? appState.intenseHardWeights
        : appState.intenseWeights;
    }

    renderIntenseWeightsPage();
  }

  function bindEvents() {
    Object.keys(dom.themeButtons).forEach(function (theme) {
      dom.themeButtons[theme].addEventListener("click", function () {
        applyTheme(theme);
      });
    });

    dom.start.rangeStartInput.addEventListener("input", function () {
      syncRangeSelection(false);
    });
    dom.start.rangeEndInput.addEventListener("input", function () {
      syncRangeSelection(false);
    });
    dom.start.rangeStartInput.addEventListener("blur", function () {
      syncRangeSelection(true);
    });
    dom.start.rangeEndInput.addEventListener("blur", function () {
      syncRangeSelection(true);
    });
    dom.start.modeSelect.addEventListener("change", syncModeSelection);
    dom.start.startButton.addEventListener("click", startSelectedMode);
    dom.start.statsButton.addEventListener("click", startStats);
    dom.start.intenseWeightsButton.addEventListener("click", startIntenseWeights);

    dom.practice.optionsList.addEventListener("click", handleOptionClick);
    dom.practice.textAnswerForm.addEventListener("submit", handleTextSubmit);
    dom.practice.restartButton.addEventListener("click", function () {
      if (appState.run) {
        startRun(appState.run.range);
      }
    });
    dom.practice.backButton.addEventListener("click", goBackToStart);
    dom.intense.optionsList.addEventListener("click", handleIntenseOptionClick);
    dom.intense.textAnswerForm.addEventListener(
      "submit",
      handleIntenseTextSubmit
    );
    dom.intense.resumeButton.addEventListener("click", handleIntenseResume);
    dom.intense.soundButton.addEventListener("click", function () {
      intenseFeedback.toggleSound();
    });
    dom.intense.restartButton.addEventListener("click", function () {
      if (appState.intenseSession) {
        startIntense(
          appState.intenseSession.run.range,
          appState.intenseSession.answerMode
        );
      }
    });
    dom.intense.backButton.addEventListener("click", goBackToStart);
    dom.writing.answerForm.addEventListener("submit", handleWritingSubmit);
    dom.writing.answerInput.addEventListener("input", handleWritingInput);
    dom.writing.clearCanvasButton.addEventListener("click", function () {
      scratchpad.clear();
    });
    dom.writing.restartButton.addEventListener("click", function () {
      if (appState.writingSession) {
        startWriting(appState.writingSession.range);
      }
    });
    dom.writing.backButton.addEventListener("click", goBackToStart);
    dom.review.grid.addEventListener("click", handleReviewGridClick);
    dom.review.grid.addEventListener("keydown", handleReviewGridKeyDown);
    dom.review.backButton.addEventListener("click", goBackToStart);
    dom.stats.backButton.addEventListener("click", goBackToStart);
    dom.stats.resetButton.addEventListener("click", resetStats);
    dom.intenseWeights.modeSelect.addEventListener("change", function () {
      appState.intenseWeightsMode =
        dom.intenseWeights.modeSelect.value === "hard" ? "hard" : "normal";
      renderIntenseWeightsPage();
    });
    dom.intenseWeights.sortSelect.addEventListener("change", function () {
      appState.intenseWeightsSort =
        dom.intenseWeights.sortSelect.value === "best"
          ? "best"
          : dom.intenseWeights.sortSelect.value === "vocabulary"
            ? "vocabulary"
            : "worst";
      renderIntenseWeightsPage();
    });
    dom.intenseWeights.resetButton.addEventListener(
      "click",
      resetIntenseWeights
    );
    dom.intenseWeights.backButton.addEventListener("click", goBackToStart);
    doc.addEventListener("keydown", handleGlobalKeyDown);
  }

  function bootstrap() {
    if (vocabulary.length < 4 || meaningPool.length < 4) {
      renderError(
        dom,
        "No hay suficientes entradas v\u00e1lidas para generar la pr\u00e1ctica."
      );
      setScreen("error");
      return;
    }

    appState.selectedRange = {
      start: 1,
      end: Math.min(20, vocabulary.length),
    };
    appState.globalStats = loadGlobalStats(storage, vocabulary);
    appState.intenseWeights = loadIntenseWeights(storage, vocabulary);
    appState.intenseHardWeights = loadIntenseWeightsWithKey(
      storage,
      vocabulary,
      INTENSE_HARD_WEIGHT_STORAGE_KEY
    );
    appState.radicalIntenseWeights = loadIntenseWeightsWithKey(
      storage,
      radicals,
      RADICAL_INTENSE_WEIGHT_STORAGE_KEY
    );

    syncStartRangeLimits();

    applyTheme(appState.selectedTheme);
    writeStartRangeInputs(dom, appState.selectedRange);
    renderStart();
    bindEvents();
    setScreen("start");
  }

  return {
    bootstrap: bootstrap,
  };
}
