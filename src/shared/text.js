export function trimText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function collapseWhitespace(value) {
  return trimText(value).replace(/\s+/g, " ");
}
