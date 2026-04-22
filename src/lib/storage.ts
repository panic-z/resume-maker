import type { Language } from "./i18n";
import {
  type BackgroundFit,
  type BackgroundMode,
  type BackgroundPreset,
  type CustomGradientBackground,
  type CustomImageBackground,
  type GradientDirection,
  isBackgroundPreset,
  resolveBackgroundLayers,
} from "./backgrounds";

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
  backgroundMode: BackgroundMode;
  backgroundPreset: BackgroundPreset;
  customGradient: CustomGradientBackground | null;
  customImage: CustomImageBackground | null;
}

export interface PersistedResumeProject {
  markdown: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
}

export const DEFAULT_STYLE: StyleSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  accentColor: "#000000",
  fontFamily: "serif",
  pagePadding: 20,
  backgroundMode: "preset",
  backgroundPreset: "plain",
  customGradient: null,
  customImage: null,
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

function isFontFamily(value: unknown): value is FontFamily {
  return typeof value === "string" && VALID_FONT_FAMILIES.includes(value as FontFamily);
}

function activeBackground(style: StyleSettings) {
  if (style.backgroundMode === "custom-gradient" && style.customGradient) {
    return resolveBackgroundLayers(style.customGradient);
  }

  if (style.backgroundMode === "custom-image" && style.customImage) {
    return resolveBackgroundLayers(style.customImage);
  }

  return resolveBackgroundLayers(style.backgroundPreset);
}

export function styleToCssVars(s: StyleSettings): Record<string, string> {
  const background = activeBackground(s);
  return {
    "--resume-font-size": `${s.fontSize}px`,
    "--resume-line-height": `${s.lineHeight}`,
    "--resume-accent": s.accentColor,
    "--resume-font-family": fontFamilyValue(s.fontFamily),
    "--resume-padding": `${s.pagePadding}mm`,
    "--resume-paper-background": background.paperBackground,
    "--resume-paper-overlay": background.paperOverlay,
    "--resume-paper-background-repeat": background.backgroundRepeat,
    "--resume-paper-background-size": background.backgroundSize,
    "--resume-paper-background-position": "top left, top left, top left",
    "--resume-background-id": `"${background.id}"`,
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
const VALID_BACKGROUND_MODES: BackgroundMode[] = ["preset", "custom-gradient", "custom-image"];
const VALID_GRADIENT_DIRECTIONS: GradientDirection[] = ["to-bottom", "to-bottom-right", "to-right"];
const VALID_BACKGROUND_FITS: BackgroundFit[] = ["cover", "contain", "repeat"];

function isHexColor(value: unknown): value is string {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
}

function parseCustomGradient(value: unknown): CustomGradientBackground | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    candidate.mode !== "custom-gradient"
    || !VALID_GRADIENT_DIRECTIONS.includes(candidate.direction as GradientDirection)
    || !isHexColor(candidate.from)
    || !isHexColor(candidate.to)
  ) {
    return null;
  }

  return {
    mode: "custom-gradient",
    direction: candidate.direction as GradientDirection,
    from: candidate.from,
    to: candidate.to,
  };
}

function parseCustomImage(value: unknown): CustomImageBackground | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const src = typeof candidate.src === "string" ? candidate.src.trim() : null;
  const isSupportedDataUrl =
    typeof src === "string"
    && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(src);
  if (
    candidate.mode !== "custom-image"
    || !isSupportedDataUrl
    || !VALID_BACKGROUND_FITS.includes(candidate.fit as BackgroundFit)
  ) {
    return null;
  }
  return {
    mode: "custom-image",
    src,
    fit: candidate.fit as BackgroundFit,
  };
}

function parseBackgroundSettings(parsed: Record<string, unknown>): Pick<
  StyleSettings,
  "backgroundMode" | "backgroundPreset" | "customGradient" | "customImage"
> {
  const backgroundPreset = isBackgroundPreset(parsed.backgroundPreset)
    ? parsed.backgroundPreset
    : DEFAULT_STYLE.backgroundPreset;
  const customGradient = parseCustomGradient(parsed.customGradient);
  const customImage = parseCustomImage(parsed.customImage);

  const fallback = {
    backgroundMode: "preset" as const,
    backgroundPreset,
    customGradient,
    customImage,
  };

  if (!("backgroundMode" in parsed) || parsed.backgroundMode == null) {
    return fallback;
  }

  if (!VALID_BACKGROUND_MODES.includes(parsed.backgroundMode as BackgroundMode)) {
    return fallback;
  }

  if (parsed.backgroundMode === "custom-gradient") {
    if (!customGradient) {
      return fallback;
    }

    return {
      backgroundMode: "custom-gradient",
      backgroundPreset,
      customGradient,
      customImage: null,
    };
  }

  if (parsed.backgroundMode === "custom-image") {
    if (!customImage) {
      return fallback;
    }

    return {
      backgroundMode: "custom-image",
      backgroundPreset,
      customGradient,
      customImage,
    };
  }

  return fallback;
}

export function normalizeStyleRecord(
  parsed: Record<string, unknown>,
  defaults: Pick<StyleSettings, "fontFamily" | "accentColor"> = TEMPLATE_DEFAULTS.classic,
): StyleSettings {
  const backgroundSettings = parseBackgroundSettings(parsed);

  return {
    fontSize: clamp(parsed.fontSize, 10, 18, DEFAULT_STYLE.fontSize),
    lineHeight: clamp(parsed.lineHeight, 1.0, 2.2, DEFAULT_STYLE.lineHeight),
    accentColor: isHexColor(parsed.accentColor)
      ? parsed.accentColor
      : defaults.accentColor,
    fontFamily: isFontFamily(parsed.fontFamily) ? parsed.fontFamily : defaults.fontFamily,
    pagePadding: clamp(parsed.pagePadding, 10, 30, DEFAULT_STYLE.pagePadding),
    ...backgroundSettings,
  };
}

export function normalizeImportedProject(
  parsed: Record<string, unknown>,
): PersistedResumeProject {
  const markdown = typeof parsed.markdown === "string" ? parsed.markdown : "";
  if (!markdown.trim()) {
    throw new Error("Invalid project");
  }

  const template = VALID_TEMPLATES.includes(parsed.template as TemplateName)
    ? (parsed.template as TemplateName)
    : "classic";
  const styleSource = parsed.style;
  const style = normalizeStyleRecord(
    styleSource && typeof styleSource === "object"
      ? (styleSource as Record<string, unknown>)
      : {},
    TEMPLATE_DEFAULTS[template],
  );
  const customCss = typeof parsed.customCss === "string" ? parsed.customCss : "";
  const language = VALID_LANGUAGES.includes(parsed.language as Language)
    ? (parsed.language as Language)
    : "zh";

  return {
    markdown,
    template,
    style,
    customCss,
    language,
  };
}

export function loadStyle(
  defaults: Pick<StyleSettings, "fontFamily" | "accentColor"> = TEMPLATE_DEFAULTS.classic,
): StyleSettings {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return { ...DEFAULT_STYLE, ...defaults };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return normalizeStyleRecord(parsed, defaults);
  } catch {
    return { ...DEFAULT_STYLE, ...defaults };
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

function detectBrowserLanguage(): Language {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const candidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language,
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return candidates.some((value) => value.toLowerCase().startsWith("zh")) ? "zh" : "en";
}

export function loadLanguage(): Language {
  try {
    const value = localStorage.getItem(LANGUAGE_KEY);
    if (value && VALID_LANGUAGES.includes(value as Language)) return value as Language;
  } catch { /* ignore */ }
  return detectBrowserLanguage();
}

export function saveLanguage(language: Language): void {
  safeSave(LANGUAGE_KEY, language);
}
