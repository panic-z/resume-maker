import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import type { TemplateName } from "../lib/storage";

interface ToolbarProps {
  template: TemplateName;
  onTemplateChange: (t: TemplateName) => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onExportMarkdown: () => void;
}

export function Toolbar({
  template,
  onTemplateChange,
  onExportPdf,
  onExportHtml,
  onExportMarkdown,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 mr-1">模板</span>
        <button
          onClick={() => onTemplateChange("classic")}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            template === "classic"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          经典
        </button>
        <button
          onClick={() => onTemplateChange("modern")}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            template === "modern"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          现代
        </button>
      </div>

      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setExportOpen(!exportOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Download size={14} />
          导出
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
  );
}
