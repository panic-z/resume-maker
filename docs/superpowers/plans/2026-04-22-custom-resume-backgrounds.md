# Custom Resume Backgrounds Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add custom gradient and custom image resume backgrounds that persist locally, render in preview, and export as self-contained HTML/PDF-compatible output alongside the existing preset backgrounds.

**Architecture:** Expand the background system from a single preset id into a mode-based configuration model stored inside `StyleSettings`. Centralize background CSS generation inside `src/lib/backgrounds.ts`, then wire the resulting layers through storage, preview, export, and the style panel so all paths share the same rendering contract. Add upload guardrails and explicit fallback behavior so invalid or oversized images do not corrupt the existing style state.

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Playwright, browser FileReader / localStorage APIs

---

## File Map

- Create: `src/lib/background-utils.ts`
  Helper utilities for validating uploaded image files, converting them to data URLs, and returning structured upload results.
- Modify: `src/lib/backgrounds.ts`
  Expand preset-only background definitions into a shared mode-aware background generator and types for preset, gradient, and image backgrounds.
- Modify: `src/lib/storage.ts`
  Extend `StyleSettings`, defaults, load/save validation, and CSS variable generation to support the new background model.
- Modify: `src/lib/storage.test.ts`
  Verify backward compatibility, mode validation, image fallback behavior, and new default handling.
- Modify: `src/hooks/useResume.test.tsx`
  Verify persisted background mode restoration in the hook-level state flow.
- Modify: `src/lib/i18n.ts`
  Add copy for background mode labels, custom gradient controls, custom image controls, upload errors, and export-size note.
- Modify: `src/components/StylePanel.tsx`
  Add the background mode switcher plus gradient and image editing controls.
- Modify: `src/components/StylePanel.test.tsx`
  Verify the mode switcher, gradient controls, and image remove flow emit the correct style patches.
- Modify: `src/components/Preview.tsx`
  Consume the mode-aware background generator output instead of preset-only conditionals.
- Modify: `src/components/Preview.test.tsx`
  Verify generated custom gradient / image background layers reach the preview container.
- Modify: `src/lib/export.ts`
  Reuse the shared background output in standalone export CSS for custom modes.
- Modify: `src/lib/export.test.ts`
  Verify standalone export includes embedded custom gradient / image styling.
- Modify: `e2e/resume-maker.spec.ts`
  Add browser coverage for custom gradient persistence, custom image upload, and exported HTML carrying embedded image background data.

### Task 1: Expand the Background Model and Generator

**Files:**
- Modify: `src/lib/backgrounds.ts`
- Test: `src/lib/export.test.ts`

- [ ] **Step 1: Write the failing export test for a custom gradient background**

```ts
it("includes generated custom gradient layers in standalone exports", () => {
  const style = {
    ...DEFAULT_STYLE,
    backgroundMode: "custom-gradient" as const,
    customGradient: {
      fromColor: "#f8fafc",
      toColor: "#e2e8f0",
      direction: "to-bottom-right" as const,
      softness: 0.18,
    },
  };

  const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);

  expect(result).toContain("--resume-paper-background:");
  expect(result).toContain("--resume-paper-overlay:");
  expect(result).toContain('linear-gradient(135deg');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/export.test.ts`
Expected: FAIL because `StyleSettings` and `styleToCssVars()` do not understand `backgroundMode` or `customGradient`.

- [ ] **Step 3: Add mode-aware background types and generator in `src/lib/backgrounds.ts`**

```ts
export type BackgroundMode = "preset" | "custom-gradient" | "custom-image";
export type BackgroundFit = "cover" | "contain" | "repeat";
export type GradientDirection = "to-bottom" | "to-bottom-right" | "to-right";

export interface CustomGradientBackground {
  fromColor: string;
  toColor: string;
  direction: GradientDirection;
  softness: number;
}

export interface CustomImageBackground {
  dataUrl: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  fit: BackgroundFit;
  imageOpacity: number;
  overlayOpacity: number;
}

export interface ResolvedBackgroundLayers {
  paperBackground: string;
  paperOverlay: string;
  backgroundSize: string;
  backgroundRepeat: string;
  backgroundPosition: string;
}

export function resolveBackgroundLayers(input: {
  backgroundMode: BackgroundMode;
  backgroundPreset: BackgroundPreset;
  customGradient: CustomGradientBackground;
  customImage: CustomImageBackground | null;
}): ResolvedBackgroundLayers {
  if (input.backgroundMode === "custom-gradient") {
    return {
      paperBackground: `linear-gradient(${gradientDirectionValue(input.customGradient.direction)}, ${input.customGradient.fromColor} 0%, ${input.customGradient.toColor} 100%)`,
      paperOverlay: `radial-gradient(circle at top right, rgba(255,255,255,${input.customGradient.softness}) 0, transparent 52%), radial-gradient(circle at bottom left, rgba(148,163,184,${input.customGradient.softness / 2}) 0, transparent 44%)`,
      backgroundSize: "cover, cover, cover",
      backgroundRepeat: "no-repeat, no-repeat, no-repeat",
      backgroundPosition: "top left, top left, top left",
    };
  }

  if (input.backgroundMode === "custom-image" && input.customImage) {
    const fit = input.customImage.fit === "repeat"
      ? { size: "auto, auto, cover", repeat: "repeat, no-repeat, no-repeat" }
      : input.customImage.fit === "contain"
        ? { size: "contain, cover, cover", repeat: "no-repeat, no-repeat, no-repeat" }
        : { size: "cover, cover, cover", repeat: "no-repeat, no-repeat, no-repeat" };

    return {
      paperBackground: "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)",
      paperOverlay: `linear-gradient(rgba(255,255,255,${input.customImage.overlayOpacity}), rgba(255,255,255,${input.customImage.overlayOpacity})), linear-gradient(rgba(255,255,255,${1 - input.customImage.imageOpacity}), rgba(255,255,255,${1 - input.customImage.imageOpacity})), url("${input.customImage.dataUrl}")`,
      backgroundSize: fit.size,
      backgroundRepeat: fit.repeat,
      backgroundPosition: "center center, top left, center center",
    };
  }

  const preset = getBackgroundPreset(input.backgroundPreset);
  return {
    paperBackground: preset.paperBackground,
    paperOverlay: preset.paperOverlay,
    backgroundSize: input.backgroundPreset === "grid-wash" ? "32px 32px, 32px 32px, cover" : "cover, cover, cover",
    backgroundRepeat: input.backgroundPreset === "grid-wash" ? "repeat, repeat, no-repeat" : "no-repeat, no-repeat, no-repeat",
    backgroundPosition: "top left, top left, top left",
  };
}
```

- [ ] **Step 4: Run the export test to verify it passes**

Run: `npx vitest run src/lib/export.test.ts`
Expected: PASS for the new custom-gradient export coverage.

- [ ] **Step 5: Commit**

```bash
git add src/lib/backgrounds.ts src/lib/export.test.ts
git commit -m "feat: add mode-aware background generator"
```

### Task 2: Extend Storage and Backward-Compatible Style Loading

**Files:**
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/hooks/useResume.test.tsx`

- [ ] **Step 1: Write the failing storage tests for the new background model**

```ts
it("loads old preset-only style payloads into preset mode", () => {
  localStorage.setItem("resume-maker:style", JSON.stringify({ backgroundPreset: "grid-wash" }));
  expect(loadStyle()).toMatchObject({
    backgroundMode: "preset",
    backgroundPreset: "grid-wash",
  });
});

it("falls back to plain preset mode when custom image payload is invalid", () => {
  localStorage.setItem("resume-maker:style", JSON.stringify({
    backgroundMode: "custom-image",
    customImage: { dataUrl: "", mimeType: "image/gif" },
  }));

  expect(loadStyle()).toMatchObject({
    backgroundMode: "preset",
    backgroundPreset: "plain",
  });
});
```

```tsx
test("restores a persisted custom gradient background from style storage", () => {
  localStorage.setItem("resume-maker:style", JSON.stringify({
    backgroundMode: "custom-gradient",
    customGradient: {
      fromColor: "#f8fafc",
      toColor: "#e2e8f0",
      direction: "to-right",
      softness: 0.2,
    },
  }));

  render(<Probe language="zh" />);

  expect(screen.getByTestId("style")).toHaveTextContent('"backgroundMode":"custom-gradient"');
  expect(screen.getByTestId("style")).toHaveTextContent('"direction":"to-right"');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage.test.ts src/hooks/useResume.test.tsx`
Expected: FAIL because `StyleSettings` still only stores `backgroundPreset`.

- [ ] **Step 3: Extend `StyleSettings`, defaults, validation, and CSS vars**

```ts
export interface StyleSettings {
  fontSize: number;
  lineHeight: number;
  accentColor: string;
  fontFamily: FontFamily;
  pagePadding: number;
  backgroundMode: BackgroundMode;
  backgroundPreset: BackgroundPreset;
  customGradient: CustomGradientBackground;
  customImage: CustomImageBackground | null;
}

export const DEFAULT_STYLE: StyleSettings = {
  fontSize: 14,
  lineHeight: 1.6,
  accentColor: "#000000",
  fontFamily: "serif",
  pagePadding: 20,
  backgroundMode: "preset",
  backgroundPreset: "plain",
  customGradient: {
    fromColor: "#ffffff",
    toColor: "#f8fafc",
    direction: "to-bottom-right",
    softness: 0.18,
  },
  customImage: null,
};

export function styleToCssVars(s: StyleSettings): Record<string, string> {
  const background = resolveBackgroundLayers(s);
  return {
    "--resume-font-size": `${s.fontSize}px`,
    "--resume-line-height": `${s.lineHeight}`,
    "--resume-accent": s.accentColor,
    "--resume-font-family": fontFamilyValue(s.fontFamily),
    "--resume-padding": `${s.pagePadding}mm`,
    "--resume-paper-background": background.paperBackground,
    "--resume-paper-overlay": background.paperOverlay,
    "--resume-background-size": background.backgroundSize,
    "--resume-background-repeat": background.backgroundRepeat,
    "--resume-background-position": background.backgroundPosition,
  };
}

export function loadStyle(...): StyleSettings {
  // preserve old payloads by defaulting `backgroundMode` to `preset`
  // validate colors, direction, softness, image mime type, fit, opacity, and dataUrl
  // fallback invalid custom-image payloads to preset/plain
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/storage.test.ts src/hooks/useResume.test.tsx`
Expected: PASS with backward-compatible storage restoration.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts src/hooks/useResume.test.tsx
git commit -m "feat: persist custom resume background settings"
```

### Task 3: Add Image Upload Utilities and Failure Handling

**Files:**
- Create: `src/lib/background-utils.ts`
- Modify: `src/lib/storage.ts`
- Test: `src/lib/storage.test.ts`

- [ ] **Step 1: Write the failing utility tests for image import validation**

```ts
it("rejects unsupported background image mime types", async () => {
  const file = new File(["gif"], "bg.gif", { type: "image/gif" });
  await expect(readBackgroundImage(file)).resolves.toMatchObject({
    ok: false,
    code: "unsupported-type",
  });
});

it("rejects background images larger than 1.5 MB", async () => {
  const file = new File([new Uint8Array(1_600_000)], "bg.png", { type: "image/png" });
  await expect(readBackgroundImage(file)).resolves.toMatchObject({
    ok: false,
    code: "file-too-large",
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: FAIL because `readBackgroundImage()` does not exist yet.

- [ ] **Step 3: Create `src/lib/background-utils.ts` with explicit upload results**

```ts
const MAX_BACKGROUND_IMAGE_BYTES = 1_500_000;
const VALID_BACKGROUND_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export type BackgroundUploadResult =
  | { ok: true; dataUrl: string; mimeType: "image/png" | "image/jpeg" | "image/webp" }
  | { ok: false; code: "unsupported-type" | "file-too-large" | "read-failed" };

export function readBackgroundImage(file: File): Promise<BackgroundUploadResult> {
  if (!VALID_BACKGROUND_IMAGE_TYPES.has(file.type)) {
    return Promise.resolve({ ok: false, code: "unsupported-type" });
  }

  if (file.size > MAX_BACKGROUND_IMAGE_BYTES) {
    return Promise.resolve({ ok: false, code: "file-too-large" });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ ok: true, dataUrl: String(reader.result), mimeType: file.type as "image/png" | "image/jpeg" | "image/webp" });
    reader.onerror = () => resolve({ ok: false, code: "read-failed" });
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/storage.test.ts`
Expected: PASS for the new upload validation coverage.

- [ ] **Step 5: Commit**

```bash
git add src/lib/background-utils.ts src/lib/storage.test.ts
git commit -m "feat: validate custom background image uploads"
```

### Task 4: Add Background Mode UI and Localized Controls

**Files:**
- Modify: `src/lib/i18n.ts`
- Modify: `src/components/StylePanel.tsx`
- Modify: `src/components/StylePanel.test.tsx`

- [ ] **Step 1: Write the failing style panel tests for the new controls**

```tsx
test("renders background mode controls", () => {
  render(<StylePanel ... />);
  expect(screen.getByRole("button", { name: "预设" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "渐变" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "图片" })).toBeInTheDocument();
});

test("changing custom gradient controls emits a nested style patch", () => {
  const onChange = vi.fn();
  render(<StylePanel ... onChange={onChange} />);

  screen.getByRole("button", { name: "渐变" }).click();
  fireEvent.change(screen.getByLabelText("主色"), { target: { value: "#e2e8f0" } });

  expect(onChange).toHaveBeenCalledWith({
    backgroundMode: "custom-gradient",
    customGradient: expect.objectContaining({ fromColor: "#e2e8f0" }),
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/StylePanel.test.tsx`
Expected: FAIL because the mode switcher and custom editors do not exist.

- [ ] **Step 3: Add localized copy and background mode editors**

```ts
stylePanel: {
  backgroundModes: {
    preset: "预设",
    "custom-gradient": "渐变",
    "custom-image": "图片",
  },
  backgroundGradient: {
    fromColor: "主色",
    toColor: "辅色",
    direction: "方向",
    softness: "柔和度",
  },
  backgroundImage: {
    upload: "上传图片",
    replace: "替换图片",
    remove: "移除图片",
    fit: "铺放方式",
    imageOpacity: "图片透明度",
    overlayOpacity: "白色蒙层",
    note: "图片背景会增大导出文件体积",
    errors: {
      unsupportedType: "仅支持 PNG、JPEG 或 WebP",
      fileTooLarge: "图片不能超过 1.5 MB",
      readFailed: "图片读取失败，请重试",
      persistenceFailed: "图片已应用，但无法保存到下次刷新",
    },
  },
}
```

```tsx
<LabeledControl label={copy.background}>
  <div className="flex gap-1">
    {(["preset", "custom-gradient", "custom-image"] as const).map((mode) => (
      <button key={mode} type="button" onClick={() => onChange({ backgroundMode: mode })}>
        {copy.backgroundModes[mode]}
      </button>
    ))}
  </div>

  {style.backgroundMode === "preset" && <PresetCards ... />}
  {style.backgroundMode === "custom-gradient" && <GradientControls ... />}
  {style.backgroundMode === "custom-image" && <ImageControls ... />}
</LabeledControl>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/StylePanel.test.tsx`
Expected: PASS for mode switching and gradient control patches.

- [ ] **Step 5: Commit**

```bash
git add src/lib/i18n.ts src/components/StylePanel.tsx src/components/StylePanel.test.tsx
git commit -m "feat: add custom background controls to style panel"
```

### Task 5: Wire Custom Image Upload and Remove Flow

**Files:**
- Modify: `src/components/StylePanel.tsx`
- Modify: `src/components/StylePanel.test.tsx`
- Modify: `src/lib/background-utils.ts`

- [ ] **Step 1: Write the failing component test for image remove behavior**

```tsx
test("removing a custom image falls back to plain preset mode", async () => {
  const onChange = vi.fn();
  render(
    <StylePanel
      language="zh"
      style={{
        ...DEFAULT_STYLE,
        backgroundMode: "custom-image",
        customImage: {
          dataUrl: "data:image/png;base64,abc",
          mimeType: "image/png",
          fit: "cover",
          imageOpacity: 0.8,
          overlayOpacity: 0.35,
        },
      }}
      onChange={onChange}
      ...
    />,
  );

  await userEvent.click(screen.getByRole("button", { name: "移除图片" }));

  expect(onChange).toHaveBeenCalledWith({
    backgroundMode: "preset",
    backgroundPreset: "plain",
    customImage: null,
  });
});
```

- [ ] **Step 2: Run tests to verify it fails**

Run: `npx vitest run src/components/StylePanel.test.tsx`
Expected: FAIL because remove / upload behavior is not implemented.

- [ ] **Step 3: Implement image upload, error messaging, and remove flow**

```tsx
const [backgroundImageError, setBackgroundImageError] = useState<string | null>(null);

async function handleBackgroundFile(file: File) {
  const result = await readBackgroundImage(file);
  if (!result.ok) {
    setBackgroundImageError(copy.backgroundImage.errors[result.code]);
    return;
  }

  setBackgroundImageError(null);
  onChange({
    backgroundMode: "custom-image",
    customImage: {
      dataUrl: result.dataUrl,
      mimeType: result.mimeType,
      fit: style.customImage?.fit ?? "cover",
      imageOpacity: style.customImage?.imageOpacity ?? 0.82,
      overlayOpacity: style.customImage?.overlayOpacity ?? 0.3,
    },
  });
}

function handleRemoveBackgroundImage() {
  setBackgroundImageError(null);
  onChange({
    backgroundMode: "preset",
    backgroundPreset: "plain",
    customImage: null,
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/StylePanel.test.tsx`
Expected: PASS for upload error handling and remove fallback behavior.

- [ ] **Step 5: Commit**

```bash
git add src/components/StylePanel.tsx src/components/StylePanel.test.tsx src/lib/background-utils.ts
git commit -m "feat: support custom background image uploads"
```

### Task 6: Reuse the Shared Background Output in Preview and Export

**Files:**
- Modify: `src/components/Preview.tsx`
- Modify: `src/components/Preview.test.tsx`
- Modify: `src/lib/export.ts`
- Modify: `src/lib/export.test.ts`

- [ ] **Step 1: Write the failing preview and export tests for custom image backgrounds**

```tsx
test("applies custom image background variables to the preview resume", () => {
  render(
    <Preview
      ...
      style={{
        ...DEFAULT_STYLE,
        backgroundMode: "custom-image",
        customImage: {
          dataUrl: "data:image/png;base64,abc",
          mimeType: "image/png",
          fit: "cover",
          imageOpacity: 0.8,
          overlayOpacity: 0.3,
        },
      }}
    />,
  );

  const preview = document.getElementById("resume-preview");
  expect(preview?.style.getPropertyValue("--resume-paper-overlay")).toContain("url(\"data:image/png;base64,abc\")");
});
```

```ts
it("embeds custom image data urls in standalone exports", () => {
  const style = {
    ...DEFAULT_STYLE,
    backgroundMode: "custom-image" as const,
    customImage: {
      dataUrl: "data:image/png;base64,abc",
      mimeType: "image/png" as const,
      fit: "cover" as const,
      imageOpacity: 0.8,
      overlayOpacity: 0.3,
    },
  };

  const result = buildStandaloneHtml("<h1>Name</h1>", "classic", style);
  expect(result).toContain('url("data:image/png;base64,abc")');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/components/Preview.test.tsx src/lib/export.test.ts`
Expected: FAIL because preview/export still rely on preset-specific background conditionals.

- [ ] **Step 3: Replace preset-only background conditionals with generated values**

```tsx
const cssVars = styleToCssVars(style);

style={{
  ...cssVars,
  padding: `${style.pagePadding}mm`,
  transform: `scale(${scale})`,
  transformOrigin: "top left",
  backgroundColor: "#ffffff",
  backgroundImage: "var(--resume-paper-overlay), var(--resume-paper-background)",
  backgroundSize: "var(--resume-background-size)",
  backgroundRepeat: "var(--resume-background-repeat)",
  backgroundPosition: "var(--resume-background-position)",
}}
```

```ts
.resume {
  ...
  background-color: #ffffff;
  background-image: var(--resume-paper-overlay), var(--resume-paper-background);
  background-position: var(--resume-background-position);
  background-repeat: var(--resume-background-repeat);
  background-size: var(--resume-background-size);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/components/Preview.test.tsx src/lib/export.test.ts`
Expected: PASS for custom image and custom gradient rendering.

- [ ] **Step 5: Commit**

```bash
git add src/components/Preview.tsx src/components/Preview.test.tsx src/lib/export.ts src/lib/export.test.ts
git commit -m "feat: render custom backgrounds in preview and export"
```

### Task 7: Add End-to-End Coverage for Gradient and Image Backgrounds

**Files:**
- Modify: `e2e/resume-maker.spec.ts`

- [ ] **Step 1: Write the failing E2E coverage**

```ts
test("自定义渐变背景刷新后保留", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "渐变", exact: true }).click();
  await page.getByLabel("主色").fill("#e2e8f0");
  await page.reload();
  const overlay = await page.locator("#resume-preview").evaluate(
    (el) => getComputedStyle(el).getPropertyValue("--resume-paper-background"),
  );
  expect(overlay).toContain("linear-gradient");
});

test("自定义图片背景会出现在导出的 HTML 中", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "图片", exact: true }).click();
  await page.getByLabel("上传图片").setInputFiles("e2e/fixtures/background-grid.png");
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.click("button:text('导出')");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("button:text('HTML')"),
  ]);
  const content = readFileSync(await download.path()!, "utf-8");
  expect(content).toContain("data:image/png;base64,");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx playwright test e2e/resume-maker.spec.ts --grep "自定义渐变背景|自定义图片背景"`
Expected: FAIL because there is no custom background mode UI yet.

- [ ] **Step 3: Add the browser scenarios**

```ts
test("自定义渐变背景刷新后保留", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "渐变", exact: true }).click();
  await page.getByLabel("主色").fill("#e2e8f0");
  await page.getByLabel("辅色").fill("#f8fafc");
  await page.reload();

  const background = await page.locator("#resume-preview").evaluate(
    (el) => getComputedStyle(el).getPropertyValue("--resume-paper-background"),
  );

  expect(background).toContain("linear-gradient");
});

test("上传自定义图片背景后预览更新", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "图片", exact: true }).click();
  await page.getByLabel("上传图片").setInputFiles("e2e/fixtures/background-grid.png");

  const overlay = await page.locator("#resume-preview").evaluate(
    (el) => getComputedStyle(el).getPropertyValue("--resume-paper-overlay"),
  );

  expect(overlay).toContain("data:image/png;base64,");
});

test("自定义图片背景会出现在导出的 HTML 中", async ({ page }) => {
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.getByRole("button", { name: "图片", exact: true }).click();
  await page.getByLabel("上传图片").setInputFiles("e2e/fixtures/background-grid.png");
  await page.getByRole("button", { name: "样式", exact: true }).click();
  await page.click("button:text('导出')");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.click("button:text('HTML')"),
  ]);

  const content = readFileSync(await download.path()!, "utf-8");
  expect(content).toContain("data:image/png;base64,");
});
```

- [ ] **Step 4: Run the targeted E2E tests to verify they pass**

Run: `npx playwright test e2e/resume-maker.spec.ts --grep "自定义渐变背景|自定义图片背景"`
Expected: PASS for the new custom background browser flows.

- [ ] **Step 5: Commit**

```bash
git add e2e/resume-maker.spec.ts
git commit -m "test: cover custom resume background flows"
```

### Task 8: Final Verification

**Files:**
- Modify: `src/lib/backgrounds.ts`
- Modify: `src/lib/background-utils.ts`
- Modify: `src/lib/storage.ts`
- Modify: `src/lib/storage.test.ts`
- Modify: `src/hooks/useResume.test.tsx`
- Modify: `src/lib/i18n.ts`
- Modify: `src/components/StylePanel.tsx`
- Modify: `src/components/StylePanel.test.tsx`
- Modify: `src/components/Preview.tsx`
- Modify: `src/components/Preview.test.tsx`
- Modify: `src/lib/export.ts`
- Modify: `src/lib/export.test.ts`
- Modify: `e2e/resume-maker.spec.ts`

- [ ] **Step 1: Run the full unit and component suite**

Run: `npm test`
Expected: PASS with the new custom background tests included.

- [ ] **Step 2: Run lint or type-safe build verification**

Run: `npm run build`
Expected: PASS with the expanded `StyleSettings` model and UI code.

- [ ] **Step 3: Run the full browser suite**

Run: `npm run test:e2e`
Expected: PASS, including preset, custom gradient, and custom image background scenarios.

- [ ] **Step 4: Commit the finished feature**

```bash
git add src/lib/backgrounds.ts src/lib/background-utils.ts src/lib/storage.ts src/lib/storage.test.ts src/hooks/useResume.test.tsx src/lib/i18n.ts src/components/StylePanel.tsx src/components/StylePanel.test.tsx src/components/Preview.tsx src/components/Preview.test.tsx src/lib/export.ts src/lib/export.test.ts e2e/resume-maker.spec.ts docs/superpowers/specs/2026-04-22-custom-resume-backgrounds-design.md docs/superpowers/plans/2026-04-22-custom-resume-backgrounds.md
git commit -m "feat: add custom resume background editor"
```

## Self-Review

- Spec coverage: the plan covers the unified background model, local persistence, image upload guardrails, preview/export reuse, style panel UI, and end-to-end flows called for in the spec.
- Placeholder scan: no `TBD` / `TODO` / abbreviated implementation steps remain after expanding the E2E task with concrete test bodies.
- Type consistency: this plan consistently uses `backgroundMode`, `customGradient`, `customImage`, `BackgroundFit`, and the existing `backgroundPreset` field across storage, UI, preview, export, and tests.
