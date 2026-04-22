import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { Download, ChevronDown, Settings2, Code2, MousePointerClick } from "lucide-react";
import type { PersistedResumeProject, TemplateName, StyleSettings } from "../lib/storage";
import { StylePanel } from "./StylePanel";
import { messages, type Language } from "../lib/i18n";
import { parseImportedMarkdown, parseImportedPdf, parseImportedProjectJson } from "../lib/import";

export type EditorTab = "markdown" | "css";

interface ToolbarProps {
  language: Language;
  template: TemplateName;
  onTemplateChange: (t: TemplateName) => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onExportMarkdown: () => void;
  onImportMarkdown: (markdown: string) => void;
  onImportProject: (project: PersistedResumeProject) => void;
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
  onImportMarkdown,
  onImportProject,
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
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const styleButtonRef = useRef<HTMLButtonElement>(null);
  const markdownImportRef = useRef<HTMLInputElement>(null);
  const jsonImportRef = useRef<HTMLInputElement>(null);
  const pdfImportRef = useRef<HTMLInputElement>(null);
  const copy = messages[language];
  const templates: { value: TemplateName; label: string }[] = [
    { value: "classic", label: copy.toolbar.templates.classic },
    { value: "modern", label: copy.toolbar.templates.modern },
    { value: "minimal", label: copy.toolbar.templates.minimal },
    { value: "professional", label: copy.toolbar.templates.professional },
    { value: "creative", label: copy.toolbar.templates.creative },
  ];

  useEffect(() => {
    function handleClickOutside(e: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setImportOpen(false);
        setExportOpen(false);
      }
    }
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

  function importErrorMessage(error: unknown): string {
    const code = typeof error === "object" && error && "code" in error ? error.code : undefined;

    switch (code) {
      case "unsupported-type":
        return copy.toolbar.import.errors.unsupportedType;
      case "read-failed":
        return copy.toolbar.import.errors.readFailed;
      case "invalid-json":
        return copy.toolbar.import.errors.invalidJson;
      case "invalid-project":
        return copy.toolbar.import.errors.invalidProject;
      case "pdf-empty":
        return copy.toolbar.import.errors.pdfEmpty;
      case "pdf-parse-failed":
        return copy.toolbar.import.errors.pdfParseFailed;
      default:
        return copy.toolbar.import.errors.readFailed;
    }
  }

  async function handleMarkdownImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.confirm(copy.toolbar.import.confirmMarkdown)) {
        return;
      }

      const text = await file.text();
      const markdown = await parseImportedMarkdown(text);
      onImportMarkdown(markdown);
      setImportOpen(false);
      setExportOpen(false);
      setImportError(null);
    } catch (error) {
      setImportError(importErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function handleProjectImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.confirm(copy.toolbar.import.confirmProject)) {
        return;
      }

      const text = await file.text();
      const project = await parseImportedProjectJson(text);
      onImportProject(project);
      setImportOpen(false);
      setExportOpen(false);
      setImportError(null);
    } catch (error) {
      setImportError(importErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  async function handlePdfImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      if (!window.confirm(copy.toolbar.import.confirmPdf)) {
        return;
      }

      const markdown = await parseImportedPdf(file);
      onImportMarkdown(markdown);
      setImportOpen(false);
      setExportOpen(false);
      setImportError(null);
    } catch (error) {
      setImportError(importErrorMessage(error));
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div>
      <div className={`relative border-b border-gray-200 bg-white ${compact ? "px-3 py-2.5" : "px-4 py-3"}`}>
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
                ref={styleButtonRef}
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

          <div className={`flex gap-2 ${compact ? "col-span-2" : "ml-auto self-end"}`} ref={menuRef}>
            <div className="relative">
              <button
                onClick={() => {
                  setImportOpen((open) => !open);
                  setExportOpen(false);
                }}
                className={`flex items-center justify-center gap-1.5 ${compact ? "px-3 py-2.5" : "px-3 py-2"} text-xs rounded-md border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors`}
              >
                {copy.toolbar.import.trigger}
                <ChevronDown size={12} />
              </button>
              <input
                ref={markdownImportRef}
                type="file"
                accept=".md,.markdown,text/markdown,text/plain"
                className="hidden"
                tabIndex={-1}
                data-testid="import-markdown-input"
                aria-label={copy.toolbar.import.markdownInput}
                onChange={handleMarkdownImport}
              />
              <input
                ref={jsonImportRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                tabIndex={-1}
                aria-label={copy.toolbar.import.projectJsonInput}
                onChange={handleProjectImport}
              />
              <input
                ref={pdfImportRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                tabIndex={-1}
                aria-label={copy.toolbar.import.pdfInput}
                onChange={handlePdfImport}
              />
              {importOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded shadow-lg z-10">
                  <button
                    onClick={() => {
                      setImportError(null);
                      markdownImportRef.current?.click();
                      setImportOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {copy.toolbar.import.markdown}
                  </button>
                  <button
                    onClick={() => {
                      setImportError(null);
                      jsonImportRef.current?.click();
                      setImportOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {copy.toolbar.import.projectJson}
                  </button>
                  <button
                    onClick={() => {
                      setImportError(null);
                      pdfImportRef.current?.click();
                      setImportOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {copy.toolbar.import.pdf}
                  </button>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setExportOpen((open) => !open);
                  setImportOpen(false);
                }}
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
      </div>

      {importError && (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {importError}
        </div>
      )}

      {styleOpen && (
        <StylePanel
          language={language}
          style={style}
          onChange={onStyleChange}
          onReset={onStyleReset}
          onClose={() => setStyleOpen(false)}
          triggerRef={styleButtonRef}
        />
      )}
    </div>
  );
}
