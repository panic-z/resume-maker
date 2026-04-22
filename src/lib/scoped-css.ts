function stripBlockComments(value: string): string {
  let result = "";
  let index = 0;
  let quote: '"' | "'" | null = null;
  let escaped = false;

  while (index < value.length) {
    const char = value[index];
    const next = value[index + 1];

    if (escaped) {
      result += char;
      escaped = false;
      index++;
      continue;
    }

    if (quote) {
      result += char;
      if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      index++;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      result += char;
      index++;
      continue;
    }

    if (char === "/" && next === "*") {
      index += 2;
      while (index < value.length) {
        if (value[index] === "*" && value[index + 1] === "/") {
          index += 2;
          break;
        }
        index++;
      }
      continue;
    }

    result += char;
    index++;
  }

  return result;
}

function prefixSelector(selector: string, scope: string): string {
  const trimmed = stripBlockComments(selector).trim();
  if (!trimmed) return scope;
  if (trimmed.includes("&")) return trimmed.replaceAll("&", scope);
  if (trimmed === ":root") return scope;
  if (trimmed === scope || trimmed.startsWith(`${scope} `) || trimmed.startsWith(`${scope}:`) || trimmed.startsWith(`${scope}[`)) {
    return trimmed;
  }
  return `${scope} ${trimmed}`;
}

function splitSelectors(selectorList: string): string[] {
  const selectors: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const char of selectorList) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (quote) {
      current += char;
      if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      current += char;
      continue;
    }

    if (char === "(") {
      parenDepth++;
      current += char;
      continue;
    }

    if (char === ")" && parenDepth > 0) {
      parenDepth--;
      current += char;
      continue;
    }

    if (char === "[") {
      bracketDepth++;
      current += char;
      continue;
    }

    if (char === "]" && bracketDepth > 0) {
      bracketDepth--;
      current += char;
      continue;
    }

    if (char === "," && parenDepth === 0 && bracketDepth === 0) {
      const trimmed = current.trim();
      if (trimmed) selectors.push(trimmed);
      current = "";
      continue;
    }

    current += char;
  }

  const trailing = current.trim();
  if (trailing) selectors.push(trailing);
  return selectors;
}

function scopeRule(header: string, body: string, scope: string): string {
  const trimmedHeader = stripBlockComments(header).trim();
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
    return "";
  }

  const selectors = splitSelectors(trimmedHeader)
    .map((selector) => prefixSelector(selector, scope))
    .join(", ");

  return `${selectors} {\n${trimmedBody}\n}`;
}

function findBlockEnd(source: string, start: number): number {
  let depth = 1;
  let cursor = start;
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let inComment = false;

  while (cursor < source.length && depth > 0) {
    const char = source[cursor];
    const next = source[cursor + 1];

    if (inComment) {
      if (char === "*" && next === "/") {
        inComment = false;
        cursor += 2;
        continue;
      }
      cursor++;
      continue;
    }

    if (escaped) {
      escaped = false;
      cursor++;
      continue;
    }

    if (quote) {
      if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = null;
      }
      cursor++;
      continue;
    }

    if (char === "/" && next === "*") {
      inComment = true;
      cursor += 2;
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      cursor++;
      continue;
    }

    if (char === "{") depth++;
    if (char === "}") depth--;
    cursor++;
  }

  return cursor;
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
    const cursor = findBlockEnd(trimmed, openBrace + 1);

    const body = trimmed.slice(openBrace + 1, cursor - 1);
    const scopedRule = scopeRule(header, body, scope);
    if (scopedRule) blocks.push(scopedRule);
    index = cursor;
  }

  return blocks.join("\n\n");
}
