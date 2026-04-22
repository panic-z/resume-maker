import { useEffect, useRef, useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { StyleSettings, FontFamily } from "../lib/storage";
import { messages, type Language } from "../lib/i18n";
import type { ChangeEvent, RefObject } from "react";
import { backgroundPresetIds, getBackgroundPreset } from "../lib/backgrounds";
import type { BackgroundMode, GradientDirection } from "../lib/backgrounds";
import { readBackgroundImage } from "../lib/background-utils";

interface StylePanelProps {
  language: Language;
  style: StyleSettings;
  onChange: (patch: Partial<StyleSettings>) => void;
  onReset: () => void;
  onClose: () => void;
  triggerRef?: RefObject<HTMLElement | null>;
}

const ACCENT_PRESETS = [
  "#000000", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#6366f1",
];

const BACKGROUND_MODES: BackgroundMode[] = ["preset", "custom-gradient", "custom-image"];
const GRADIENT_DIRECTIONS: GradientDirection[] = ["to-bottom", "to-bottom-right", "to-right"];
const DEFAULT_CUSTOM_GRADIENT: NonNullable<StyleSettings["customGradient"]> = {
  mode: "custom-gradient",
  direction: "to-bottom-right",
  from: "#ffffff",
  to: "#f8fafc",
};

export function StylePanel({ language, style, onChange, onReset, onClose, triggerRef }: StylePanelProps) {
  const copy = messages[language].stylePanel;
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const backgroundImageInputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);
  const backgroundImageRequestIdRef = useRef(0);
  const [backgroundImageError, setBackgroundImageError] = useState<string | null>(null);
  const [isUploadingBackgroundImage, setIsUploadingBackgroundImage] = useState(false);
  const [uploadedBackgroundImageName, setUploadedBackgroundImageName] = useState<string | null>(null);
  const [topOffset, setTopOffset] = useState(0);
  const fontOptions: { value: FontFamily; label: string }[] = [
    { value: "serif", label: copy.fontOptions.serif },
    { value: "sans", label: copy.fontOptions.sans },
    { value: "system", label: copy.fontOptions.system },
  ];
  const activeGradient = style.customGradient ?? DEFAULT_CUSTOM_GRADIENT;
  const currentBackgroundImageLabel = style.backgroundMode === "custom-image"
    ? uploadedBackgroundImageName ?? (style.customImage ? copy.backgroundImage.selected : null)
    : null;
  const visibleBackgroundImageError = style.backgroundMode === "custom-image"
    ? backgroundImageError
    : null;
  const isBackgroundImageUploading = style.backgroundMode === "custom-image" && isUploadingBackgroundImage;

  const updateBackgroundMode = (mode: BackgroundMode) => {
    if (mode !== "custom-image") {
      backgroundImageRequestIdRef.current += 1;
      setUploadedBackgroundImageName(null);
      setBackgroundImageError(null);
      setIsUploadingBackgroundImage(false);
      if (backgroundImageInputRef.current) {
        backgroundImageInputRef.current.value = "";
      }
    }

    if (mode === "custom-gradient") {
      onChange({
        backgroundMode: mode,
        customGradient: style.customGradient ?? DEFAULT_CUSTOM_GRADIENT,
      });
      return;
    }

    onChange({ backgroundMode: mode });
  };

  const updateCustomGradient = (patch: Partial<NonNullable<StyleSettings["customGradient"]>>) => {
    onChange({
      customGradient: {
        ...activeGradient,
        ...patch,
      },
    });
  };

  const handleBackgroundImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const requestId = backgroundImageRequestIdRef.current + 1;
    backgroundImageRequestIdRef.current = requestId;
    setIsUploadingBackgroundImage(true);
    setBackgroundImageError(null);

    const result = await readBackgroundImage(file);
    const isStaleRequest =
      backgroundImageRequestIdRef.current !== requestId
      || style.backgroundMode !== "custom-image";

    if (isStaleRequest) {
      event.target.value = "";
      return;
    }

    if (!result.ok) {
      setUploadedBackgroundImageName(null);
      setBackgroundImageError(
        result.code === "unsupported-type"
          ? copy.backgroundImage.errors.unsupportedType
          : result.code === "file-too-large"
            ? copy.backgroundImage.errors.fileTooLarge
            : copy.backgroundImage.errors.readFailed,
      );
      setIsUploadingBackgroundImage(false);
      event.target.value = "";
      return;
    }

    setUploadedBackgroundImageName(file.name);
    setBackgroundImageError(null);
    setIsUploadingBackgroundImage(false);
    onChange({
      backgroundMode: "custom-image",
      customImage: {
        mode: "custom-image",
        src: result.dataUrl,
        fit: style.customImage?.fit ?? "cover",
      },
    });
    event.target.value = "";
  };

  const handleRemoveBackgroundImage = () => {
    backgroundImageRequestIdRef.current += 1;
    setUploadedBackgroundImageName(null);
    setBackgroundImageError(null);
    setIsUploadingBackgroundImage(false);
    if (backgroundImageInputRef.current) {
      backgroundImageInputRef.current.value = "";
    }
    onChange({
      backgroundMode: "preset",
      backgroundPreset: "plain",
      customImage: null,
    });
  };

  const handleBackgroundImageFitChange = (fit: NonNullable<StyleSettings["customImage"]>["fit"]) => {
    if (!style.customImage) {
      return;
    }

    onChange({
      customImage: {
        ...style.customImage,
        fit,
      },
    });
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const updateTopOffset = () => {
      setTopOffset(triggerRef?.current?.getBoundingClientRect().bottom ?? 0);
    };

    updateTopOffset();
    window.addEventListener("resize", updateTopOffset);

    return () => {
      window.removeEventListener("resize", updateTopOffset);
    };
  }, [triggerRef]);

  useEffect(() => {
    if (style.backgroundMode === "custom-image" && style.customImage) {
      return;
    }

    let cancelled = false;
    backgroundImageRequestIdRef.current += 1;
    if (backgroundImageInputRef.current) {
      backgroundImageInputRef.current.value = "";
    }
    queueMicrotask(() => {
      if (cancelled) {
        return;
      }
      setUploadedBackgroundImageName(null);
      setBackgroundImageError(null);
      setIsUploadingBackgroundImage(false);
    });

    return () => {
      cancelled = true;
    };
  }, [style.backgroundMode, style.customImage]);

  useEffect(() => {
    const previousActiveElement = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
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
    const handlePointerDown = (event: PointerEvent) => {
      if (triggerRef?.current?.contains(event.target as Node)) {
        return;
      }
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
      previousActiveElement?.focus();
    };
  }, [triggerRef]);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40" style={{ top: `${topOffset}px` }}>
      <div aria-hidden="true" className="absolute inset-0 bg-gray-900/25" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        className="pointer-events-auto absolute inset-y-0 right-0 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-2xl"
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
                    type="button"
                    onClick={() => onChange({ fontFamily: opt.value })}
                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                      style.fontFamily === opt.value
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
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
                className="h-1 w-full accent-gray-700"
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
                className="h-1 w-full accent-gray-700"
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
                className="h-1 w-full accent-gray-700"
              />
            </LabeledControl>

            <LabeledControl label={copy.accentColor}>
              <div className="flex flex-wrap items-center gap-2">
                {ACCENT_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => onChange({ accentColor: color })}
                    aria-label={`${copy.accentColor} ${color}`}
                    className={`h-[1.125rem] w-[1.125rem] rounded-full border-2 transition-transform ${
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
                  className="ml-1 h-5 w-5 cursor-pointer rounded border-0 p-0"
                />
              </div>
            </LabeledControl>

            <LabeledControl label={copy.background}>
              <div className="flex flex-wrap gap-1">
                {BACKGROUND_MODES.map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateBackgroundMode(mode)}
                    className={`rounded-md px-2 py-1 text-xs transition-colors ${
                      style.backgroundMode === mode
                        ? "bg-gray-900 text-white"
                        : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {copy.backgroundModes[mode]}
                  </button>
                ))}
              </div>

              {style.backgroundMode === "preset" ? (
                <div className="grid grid-cols-2 gap-2">
                  {backgroundPresetIds().map((presetId) => {
                    const preset = getBackgroundPreset(presetId);
                    const active = style.backgroundPreset === presetId;
                    return (
                      <button
                        key={presetId}
                        type="button"
                        onClick={() => onChange({ backgroundPreset: presetId })}
                        aria-label={copy.backgroundOptions[presetId]}
                        className={`rounded-xl border p-2 text-left transition-colors ${
                          active ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <span className={`block h-16 rounded-lg border border-gray-200 ${preset.cardClassName}`} />
                        <span className="mt-2 block text-[11px] font-medium text-gray-600">
                          {copy.backgroundOptions[presetId]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {style.backgroundMode === "custom-gradient" ? (
                <div className="grid gap-3">
                  <Field label={copy.backgroundGradient.fromColor}>
                    <input
                      aria-label={copy.backgroundGradient.fromColor}
                      type="color"
                      value={activeGradient.from}
                      onChange={(e) => updateCustomGradient({ from: e.target.value })}
                      className="h-9 w-full cursor-pointer rounded-md border border-gray-200 bg-white p-1"
                    />
                  </Field>

                  <Field label={copy.backgroundGradient.toColor}>
                    <input
                      aria-label={copy.backgroundGradient.toColor}
                      type="color"
                      value={activeGradient.to}
                      onChange={(e) => updateCustomGradient({ to: e.target.value })}
                      className="h-9 w-full cursor-pointer rounded-md border border-gray-200 bg-white p-1"
                    />
                  </Field>

                  <Field label={copy.backgroundGradient.direction}>
                    <select
                      aria-label={copy.backgroundGradient.direction}
                      value={activeGradient.direction}
                      onChange={(e) => updateCustomGradient({ direction: e.target.value as GradientDirection })}
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                    >
                      {GRADIENT_DIRECTIONS.map((direction) => (
                        <option key={direction} value={direction}>
                          {copy.backgroundGradient.directionOptions[direction]}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={copy.backgroundGradient.softness}>
                    <input
                      aria-label={copy.backgroundGradient.softness}
                      type="range"
                      min={0}
                      max={100}
                      value={18}
                      disabled
                      readOnly
                      className="h-1 w-full accent-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <p className="text-xs text-gray-500">{copy.backgroundGradient.softnessHint}</p>
                  </Field>
                </div>
              ) : null}

              {style.backgroundMode === "custom-image" ? (
                <div className="grid gap-3">
                  <Field label={copy.backgroundImage.upload}>
                    <div className="flex flex-wrap gap-2">
                      <input
                        ref={backgroundImageInputRef}
                        aria-label={copy.backgroundImage.upload}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleBackgroundImageUpload}
                        className="sr-only"
                      />
                      <button
                        type="button"
                        onClick={() => backgroundImageInputRef.current?.click()}
                        disabled={isBackgroundImageUploading}
                        className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {style.customImage ? copy.backgroundImage.replace : copy.backgroundImage.upload}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveBackgroundImage}
                        disabled={!style.customImage && !currentBackgroundImageLabel}
                        className="rounded-md border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300"
                      >
                        {copy.backgroundImage.remove}
                      </button>
                    </div>
                    {visibleBackgroundImageError ? (
                      <p role="alert" className="text-xs text-red-600">{visibleBackgroundImageError}</p>
                    ) : null}
                    {currentBackgroundImageLabel ? (
                      <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
                        <div className="font-medium text-gray-500">{copy.backgroundImage.fileName}</div>
                        <div className="mt-1">{currentBackgroundImageLabel}</div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">{copy.backgroundImage.empty}</p>
                    )}
                  </Field>

                  <Field label={copy.backgroundImage.fit}>
                    <select
                      aria-label={copy.backgroundImage.fit}
                      disabled={!style.customImage}
                      value={style.customImage?.fit ?? "cover"}
                      onChange={(e) => handleBackgroundImageFitChange(e.target.value as NonNullable<StyleSettings["customImage"]>["fit"])}
                      className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="cover">{copy.backgroundImage.fitOptions.cover}</option>
                      <option value="contain">{copy.backgroundImage.fitOptions.contain}</option>
                      <option value="repeat">{copy.backgroundImage.fitOptions.repeat}</option>
                    </select>
                    <p className="text-xs text-gray-500">{copy.backgroundImage.note}</p>
                  </Field>
                </div>
              ) : null}
            </LabeledControl>

            <button
              type="button"
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 text-sm text-gray-700">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      {children}
    </div>
  );
}
