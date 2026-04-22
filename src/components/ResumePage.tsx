import { useState, useCallback, useRef, useEffect, lazy, Suspense } from "react";
import { Preview } from "./Preview";
import type { SelectedElement } from "./Preview";
import { Toolbar } from "./Toolbar";
import type { EditorTab } from "./Toolbar";
import { StylePopover } from "./StylePopover";
import { useResume } from "../hooks/useResume";
import { parseResumeToHtml } from "../lib/markdown";
import { exportPdf, exportHtml, exportMarkdown } from "../lib/export";
import type { Language } from "../lib/i18n";
import { isCompactLayout } from "./preview-layout";

const Editor = lazy(async () => import("./Editor").then((module) => ({ default: module.Editor })));
const CssEditor = lazy(async () => import("./CssEditor").then((module) => ({ default: module.CssEditor })));

interface ResumePageProps {
  language: Language;
}

export function ResumePage({ language }: ResumePageProps) {
  const {
    markdown, setMarkdown,
    template, changeTemplate,
    style, changeStyle, resetStyle,
    customCss, setCustomCss,
  } = useResume(language);

  const [splitPercent, setSplitPercent] = useState(50);
  const [editorTab, setEditorTab] = useState<EditorTab>("markdown");
  const [editMode, setEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [compact, setCompact] = useState(() => isCompactLayout(window.innerWidth));
  const [workspaceView, setWorkspaceView] = useState<"editor" | "preview">("editor");
  const [html, setHtml] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const workspaceViewRef = useRef(workspaceView);

  useEffect(() => {
    workspaceViewRef.current = workspaceView;
  }, [workspaceView]);

  useEffect(() => {
    let cancelled = false;
    parseResumeToHtml(markdown).then((result) => {
      if (!cancelled) {
        setHtml(result);
      }
    });
    return () => { cancelled = true; };
  }, [markdown]);

  useEffect(() => {
    const handleResize = () => {
      const nextCompact = isCompactLayout(window.innerWidth);
      setCompact(nextCompact);
      if (!nextCompact) {
        setWorkspaceView("editor");
      }
      if (nextCompact && workspaceViewRef.current === "editor") {
        setSelectedElement(null);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(percent, 20), 80));
    }
    function handleMouseUp() {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleExportPdf = useCallback(() => {
    if (!html) return;
    exportPdf(html, template, style, customCss, language);
  }, [html, template, style, customCss, language]);

  const handleExportHtml = useCallback(() => {
    if (!html) return;
    exportHtml(html, template, style, customCss, language);
  }, [html, template, style, customCss, language]);

  const handleExportMd = useCallback(() => {
    exportMarkdown(markdown);
  }, [markdown]);

  const handleImportMarkdown = useCallback((_file: File) => {
    // Task 5 only wires the picker shell; parsing is implemented in follow-up tasks.
  }, []);

  const handleImportProject = useCallback((_file: File) => {
    // Task 5 only wires the picker shell; parsing is implemented in follow-up tasks.
  }, []);

  const handleImportPdf = useCallback((_file: File) => {
    // Task 5 only wires the picker shell; parsing is implemented in follow-up tasks.
  }, []);

  const handleEditModeChange = useCallback((v: boolean) => {
    setEditMode(v);
    if (!v) setSelectedElement(null);
  }, []);

  const handleElementSelect = useCallback((el: SelectedElement | null) => {
    setSelectedElement(el);
  }, []);

  const handlePopoverClose = useCallback(() => {
    setSelectedElement(null);
  }, []);

  const handleStyleReset = useCallback(() => {
    resetStyle();
    setCustomCss("");
    setSelectedElement(null);
  }, [resetStyle, setCustomCss]);

  const handleWorkspaceViewChange = useCallback((view: "editor" | "preview") => {
    setWorkspaceView(view);
    if (view === "editor") {
      setSelectedElement(null);
    }
  }, []);

  const showEditor = !compact || workspaceView === "editor";
  const showPreview = !compact || workspaceView === "preview";

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        language={language}
        template={template}
        onTemplateChange={changeTemplate}
        onExportPdf={handleExportPdf}
        onExportHtml={handleExportHtml}
        onExportMarkdown={handleExportMd}
        onImportMarkdown={handleImportMarkdown}
        onImportProject={handleImportProject}
        onImportPdf={handleImportPdf}
        style={style}
        onStyleChange={changeStyle}
        onStyleReset={handleStyleReset}
        editorTab={editorTab}
        onEditorTabChange={setEditorTab}
        editMode={editMode}
        onEditModeChange={handleEditModeChange}
        compact={compact}
        workspaceView={workspaceView}
        onWorkspaceViewChange={handleWorkspaceViewChange}
      />
      <div ref={containerRef} className={`flex flex-1 overflow-hidden ${compact ? "flex-col" : ""}`}>
        {showEditor && (
          <div
            style={compact ? undefined : { width: `${splitPercent}%` }}
            className={`overflow-hidden ${compact ? "flex-1 border-b border-gray-200" : ""}`}
          >
            <Suspense fallback={<div className="h-full bg-white" data-testid="editor-loading" />}>
              {editorTab === "markdown" ? (
                <Editor value={markdown} onChange={setMarkdown} />
              ) : (
                <CssEditor value={customCss} onChange={setCustomCss} />
              )}
            </Suspense>
          </div>
        )}
        {!compact && (
          <div
            onMouseDown={handleMouseDown}
            className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0"
          />
        )}
        {showPreview && (
          <div style={compact ? undefined : { width: `${100 - splitPercent}%` }} className="overflow-hidden flex-1">
          <Preview
            html={html}
            template={template}
            style={style}
            customCss={customCss}
            language={language}
            editMode={editMode}
            onElementSelect={handleElementSelect}
          />
          </div>
        )}
      </div>

      {selectedElement && editMode && (
        <StylePopover
          language={language}
          element={selectedElement}
          customCss={customCss}
          onCssChange={setCustomCss}
          onClose={handlePopoverClose}
        />
      )}
    </div>
  );
}
