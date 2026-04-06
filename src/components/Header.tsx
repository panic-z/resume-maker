import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        <span className="font-semibold text-sm">Resume Maker</span>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        GitHub
      </a>
    </header>
  );
}
