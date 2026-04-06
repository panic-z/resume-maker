import { useState, useEffect, useRef, useCallback } from "react";
import { loadContent, saveContent, loadTemplate, saveTemplate } from "../lib/storage";
import type { TemplateName } from "../lib/storage";
import { DEFAULT_RESUME } from "../data/default-resume";

export function useResume() {
  const [markdown, setMarkdown] = useState<string>(() => {
    return loadContent() ?? DEFAULT_RESUME;
  });

  const [template, setTemplate] = useState<TemplateName>(() => {
    return loadTemplate();
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveContent(markdown);
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [markdown]);

  const changeTemplate = useCallback((t: TemplateName) => {
    setTemplate(t);
    saveTemplate(t);
  }, []);

  return { markdown, setMarkdown, template, changeTemplate };
}
