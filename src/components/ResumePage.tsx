import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "./Editor";
import { CssEditor } from "./CssEditor";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const htmlRef = useRef("");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    parseResumeToHtml(markdown).then((result) => {
      if (!cancelled) {
        htmlRef.current = result;
        forceUpdate((n) => n + 1);
      }
    });
    return () => { cancelled = true; };
  }, [markdown]);

  useEffect(() => {
    const handleResize = () => {
      setCompact(isCompactLayout(window.innerWidth));
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
    if (!htmlRef.current) return;
    exportPdf(htmlRef.current, template, style, customCss, language);
  }, [template, style, customCss, language]);

  const handleExportHtml = useCallback(() => {
    if (!htmlRef.current) return;
    exportHtml(htmlRef.current, template, style, customCss);
  }, [template, style, customCss]);

  const handleExportMd = useCallback(() => {
    exportMarkdown(markdown);
  }, [markdown]);

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

  useEffect(() => {
    if (!compact) {
      setWorkspaceView("editor");
    }
  }, [compact]);

  useEffect(() => {
    if (compact && workspaceView === "editor") {
      setSelectedElement(null);
    }
  }, [compact, workspaceView]);

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
        style={style}
        onStyleChange={changeStyle}
        onStyleReset={handleStyleReset}
        editorTab={editorTab}
        onEditorTabChange={setEditorTab}
        editMode={editMode}
        onEditModeChange={handleEditModeChange}
        compact={compact}
        workspaceView={workspaceView}
        onWorkspaceViewChange={setWorkspaceView}
      />
      <div ref={containerRef} className={`flex flex-1 overflow-hidden ${compact ? "flex-col" : ""}`}>
        {showEditor && (
          <div
            style={compact ? undefined : { width: `${splitPercent}%` }}
            className={`overflow-hidden ${compact ? "flex-1 border-b border-gray-200" : ""}`}
          >
          {editorTab === "markdown" ? (
            <Editor value={markdown} onChange={setMarkdown} />
          ) : (
            <CssEditor value={customCss} onChange={setCustomCss} />
          )}
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
            html={htmlRef.current}
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
