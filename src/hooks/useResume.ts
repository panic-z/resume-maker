import { useState, useEffect, useRef, useCallback } from "react";
import {
  loadContent, saveContent,
  loadTemplate, saveTemplate,
  loadStyle, saveStyle,
  loadCustomCss, saveCustomCss,
  DEFAULT_STYLE, TEMPLATE_DEFAULTS,
} from "../lib/storage";
import type { TemplateName, StyleSettings } from "../lib/storage";
import type { Language } from "../lib/i18n";
import { getDefaultResume, isDefaultResume } from "../data/default-resume";

export function useResume(language: Language) {
  const initialContent = loadContent();
  const hasCustomStoredContentRef = useRef(
    initialContent !== null && !isDefaultResume(initialContent),
  );
  const [markdown, setMarkdown] = useState<string>(() => {
    return initialContent ?? getDefaultResume(language);
  });

  const [template, setTemplate] = useState<TemplateName>(() => {
    return loadTemplate();
  });

  const [style, setStyleState] = useState<StyleSettings>(() => loadStyle());
  const [customCss, setCustomCssState] = useState<string>(() => loadCustomCss());

  const mdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cssTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const styleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const markdownRef = useRef(markdown);
  const customCssRef = useRef(customCss);
  const styleRef = useRef(style);
  markdownRef.current = markdown;
  customCssRef.current = customCss;
  styleRef.current = style;

  useEffect(() => {
    if (mdTimer.current) clearTimeout(mdTimer.current);
    mdTimer.current = setTimeout(() => saveContent(markdown), 500);
    return () => { if (mdTimer.current) clearTimeout(mdTimer.current); };
  }, [markdown]);

  useEffect(() => {
    if (!hasCustomStoredContentRef.current && isDefaultResume(markdown)) {
      setMarkdown(getDefaultResume(language));
    }
  }, [language, markdown]);

  useEffect(() => {
    if (cssTimer.current) clearTimeout(cssTimer.current);
    cssTimer.current = setTimeout(() => saveCustomCss(customCss), 500);
    return () => { if (cssTimer.current) clearTimeout(cssTimer.current); };
  }, [customCss]);

  useEffect(() => {
    if (styleTimer.current) clearTimeout(styleTimer.current);
    styleTimer.current = setTimeout(() => saveStyle(style), 300);
    return () => { if (styleTimer.current) clearTimeout(styleTimer.current); };
  }, [style]);

  useEffect(() => {
    const flush = () => {
      saveContent(markdownRef.current);
      saveCustomCss(customCssRef.current);
      saveStyle(styleRef.current);
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      flush();
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  const changeTemplate = useCallback((t: TemplateName) => {
    setTemplate(t);
    saveTemplate(t);
    const defaults = TEMPLATE_DEFAULTS[t];
    setStyleState((prev) => ({ ...prev, fontFamily: defaults.fontFamily, accentColor: defaults.accentColor }));
  }, []);

  const changeStyle = useCallback((patch: Partial<StyleSettings>) => {
    setStyleState((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetStyle = useCallback(() => {
    const defaults = TEMPLATE_DEFAULTS[template];
    setStyleState({ ...DEFAULT_STYLE, fontFamily: defaults.fontFamily, accentColor: defaults.accentColor });
  }, [template]);

  const setCustomCss = useCallback((css: string) => {
    setCustomCssState(css);
  }, []);

  return { markdown, setMarkdown, template, changeTemplate, style, changeStyle, resetStyle, customCss, setCustomCss };
}
