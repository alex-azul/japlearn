function getRelativePoint(canvas, event) {
  var rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function createScratchpad(canvas, options = {}) {
  var view = options.view || canvas.ownerDocument.defaultView || null;
  var strokeStyle = options.strokeStyle || "#111111";
  var lineWidth = options.lineWidth || 6;
  var context = null;
  var cssWidth = 0;
  var cssHeight = 0;
  var isDrawing = false;
  var activePointerId = null;
  var lastPoint = null;

  function configureContext() {
    if (!context) {
      return;
    }

    context.strokeStyle = strokeStyle;
    context.lineWidth = lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    var dpr = view && view.devicePixelRatio ? view.devicePixelRatio : 1;
    var width;
    var height;

    if (rect.width < 1 || rect.height < 1) {
      return false;
    }

    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width === width && canvas.height === height && context) {
      return false;
    }

    cssWidth = rect.width;
    cssHeight = rect.height;
    canvas.width = width;
    canvas.height = height;
    context = canvas.getContext("2d");

    if (!context) {
      return false;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    configureContext();
    clear();
    return true;
  }

  function clear() {
    if (!context && !resize()) {
      return;
    }

    context.clearRect(0, 0, cssWidth, cssHeight);
  }

  function startStroke(event) {
    if (event.button !== undefined && event.button !== 0 && event.pointerType !== "touch") {
      return;
    }

    if (!context) {
      resize();
    }

    if (!context) {
      return;
    }

    isDrawing = true;
    activePointerId = event.pointerId;
    lastPoint = getRelativePoint(canvas, event);

    if (typeof canvas.setPointerCapture === "function") {
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        // Some browsers can throw if capture is unavailable for this pointer.
      }
    }

    event.preventDefault();
  }

  function moveStroke(event) {
    var nextPoint;

    if (!isDrawing || event.pointerId !== activePointerId || !context) {
      return;
    }

    nextPoint = getRelativePoint(canvas, event);
    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(nextPoint.x, nextPoint.y);
    context.stroke();
    lastPoint = nextPoint;
    event.preventDefault();
  }

  function endStroke(event) {
    if (!isDrawing) {
      return;
    }

    if (event.pointerId !== undefined && event.pointerId !== activePointerId) {
      return;
    }

    isDrawing = false;
    activePointerId = null;
    lastPoint = null;

    if (
      event.pointerId !== undefined &&
      typeof canvas.releasePointerCapture === "function"
    ) {
      try {
        canvas.releasePointerCapture(event.pointerId);
      } catch (error) {
        // Ignore release errors when the pointer was never captured.
      }
    }
  }

  function destroy() {
    canvas.removeEventListener("pointerdown", startStroke);
    canvas.removeEventListener("pointermove", moveStroke);
    canvas.removeEventListener("pointerup", endStroke);
    canvas.removeEventListener("pointercancel", endStroke);

    if (view) {
      view.removeEventListener("resize", resize);
    }
  }

  canvas.addEventListener("pointerdown", startStroke);
  canvas.addEventListener("pointermove", moveStroke);
  canvas.addEventListener("pointerup", endStroke);
  canvas.addEventListener("pointercancel", endStroke);

  if (view) {
    view.addEventListener("resize", resize);
  }

  return {
    clear: clear,
    destroy: destroy,
    resize: resize,
  };
}
