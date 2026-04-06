import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { Toolbar } from "./Toolbar";
import { useResume } from "../hooks/useResume";
import { parseResumeToHtml } from "../lib/markdown";
import { exportPdf, exportHtml, exportMarkdown } from "../lib/export";

export function ResumePage() {
  const { markdown, setMarkdown, template, changeTemplate } = useResume();
  const [splitPercent, setSplitPercent] = useState(50);
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
    exportPdf(htmlRef.current, template);
  }, [template]);

  const handleExportHtml = useCallback(() => {
    exportHtml(htmlRef.current, template);
  }, [template]);

  const handleExportMd = useCallback(() => {
    exportMarkdown(markdown);
  }, [markdown]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        template={template}
        onTemplateChange={changeTemplate}
        onExportPdf={handleExportPdf}
        onExportHtml={handleExportHtml}
        onExportMarkdown={handleExportMd}
      />
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div style={{ width: `${splitPercent}%` }} className="overflow-hidden">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0"
        />
        <div style={{ width: `${100 - splitPercent}%` }} className="overflow-hidden">
          <Preview html={htmlRef.current} template={template} />
        </div>
      </div>
    </div>
  );
}
