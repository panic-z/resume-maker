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

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  let index = 0;

  while (index < css.length) {
    while (index < css.length && /\s/.test(css[index])) index++;
    if (index >= css.length) break;

    const openBrace = css.indexOf("{", index);
    if (openBrace === -1) break;

    const selector = css.slice(index, openBrace).trim();
    let depth = 1;
    let cursor = openBrace + 1;

    while (cursor < css.length && depth > 0) {
      const char = css[cursor];
      if (char === "{") depth++;
      if (char === "}") depth--;
      cursor++;
    }

    const raw = css.slice(index, cursor).trim();
    const body = css.slice(openBrace + 1, cursor - 1).trim();
    const properties: CssProperties = {};

    if (!selector.startsWith("@")) {
      for (const declaration of splitDeclarations(body)) {
        const colonIdx = declaration.indexOf(":");
        if (colonIdx === -1) continue;
        const prop = declaration.slice(0, colonIdx).trim();
        const val = declaration.slice(colonIdx + 1).trim();
        if (prop && val) properties[prop] = val;
      }
    }

    rules.push({ selector, properties, raw });
    index = cursor;
  }

  return rules;
}

export function mergeCustomCss(existingCss: string, selector: string, newProps: CssProperties): string {
  const rules = parseRules(existingCss);
  const existingIdx = rules.findIndex((r) => r.selector === selector);

  if (existingIdx !== -1) {
    const merged = { ...rules[existingIdx].properties, ...newProps };
    const cleaned: CssProperties = {};
    for (const [k, v] of Object.entries(merged)) {
      if (v.trim() !== "") cleaned[k] = v;
    }
    const newRule = generateCssRule(selector, cleaned);
    if (!newRule) {
      rules.splice(existingIdx, 1);
      return rules.map((r) => r.raw).join("\n\n");
    }
    rules[existingIdx] = { selector, properties: cleaned, raw: newRule };
    return rules.map((r) => r.raw).join("\n\n");
  }

  const newRule = generateCssRule(selector, newProps);
  if (!newRule) return existingCss;
  return existingCss.trim() ? `${existingCss.trim()}\n\n${newRule}` : newRule;
}

export function getExistingProperties(css: string, selector: string): CssProperties {
  const rules = parseRules(css);
  const rule = rules.find((r) => r.selector === selector);
  return rule ? { ...rule.properties } : {};
}

export function removeCustomCssRule(css: string, selector: string): string {
  const rules = parseRules(css).filter((rule) => rule.selector !== selector);
  return rules.map((rule) => rule.raw).join("\n\n");
}
