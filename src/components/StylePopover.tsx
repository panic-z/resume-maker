import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import type { SelectedElement } from "./Preview";
import { getExistingProperties, mergeCustomCss, removeCustomCssRule, type CssProperties } from "../lib/css-utils";
import { messages, type Language } from "../lib/i18n";

interface StylePopoverProps {
  language: Language;
  element: SelectedElement;
  customCss: string;
  onCssChange: (css: string) => void;
  onClose: () => void;
}

function parseNum(val: string | undefined, fallback: string): string {
  if (!val) return fallback;
  const n = parseFloat(val);
  return isNaN(n) ? fallback : String(n);
}

function parseBorder(value: string | undefined): { width: string; style: string; color: string } {
  if (!value) return { width: "1px", style: "none", color: "#000" };
  const match = value.match(/^(\S+)\s+(none|solid|dashed|dotted|double|groove|ridge|inset|outset)\s+(.+)$/);
  if (match) return { width: match[1], style: match[2], color: match[3] };
  return { width: "1px", style: "none", color: "#000" };
}

export function StylePopover({ language, element, customCss, onCssChange, onClose }: StylePopoverProps) {
  const copy = messages[language].stylePopover;
  const fontWeights = [
    { value: "normal", label: copy.fontWeights.normal },
    { value: "500", label: copy.fontWeights["500"] },
    { value: "600", label: copy.fontWeights["600"] },
    { value: "700", label: copy.fontWeights["700"] },
    { value: "800", label: copy.fontWeights["800"] },
  ];
  const textAligns = [
    { value: "left", label: copy.textAligns.left },
    { value: "center", label: copy.textAligns.center },
    { value: "right", label: copy.textAligns.right },
  ];
  const textTransforms = [
    { value: "none", label: copy.textTransforms.none },
    { value: "uppercase", label: copy.textTransforms.uppercase },
    { value: "capitalize", label: copy.textTransforms.capitalize },
  ];
  const borderStyles = [
    { value: "none", label: copy.borderStyles.none },
    { value: "solid", label: copy.borderStyles.solid },
    { value: "dashed", label: copy.borderStyles.dashed },
    { value: "dotted", label: copy.borderStyles.dotted },
  ];
  const existing = getExistingProperties(customCss, element.selector);
  const [props, setProps] = useState<CssProperties>(existing);
  const popoverRef = useRef<HTMLDivElement>(null);

  const customCssRef = useRef(customCss);
  customCssRef.current = customCss;
  const internalChange = useRef(false);
  const prevSelector = useRef(element.selector);

  useEffect(() => {
    const selectorChanged = prevSelector.current !== element.selector;
    prevSelector.current = element.selector;
    if (!selectorChanged && internalChange.current) {
      internalChange.current = false;
      return;
    }
    internalChange.current = false;
    setProps(getExistingProperties(customCss, element.selector));
  }, [element.selector, customCss]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const apply = useCallback((patch: CssProperties) => {
    setProps((prev) => {
      const next = { ...prev, ...patch };
      internalChange.current = true;
      onCssChange(mergeCustomCss(customCssRef.current, element.selector, next));
      return next;
    });
  }, [element.selector, onCssChange]);

  const handleResetElement = useCallback(() => {
    internalChange.current = true;
    setProps({});
    onCssChange(removeCustomCssRule(customCssRef.current, element.selector));
  }, [element.selector, onCssChange]);

  const top = Math.max(8, element.rect.top - 8);
  const left = Math.max(8, Math.min(element.rect.right + 12, window.innerWidth - 300));

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-xl text-xs"
      style={{ top, left }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <span className="font-medium text-gray-700">{element.label}</span>
        <span className="text-[10px] text-gray-400 font-mono">{element.selector}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 ml-2">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-3 max-h-80 overflow-y-auto">
        <button
          type="button"
          onClick={handleResetElement}
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-left text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        >
          {copy.resetElement}
        </button>
        <Section title={copy.sections.font}>
          <Row label={copy.rows.size}>
            <input
              type="range"
              min={8}
              max={36}
              step={1}
              value={parseNum(props["font-size"]?.replace("px", ""), "14")}
              onChange={(e) => apply({ "font-size": `${e.target.value}px` })}
              className="w-20 h-1 accent-gray-700"
            />
            <span className="text-gray-400 w-8 text-right">{parseNum(props["font-size"]?.replace("px", ""), "—")}px</span>
          </Row>
          <Row label={copy.rows.weight}>
            <div className="flex gap-0.5">
              {fontWeights.map((w) => (
                <button
                  key={w.value}
                  onClick={() => apply({ "font-weight": w.value })}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    props["font-weight"] === w.value ? "bg-gray-800 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </Row>
          <Row label={copy.rows.color}>
            <input
              type="color"
              value={props.color || "#000000"}
              onChange={(e) => apply({ color: e.target.value })}
              className="w-6 h-5 rounded cursor-pointer border border-gray-200 p-0"
            />
            <span className="text-gray-400 font-mono">{props.color || "—"}</span>
          </Row>
        </Section>

        <Section title={copy.sections.text}>
          <Row label={copy.rows.align}>
            <div className="flex gap-0.5">
              {textAligns.map((a) => (
                <button
                  key={a.value}
                  onClick={() => apply({ "text-align": a.value })}
                  className={`px-2 py-0.5 rounded text-[10px] ${
                    props["text-align"] === a.value ? "bg-gray-800 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </Row>
          <Row label={copy.rows.letterSpacing}>
            <input
              type="range"
              min={0}
              max={0.3}
              step={0.01}
              value={parseNum(props["letter-spacing"]?.replace("em", ""), "0")}
              onChange={(e) => apply({ "letter-spacing": `${e.target.value}em` })}
              className="w-20 h-1 accent-gray-700"
            />
            <span className="text-gray-400 w-10 text-right">{parseNum(props["letter-spacing"]?.replace("em", ""), "0")}em</span>
          </Row>
          <Row label={copy.rows.transform}>
            <div className="flex gap-0.5">
              {textTransforms.map((t) => (
                <button
                  key={t.value}
                  onClick={() => apply({ "text-transform": t.value })}
                  className={`px-1.5 py-0.5 rounded text-[10px] ${
                    props["text-transform"] === t.value ? "bg-gray-800 text-white" : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Row>
        </Section>

        <Section title={copy.sections.spacing}>
          <Row label={copy.rows.marginTop}>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={parseNum(props["margin-top"]?.replace("em", ""), "0")}
              onChange={(e) => apply({ "margin-top": `${e.target.value}em` })}
              className="w-20 h-1 accent-gray-700"
            />
            <span className="text-gray-400 w-8 text-right">{parseNum(props["margin-top"]?.replace("em", ""), "0")}em</span>
          </Row>
          <Row label={copy.rows.marginBottom}>
            <input
              type="range"
              min={0}
              max={3}
              step={0.1}
              value={parseNum(props["margin-bottom"]?.replace("em", ""), "0")}
              onChange={(e) => apply({ "margin-bottom": `${e.target.value}em` })}
              className="w-20 h-1 accent-gray-700"
            />
            <span className="text-gray-400 w-8 text-right">{parseNum(props["margin-bottom"]?.replace("em", ""), "0")}em</span>
          </Row>
        </Section>

        <Section title={copy.sections.border}>
          <Row label={copy.rows.borderStyle}>
            <div className="flex gap-0.5">
              {borderStyles.map((b) => {
                const border = parseBorder(props["border-bottom"]);
                return (
                  <button
                    key={b.value}
                    onClick={() => {
                      if (b.value === "none") {
                        apply({ "border-bottom": "" });
                      } else {
                        apply({ "border-bottom": `${border.width} ${b.value} ${border.color}` });
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[10px] ${
                      border.style === b.value ? "bg-gray-800 text-white" : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </Row>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">{title}</div>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-500 w-10 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 flex-1">{children}</div>
    </div>
  );
}
