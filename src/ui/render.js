import { getPromptText, getReadingText } from "../domain/answers.js";
import { INTENSE_WEIGHT_MAX_SCORE } from "../domain/intense-weights.js";
import { formatRange } from "../domain/selection.js";
import { formatAccuracy } from "../domain/run.js";
import {
  getCurrentWritingEntry,
  getRemainingCount,
} from "../domain/writing-practice.js";

function getStatsTintStyle(statsEntry) {
  if (statsEntry.stats.appearances === 0) {
    return "rgba(127, 127, 127, 0.08)";
  }

  var red = {
    r: 191,
    g: 68,
    b: 76,
  };
  var green = {
    r: 62,
    g: 155,
    b: 98,
  };
  var mix = statsEntry.accuracy;
  var redMix = 1 - mix;
  var r = Math.round(red.r * redMix + green.r * mix);
  var g = Math.round(red.g * redMix + green.g * mix);
  var b = Math.round(red.b * redMix + green.b * mix);

  return "rgba(" + r + ", " + g + ", " + b + ", 0.18)";
}

function getIntenseWeightTintStyle(weightEntry) {
  var intensity = Math.min(
    Math.abs(weightEntry.score) / INTENSE_WEIGHT_MAX_SCORE,
    1
  );

  if (intensity === 0) {
    return "rgba(127, 127, 127, 0.08)";
  }

  var color =
    weightEntry.score < 0
      ? {
          r: 191,
          g: 68,
          b: 76,
        }
      : {
          r: 62,
          g: 155,
          b: 98,
        };

  return (
    "rgba(" +
    color.r +
    ", " +
    color.g +
    ", " +
    color.b +
    ", " +
    (0.08 + intensity * 0.2).toFixed(3) +
    ")"
  );
}

function renderStatsSummary(dom, summary) {
  dom.stats.trackedCount.textContent = String(summary.trackedCount);
  dom.stats.totalAppearances.textContent = String(summary.totalAppearances);
  dom.stats.totalCorrect.textContent = String(summary.totalCorrect);
  dom.stats.totalWrong.textContent = String(summary.totalWrong);
}

function renderIntenseWeightsSummary(dom, summary) {
  var averageScore =
    summary.trackedCount > 0 ? summary.totalScore / summary.trackedCount : 0;

  dom.intenseWeights.trackedCount.textContent = String(summary.trackedCount);
  dom.intenseWeights.totalAttempts.textContent = String(summary.totalAttempts);
  dom.intenseWeights.needsPracticeCount.textContent = String(
    summary.needsPracticeCount
  );
  dom.intenseWeights.strongCount.textContent = String(summary.strongCount);
  dom.intenseWeights.averageScore.textContent =
    averageScore > 0 ? "+" + averageScore.toFixed(2) : averageScore.toFixed(2);
}

function appendStatsPill(doc, parent, label, value) {
  var pill = doc.createElement("span");

  pill.className = "stats-pill";
  pill.textContent = label + ": " + value;
  parent.appendChild(pill);
}

function renderStats(dom, runState) {
  dom.practice.statRange.textContent = formatRange(runState.range);
  dom.practice.statPoolSize.textContent = String(runState.poolSize);
  dom.practice.statAnswered.textContent = String(runState.answeredCount);
  dom.practice.statAccuracy.textContent = formatAccuracy(
    runState.correctCount,
    runState.answeredCount
  );
}

function renderIntenseOptions(dom, options, isDisabled) {
  var doc = dom.intense.optionsList.ownerDocument;
  var fragment = doc.createDocumentFragment();

  dom.intense.optionsList.textContent = "";

  options.forEach(function (meaning, index) {
    var button = doc.createElement("button");
    var shortcut = doc.createElement("span");
    var label = doc.createElement("span");

    button.type = "button";
    button.className = "option-button intense-option-button";
    button.dataset.answer = meaning;
    button.disabled = isDisabled;

    shortcut.className = "intense-option-shortcut";
    shortcut.textContent = String(index + 1);
    label.className = "intense-option-label";
    label.textContent = meaning;

    button.appendChild(shortcut);
    button.appendChild(label);
    fragment.appendChild(button);
  });

  dom.intense.optionsList.appendChild(fragment);
}

function renderIntenseTextAnswer(dom, isDisabled) {
  var submitButton = dom.intense.textAnswerForm.querySelector("button");

  dom.intense.optionsList.textContent = "";
  dom.intense.optionsList.classList.add("hidden");
  dom.intense.textAnswerForm.classList.remove("hidden");
  dom.intense.textAnswerInput.disabled = isDisabled;

  if (submitButton) {
    submitButton.disabled = isDisabled;
  }

  if (!isDisabled) {
    dom.intense.textAnswerInput.value = "";

    if (typeof dom.intense.textAnswerInput.focus === "function") {
      dom.intense.textAnswerInput.focus();
    }
  }
}

function getIntensePauseTitle(reason) {
  return reason === "timeout" ? "Tiempo agotado" : "Fallo";
}

function renderLastFailure(dom, lastFailure) {
  var hasFailure = Boolean(lastFailure);

  dom.practice.failureEmpty.classList.toggle("hidden", hasFailure);
  dom.practice.failureDetails.classList.toggle("hidden", !hasFailure);

  if (!hasFailure) {
    return;
  }

  dom.practice.failureWord.textContent = lastFailure.prompt;
  dom.practice.failureReading.textContent = lastFailure.furigana;
  dom.practice.failureMeaning.textContent = lastFailure.meaning;
}

function renderChoiceAnswer(dom, options) {
  var doc = dom.practice.optionsList.ownerDocument;
  var fragment = doc.createDocumentFragment();

  dom.practice.textAnswerForm.classList.add("hidden");
  dom.practice.textAnswerInput.value = "";
  dom.practice.optionsList.classList.remove("hidden");
  dom.practice.optionsList.textContent = "";

  options.forEach(function (meaning) {
    var button = doc.createElement("button");

    button.type = "button";
    button.className = "option-button";
    button.dataset.answer = meaning;
    button.textContent = meaning;
    fragment.appendChild(button);
  });

  dom.practice.optionsList.appendChild(fragment);
}

function renderTextAnswer(dom) {
  dom.practice.optionsList.textContent = "";
  dom.practice.optionsList.classList.add("hidden");
  dom.practice.textAnswerForm.classList.remove("hidden");
  dom.practice.textAnswerInput.value = "";

  if (typeof dom.practice.textAnswerInput.focus === "function") {
    dom.practice.textAnswerInput.focus();
  }
}

function renderAnswerInput(dom, runState) {
  if (runState.currentResponseMode === "text") {
    renderTextAnswer(dom);
    return;
  }

  renderChoiceAnswer(dom, runState.currentOptions);
}

export function writeStartRangeInputs(dom, range) {
  dom.start.rangeStartInput.value = String(range.start);
  dom.start.rangeEndInput.value = String(range.end);
}

export function renderStartSelection(dom, state) {
  var selectedCount = state.range.end - state.range.start + 1;

  dom.start.modeSelect.value = state.mode;
  dom.start.poolSizeDisplay.textContent = String(selectedCount);
  dom.start.poolTotalDisplay.textContent = String(state.total);
  dom.start.rangeDisplay.textContent = "Rango " + formatRange(state.range);
  dom.start.startButton.textContent =
    state.mode === "review"
      ? "Abrir repaso"
      : state.mode === "intense"
        ? "Abrir pr\u00e1ctica intensa"
      : state.mode === "intense-hard"
        ? "Abrir pr\u00e1ctica intensa hard"
      : state.mode === "writing"
        ? "Abrir pr\u00e1ctica de escritura"
      : state.mode === "radicals-review"
        ? "Abrir grid de radicales"
      : state.mode === "radicals-intense"
        ? "Abrir radicales intenso"
        : "Empezar pr\u00e1ctica";
}

export function renderError(dom, message) {
  dom.errorMessage.textContent = message;
}

export function renderPractice(dom, runState) {
  dom.practice.promptWord.textContent = getPromptText(runState.currentWord);
  renderStats(dom, runState);
  renderLastFailure(dom, runState.lastFailure);
  renderAnswerInput(dom, runState);
}

export function renderIntenseTimer(dom, progress) {
  var safeProgress = Math.max(0, Math.min(1, progress));

  dom.intense.timerBar.style.transform = "scaleX(" + safeProgress + ")";
  dom.intense.timerBar.classList.toggle("is-urgent", safeProgress <= 0.33);
}

export function renderIntensePractice(dom, state) {
  var session = state.session;
  var progress = session.timeLimitMs
    ? session.timeRemainingMs / session.timeLimitMs
    : 0;
  var isDisabled = session.isPaused || session.isTransitioning;

  dom.intense.statRange.textContent = formatRange(session.run.range);
  dom.intense.statPoolSize.textContent = String(session.run.poolSize);
  dom.intense.statAnswered.textContent = String(session.run.answeredCount);
  dom.intense.statCombo.textContent = String(session.comboCount);
  dom.intense.promptLabel.textContent =
    session.promptLabel ||
    (session.answerMode === "text"
      ? "Pr\u00e1ctica intensa hard"
      : "Pr\u00e1ctica intensa");
  dom.intense.promptWord.textContent = getPromptText(session.run.currentWord);
  dom.intense.promptWord.classList.toggle("is-hit", session.isTransitioning);
  dom.intense.pauseOverlay.classList.toggle("hidden", !session.isPaused);
  dom.intense.pauseTitle.textContent = getIntensePauseTitle(session.pauseReason);
  dom.intense.pauseMeaning.textContent = session.pauseCorrectMeaning || "";

  if (session.answerMode === "text") {
    renderIntenseTextAnswer(dom, isDisabled);
  } else {
    dom.intense.textAnswerForm.classList.add("hidden");
    dom.intense.textAnswerInput.value = "";
    dom.intense.optionsList.classList.remove("hidden");
    renderIntenseOptions(dom, session.run.currentOptions, isDisabled);
  }

  renderIntenseTimer(dom, progress);
}

export function renderReview(dom, state) {
  var doc = dom.review.grid.ownerDocument;
  var fragment = doc.createDocumentFragment();
  var markedWordIds = state.markedWordIds || new Set();

  dom.review.range.textContent = formatRange(state.range);
  dom.review.count.textContent = String(state.entries.length);
  dom.review.total.textContent = String(state.total);
  dom.review.grid.textContent = "";

  state.entries.forEach(function (entry) {
    var card = doc.createElement("article");
    var word = doc.createElement("h2");
    var reading = doc.createElement("p");
    var meaning = doc.createElement("p");
    var mnemonic = doc.createElement("p");
    var wordId = String(entry.id);

    card.className = "review-item";
    card.dataset.wordId = wordId;
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute(
      "aria-pressed",
      markedWordIds.has(wordId) ? "true" : "false"
    );
    card.classList.toggle("is-marked", markedWordIds.has(wordId));

    word.className = "review-word japanese-display";
    reading.className = "review-reading";
    meaning.className = "review-meaning";
    mnemonic.className = "review-mnemonic";

    word.textContent = getPromptText(entry);
    reading.textContent = getReadingText(entry);
    meaning.textContent = entry.meaning;
    mnemonic.textContent = entry.mnemonic || "";

    card.appendChild(word);
    card.appendChild(reading);
    card.appendChild(meaning);
    if (entry.mnemonic) {
      card.appendChild(mnemonic);
    }
    fragment.appendChild(card);
  });

  dom.review.grid.appendChild(fragment);
}

export function renderWritingPractice(dom, state) {
  var currentEntry = getCurrentWritingEntry(state.session);

  dom.writing.statRange.textContent = formatRange(state.session.range);
  dom.writing.statPoolSize.textContent = String(state.session.poolSize);
  dom.writing.statCompleted.textContent = String(state.session.completedCount);
  dom.writing.statRemaining.textContent = String(getRemainingCount(state.session));
  dom.writing.feedback.textContent = state.feedbackMessage || "";
  dom.writing.feedback.classList.toggle("hidden", !state.feedbackMessage);

  if (!currentEntry) {
    dom.writing.activePanel.classList.add("hidden");
    dom.writing.completePanel.classList.remove("hidden");
    dom.writing.answerInput.value = "";
    return;
  }

  dom.writing.completePanel.classList.add("hidden");
  dom.writing.activePanel.classList.remove("hidden");
  dom.writing.promptWord.textContent = getPromptText(currentEntry);
  dom.writing.meaning.textContent = currentEntry.meaning;
  dom.writing.answerInput.value = state.draftAnswer || "";

  if (typeof dom.writing.answerInput.focus === "function") {
    dom.writing.answerInput.focus();
  }
}

export function renderStatsScreen(dom, state) {
  var doc = dom.stats.grid.ownerDocument;
  var fragment = doc.createDocumentFragment();

  renderStatsSummary(dom, state.summary);
  dom.stats.grid.textContent = "";

  state.entries.forEach(function (item) {
    var card = doc.createElement("article");
    var word = doc.createElement("h2");
    var reading = doc.createElement("p");
    var meaning = doc.createElement("p");
    var statsMeta = doc.createElement("div");

    card.className = "review-item stats-item";
    card.style.backgroundColor = getStatsTintStyle(item);

    word.className = "review-word japanese-display";
    reading.className = "review-reading";
    meaning.className = "review-meaning";
    statsMeta.className = "stats-meta";

    word.textContent = getPromptText(item.entry);
    reading.textContent = getReadingText(item.entry);
    meaning.textContent = item.entry.meaning;
    appendStatsPill(doc, statsMeta, "Seen", item.stats.appearances);
    appendStatsPill(doc, statsMeta, "OK", item.stats.correct);
    appendStatsPill(doc, statsMeta, "Fail", item.stats.wrong);
    appendStatsPill(doc, statsMeta, "Acc", item.accuracyLabel);

    card.appendChild(word);
    card.appendChild(reading);
    card.appendChild(meaning);
    card.appendChild(statsMeta);
    fragment.appendChild(card);
  });

  dom.stats.grid.appendChild(fragment);
}

export function renderIntenseWeightsScreen(dom, state) {
  var doc = dom.intenseWeights.grid.ownerDocument;
  var fragment = doc.createDocumentFragment();

  renderIntenseWeightsSummary(dom, state.summary);
  dom.intenseWeights.title.textContent = state.title;
  dom.intenseWeights.modeSelect.value = state.mode;
  dom.intenseWeights.sortSelect.value = state.sort;
  dom.intenseWeights.grid.textContent = "";

  state.entries.forEach(function (item) {
    var card = doc.createElement("article");
    var word = doc.createElement("h2");
    var reading = doc.createElement("p");
    var meaning = doc.createElement("p");
    var statsMeta = doc.createElement("div");

    card.className = "review-item stats-item intense-weight-item";
    card.style.backgroundColor = getIntenseWeightTintStyle(item);

    word.className = "review-word japanese-display";
    reading.className = "review-reading";
    meaning.className = "review-meaning";
    statsMeta.className = "stats-meta";

    word.textContent = getPromptText(item.entry);
    reading.textContent = getReadingText(item.entry);
    meaning.textContent = item.entry.meaning;
    appendStatsPill(doc, statsMeta, "Pond", item.scoreLabel);
    appendStatsPill(doc, statsMeta, "Intentos", item.weight.attempts);
    appendStatsPill(doc, statsMeta, "R\u00e1pidos", item.weight.fastCorrect);
    appendStatsPill(doc, statsMeta, "Lentos", item.weight.slowCorrect);
    appendStatsPill(doc, statsMeta, "Fallos", item.weight.wrong);

    card.appendChild(word);
    card.appendChild(reading);
    card.appendChild(meaning);
    card.appendChild(statsMeta);
    fragment.appendChild(card);
  });

  dom.intenseWeights.grid.appendChild(fragment);
}
