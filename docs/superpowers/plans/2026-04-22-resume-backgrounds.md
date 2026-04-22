# Resume Background Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selectable geometric resume background presets that persist in state, render in the live preview, and carry through exported HTML and PDF output.

**Architecture:** Introduce a shared background preset module that defines preset ids, localized labels, preview card styling, and actual CSS variables / background layers. Extend the existing `StyleSettings` flow to persist a `backgroundPreset`, expose it in the style panel, and consume the shared background styling from both preview and export so the user sees the same design in-editor and in generated files.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind utility classes, Vitest, Playwright

---

## File Structure

### Create

- `src/lib/backgrounds.ts`
  Central source of truth for background preset ids, labels, card preview metadata, and generated CSS style fragments.

### Modify

- `src/lib/storage.ts`
  Extend `StyleSettings`, defaults, validation, and CSS variable generation with background preset support.
- `src/lib/storage.test.ts`
  Cover loading persisted background presets and fallback behavior.
- `src/lib/export.ts`
  Reuse shared background styling in standalone HTML export output.
- `src/lib/export.test.ts`
  Verify exported HTML includes the selected background preset styling.
- `src/lib/i18n.ts`
  Add localized copy for the new background section and preset labels.
- `src/components/StylePanel.tsx`
  Render the new background picker cards and emit `backgroundPreset` updates.
- `src/components/Toolbar.test.tsx`
  Extend dialog assertions to include the background section and preset controls.
- `src/components/Preview.tsx`
  Apply the chosen background styles to the resume container in the live preview.
- `src/components/Preview.test.tsx`
  Verify preview styling includes the selected background preset.
- `src/hooks/useResume.test.tsx`
  Verify stored style state restores a persisted background preset.
- `e2e/resume-maker.spec.ts`
  Add browser-level checks for switching backgrounds, persistence after reload, and exported HTML containing the chosen preset styling.

## Task 1: Add Shared Background Preset Module

**Files:**
- Create: `src/lib/backgrounds.ts`
- Test: `src/lib/export.test.ts`

- [ ] **Step 1: Write the failing export test for a non-plain background**

```ts
it("includes selected geometric background styling in standalone exports", () => {
  const style = { ...DEFAULT_STYLE, backgroundPreset: "corner-frame" };
  const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
  expect(result).toContain("--resume-paper-background:");
  expect(result).toContain("--resume-paper-overlay:");
  expect(result).toContain("corner-frame");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export.test.ts`
Expected: FAIL because `backgroundPreset` is not part of `StyleSettings` / export output yet.

- [ ] **Step 3: Create the shared background preset module with minimal preset metadata**

```ts
import type { Language } from "./i18n";

export type BackgroundPreset = "plain" | "corner-frame" | "soft-arc" | "grid-wash" | "editorial-bands";

export interface BackgroundPresetDefinition {
  id: BackgroundPreset;
  labelKey: BackgroundPreset;
  cardClassName: string;
  paperBackground: string;
  paperOverlay: string;
}

const PRESETS: Record<BackgroundPreset, BackgroundPresetDefinition> = {
  plain: {
    id: "plain",
    labelKey: "plain",
    cardClassName: "bg-white",
    paperBackground: "#ffffff",
    paperOverlay: "none",
  },
  corner-frame: {
    id: "corner-frame",
    labelKey: "corner-frame",
    cardClassName: "bg-[linear-gradient(135deg,#f8fafc,#ffffff)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(135deg, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.18) 22px, transparent 22px), linear-gradient(315deg, rgba(148,163,184,0.14) 0, rgba(148,163,184,0.14) 18px, transparent 18px)",
  },
  soft-arc: {
    id: "soft-arc",
    labelKey: "soft-arc",
    cardClassName: "bg-[radial-gradient(circle_at_top_right,#e2e8f0,transparent_55%),linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "radial-gradient(circle at top right, rgba(148,163,184,0.18) 0, rgba(148,163,184,0.12) 18%, transparent 52%), radial-gradient(circle at bottom left, rgba(226,232,240,0.95) 0, transparent 40%)",
  },
  grid-wash: {
    id: "grid-wash",
    labelKey: "grid-wash",
    cardClassName: "bg-[linear-gradient(180deg,#ffffff,#f8fafc)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
  },
  editorial-bands: {
    id: "editorial-bands",
    labelKey: "editorial-bands",
    cardClassName: "bg-[linear-gradient(90deg,#e2e8f0_0_14%,#ffffff_14%_100%)]",
    paperBackground: "linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)",
    paperOverlay:
      "linear-gradient(90deg, rgba(226,232,240,0.95) 0, rgba(226,232,240,0.95) 12%, transparent 12%, transparent 100%), linear-gradient(180deg, transparent 0, transparent calc(100% - 56px), rgba(148,163,184,0.10) calc(100% - 56px), rgba(148,163,184,0.10) 100%)",
  },
};

export function getBackgroundPreset(id: BackgroundPreset): BackgroundPresetDefinition {
  return PRESETS[id];
}

export function isBackgroundPreset(value: unknown): value is BackgroundPreset {
  return typeof value === "string" && value in PRESETS;
}

export function backgroundPresetIds(): BackgroundPreset[] {
  return Object.keys(PRESETS) as BackgroundPreset[];
}
```

- [ ] **Step 4: Run export test to verify it still fails for the expected reason**

Run: `npx vitest run src/lib/export.test.ts`
Expected: FAIL because `storage.ts` and `export.ts` still do not consume the new background preset definitions.

## Task 2: Extend Style State and Persistence

**Files:**
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/hooks/useResume.test.tsx`
- Test: `src/lib/storage.test.ts`
- Test: `src/hooks/useResume.test.tsx`

- [ ] **Step 1: Write the failing storage tests**

```ts
it("restores a stored background preset when valid", () => {
  localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "grid-wash" }));
  expect(loadStyle()).toMatchObject({ backgroundPreset: "grid-wash" });
});

it("falls back to the plain background for unknown stored presets", () => {
  localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "mystery" }));
  expect(loadStyle()).toMatchObject({ backgroundPreset: "plain" });
});
```

```tsx
test("restores a persisted background preset from style storage", () => {
  localStorage.clear();
  localStorage.setItem(
    "resume-maker:style",
    JSON.stringify({ backgroundPreset: "editorial-bands", fontSize: 14, lineHeight: 1.6, pagePadding: 20 }),
  );

  render(<Probe language="zh" />);

  expect(screen.getByTestId("style")).toHaveTextContent('"backgroundPreset":"editorial-bands"');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage.test.ts src/hooks/useResume.test.tsx`
Expected: FAIL because `backgroundPreset` is not yet recognized or persisted in the style state.

- [ ] **Step 3: Update `storage.ts` to support `backgroundPreset`**

```ts
import { type BackgroundPreset, getBackgroundPreset, isBackgroundPreset } from "./backgrounds";

export interface StyleSettings {
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  fontFamily: FontFamily;
  pagePadding: number;
  backgroundPreset: BackgroundPreset;
}

export const DEFAULT_STYLE: StyleSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  accentColor: "#000000",
  fontFamily: "serif",
  pagePadding: 20,
  backgroundPreset: "plain",
};

export function styleToCssVars(s: StyleSettings): Record<string, string> {
  const background = getBackgroundPreset(s.backgroundPreset);
  return {
    "--resume-font-size": `${s.fontSize}px`,
    "--resume-line-height": `${s.lineHeight}`,
    "--resume-accent": s.accentColor,
    "--resume-font-family": fontFamilyValue(s.fontFamily),
    "--resume-padding": `${s.pagePadding}mm`,
    "--resume-paper-background": background.paperBackground,
    "--resume-paper-overlay": background.paperOverlay,
    "--resume-background-id": `"${background.id}"`,
  };
}

export function loadStyle(
  defaults: Pick<StyleSettings, "fontFamily" | "accentColor"> = TEMPLATE_DEFAULTS.classic,
): StyleSettings {
  try {
    const raw = localStorage.getItem(STYLE_KEY);
    if (!raw) return { ...DEFAULT_STYLE, ...defaults };
    const parsed = JSON.parse(raw);
    return {
      fontSize: clamp(parsed.fontSize, 10, 18, DEFAULT_STYLE.fontSize),
      lineHeight: clamp(parsed.lineHeight, 1.0, 2.2, DEFAULT_STYLE.lineHeight),
      accentColor: typeof parsed.accentColor === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.accentColor)
        ? parsed.accentColor : defaults.accentColor,
      fontFamily: VALID_FONT_FAMILIES.includes(parsed.fontFamily) ? parsed.fontFamily : defaults.fontFamily,
      pagePadding: clamp(parsed.pagePadding, 10, 30, DEFAULT_STYLE.pagePadding),
      backgroundPreset: isBackgroundPreset(parsed.backgroundPreset) ? parsed.backgroundPreset : DEFAULT_STYLE.backgroundPreset,
    };
  } catch {
    return { ...DEFAULT_STYLE, ...defaults };
  }
}
```

- [ ] **Step 4: Run storage tests to verify they pass**

Run: `npx vitest run src/lib/storage.test.ts src/hooks/useResume.test.tsx`
Expected: PASS

## Task 3: Localize and Render Background Choices in the Style Drawer

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/components/StylePanel.tsx`
- Modify: `src/components/Toolbar.test.tsx`
- Test: `src/components/Toolbar.test.tsx`
- Test: `src/components/StylePanel.test.tsx`

- [ ] **Step 1: Write the failing UI test for the background section**

```ts
test("shows background preset controls in the style drawer", () => {
  renderToolbar();

  fireEvent.click(screen.getByRole("button", { name: "样式" }));

  expect(screen.getByText("背景")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "纯白" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "角框" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI test to verify it fails**

Run: `npx vitest run src/components/Toolbar.test.tsx`
Expected: FAIL because the style panel does not yet expose a background section.

- [ ] **Step 3: Add localized copy for the new background section**

```ts
stylePanel: {
  title: string;
  close: string;
  font: string;
  fontSize: string;
  lineHeight: string;
  pagePadding: string;
  accentColor: string;
  background: string;
  reset: string;
  fontOptions: Record<"serif" | "sans" | "system", string>;
  backgroundOptions: Record<"plain" | "corner-frame" | "soft-arc" | "grid-wash" | "editorial-bands", string>;
};
```

```ts
background: "背景",
backgroundOptions: {
  plain: "纯白",
  "corner-frame": "角框",
  "soft-arc": "柔弧",
  "grid-wash": "网格",
  "editorial-bands": "编排条带",
},
```

```ts
background: "Background",
backgroundOptions: {
  plain: "Plain",
  "corner-frame": "Corner Frame",
  "soft-arc": "Soft Arc",
  "grid-wash": "Grid Wash",
  "editorial-bands": "Editorial Bands",
},
```

- [ ] **Step 4: Update `StylePanel.tsx` to render preview cards for the backgrounds**

```tsx
import { backgroundPresetIds, getBackgroundPreset } from "../lib/backgrounds";

<LabeledControl label={copy.background}>
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
</LabeledControl>
```

- [ ] **Step 5: Run the drawer test to verify it passes**

Run: `npx vitest run src/components/Toolbar.test.tsx src/components/StylePanel.test.tsx`
Expected: PASS

## Task 4: Apply Backgrounds in Preview and Export

**Files:**
- Modify: `src/components/Preview.tsx`
- Modify: `src/components/Preview.test.tsx`
- Modify: `src/lib/export.ts`
- Modify: `src/lib/export.test.ts`
- Test: `src/components/Preview.test.tsx`
- Test: `src/lib/export.test.ts`

- [ ] **Step 1: Write the failing preview and export tests**

```ts
test("applies selected background css variables to the preview resume", () => {
  render(
    <Preview
      html="<h1 class='resume-name'>Name</h1>"
      template="classic"
      style={{ ...DEFAULT_STYLE, backgroundPreset: "soft-arc" }}
      customCss=""
      language="zh"
    />,
  );

  const preview = document.getElementById("resume-preview");
  expect(preview?.style.getPropertyValue("--resume-paper-overlay")).not.toBe("none");
});
```

```ts
it("includes selected geometric background styling in standalone exports", () => {
  const style = { ...DEFAULT_STYLE, backgroundPreset: "corner-frame" };
  const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
  expect(result).toContain("--resume-paper-background:");
  expect(result).toContain("--resume-paper-overlay:");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Preview.test.tsx src/lib/export.test.ts`
Expected: FAIL because preview and export markup do not yet consume the background variables.

- [ ] **Step 3: Update preview and export to render the shared background styling**

```tsx
style={{
  ...cssVars,
  padding: `${style.pagePadding}mm`,
  transform: `scale(${scale})`,
  transformOrigin: "top left",
  background: "var(--resume-paper-background)",
  backgroundImage: "var(--resume-paper-overlay)",
  backgroundSize: style.backgroundPreset === "grid-wash" ? "32px 32px, 32px 32px" : "cover, cover",
  backgroundRepeat: style.backgroundPreset === "grid-wash" ? "repeat, repeat" : "no-repeat, no-repeat",
  backgroundPosition: "top left, top left",
} as React.CSSProperties}
```

```ts
<style>
body { margin: 0; display: flex; justify-content: center; background: #f3f4f6; }
.resume {
  width: 210mm;
  min-height: 297mm;
  padding: ${style.pagePadding}mm;
  background: var(--resume-paper-background);
  background-image: var(--resume-paper-overlay);
  background-position: top left, top left;
  background-repeat: ${style.backgroundPreset === "grid-wash" ? "repeat, repeat" : "no-repeat, no-repeat"};
  background-size: ${style.backgroundPreset === "grid-wash" ? "32px 32px, 32px 32px" : "cover, cover"};
  box-shadow: 0 1px 3px rgba(0,0,0,.1);
}
@media print {
  body { background: #fff; }
  .resume {
    box-shadow: none;
    padding: ${Math.max(style.pagePadding - 5, 10)}mm;
    width: 100%;
  }
}
</style>
```

- [ ] **Step 4: Run preview and export tests to verify they pass**

Run: `npx vitest run src/components/Preview.test.tsx src/lib/export.test.ts`
Expected: PASS

## Task 5: Add Browser-Level Background Coverage

**Files:**
- Modify: `e2e/resume-maker.spec.ts`
- Test: `e2e/resume-maker.spec.ts`

- [ ] **Step 1: Add failing E2E coverage for background switching and persistence**

```ts
test("背景切换：选择几何背景后预览立即更新并在刷新后保留", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "角框" }).click();

  const preview = page.locator("#resume-preview");
  const overlay = await preview.evaluate((el) => getComputedStyle(el).getPropertyValue("--resume-paper-overlay"));
  expect(overlay).not.toBe("none");

  await page.reload();
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await expect(page.getByRole("button", { name: "角框" })).toHaveClass(/border-gray-900/);
});
```

```ts
test("导出 HTML 包含所选背景样式变量", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "柔弧" }).click();
  await page.getByRole("button", { name: "导出" }).click();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "HTML" }).click(),
  ]);

  const path = await download.path();
  const content = path ? readFileSync(path, "utf-8") : "";
  expect(content).toContain("--resume-paper-overlay:");
});
```

- [ ] **Step 2: Run the targeted browser tests to verify they fail**

Run: `npx playwright test -g "背景切换|导出 HTML 包含所选背景样式变量"`
Expected: FAIL because there is no background control or export wiring yet.

- [ ] **Step 3: Adjust UI / selectors as needed to make the tests pass with minimal code changes**

```ts
// Expected final surface:
// - background cards expose localized aria-labels
// - selected card has an active border class
// - preview exposes background CSS vars on #resume-preview
```

- [ ] **Step 4: Run the targeted browser tests to verify they pass**

Run: `npx playwright test -g "背景切换|导出 HTML 包含所选背景样式变量"`
Expected: PASS

## Task 6: Full Verification

**Files:**
- Modify: none
- Test: whole repo

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: PASS with all Vitest suites green.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS with 0 lint errors.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS with a successful Vite production bundle.

- [ ] **Step 4: Run the full E2E suite**

Run: `npm run test:e2e`
Expected: PASS with all Playwright specs green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backgrounds.ts src/lib/storage.ts src/lib/storage.test.ts src/lib/export.ts src/lib/export.test.ts src/lib/i18n.ts src/components/StylePanel.tsx src/components/StylePanel.test.tsx src/components/Toolbar.test.tsx src/components/Preview.tsx src/components/Preview.test.tsx src/hooks/useResume.test.tsx e2e/resume-maker.spec.ts docs/superpowers/specs/2026-04-22-resume-backgrounds-design.md docs/superpowers/plans/2026-04-22-resume-backgrounds.md
git commit -m "feat: add geometric resume background presets"
```

## Self-Review

- Spec coverage: this plan maps the spec’s shared background module, persisted style field, style panel UI, preview/export consistency, and browser coverage into explicit tasks.
- Placeholder scan: no `TODO` / `TBD` markers remain; each task contains concrete file paths, code targets, and commands.
- Type consistency: the plan consistently uses `backgroundPreset`, `BackgroundPreset`, and the same preset ids across storage, UI, preview, export, and tests.
