import { FileText } from "lucide-react";
import { messages, type Language } from "../lib/i18n";

interface HeaderProps {
  language: Language;
  onLanguageChange: (language: Language) => void;
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const copy = messages[language];

  return (
    <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        <span className="font-semibold text-sm">Resume Maker</span>
      </div>
      <div className="flex items-center gap-3 ml-auto">
        <span className="hidden text-xs text-gray-400 md:inline">{copy.app.tagline}</span>
        <div className="flex items-center gap-1 rounded-md bg-gray-100 p-0.5">
          <button
            type="button"
            onClick={() => onLanguageChange("zh")}
            aria-pressed={language === "zh"}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              language === "zh" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {copy.header.zh}
          </button>
          <button
            type="button"
            onClick={() => onLanguageChange("en")}
            aria-pressed={language === "en"}
            className={`rounded px-2 py-1 text-xs transition-colors ${
              language === "en" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {copy.header.en}
          </button>
        </div>
      </div>
    </header>
  );
}
