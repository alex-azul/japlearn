import { collapseWhitespace } from "../shared/text.js";
import { getRangeEntries } from "./selection.js";

export function normalizeWritingCopy(value) {
  return collapseWhitespace(value).toLowerCase();
}

export function isValidWritingCopyAnswer(answer, meaning) {
  var normalizedAnswer = normalizeWritingCopy(answer);

  if (!normalizedAnswer) {
    return false;
  }

  return normalizedAnswer === normalizeWritingCopy(meaning);
}

export function createWritingSession(range, vocabulary) {
  var sessionRange = {
    start: range.start,
    end: range.end,
  };
  var entries = getRangeEntries(vocabulary, sessionRange);

  return {
    range: sessionRange,
    poolSize: entries.length,
    entries: entries,
    currentIndex: 0,
    completedCount: 0,
    isComplete: entries.length === 0,
  };
}

export function getCurrentWritingEntry(session) {
  if (!session || session.isComplete) {
    return null;
  }

  return session.entries[session.currentIndex] || null;
}

export function getRemainingCount(session) {
  if (!session) {
    return 0;
  }

  return Math.max(session.poolSize - session.completedCount, 0);
}

export function submitWritingAnswer(session, answer) {
  var currentEntry = getCurrentWritingEntry(session);

  if (!currentEntry) {
    return false;
  }

  if (!isValidWritingCopyAnswer(answer, currentEntry.meaning)) {
    return false;
  }

  session.currentIndex += 1;
  session.completedCount += 1;
  session.isComplete = session.currentIndex >= session.entries.length;
  return true;
}
