import assert from "node:assert/strict";
import test from "node:test";

import {
  getIntenseFeedbackProfile,
  INTENSE_FEEDBACK_MAX_PARTICLES,
  INTENSE_FEEDBACK_MAX_PITCH_HZ,
  INTENSE_SOUND_STORAGE_KEY,
  readIntenseSoundEnabled,
  writeIntenseSoundEnabled,
} from "../src/ui/intense-feedback.js";

test("getIntenseFeedbackProfile scales acierto feedback with combo", function () {
  var firstHit = getIntenseFeedbackProfile(1);
  var fourthHit = getIntenseFeedbackProfile(4);
  var fifthHit = getIntenseFeedbackProfile(5);
  var sixthHit = getIntenseFeedbackProfile(6);

  assert.equal(firstHit.comboCount, 1);
  assert.equal(fifthHit.comboCount, 5);
  assert.equal(fifthHit.particleCount > firstHit.particleCount, true);
  assert.equal(fifthHit.pitchHz > firstHit.pitchHz, true);
  assert.equal(fifthHit.durationMs, firstHit.durationMs);
  assert.equal(
    sixthHit.pitchHz - fifthHit.pitchHz,
    fifthHit.pitchHz - fourthHit.pitchHz
  );
  assert.equal("isMilestone" in fifthHit, false);
});

test("getIntenseFeedbackProfile clamps invalid and extreme combos", function () {
  var invalidCombo = getIntenseFeedbackProfile("nope");
  var hugeCombo = getIntenseFeedbackProfile(999);

  assert.equal(invalidCombo.comboCount, 0);
  assert.equal(invalidCombo.particleCount, 8);
  assert.equal(hugeCombo.particleCount, INTENSE_FEEDBACK_MAX_PARTICLES);
  assert.equal(hugeCombo.pitchHz, INTENSE_FEEDBACK_MAX_PITCH_HZ);
});

test("intense sound preference defaults on and persists mute state", function () {
  var values = new Map();
  var storage = {
    getItem: function (key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem: function (key, value) {
      values.set(key, value);
    },
  };

  assert.equal(readIntenseSoundEnabled(storage), true);

  writeIntenseSoundEnabled(storage, false);
  assert.equal(values.get(INTENSE_SOUND_STORAGE_KEY), "off");
  assert.equal(readIntenseSoundEnabled(storage), false);

  writeIntenseSoundEnabled(storage, true);
  assert.equal(values.get(INTENSE_SOUND_STORAGE_KEY), "on");
  assert.equal(readIntenseSoundEnabled(storage), true);
});
