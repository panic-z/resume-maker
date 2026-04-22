export type BackgroundPreset =
  | "plain"
  | "corner-frame"
  | "soft-arc"
  | "grid-wash"
  | "editorial-bands";

export type BackgroundMode = "preset" | "custom-gradient" | "custom-image";
export type BackgroundFit = "cover" | "contain" | "repeat";
export type GradientDirection = "to-bottom" | "to-bottom-right" | "to-right";

export interface ResolvedBackgroundLayers {
  mode: BackgroundMode;
  id: string;
  labelKey: string;
  cardClassName: string;
  paperBackground: string;
  paperOverlay: string;
  backgroundRepeat: string;
  backgroundSize: string;
}

export interface BackgroundPresetDefinition extends ResolvedBackgroundLayers {
  mode: "preset";
  id: BackgroundPreset;
  labelKey: BackgroundPreset;
}

export interface CustomGradientBackground {
  mode: "custom-gradient";
  direction: GradientDirection;
  from: string;
  to: string;
}

export interface CustomImageBackground {
  mode: "custom-image";
  src: string;
  fit: BackgroundFit;
}

type BackgroundInput =
  | BackgroundPreset
  | BackgroundPresetDefinition
  | CustomGradientBackground
  | CustomImageBackground;

function gradientDirectionToAngle(direction: GradientDirection): string {
  switch (direction) {
    case "to-bottom-right":
      return "135deg";
    case "to-right":
      return "90deg";
    case "to-bottom":
    default:
      return "180deg";
  }
}

function backgroundRepeatForPreset(id: BackgroundPreset): string {
  return id === "grid-wash" ? "repeat, repeat, no-repeat" : "no-repeat, no-repeat, no-repeat";
}

function backgroundSizeForPreset(id: BackgroundPreset): string {
  return id === "grid-wash" ? "32px 32px, 32px 32px, cover" : "cover, cover, cover";
}

function resolvePreset(id: BackgroundPreset): BackgroundPresetDefinition {
  return PRESETS[id];
}

function resolveCustomGradient(background: CustomGradientBackground): ResolvedBackgroundLayers {
  return {
    mode: "custom-gradient",
    id: "custom-gradient",
    labelKey: "custom-gradient",
    cardClassName: "bg-[linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: `linear-gradient(${gradientDirectionToAngle(background.direction)}, ${background.from} 0%, ${background.to} 100%)`,
    paperOverlay: "none, none",
    backgroundRepeat: "no-repeat, no-repeat, no-repeat",
    backgroundSize: "cover, cover, cover",
  };
}

function serializeCssUrlValue(value: string): string {
  return JSON.stringify(value).slice(1, -1);
}

function resolveCustomImage(background: CustomImageBackground): ResolvedBackgroundLayers {
  const repeat = background.fit === "repeat";
  const backgroundRepeat = repeat ? "no-repeat, no-repeat, repeat" : "no-repeat, no-repeat, no-repeat";
  const backgroundSize =
    background.fit === "contain"
      ? "contain, contain, contain"
      : background.fit === "repeat"
        ? "auto, auto, auto"
        : "cover, cover, cover";

  return {
    mode: "custom-image",
    id: "custom-image",
    labelKey: "custom-image",
    cardClassName: "bg-[linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: `url("${serializeCssUrlValue(background.src)}")`,
    paperOverlay: "none, none",
    backgroundRepeat,
    backgroundSize,
  };
}

const PRESETS: Record<BackgroundPreset, BackgroundPresetDefinition> = {
  plain: {
    mode: "preset",
    id: "plain",
    labelKey: "plain",
    cardClassName: "bg-white",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)",
    paperOverlay: "none, none",
    backgroundRepeat: backgroundRepeatForPreset("plain"),
    backgroundSize: backgroundSizeForPreset("plain"),
  },
  "corner-frame": {
    mode: "preset",
    id: "corner-frame",
    labelKey: "corner-frame",
    cardClassName: "bg-[linear-gradient(135deg,#f8fafc,#ffffff)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(135deg, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 22px, transparent 22px), linear-gradient(315deg, rgba(148,163,184,0.14) 0, rgba(148,163,184,0.14) 18px, transparent 18px)",
    backgroundRepeat: backgroundRepeatForPreset("corner-frame"),
    backgroundSize: backgroundSizeForPreset("corner-frame"),
  },
  "soft-arc": {
    mode: "preset",
    id: "soft-arc",
    labelKey: "soft-arc",
    cardClassName: "bg-[radial-gradient(circle_at_top_right,#e2e8f0,transparent_55%),linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "radial-gradient(circle at top right, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.12) 18%, transparent 52%), radial-gradient(circle at bottom left, rgba(226,232,240,0.95) 0, transparent 40%)",
    backgroundRepeat: backgroundRepeatForPreset("soft-arc"),
    backgroundSize: backgroundSizeForPreset("soft-arc"),
  },
  "grid-wash": {
    mode: "preset",
    id: "grid-wash",
    labelKey: "grid-wash",
    cardClassName: "bg-[linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
    backgroundRepeat: backgroundRepeatForPreset("grid-wash"),
    backgroundSize: backgroundSizeForPreset("grid-wash"),
  },
  "editorial-bands": {
    mode: "preset",
    id: "editorial-bands",
    labelKey: "editorial-bands",
    cardClassName: "bg-[linear-gradient(90deg,#e2e8f0_0_14%,#ffffff_14%_100%)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(90deg, rgba(226,232,240,0.95) 0, rgba(226,232,240,0.95) 12%, transparent 12%, transparent 100%), linear-gradient(180deg, transparent 0, transparent calc(100% - 56px), rgba(148,163,184,0.10) calc(100% - 56px), rgba(148,163,184,0.10) 100%)",
    backgroundRepeat: backgroundRepeatForPreset("editorial-bands"),
    backgroundSize: backgroundSizeForPreset("editorial-bands"),
  },
};

export function resolveBackgroundLayers(input: BackgroundInput): ResolvedBackgroundLayers {
  if (typeof input === "string") {
    return resolvePreset(input);
  }

  if (input.mode === "custom-gradient") {
    return resolveCustomGradient(input);
  }

  if (input.mode === "custom-image") {
    return resolveCustomImage(input);
  }

  return PRESETS[input.id];
}

export function getBackgroundPreset(id: BackgroundPreset): BackgroundPresetDefinition;
export function getBackgroundPreset(id: BackgroundInput): ResolvedBackgroundLayers;
export function getBackgroundPreset(id: BackgroundInput): ResolvedBackgroundLayers {
  return resolveBackgroundLayers(id);
}

export function isBackgroundPreset(value: unknown): value is BackgroundPreset {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PRESETS, value);
}

export function backgroundPresetIds(): BackgroundPreset[] {
  return Object.keys(PRESETS) as BackgroundPreset[];
}
