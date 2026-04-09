import {
  clearGlobalStats,
  loadGlobalStats,
  saveGlobalStats,
} from "../data/global-stats-storage.js";
import { buildMeaningPool, loadVocabulary } from "../data/vocabulary.js";
import {
  applyGlobalAnswer,
  createEmptyGlobalStats,
  createStatsScreenEntries,
} from "../domain/global-stats.js";
import {
  advanceIntenseQuestion,
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
import {
  renderError,
  renderIntensePractice,
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
  var meaningPool = buildMeaningPool(vocabulary);
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
    screen: "start",
    selectedTheme: "system",
    selectedRange: {
      start: 1,
      end: 1,
    },
    selectedMode: "practice",
    globalStats: createEmptyGlobalStats(vocabulary),
  };

  function setScreen(screenName) {
    appState.screen = screenName;
    showScreen(dom, screenName);
  }

  function renderStart() {
    renderStartSelection(dom, {
      range: appState.selectedRange,
      mode: appState.selectedMode,
      total: vocabulary.length,
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

  function applyTheme(theme) {
    appState.selectedTheme = syncThemeSelection(dom, theme);
  }

  function resetWritingState() {
    appState.writingSession = null;
    appState.writingDraftAnswer = "";
    appState.writingFeedbackMessage = "";
    scratchpad.clear();
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
    appState.intenseSession = null;
  }

  function recordGlobalAnswerResult(wordId, isCorrect) {
    applyGlobalAnswer(appState.globalStats, wordId, isCorrect);
    saveGlobalStats(storage, appState.globalStats);
  }

  function syncRangeSelection(writeInputs = false) {
    var nextRange = normalizeRange(
      dom.start.rangeStartInput.value,
      dom.start.rangeEndInput.value,
      appState.selectedRange,
      vocabulary.length
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
        : dom.start.modeSelect.value === "writing"
          ? "writing"
          : "practice";

    appState.selectedMode = nextMode;
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

  function startIntense(range) {
    appState.run = null;
    resetWritingState();
    clearIntenseState();
    appState.intenseSession = createIntenseSession(range, vocabulary, meaningPool);
    advanceIntenseQuestion(appState.intenseSession, randomFn);
    setScreen("intense");
    renderIntensePage();
    startIntenseTimer();
  }

  function startWriting(range) {
    appState.run = null;
    clearIntenseState();
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
    renderReview(dom, {
      entries: getRangeEntries(vocabulary, range),
      range: range,
      total: vocabulary.length,
    });
    setScreen("review");
  }

  function startStats() {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
    renderStatsPage();
    setScreen("stats");
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

    if (selectedMode === "writing") {
      startWriting(selectedRange);
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

    if (
      !appState.intenseSession ||
      appState.intenseSession.isPaused ||
      appState.intenseSession.isTransitioning
    ) {
      return;
    }

    stopIntenseTimer();
    currentWordId = appState.intenseSession.run.currentWord.id;
    isCorrect = submitIntenseAnswer(appState.intenseSession, answerValue);
    recordGlobalAnswerResult(currentWordId, isCorrect);

    if (isCorrect) {
      beginIntenseTransition();
      return;
    }

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

  function goBackToStart() {
    appState.run = null;
    clearIntenseState();
    resetWritingState();
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

    dom.practice.optionsList.addEventListener("click", handleOptionClick);
    dom.practice.textAnswerForm.addEventListener("submit", handleTextSubmit);
    dom.practice.restartButton.addEventListener("click", function () {
      if (appState.run) {
        startRun(appState.run.range);
      }
    });
    dom.practice.backButton.addEventListener("click", goBackToStart);
    dom.intense.optionsList.addEventListener("click", handleIntenseOptionClick);
    dom.intense.resumeButton.addEventListener("click", handleIntenseResume);
    dom.intense.restartButton.addEventListener("click", function () {
      if (appState.intenseSession) {
        startIntense(appState.intenseSession.run.range);
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
    dom.review.backButton.addEventListener("click", goBackToStart);
    dom.stats.backButton.addEventListener("click", goBackToStart);
    dom.stats.resetButton.addEventListener("click", resetStats);
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

    dom.start.rangeStartInput.max = String(vocabulary.length);
    dom.start.rangeEndInput.max = String(vocabulary.length);

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
