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

function parseRules(css: string): ParsedRule[] {
  const rules: ParsedRule[] = [];
  const regex = /([^{}]+)\{([^}]*)\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const selector = match[1].trim();
    const body = match[2].trim();
    const properties: CssProperties = {};
    for (const line of body.split(";")) {
      const colonIdx = line.indexOf(":");
      if (colonIdx === -1) continue;
      const prop = line.slice(0, colonIdx).trim();
      const val = line.slice(colonIdx + 1).trim();
      if (prop && val) properties[prop] = val;
    }
    rules.push({ selector, properties, raw: match[0].trim() });
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
