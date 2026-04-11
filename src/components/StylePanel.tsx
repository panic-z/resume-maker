import { useEffect, useRef } from "react";
import { RotateCcw, X } from "lucide-react";
import type { StyleSettings, FontFamily } from "../lib/storage";
import { messages, type Language } from "../lib/i18n";

interface StylePanelProps {
  language: Language;
  style: StyleSettings;
  onChange: (patch: Partial<StyleSettings>) => void;
  onReset: () => void;
  onClose: () => void;
}

const ACCENT_PRESETS = [
  "#000000", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#6366f1",
];

export function StylePanel({ language, style, onChange, onReset, onClose }: StylePanelProps) {
  const copy = messages[language].stylePanel;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: "serif", label: copy.fontOptions.serif },
    { value: "sans", label: copy.fontOptions.sans },
    { value: "system", label: copy.fontOptions.system },
  ];

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
      );

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        className="absolute inset-0 bg-gray-900/25"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400">
              {copy.title}
            </div>
            <h2 className="mt-1 text-sm font-semibold text-gray-900">{copy.title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="grid gap-4">
        <LabeledControl label={copy.font}>
          <div className="flex flex-wrap gap-1">
            {fontOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ fontFamily: opt.value })}
                className={`px-2 py-1 text-xs rounded-md transition-colors ${
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

        <LabeledControl label={`${copy.fontSize} ${style.fontSize}px`}>
          <input
            type="range"
            min={10}
            max={18}
            step={0.5}
            value={style.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className="w-full h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={`${copy.lineHeight} ${style.lineHeight.toFixed(1)}`}>
          <input
            type="range"
            min={1.0}
            max={2.2}
            step={0.1}
            value={style.lineHeight}
            onChange={(e) => onChange({ lineHeight: Number(e.target.value) })}
            className="w-full h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={`${copy.pagePadding} ${style.pagePadding}mm`}>
          <input
            type="range"
            min={10}
            max={30}
            step={1}
            value={style.pagePadding}
            onChange={(e) => onChange({ pagePadding: Number(e.target.value) })}
            className="w-full h-1 accent-gray-700"
          />
        </LabeledControl>

        <LabeledControl label={copy.accentColor}>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => onChange({ accentColor: color })}
                aria-label={`${copy.accentColor} ${color}`}
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
              className="mt-2 inline-flex w-fit items-center gap-1 rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
              title={copy.reset}
            >
              <RotateCcw size={12} />
              {copy.reset}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LabeledControl({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-gray-50/70 p-3">
      <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-gray-400 leading-none">{label}</span>
      {children}
    </div>
  );
}
