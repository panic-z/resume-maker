import { useRef, useCallback, useEffect, useState } from "react";
import "../templates/classic.css";
import "../templates/modern.css";
import "../templates/minimal.css";
import "../templates/professional.css";
import "../templates/creative.css";
import { styleToCssVars } from "../lib/storage";
import type { TemplateName, StyleSettings } from "../lib/storage";
import { messages, type Language } from "../lib/i18n";
import { getPreviewScale } from "./preview-layout";
import { scopeCustomCss } from "../lib/scoped-css";

export interface SelectedElement {
  selector: string;
  label: string;
  rect: DOMRect;
}

interface PreviewProps {
  html: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
  editMode?: boolean;
  onElementSelect?: (el: SelectedElement | null) => void;
}

function detectElement(target: HTMLElement, container: HTMLElement, language: Language): SelectedElement | null {
  const copy = messages[language].preview.elements;
  const selectorMap: { className: string; selector: string; label: string }[] = [
    { className: "resume-name", selector: ".resume-name", label: copy.name },
    { className: "resume-contact", selector: ".resume-contact", label: copy.contact },
    { className: "resume-section-title", selector: ".resume-section-title", label: copy.sectionTitle },
    { className: "resume-entry-title", selector: ".resume-entry-title", label: copy.entryTitle },
    { className: "resume-section", selector: ".resume-section", label: copy.section },
  ];
  let el: HTMLElement | null = target;
  while (el && el !== container) {
    for (const item of selectorMap) {
      if (el.classList.contains(item.className)) {
        return { selector: item.selector, label: item.label, rect: el.getBoundingClientRect() };
      }
    }
    const tag = el.tagName.toLowerCase();
    if (tag === "li") return { selector: "li", label: copy.listItem, rect: el.getBoundingClientRect() };
    if (tag === "a") return { selector: "a", label: copy.link, rect: el.getBoundingClientRect() };
    if (tag === "ul") return { selector: "ul", label: copy.list, rect: el.getBoundingClientRect() };
    el = el.parentElement;
  }
  return null;
}

export function Preview({ html, template, style, customCss, language, editMode, onElementSelect }: PreviewProps) {
  const cssVars = styleToCssVars(style);
  const resumeRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-resume-custom", "");
    el.textContent = scopeCustomCss(customCss, "#resume-preview");
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [customCss]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onElementSelect || !resumeRef.current) return;
    e.preventDefault();
    const target = e.target as HTMLElement;
    const selected = detectElement(target, resumeRef.current, language);
    onElementSelect(selected);
  }, [editMode, language, onElementSelect]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateScale = () => {
      if (!containerRef.current) return;
      setScale(getPreviewScale(containerRef.current.clientWidth));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(containerRef.current);
    window.addEventListener("resize", updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  const scaledWidth = `${794 * scale}px`;
  const scaledHeight = `${1123 * scale}px`;

  return (
    <div ref={containerRef} className="h-full overflow-auto bg-gray-100 p-4 md:p-8 relative">
      <div className="mx-auto transition-[width,height] duration-200" style={{ width: scaledWidth, minHeight: scaledHeight }}>
        <div
          ref={resumeRef}
          id="resume-preview"
          className={`template-${template} bg-white shadow-lg w-[210mm] min-h-[297mm] ${editMode ? "resume-edit-mode" : ""}`}
          style={{
            ...cssVars,
            padding: `${style.pagePadding}mm`,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          } as React.CSSProperties}
          onClick={handleClick}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {editMode && (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded">
          {messages[language].preview.hint}
        </div>
      )}
    </div>
  );
}
