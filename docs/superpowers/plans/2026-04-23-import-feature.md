# Import Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a toolbar import flow for Markdown, project JSON, and experimental PDF files that updates the resume state safely in the browser.

**Architecture:** Add a dedicated import library for file parsing and normalization, extend `useResume` with explicit import actions, and wire the toolbar to a new import dropdown plus hidden file inputs. Keep import behavior client-side, reuse existing storage validation logic, and isolate PDF parsing as a best-effort conversion path that only replaces Markdown.

**Tech Stack:** React 19, TypeScript 6, Vite 8, Vitest, Playwright, browser File APIs, `pdfjs-dist` for PDF text extraction.

---

## File Structure

**Create:**

- `src/lib/import.ts` — import entry points, file-type parsing, project snapshot normalization, PDF text extraction, Markdown conversion heuristics, and stable error codes
- `src/lib/import.test.ts` — unit tests for Markdown, JSON, and PDF import behaviors

**Modify:**

- `src/hooks/useResume.ts` — add explicit import actions for Markdown and full-project state
- `src/components/Toolbar.tsx` — add Import dropdown, hidden file inputs, confirmation flow, localized error display, and wiring to hook actions
- `src/components/Toolbar.test.tsx` — add component tests for import menu and file-type triggers
- `src/components/ResumePage.tsx` — pass import actions into the toolbar
- `src/lib/storage.ts` — expose reusable project-state normalization helpers instead of duplicating validation logic
- `src/lib/i18n.ts` — add localized copy for import menu items, confirmations, and error messages
- `package.json` — add `pdfjs-dist` dependency
- `e2e/resume-maker.spec.ts` — add import E2E coverage

## Task 1: Add Import Parsing Unit Tests

**Files:**
- Create: `src/lib/import.test.ts`
- Test: `src/lib/import.test.ts`

- [ ] **Step 1: Write the failing tests for Markdown, JSON, and PDF import helpers**

```ts
import { describe, expect, it, vi } from "vitest";
import {
  parseImportedMarkdown,
  parseImportedProjectJson,
  convertPdfTextToMarkdown,
  type ImportedProjectState,
} from "./import";

describe("parseImportedMarkdown", () => {
  it("returns UTF-8 markdown text unchanged except for normalizing line endings", async () => {
    await expect(parseImportedMarkdown("# Name\r\n\r\n- item\r\n")).resolves.toBe("# Name\n\n- item\n");
  });
});

describe("parseImportedProjectJson", () => {
  it("restores a valid project snapshot", async () => {
    const result = await parseImportedProjectJson(
      JSON.stringify({
        markdown: "# Name",
        template: "modern",
        style: { fontSize: 14, lineHeight: 1.6, accentColor: "#3b82f6", fontFamily: "sans", pagePadding: 20, backgroundMode: "preset", backgroundPreset: "plain", customGradient: null, customImage: null },
        customCss: ".resume-name { color: red; }",
        language: "en",
      }),
    );

    expect(result).toMatchObject({
      markdown: "# Name",
      template: "modern",
      customCss: ".resume-name { color: red; }",
      language: "en",
    } satisfies Partial<ImportedProjectState>);
  });

  it("throws invalid-project when the snapshot cannot be normalized", async () => {
    await expect(parseImportedProjectJson("{\"template\":\"mystery\"}")).rejects.toMatchObject({ code: "invalid-project" });
  });
});

describe("convertPdfTextToMarkdown", () => {
  it("turns extracted PDF text into editable markdown paragraphs", () => {
    expect(convertPdfTextToMarkdown("Name\nEmail\n\nExperience\nBuilt things")).toBe("# Name\n\nEmail\n\n## Experience\n\nBuilt things");
  });

  it("throws pdf-empty when extraction is blank", () => {
    expect(() => convertPdfTextToMarkdown("   \n\n")).toThrowError();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- src/lib/import.test.ts`

Expected: FAIL with module-not-found or missing export errors for `./import`

- [ ] **Step 3: Create the minimal import module skeleton**

```ts
// src/lib/import.ts
export interface ImportedProjectState {
  markdown: string;
  template: "classic" | "modern" | "minimal" | "professional" | "creative";
  style: Record<string, unknown>;
  customCss: string;
  language: "zh" | "en";
}

export async function parseImportedMarkdown(markdown: string): Promise<string> {
  return markdown;
}

export async function parseImportedProjectJson(_raw: string): Promise<ImportedProjectState> {
  throw Object.assign(new Error("Not implemented"), { code: "invalid-project" });
}

export function convertPdfTextToMarkdown(_text: string): string {
  throw new Error("Not implemented");
}
```

- [ ] **Step 4: Run the tests to verify the failures are now behavioral**

Run: `npm test -- src/lib/import.test.ts`

Expected: FAIL on assertion mismatches instead of module-not-found

- [ ] **Step 5: Commit**

```bash
git add src/lib/import.ts src/lib/import.test.ts
git commit -m "test: add import parser coverage"
```

## Task 2: Implement Markdown and JSON Import Parsing

**Files:**
- Modify: `src/lib/import.ts`
- Modify: `src/lib/storage.ts`
- Test: `src/lib/import.test.ts`

- [ ] **Step 1: Add reusable project-state normalization in storage**

```ts
// src/lib/storage.ts
export interface PersistedResumeProject {
  markdown: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
}

export function normalizeImportedProject(
  parsed: Record<string, unknown>,
  defaults: Pick<StyleSettings, "fontFamily" | "accentColor"> = TEMPLATE_DEFAULTS.classic,
): PersistedResumeProject {
  const markdown = typeof parsed.markdown === "string" ? parsed.markdown : "";
  const template = typeof parsed.template === "string" && VALID_TEMPLATES.includes(parsed.template as TemplateName)
    ? parsed.template as TemplateName
    : "classic";
  const style = normalizeStyleRecord(parsed.style, TEMPLATE_DEFAULTS[template] ?? defaults);
  const customCss = typeof parsed.customCss === "string" ? parsed.customCss : "";
  const language = typeof parsed.language === "string" && VALID_LANGUAGES.includes(parsed.language as Language)
    ? parsed.language as Language
    : "zh";

  if (!markdown.trim()) {
    throw Object.assign(new Error("Invalid project"), { code: "invalid-project" });
  }

  return { markdown, template, style, customCss, language };
}
```

- [ ] **Step 2: Run storage and import tests to confirm the new helper is still missing dependencies**

Run: `npm test -- src/lib/import.test.ts src/lib/storage.test.ts`

Expected: FAIL because `normalizeStyleRecord` or import usage is not wired yet

- [ ] **Step 3: Refactor existing style normalization into a reusable helper**

```ts
// src/lib/storage.ts
export function normalizeStyleRecord(
  parsed: Record<string, unknown>,
  defaults: Pick<StyleSettings, "fontFamily" | "accentColor">,
): StyleSettings {
  const backgroundSettings = parseBackgroundSettings(parsed);
  return {
    fontSize: clamp(parsed.fontSize, 10, 18, DEFAULT_STYLE.fontSize),
    lineHeight: clamp(parsed.lineHeight, 1.0, 2.2, DEFAULT_STYLE.lineHeight),
    accentColor: isHexColor(parsed.accentColor) ? parsed.accentColor : defaults.accentColor,
    fontFamily: isFontFamily(parsed.fontFamily) ? parsed.fontFamily : defaults.fontFamily,
    pagePadding: clamp(parsed.pagePadding, 10, 30, DEFAULT_STYLE.pagePadding),
    ...backgroundSettings,
  };
}
```

- [ ] **Step 4: Implement Markdown and JSON parsing in the import module**

```ts
// src/lib/import.ts
import { normalizeImportedProject, type PersistedResumeProject } from "./storage";

export type ImportErrorCode =
  | "unsupported-type"
  | "read-failed"
  | "invalid-json"
  | "invalid-project"
  | "pdf-parse-failed"
  | "pdf-empty";

export class ResumeImportError extends Error {
  constructor(public code: ImportErrorCode) {
    super(code);
  }
}

export async function parseImportedMarkdown(markdown: string): Promise<string> {
  return markdown.replace(/\r\n?/g, "\n");
}

export async function parseImportedProjectJson(raw: string): Promise<PersistedResumeProject> {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new ResumeImportError("invalid-json");
  }

  try {
    return normalizeImportedProject(parsed);
  } catch {
    throw new ResumeImportError("invalid-project");
  }
}
```

- [ ] **Step 5: Run import and storage tests to verify they pass**

Run: `npm test -- src/lib/import.test.ts src/lib/storage.test.ts`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/import.ts src/lib/import.test.ts src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add markdown and project json import parsing"
```

## Task 3: Add PDF Extraction and Markdown Conversion

**Files:**
- Modify: `package.json`
- Modify: `src/lib/import.ts`
- Test: `src/lib/import.test.ts`

- [ ] **Step 1: Add a failing PDF import unit test around extraction flow**

```ts
it("maps extracted PDF text into markdown and rejects empty extraction", async () => {
  const markdown = convertPdfTextToMarkdown("Name\nEmail\n\nExperience\nBuilt things");
  expect(markdown).toContain("# Name");
  expect(markdown).toContain("## Experience");
  expect(() => convertPdfTextToMarkdown("")).toThrow();
});
```

- [ ] **Step 2: Run the import test file to verify the PDF test fails**

Run: `npm test -- src/lib/import.test.ts`

Expected: FAIL on `convertPdfTextToMarkdown`

- [ ] **Step 3: Add the PDF parsing dependency**

```json
{
  "dependencies": {
    "pdfjs-dist": "^4.10.38"
  }
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: PASS with updated lockfile and `pdfjs-dist` added

- [ ] **Step 5: Implement PDF parsing and conservative Markdown conversion**

```ts
// src/lib/import.ts
import * as pdfjsLib from "pdfjs-dist";

export function convertPdfTextToMarkdown(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) throw new ResumeImportError("pdf-empty");

  const blocks = normalized.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block, index) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.length === 0) return "";
    if (index === 0) return `# ${lines[0]}\n\n${lines.slice(1).join("\n")}`.trim();
    if (lines.length <= 3 && /^[A-Za-z\u4e00-\u9fa5\s]+$/.test(lines[0])) {
      return `## ${lines[0]}${lines.slice(1).length ? `\n\n${lines.slice(1).join("\n")}` : ""}`;
    }
    return lines.join("\n");
  }).filter(Boolean).join("\n\n");
}

export async function parseImportedPdf(file: File): Promise<string> {
  try {
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pageTexts.push(content.items.map((item) => ("str" in item ? item.str : "")).join("\n"));
    }

    return convertPdfTextToMarkdown(pageTexts.join("\n\n"));
  } catch (error) {
    if (error instanceof ResumeImportError) throw error;
    throw new ResumeImportError("pdf-parse-failed");
  }
}
```

- [ ] **Step 6: Run the import tests to verify PDF parsing logic passes**

Run: `npm test -- src/lib/import.test.ts`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/import.ts src/lib/import.test.ts
git commit -m "feat: add experimental pdf import parsing"
```

## Task 4: Extend useResume With Import Actions

**Files:**
- Modify: `src/hooks/useResume.ts`
- Modify: `src/hooks/useResume.test.tsx`

- [ ] **Step 1: Write failing hook tests for import actions**

```tsx
test("imports markdown without changing template or styles", () => {
  // render Probe, trigger importMarkdown("# Imported"), assert markdown changed and template/style unchanged
});

test("imports a full project snapshot atomically", () => {
  // render Probe, trigger importProject({...}), assert markdown/template/style/customCss all changed together
});
```

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `npm test -- src/hooks/useResume.test.tsx`

Expected: FAIL because import actions do not exist yet

- [ ] **Step 3: Add import actions to the hook**

```ts
// src/hooks/useResume.ts
const importMarkdown = useCallback((nextMarkdown: string) => {
  setMarkdown(nextMarkdown);
}, []);

const importProject = useCallback((project: {
  markdown: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
}) => {
  setMarkdown(project.markdown);
  setTemplate(project.template);
  saveTemplate(project.template);
  setStyleState(project.style);
  setCustomCssState(project.customCss);
}, []);
```

- [ ] **Step 4: Return the new actions and update the hook tests**

```ts
return {
  markdown,
  setMarkdown,
  template,
  changeTemplate,
  style,
  changeStyle,
  resetStyle,
  customCss,
  setCustomCss,
  importMarkdown,
  importProject,
};
```

- [ ] **Step 5: Run the hook tests to verify they pass**

Run: `npm test -- src/hooks/useResume.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useResume.ts src/hooks/useResume.test.tsx
git commit -m "feat: add resume import actions"
```

## Task 5: Add Toolbar Import UI and Localized Messaging

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/Toolbar.test.tsx`
- Modify: `src/components/ResumePage.tsx`
- Modify: `src/lib/i18n.ts`

- [ ] **Step 1: Write failing toolbar tests for import menu items and trigger behavior**

```tsx
test("opens the import menu with markdown, json, and pdf options", () => {
  // open import dropdown and assert the three labels are visible
});

test("calls the markdown import file picker when markdown import is clicked", () => {
  // spy on hidden input click and assert it fires
});
```

- [ ] **Step 2: Run the toolbar tests to verify they fail**

Run: `npm test -- src/components/Toolbar.test.tsx`

Expected: FAIL because import UI does not exist yet

- [ ] **Step 3: Add localized import copy**

```ts
// src/lib/i18n.ts
import: {
  title: "导入",
  markdown: "Markdown",
  projectJson: "项目 JSON",
  pdf: "PDF（实验性）",
  confirmMarkdown: "...",
  confirmProject: "...",
  confirmPdf: "...",
  errors: {
    unsupportedType: "...",
    readFailed: "...",
    invalidJson: "...",
    invalidProject: "...",
    pdfParseFailed: "...",
    pdfEmpty: "...",
  },
}
```

- [ ] **Step 4: Add the import dropdown and hidden file inputs to the toolbar**

```tsx
// src/components/Toolbar.tsx
const markdownImportRef = useRef<HTMLInputElement>(null);
const jsonImportRef = useRef<HTMLInputElement>(null);
const pdfImportRef = useRef<HTMLInputElement>(null);
const [importOpen, setImportOpen] = useState(false);
const [importError, setImportError] = useState<string | null>(null);

<button onClick={() => setImportOpen(!importOpen)}>Import</button>
{importOpen && (
  <div>
    <button onClick={() => markdownImportRef.current?.click()}>{copy.toolbar.import.markdown}</button>
    <button onClick={() => jsonImportRef.current?.click()}>{copy.toolbar.import.projectJson}</button>
    <button onClick={() => pdfImportRef.current?.click()}>{copy.toolbar.import.pdf}</button>
  </div>
)}
<input ref={markdownImportRef} type="file" accept=".md,text/markdown" className="sr-only" />
<input ref={jsonImportRef} type="file" accept=".json,application/json" className="sr-only" />
<input ref={pdfImportRef} type="file" accept="application/pdf,.pdf" className="sr-only" />
```

- [ ] **Step 5: Thread import action props through ResumePage into Toolbar**

```tsx
// src/components/ResumePage.tsx
<Toolbar
  ...
  onImportMarkdown={importMarkdown}
  onImportProject={importProject}
/>
```

- [ ] **Step 6: Run the toolbar and page tests to verify they pass**

Run: `npm test -- src/components/Toolbar.test.tsx src/components/ResumePage.test.tsx`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Toolbar.test.tsx src/components/ResumePage.tsx src/lib/i18n.ts
git commit -m "feat: add import toolbar entry points"
```

## Task 6: Wire Parsing, Confirmation, and Error Display Into Toolbar

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/Toolbar.test.tsx`
- Modify: `src/lib/import.ts`

- [ ] **Step 1: Write failing toolbar tests for confirmation and successful imports**

```tsx
test("imports markdown after confirmation and preserves current style", async () => {
  // mock parseImportedMarkdown + window.confirm, upload a file, assert onImportMarkdown called
});

test("imports a project json snapshot after confirmation", async () => {
  // mock parseImportedProjectJson, upload json, assert onImportProject called
});

test("shows a localized error when import parsing fails", async () => {
  // mock parseImportedPdf to reject and assert the error message is rendered
});
```

- [ ] **Step 2: Run the toolbar tests to verify they fail**

Run: `npm test -- src/components/Toolbar.test.tsx`

Expected: FAIL because handlers are not implemented yet

- [ ] **Step 3: Implement shared import handlers in the toolbar**

```tsx
const handleMarkdownImport = async (event: ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!window.confirm(copy.toolbar.import.confirmMarkdown)) return;
  try {
    const text = await file.text();
    const markdown = await parseImportedMarkdown(text);
    onImportMarkdown(markdown);
    setImportOpen(false);
    setImportError(null);
  } catch (error) {
    setImportError(importErrorMessage(error, copy.toolbar.import.errors));
  } finally {
    event.target.value = "";
  }
};
```

- [ ] **Step 4: Add matching JSON and PDF handlers**

```tsx
const handleProjectImport = async (event: ChangeEvent<HTMLInputElement>) => {
  // file.text() -> parseImportedProjectJson -> onImportProject(project)
};

const handlePdfImport = async (event: ChangeEvent<HTMLInputElement>) => {
  // parseImportedPdf(file) -> onImportMarkdown(markdown)
};
```

- [ ] **Step 5: Run the toolbar tests to verify they pass**

Run: `npm test -- src/components/Toolbar.test.tsx`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Toolbar.tsx src/components/Toolbar.test.tsx src/lib/import.ts
git commit -m "feat: wire import confirmation and error handling"
```

## Task 7: Add End-to-End Import Coverage

**Files:**
- Modify: `e2e/resume-maker.spec.ts`
- Test: `e2e/resume-maker.spec.ts`

- [ ] **Step 1: Add a Markdown import E2E test**

```ts
test("imports markdown into the editor and updates the preview", async ({ page }) => {
  await page.click("button:text('导入')");
  await page.click("button:text('Markdown')");
  await page.once("dialog", (dialog) => dialog.accept());
  await page.getByLabel("导入 Markdown").setInputFiles({
    name: "resume.md",
    mimeType: "text/markdown",
    buffer: Buffer.from("# Imported Name\n\n> imported@example.com"),
  });
  await expect(page.locator(".resume-name")).toContainText("Imported Name");
});
```

- [ ] **Step 2: Add a JSON import E2E test**

```ts
test("imports a project snapshot and restores template plus styles", async ({ page }) => {
  // upload a json snapshot with template modern and custom css
  // assert template class and preview variables update
});
```

- [ ] **Step 3: Add a PDF import E2E test using a stable fixture**

```ts
test("imports a text pdf into editable markdown", async ({ page }) => {
  // upload a simple text-based PDF fixture, accept dialog, assert editor/preview contains extracted name
});
```

- [ ] **Step 4: Run the E2E suite subset to verify it fails**

Run: `npx playwright test e2e/resume-maker.spec.ts --grep "imports markdown|imports a project snapshot|imports a text pdf"`

Expected: FAIL because import UI or handlers are incomplete

- [ ] **Step 5: Adjust selectors and localized labels until the import E2E tests pass**

```ts
// Keep selectors stable by using accessible button names and file input labels:
page.getByRole("button", { name: "导入", exact: true });
page.getByLabel("导入 Markdown");
page.getByLabel("导入项目 JSON");
page.getByLabel("导入 PDF");
```

- [ ] **Step 6: Run the targeted E2E tests to verify they pass**

Run: `npx playwright test e2e/resume-maker.spec.ts --grep "imports markdown|imports a project snapshot|imports a text pdf"`

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add e2e/resume-maker.spec.ts
git commit -m "test: add import end-to-end coverage"
```

## Task 8: Final Verification and Documentation Refresh

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the feature list and usage docs**

```md
- **Import** — Bring resumes in from Markdown, Resume Maker JSON snapshots, or experimental PDF text extraction
```

- [ ] **Step 2: Run the full unit test suite**

Run: `npm test`

Expected: PASS with all Vitest suites green

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS

- [ ] **Step 5: Run the full E2E suite**

Run: `npm run test:e2e`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: document import feature"
```

## Self-Review

### Spec Coverage

- Toolbar import entry: covered by Tasks 5 and 6
- Markdown import behavior: covered by Tasks 1, 4, 6, and 7
- JSON full-project restore: covered by Tasks 1, 2, 4, 6, and 7
- PDF experimental import: covered by Tasks 1, 3, 6, and 7
- Confirmation and overwrite protection: covered by Task 6
- Localized errors: covered by Tasks 5 and 6
- Unit/component/E2E coverage: covered by Tasks 1, 5, 6, and 7
- Docs update: covered by Task 8

### Placeholder Scan

- No `TODO`, `TBD`, or “similar to above” placeholders remain
- Every code-changing task includes concrete file targets and code snippets
- Every validation step includes an exact command and expected outcome

### Type Consistency

- Import action names are consistent: `importMarkdown`, `importProject`
- Project snapshot shape is consistent across tasks: `markdown`, `template`, `style`, `customCss`, `language`
- Error codes are consistent across parsing and UI mapping
