export function syncThemeSelection(dom, theme) {
  var nextTheme =
    theme === "light" || theme === "dark" ? theme : "system";

  if (nextTheme === "system") {
    dom.rootElement.removeAttribute("data-theme");
  } else {
    dom.rootElement.setAttribute("data-theme", nextTheme);
  }

  Object.keys(dom.themeButtons).forEach(function (themeName) {
    var button = dom.themeButtons[themeName];
    var isActive = themeName === nextTheme;

    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  return nextTheme;
}
