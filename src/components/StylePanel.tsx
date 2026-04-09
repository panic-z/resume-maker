import { RotateCcw } from "lucide-react";
import type { StyleSettings, FontFamily } from "../lib/storage";
import { messages, type Language } from "../lib/i18n";

interface StylePanelProps {
  language: Language;
  style: StyleSettings;
  onChange: (patch: Partial<StyleSettings>) => void;
  onReset: () => void;
}

const ACCENT_PRESETS = [
  "#000000", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#6366f1",
];

export function StylePanel({ language, style, onChange, onReset }: StylePanelProps) {
  const copy = messages[language];
  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: "serif", label: copy.stylePanel.fontOptions.serif },
    { value: "sans", label: copy.stylePanel.fontOptions.sans },
    { value: "system", label: copy.stylePanel.fontOptions.system },
  ];

  return (
    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
      <div className="flex items-center gap-6 flex-wrap">
        <LabeledControl label={copy.stylePanel.font}>
          <div className="flex gap-1">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ fontFamily: opt.value })}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  style.fontFamily === opt.value
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </LabeledControl>

        <LabeledControl label={`${copy.stylePanel.fontSize} ${style.fontSize}px`}>
          <input
            type="range"
            min={10}
            max={18}
            step={0.5}
            value={style.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-24 h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={`${copy.stylePanel.lineHeight} ${style.lineHeight.toFixed(1)}`}>
          <input
            type="range"
            min={1.0}
            max={2.2}
            step={0.1}
            value={style.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-24 h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={`${copy.stylePanel.pagePadding} ${style.pagePadding}mm`}>
          <input
            type="range"
            min={10}
            max={30}
            step={1}
            value={style.pagePadding}
            onChange={(e) => onChange({ pagePadding: Number(e.target.value) })}
            className="w-24 h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={copy.stylePanel.accentColor}>
          <div className="flex items-center gap-1">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ accentColor: color })}
                className={`w-[1.125rem] h-[1.125rem] rounded-full border-2 transition-transform ${
                  style.accentColor === color
                    ? "border-gray-800 scale-125"
                    : "border-transparent hover:scale-110"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={style.accentColor}
              onChange={(e) => onChange({ accentColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 p-0 ml-1"
            />
          </div>
        </LabeledControl>

        <button
          onClick={onReset}
          className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          title={copy.stylePanel.reset}
        >
          <RotateCcw size={12} />
          {copy.stylePanel.reset}
        </button>
      </div>
    </div>
  );
}

function LabeledControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] text-gray-400 leading-none">{label}</span>
      {children}
    </div>
  );
}
