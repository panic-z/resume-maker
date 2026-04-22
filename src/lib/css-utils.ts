export interface CssProperties {
  [key: string]: string;
}

export function generateCssRule(selector: string, properties: CssProperties): string {
  const entries = Object.entries(properties).filter(([, v]) => v.trim() !== "");
  if (entries.length === 0) return "";
  const body = entries.map(([prop, val]) => `  ${prop}: ${val};`).join("\n");
  return `${selector} {\n${body}\n}`;
}

interface ParsedRule {
  selector: string;
  properties: CssProperties;
  raw: string;
}

function splitDeclarations(body: string): string[] {
  const declarations: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let escaped = false;
  let parenDepth = 0;
  let bracketDepth = 0;

  for (const char of body) {
    current += char;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }

    if (char === "(") {
      parenDepth++;
      continue;
    }

    if (char === ")" && parenDepth > 0) {
      parenDepth--;
      continue;
    }

    if (char === "[") {
      bracketDepth++;
      continue;
    }

    if (char === "]" && bracketDepth > 0) {
      bracketDepth--;
      continue;
    }

    if (char === ";" && parenDepth === 0 && bracketDepth === 0) {
      const declaration = current.slice(0, -1).trim();
      if (declaration) declarations.push(declaration);
      current = "";
    }
  }

  const trailing = current.trim();
  if (trailing) declarations.push(trailing);

  return declarations;
}

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

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  let index = 0;

  while (index < css.length) {
    while (index < css.length && /\s/.test(css[index])) index++;
    if (index >= css.length) break;

    const openBrace = css.indexOf("{", index);
    if (openBrace === -1) break;

    const selector = css.slice(index, openBrace).trim();
    const cursor = findBlockEnd(css, openBrace + 1);

    const raw = css.slice(index, cursor).trim();
    const body = css.slice(openBrace + 1, cursor - 1).trim();
    const properties: CssProperties = {};

    if (!selector.startsWith("@")) {
      for (const declaration of splitDeclarations(body)) {
        const cleanedDeclaration = stripBlockComments(declaration).trim();
        const colonIdx = cleanedDeclaration.indexOf(":");
        if (colonIdx === -1) continue;
        const prop = cleanedDeclaration.slice(0, colonIdx).trim();
        const val = cleanedDeclaration.slice(colonIdx + 1).trim();
        if (prop && val) properties[prop] = val;
      }
    }

    rules.push({ selector, properties, raw });
    index = cursor;
  }

  return rules;
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

export function mergeCustomCss(existingCss: string, selector: string, newProps: CssProperties): string {
  const rules = parseRules(existingCss);
  const matchingIndexes = rules
    .map((rule, index) => (rule.selector === selector ? index : -1))
    .filter((index) => index !== -1);
  const existingIdx = matchingIndexes.at(-1) ?? -1;

  if (existingIdx !== -1) {
    const mergedExisting = matchingIndexes.reduce<CssProperties>((acc, index) => {
      return { ...acc, ...rules[index].properties };
    }, {});
    const merged = { ...mergedExisting, ...newProps };
    const cleaned: CssProperties = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v.trim() !== "") cleaned[k] = v;
    }
    const newRule = generateCssRule(selector, cleaned);
    if (!newRule) {
      for (const index of [...matchingIndexes].reverse()) {
        rules.splice(index, 1);
      }
      return rules.map((r) => r.raw).join("\n\n");
    }
    rules[existingIdx] = { selector, properties: cleaned, raw: newRule };
    for (const index of matchingIndexes.slice(0, -1).reverse()) {
      rules.splice(index, 1);
    }
    return rules.map((r) => r.raw).join("\n\n");
  }

  const newRule = generateCssRule(selector, newProps);
  if (!newRule) return existingCss;
  return existingCss.trim() ? `${existingCss.trim()}\n\n${newRule}` : newRule;
}

export function getExistingProperties(css: string, selector: string): CssProperties {
  const rules = parseRules(css);
  const matchingRules = rules.filter((r) => r.selector === selector);
  return matchingRules.reduce<CssProperties>((acc, rule) => ({ ...acc, ...rule.properties }), {});
}

export function removeCustomCssRule(css: string, selector: string): string {
  const rules = parseRules(css).filter((rule) => rule.selector !== selector);
  return rules.map((rule) => rule.raw).join("\n\n");
}
