import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        <span className="font-semibold text-sm">Resume Maker</span>
      </div>
      <span className="text-xs text-gray-400">开源简历生成器</span>
    </header>
  );
}
