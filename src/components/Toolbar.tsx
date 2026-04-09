import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown, Settings2, Code2, MousePointerClick } from "lucide-react";
import type { TemplateName, StyleSettings } from "../lib/storage";
import { StylePanel } from "./StylePanel";
import { messages, type Language } from "../lib/i18n";

export type EditorTab = "markdown" | "css";

interface ToolbarProps {
  language: Language;
  template: TemplateName;
  onTemplateChange: (t: TemplateName) => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onExportMarkdown: () => void;
  style: StyleSettings;
  onStyleChange: (patch: Partial<StyleSettings>) => void;
  onStyleReset: () => void;
  editorTab: EditorTab;
  onEditorTabChange: (tab: EditorTab) => void;
  editMode: boolean;
  onEditModeChange: (v: boolean) => void;
}

export function Toolbar({
  language,
  template,
  onTemplateChange,
  onExportPdf,
  onExportHtml,
  onExportMarkdown,
  style,
  onStyleChange,
  onStyleReset,
  editorTab,
  onEditorTabChange,
  editMode,
  onEditModeChange,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const copy = messages[language];
  const templates: { value: TemplateName; label: string }[] = [
    { value: "classic", label: copy.toolbar.templates.classic },
    { value: "modern", label: copy.toolbar.templates.modern },
    { value: "minimal", label: copy.toolbar.templates.minimal },
    { value: "professional", label: copy.toolbar.templates.professional },
    { value: "creative", label: copy.toolbar.templates.creative },
  ];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-500 mr-1">{copy.toolbar.template}</span>
          {templates.map((t) => (
            <button
              key={t.value}
              onClick={() => onTemplateChange(t.value)}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                template === t.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setStyleOpen(!styleOpen)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
            styleOpen
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Settings2 size={13} />
          {copy.toolbar.style}
        </button>

        <button
          onClick={() => onEditorTabChange(editorTab === "css" ? "markdown" : "css")}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
            editorTab === "css"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Code2 size={13} />
          CSS
        </button>

        <button
          onClick={() => onEditModeChange(!editMode)}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded transition-colors ${
            editMode
              ? "bg-amber-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <MousePointerClick size={13} />
          {copy.toolbar.visual}
        </button>

        <div className="ml-auto relative" ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Download size={14} />
            {copy.toolbar.export}
            <ChevronDown size={12} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
              <button
                onClick={() => { onExportPdf(); setExportOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                PDF
              </button>
              <button
                onClick={() => { onExportHtml(); setExportOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                HTML
              </button>
              <button
                onClick={() => { onExportMarkdown(); setExportOpen(false); }}
                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
              >
                Markdown
              </button>
            </div>
          )}
        </div>
      </div>

      {styleOpen && (
        <StylePanel language={language} style={style} onChange={onStyleChange} onReset={onStyleReset} />
      )}
    </div>
  );
}
