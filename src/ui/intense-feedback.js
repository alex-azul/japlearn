export var INTENSE_SOUND_STORAGE_KEY = "japlearn2:intense-sound";
export var INTENSE_FEEDBACK_MAX_PARTICLES = 34;
export var INTENSE_FEEDBACK_MAX_PITCH_HZ = 1320;

function clampNumber(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getComboCount(value) {
  var comboCount = Number(value);

  if (!Number.isFinite(comboCount)) {
    return 0;
  }

  return Math.max(0, Math.floor(comboCount));
}

export function getIntenseFeedbackProfile(comboCount) {
  var combo = getComboCount(comboCount);
  var pitchHz = 540 + combo * 34;
  var particleCount = 8 + combo * 2;

  return {
    comboCount: combo,
    particleCount: clampNumber(
      particleCount,
      8,
      INTENSE_FEEDBACK_MAX_PARTICLES
    ),
    pitchHz: Math.round(clampNumber(pitchHz, 520, INTENSE_FEEDBACK_MAX_PITCH_HZ)),
    volume: clampNumber(0.055 + combo * 0.006, 0.055, 0.16),
    durationMs: 125,
  };
}

export function readIntenseSoundEnabled(storage) {
  try {
    if (!storage || typeof storage.getItem !== "function") {
      return true;
    }

    return storage.getItem(INTENSE_SOUND_STORAGE_KEY) !== "off";
  } catch (error) {
    return true;
  }
}

export function writeIntenseSoundEnabled(storage, isEnabled) {
  try {
    if (!storage || typeof storage.setItem !== "function") {
      return;
    }

    storage.setItem(INTENSE_SOUND_STORAGE_KEY, isEnabled ? "on" : "off");
  } catch (error) {
    return;
  }
}

function getAudioContext(view) {
  var AudioContextConstructor =
    view && (view.AudioContext || view.webkitAudioContext);

  if (!AudioContextConstructor) {
    return null;
  }

  try {
    return new AudioContextConstructor();
  } catch (error) {
    return null;
  }
}

export function createIntenseFeedback(dom, options = {}) {
  var view =
    options.view || (typeof window !== "undefined" ? window : undefined);
  var randomFn = options.randomFn || Math.random;
  var storage = options.storage || null;
  var soundEnabled = readIntenseSoundEnabled(storage);
  var audioContext = null;
  var particleTimeoutIds = [];

  function getViewTimeout() {
    return view && typeof view.setTimeout === "function"
      ? view.setTimeout.bind(view)
      : setTimeout;
  }

  function getViewClearTimeout() {
    return view && typeof view.clearTimeout === "function"
      ? view.clearTimeout.bind(view)
      : clearTimeout;
  }

  function clearParticleTimeouts() {
    var clearTimeoutFn = getViewClearTimeout();

    particleTimeoutIds.forEach(function (timeoutId) {
      clearTimeoutFn(timeoutId);
    });
    particleTimeoutIds = [];
  }

  function renderSoundState() {
    if (!dom.soundButton) {
      return;
    }

    dom.soundButton.textContent = soundEnabled ? "SFX on" : "SFX off";
    dom.soundButton.classList.toggle("is-muted", !soundEnabled);
    dom.soundButton.setAttribute("aria-pressed", soundEnabled ? "true" : "false");
    dom.soundButton.setAttribute(
      "aria-label",
      soundEnabled ? "Silenciar SFX" : "Activar SFX"
    );
    dom.soundButton.title = soundEnabled ? "Silenciar SFX" : "Activar SFX";
  }

  function setSoundEnabled(isEnabled) {
    soundEnabled = Boolean(isEnabled);
    writeIntenseSoundEnabled(storage, soundEnabled);
    renderSoundState();
  }

  function toggleSound() {
    setSoundEnabled(!soundEnabled);
  }

  function clear() {
    clearParticleTimeouts();

    if (dom.feedbackLayer) {
      dom.feedbackLayer.textContent = "";
    }
  }

  function spawnParticles(profile) {
    var doc;
    var fragment;
    var timeoutFn;

    if (!dom.feedbackLayer) {
      return;
    }

    clearParticleTimeouts();
    dom.feedbackLayer.textContent = "";
    doc = dom.feedbackLayer.ownerDocument;
    fragment = doc.createDocumentFragment();
    timeoutFn = getViewTimeout();

    Array.from({ length: profile.particleCount }).forEach(function (_, index) {
      var particle = doc.createElement("span");
      var angle = -115 + randomFn() * 230;
      var angleRad = (angle * Math.PI) / 180;
      var distance = 48 + randomFn() * 78 + Math.min(profile.comboCount, 12) * 2;
      var size = 6 + randomFn() * 8;
      var dx = Math.cos(angleRad) * distance;
      var dy = Math.sin(angleRad) * distance;

      particle.className = "intense-particle";
      particle.style.setProperty("--particle-x", dx.toFixed(2) + "px");
      particle.style.setProperty("--particle-y", dy.toFixed(2) + "px");
      particle.style.setProperty("--particle-size", size.toFixed(2) + "px");
      particle.style.setProperty(
        "--particle-delay",
        String((index % 4) * 8) + "ms"
      );
      particle.style.left = (49 + (randomFn() - 0.5) * 14).toFixed(2) + "%";
      particle.style.top = (31 + (randomFn() - 0.5) * 9).toFixed(2) + "%";
      fragment.appendChild(particle);
    });

    dom.feedbackLayer.appendChild(fragment);
    particleTimeoutIds.push(
      timeoutFn(function () {
        if (dom.feedbackLayer) {
          dom.feedbackLayer.textContent = "";
        }
      }, 680)
    );
  }

  function playTing(profile) {
    var context;
    var startAt;
    var endAt;
    var oscillator;
    var overtoneOscillator;
    var gain;
    var overtoneGain;
    var resumeResult;

    if (!soundEnabled) {
      return;
    }

    if (!audioContext) {
      audioContext = getAudioContext(view);
    }

    context = audioContext;

    if (!context) {
      return;
    }

    try {
      if (context.state === "suspended" && typeof context.resume === "function") {
        resumeResult = context.resume();

        if (resumeResult && typeof resumeResult.catch === "function") {
          resumeResult.catch(function () {});
        }
      }

      startAt = context.currentTime;
      endAt = startAt + profile.durationMs / 1000;
      oscillator = context.createOscillator();
      overtoneOscillator = context.createOscillator();
      gain = context.createGain();
      overtoneGain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(profile.pitchHz * 0.92, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(
        profile.pitchHz * 1.12,
        endAt
      );
      overtoneOscillator.type = "triangle";
      overtoneOscillator.frequency.setValueAtTime(
        profile.pitchHz * 2.71,
        startAt
      );
      overtoneOscillator.frequency.exponentialRampToValueAtTime(
        profile.pitchHz * 2.88,
        startAt + 0.055
      );
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(profile.volume, startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, endAt);
      overtoneGain.gain.setValueAtTime(0.0001, startAt);
      overtoneGain.gain.exponentialRampToValueAtTime(
        profile.volume * 0.42,
        startAt + 0.004
      );
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.07);
      oscillator.connect(gain);
      overtoneOscillator.connect(overtoneGain);
      gain.connect(context.destination);
      overtoneGain.connect(context.destination);
      oscillator.start(startAt);
      overtoneOscillator.start(startAt);
      oscillator.stop(endAt + 0.02);
      overtoneOscillator.stop(startAt + 0.09);
    } catch (error) {
      return;
    }
  }

  function triggerCorrect(comboCount) {
    var profile = getIntenseFeedbackProfile(comboCount);

    spawnParticles(profile);
    playTing(profile);
  }

  renderSoundState();

  return {
    clear: clear,
    renderSoundState: renderSoundState,
    setSoundEnabled: setSoundEnabled,
    toggleSound: toggleSound,
    triggerCorrect: triggerCorrect,
  };
}
