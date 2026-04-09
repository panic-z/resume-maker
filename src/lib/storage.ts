import type { Language } from "./i18n";

const CONTENT_KEY = "resume-maker:content";
const TEMPLATE_KEY = "resume-maker:template";
const STYLE_KEY = "resume-maker:style";
const CUSTOM_CSS_KEY = "resume-maker:custom-css";
const LANGUAGE_KEY = "resume-maker:language";

export type TemplateName = "classic" | "modern" | "minimal" | "professional" | "creative";

export type FontFamily = "serif" | "sans" | "system";

export interface StyleSettings {
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  fontFamily: FontFamily;
  pagePadding: number;
}

export const DEFAULT_STYLE: StyleSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  accentColor: "#000000",
  fontFamily: "serif",
  pagePadding: 20,
};

export const TEMPLATE_DEFAULTS: Record<TemplateName, Pick<StyleSettings, "fontFamily" | "accentColor">> = {
  classic: { fontFamily: "serif", accentColor: "#000000" },
  modern: { fontFamily: "sans", accentColor: "#3b82f6" },
  minimal: { fontFamily: "sans", accentColor: "#333333" },
  professional: { fontFamily: "serif", accentColor: "#1e3a5f" },
  creative: { fontFamily: "sans", accentColor: "#7c3aed" },
};

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  serif: 'Georgia, "Noto Serif SC", "Times New Roman", serif',
  sans: 'Inter, "Noto Sans SC", system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Noto Sans SC", sans-serif',
};

export function fontFamilyValue(key: FontFamily): string {
  return FONT_FAMILY_MAP[key];
}

export function styleToCssVars(s: StyleSettings): Record<string, string> {
  return {
    "--resume-font-size": `${s.fontSize}px`,
    "--resume-line-height": `${s.lineHeight}`,
    "--resume-accent": s.accentColor,
    "--resume-font-family": fontFamilyValue(s.fontFamily),
    "--resume-padding": `${s.pagePadding}mm`,
  };
}

export function loadContent(): string | null {
  try { return localStorage.getItem(CONTENT_KEY); } catch { return null; }
}

function safeSave(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* QuotaExceededError or private mode */ }
}

export function saveContent(content: string): void {
  safeSave(CONTENT_KEY, content);
}

const VALID_TEMPLATES: TemplateName[] = ["classic", "modern", "minimal", "professional", "creative"];

export function loadTemplate(): TemplateName {
  try {
    const value = localStorage.getItem(TEMPLATE_KEY);
    if (value && VALID_TEMPLATES.includes(value as TemplateName)) return value as TemplateName;
  } catch { /* ignore */ }
  return "classic";
}

export function saveTemplate(template: TemplateName): void {
  safeSave(TEMPLATE_KEY, template);
}

function clamp(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

const VALID_FONT_FAMILIES: FontFamily[] = ["serif", "sans", "system"];

export function loadStyle(): StyleSettings {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return DEFAULT_STYLE;
    const parsed = JSON.parse(raw);
    return {
      fontSize: clamp(parsed.fontSize, 10, 18, DEFAULT_STYLE.fontSize),
      lineHeight: clamp(parsed.lineHeight, 1.0, 2.2, DEFAULT_STYLE.lineHeight),
      accentColor: typeof parsed.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.accentColor)
        ? parsed.accentColor : DEFAULT_STYLE.accentColor,
      fontFamily: VALID_FONT_FAMILIES.includes(parsed.fontFamily) ? parsed.fontFamily : DEFAULT_STYLE.fontFamily,
      pagePadding: clamp(parsed.pagePadding, 10, 30, DEFAULT_STYLE.pagePadding),
    };
  } catch {
    return DEFAULT_STYLE;
  }
}

export function saveStyle(style: StyleSettings): void {
  safeSave(STYLE_KEY, JSON.stringify(style));
}

export function loadCustomCss(): string {
  try { return localStorage.getItem(CUSTOM_CSS_KEY) ?? ""; } catch { return ""; }
}

export function saveCustomCss(css: string): void {
  safeSave(CUSTOM_CSS_KEY, css);
}

const VALID_LANGUAGES: Language[] = ["zh", "en"];

export function loadLanguage(): Language {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    if (value && VALID_LANGUAGES.includes(value as Language)) return value as Language;
  } catch { /* ignore */ }
  return "zh";
}

export function saveLanguage(language: Language): void {
  safeSave(LANGUAGE_KEY, language);
}
