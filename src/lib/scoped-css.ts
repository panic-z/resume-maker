function prefixSelector(selector: string, scope: string): string {
  const trimmed = selector.trim();
  if (!trimmed) return scope;
  if (trimmed.includes("&")) return trimmed.replaceAll("&", scope);
  if (trimmed === ":root") return scope;
  if (trimmed === scope || trimmed.startsWith(`${scope} `) || trimmed.startsWith(`${scope}:`) || trimmed.startsWith(`${scope}[`)) {
    return trimmed;
  }
  return `${scope} ${trimmed}`;
}

function scopeRule(header: string, body: string, scope: string): string {
  const trimmedHeader = header.trim();
  const trimmedBody = body.trim();

  if (!trimmedHeader) {
    return trimmedBody ? `${scope} {\n${trimmedBody}\n}` : "";
  }

  if (
    trimmedHeader.startsWith("@media") ||
    trimmedHeader.startsWith("@supports") ||
    trimmedHeader.startsWith("@container") ||
    trimmedHeader.startsWith("@layer")
  ) {
    const nested = scopeCustomCss(trimmedBody, scope);
    return `${trimmedHeader} {\n${nested}\n}`;
  }

  if (
    trimmedHeader.startsWith("@keyframes") ||
    trimmedHeader.startsWith("@font-face") ||
    trimmedHeader.startsWith("@page")
  ) {
    return `${trimmedHeader} {\n${trimmedBody}\n}`;
  }

  const selectors = trimmedHeader
    .split(",")
    .map((selector) => prefixSelector(selector, scope))
    .join(", ");

  return `${selectors} {\n${trimmedBody}\n}`;
}

export function scopeCustomCss(css: string, scope: string): string {
  const trimmed = css.trim();
  if (!trimmed) return "";

  let index = 0;
  const blocks: string[] = [];

  while (index < trimmed.length) {
    while (index < trimmed.length && /\s/.test(trimmed[index])) index++;
    if (index >= trimmed.length) break;

    const openBrace = trimmed.indexOf("{", index);
    if (openBrace === -1) {
      const trailing = trimmed.slice(index).trim();
      if (trailing) blocks.push(`${scope} {\n${trailing}\n}`);
      break;
    }

    const header = trimmed.slice(index, openBrace);
    let depth = 1;
    let cursor = openBrace + 1;
    while (cursor < trimmed.length && depth > 0) {
      const char = trimmed[cursor];
      if (char === "{") depth++;
      if (char === "}") depth--;
      cursor++;
    }

    const body = trimmed.slice(openBrace + 1, cursor - 1);
    const scopedRule = scopeRule(header, body, scope);
    if (scopedRule) blocks.push(scopedRule);
    index = cursor;
  }

  return blocks.join("\n\n");
}
