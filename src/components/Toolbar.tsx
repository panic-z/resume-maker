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
  compact: boolean;
  workspaceView: "editor" | "preview";
  onWorkspaceViewChange: (view: "editor" | "preview") => void;
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
  compact,
  workspaceView,
  onWorkspaceViewChange,
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
      <div className={`border-b border-gray-200 bg-white ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
        <div className={compact ? "grid grid-cols-2 items-end gap-x-3 gap-y-2" : "flex flex-wrap items-start gap-3"}>
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              {copy.toolbar.template}
            </span>
            {compact ? (
              <select
                value={template}
                onChange={(e) => onTemplateChange(e.target.value as TemplateName)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                aria-label={copy.toolbar.template}
              >
                {templates.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onTemplateChange(t.value)}
                    className={`px-2.5 py-1.5 text-xs rounded-md transition-colors ${
                      template === t.value
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={`flex min-w-0 flex-col gap-1 ${compact ? "col-span-2" : ""}`}>
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              {copy.toolbar.mode}
            </span>
            <div className={`flex flex-wrap items-center ${compact ? "gap-1" : "gap-1.5"}`}>
              <button
                onClick={() => setStyleOpen(!styleOpen)}
                className={`flex items-center gap-1 ${compact ? "px-2 py-1.5" : "px-2.5 py-1.5"} text-xs rounded-md transition-colors ${
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
                className={`flex items-center gap-1 ${compact ? "px-2 py-1.5" : "px-2.5 py-1.5"} text-xs rounded-md transition-colors ${
                  editorTab === "css"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Code2 size={13} />
                {editorTab === "css" ? copy.toolbar.markdown : "CSS"}
              </button>

              <button
                onClick={() => onEditModeChange(!editMode)}
                className={`flex items-center gap-1 ${compact ? "px-2 py-1.5" : "px-2.5 py-1.5"} text-xs rounded-md transition-colors ${
                  editMode
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <MousePointerClick size={13} />
                {copy.toolbar.visual}
              </button>
            </div>
          </div>

          {compact && (
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
                {copy.toolbar.workspace}
              </span>
              <div className="inline-flex rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => onWorkspaceViewChange("editor")}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    workspaceView === "editor" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {copy.toolbar.edit}
                </button>
                <button
                  type="button"
                  onClick={() => onWorkspaceViewChange("preview")}
                  className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                    workspaceView === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  {copy.toolbar.preview}
                </button>
              </div>
            </div>
          )}

          <div className={`relative ${compact ? "col-span-2" : "ml-auto self-end"}`} ref={dropdownRef}>
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className={`flex items-center justify-center gap-1.5 ${compact ? "w-full px-3 py-2.5" : "px-3 py-2"} text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors`}
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
      </div>

      {styleOpen && (
        <StylePanel
          language={language}
          style={style}
          onChange={onStyleChange}
          onReset={onStyleReset}
          onClose={() => setStyleOpen(false)}
        />
      )}
    </div>
  );
}
