import { useRef, useCallback, useEffect } from "react";
import "../templates/classic.css";
import "../templates/modern.css";
import "../templates/minimal.css";
import "../templates/professional.css";
import "../templates/creative.css";
import { styleToCssVars } from "../lib/storage";
import type { TemplateName, StyleSettings } from "../lib/storage";

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
  editMode?: boolean;
  onElementSelect?: (el: SelectedElement | null) => void;
}

const SELECTOR_MAP: { className: string; selector: string; label: string }[] = [
  { className: "resume-name", selector: ".resume-name", label: "姓名" },
  { className: "resume-contact", selector: ".resume-contact", label: "联系方式" },
  { className: "resume-section-title", selector: ".resume-section-title", label: "章节标题" },
  { className: "resume-entry-title", selector: ".resume-entry-title", label: "条目标题" },
  { className: "resume-section", selector: ".resume-section", label: "章节" },
];

function detectElement(target: HTMLElement, container: HTMLElement): SelectedElement | null {
  let el: HTMLElement | null = target;
  while (el && el !== container) {
    for (const item of SELECTOR_MAP) {
      if (el.classList.contains(item.className)) {
        return { selector: item.selector, label: item.label, rect: el.getBoundingClientRect() };
      }
    }
    const tag = el.tagName.toLowerCase();
    if (tag === "li") return { selector: "li", label: "列表项", rect: el.getBoundingClientRect() };
    if (tag === "a") return { selector: "a", label: "链接", rect: el.getBoundingClientRect() };
    if (tag === "ul") return { selector: "ul", label: "列表", rect: el.getBoundingClientRect() };
    el = el.parentElement;
  }
  return null;
}

export function Preview({ html, template, style, customCss, editMode, onElementSelect }: PreviewProps) {
  const cssVars = styleToCssVars(style);
  const resumeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.createElement("style");
    el.setAttribute("data-resume-custom", "");
    el.textContent = customCss
      ? `#resume-preview {\n${customCss}\n}`
      : "";
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [customCss]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!editMode || !onElementSelect || !resumeRef.current) return;
    e.preventDefault();
    const target = e.target as HTMLElement;
    const selected = detectElement(target, resumeRef.current);
    onElementSelect(selected);
  }, [editMode, onElementSelect]);

  return (
    <div className="h-full overflow-auto bg-gray-100 p-8 relative">
      <div
        ref={resumeRef}
        id="resume-preview"
        className={`template-${template} bg-white shadow-lg w-[210mm] min-h-[297mm] mx-auto ${editMode ? "resume-edit-mode" : ""}`}
        style={{
          ...cssVars,
          padding: `${style.pagePadding}mm`,
        } as React.CSSProperties}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: html }}
      />
      {editMode && (
        <div className="absolute top-2 right-2 bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded">
          点击元素编辑样式
        </div>
      )}
    </div>
  );
}
