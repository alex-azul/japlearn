export function getDomRefs(doc = document) {
  return {
    rootElement: doc.documentElement,
    screens: {
      error: doc.getElementById("error-screen"),
      start: doc.getElementById("start-screen"),
      practice: doc.getElementById("practice-screen"),
      writing: doc.getElementById("writing-screen"),
      review: doc.getElementById("review-screen"),
      stats: doc.getElementById("stats-screen"),
    },
    errorMessage: doc.getElementById("error-message"),
    themeButtons: {
      system: doc.getElementById("theme-system-button"),
      light: doc.getElementById("theme-light-button"),
      dark: doc.getElementById("theme-dark-button"),
    },
    start: {
      rangeStartInput: doc.getElementById("range-start-input"),
      rangeEndInput: doc.getElementById("range-end-input"),
      modeSelect: doc.getElementById("mode-select"),
      poolSizeDisplay: doc.getElementById("pool-size-display"),
      poolTotalDisplay: doc.getElementById("pool-total-display"),
      rangeDisplay: doc.getElementById("range-display"),
      startButton: doc.getElementById("start-button"),
      statsButton: doc.getElementById("stats-button"),
    },
    practice: {
      statRange: doc.getElementById("stat-range"),
      statPoolSize: doc.getElementById("stat-pool-size"),
      statAnswered: doc.getElementById("stat-answered"),
      statAccuracy: doc.getElementById("stat-accuracy"),
      promptWord: doc.getElementById("prompt-word"),
      optionsList: doc.getElementById("options-list"),
      textAnswerForm: doc.getElementById("text-answer-form"),
      textAnswerInput: doc.getElementById("text-answer-input"),
      failureEmpty: doc.getElementById("failure-empty"),
      failureDetails: doc.getElementById("failure-details"),
      failureWord: doc.getElementById("failure-word"),
      failureReading: doc.getElementById("failure-reading"),
      failureMeaning: doc.getElementById("failure-meaning"),
      restartButton: doc.getElementById("restart-button"),
      backButton: doc.getElementById("back-button"),
    },
    review: {
      range: doc.getElementById("review-range"),
      count: doc.getElementById("review-count"),
      total: doc.getElementById("review-total"),
      grid: doc.getElementById("review-grid"),
      backButton: doc.getElementById("review-back-button"),
    },
    writing: {
      statRange: doc.getElementById("writing-range"),
      statPoolSize: doc.getElementById("writing-pool-size"),
      statCompleted: doc.getElementById("writing-completed-count"),
      statRemaining: doc.getElementById("writing-remaining-count"),
      activePanel: doc.getElementById("writing-active-panel"),
      completePanel: doc.getElementById("writing-complete-panel"),
      promptWord: doc.getElementById("writing-prompt-word"),
      canvas: doc.getElementById("writing-canvas"),
      meaning: doc.getElementById("writing-meaning"),
      answerForm: doc.getElementById("writing-answer-form"),
      answerInput: doc.getElementById("writing-answer-input"),
      feedback: doc.getElementById("writing-feedback"),
      restartButton: doc.getElementById("writing-restart-button"),
      backButton: doc.getElementById("writing-back-button"),
    },
    stats: {
      trackedCount: doc.getElementById("stats-tracked-count"),
      totalAppearances: doc.getElementById("stats-total-appearances"),
      totalCorrect: doc.getElementById("stats-total-correct"),
      totalWrong: doc.getElementById("stats-total-wrong"),
      grid: doc.getElementById("stats-grid"),
      resetButton: doc.getElementById("stats-reset-button"),
      backButton: doc.getElementById("stats-back-button"),
    },
  };
}

export function showScreen(dom, screenName) {
  Object.keys(dom.screens).forEach(function (name) {
    dom.screens[name].classList.toggle("hidden", name !== screenName);
  });
}
