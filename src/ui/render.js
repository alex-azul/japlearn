import { getPromptText, getReadingText } from "../domain/answers.js";
import { formatRange } from "../domain/selection.js";
import { formatAccuracy } from "../domain/run.js";

function renderStats(dom, runState) {
  dom.practice.statRange.textContent = formatRange(runState.range);
  dom.practice.statPoolSize.textContent = String(runState.poolSize);
  dom.practice.statAnswered.textContent = String(runState.answeredCount);
  dom.practice.statAccuracy.textContent = formatAccuracy(
    runState.correctCount,
    runState.answeredCount
  );
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
    state.mode === "review" ? "Abrir repaso" : "Empezar pr\u00e1ctica";
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

export function renderReview(dom, state) {
  var doc = dom.review.grid.ownerDocument;
  var fragment = doc.createDocumentFragment();

  dom.review.range.textContent = formatRange(state.range);
  dom.review.count.textContent = String(state.entries.length);
  dom.review.total.textContent = String(state.total);
  dom.review.grid.textContent = "";

  state.entries.forEach(function (entry) {
    var card = doc.createElement("article");
    var word = doc.createElement("h2");
    var reading = doc.createElement("p");
    var meaning = doc.createElement("p");

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

  dom.review.grid.appendChild(fragment);
}
