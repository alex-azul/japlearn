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
import { createRunState, recordAnswer } from "../domain/run.js";
import {
  createOptions,
  getRangeEntries,
  normalizeRange,
  pickNextWord,
} from "../domain/selection.js";
import { trimText } from "../shared/text.js";
import { getDomRefs, showScreen } from "../ui/dom.js";
import {
  renderError,
  renderPractice,
  renderReview,
  renderStatsScreen,
  renderStartSelection,
  writeStartRangeInputs,
} from "../ui/render.js";
import { syncThemeSelection } from "../ui/theme.js";

export function createApp(options = {}) {
  var rawVocabulary = options.rawVocabulary || [];
  var doc = options.document || document;
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
  var appState = {
    run: null,
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
      dom.start.modeSelect.value === "review" ? "review" : "practice";

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
    appState.run = createRunState(range, vocabulary, meaningPool);
    setScreen("practice");
    advanceQuestion();
  }

  function startReview(range) {
    appState.run = null;
    renderReview(dom, {
      entries: getRangeEntries(vocabulary, range),
      range: range,
      total: vocabulary.length,
    });
    setScreen("review");
  }

  function startStats() {
    appState.run = null;
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

    startRun(selectedRange);
  }

  function handleAnswer(answerValue) {
    var isCorrect;

    if (!appState.run) {
      return;
    }

    isCorrect = recordAnswer(appState.run, answerValue);
    applyGlobalAnswer(
      appState.globalStats,
      appState.run.currentWord.id,
      isCorrect
    );
    saveGlobalStats(storage, appState.globalStats);
    advanceQuestion();
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

  function goBackToStart() {
    appState.run = null;
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
    dom.review.backButton.addEventListener("click", goBackToStart);
    dom.stats.backButton.addEventListener("click", goBackToStart);
    dom.stats.resetButton.addEventListener("click", resetStats);
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
