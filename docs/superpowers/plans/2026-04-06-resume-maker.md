# Resume Maker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Markdown-based online resume editor with real-time preview, two templates, and PDF/HTML/Markdown export.

**Architecture:** Vite + React + TypeScript SPA. Left panel is a CodeMirror Markdown editor, right panel renders the resume in real-time via a unified/remark/rehype pipeline. Two template CSS files scope styles via wrapper class. Data persists in localStorage. PDF export via `window.print()`.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind CSS, CodeMirror 6 (`@uiw/react-codemirror`), unified/remark-parse/remark-rehype/rehype-react, Vitest, lucide-react.

---

## File Structure

```
resume-maker/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Top nav bar (logo + GitHub link)
│   │   ├── Editor.tsx            # CodeMirror Markdown editor wrapper
│   │   ├── Preview.tsx           # Resume live preview (renders parsed Markdown)
│   │   ├── Toolbar.tsx           # Template switcher + export dropdown
│   │   └── ResumePage.tsx        # Main layout: draggable left/right split
│   ├── templates/
│   │   ├── classic.css           # Classic template (serif, centered, B&W)
│   │   └── modern.css            # Modern template (sans-serif, left-aligned, accent color)
│   ├── lib/
│   │   ├── markdown.ts           # unified pipeline + custom rehype plugin
│   │   ├── markdown.test.ts      # Tests for markdown parsing
│   │   ├── export.ts             # Export logic (PDF/HTML/Markdown)
│   │   ├── export.test.ts        # Tests for export (HTML/MD generation)
│   │   ├── storage.ts            # localStorage read/write with debounce
│   │   └── storage.test.ts       # Tests for storage
│   ├── hooks/
│   │   └── useResume.ts          # State + persistence hook (content, template)
│   ├── data/
│   │   └── default-resume.ts     # Default sample resume as a TS string constant
│   ├── App.tsx
│   ├── index.css                 # Tailwind directives + global styles
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.ts
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`

- [ ] **Step 1: Scaffold Vite + React + TS project**

```bash
npm create vite@latest . -- --template react-ts
```

Accept overwrite if prompted (directory already has `docs/`).

- [ ] **Step 2: Install core dependencies**

```bash
npm install
npm install @uiw/react-codemirror @codemirror/lang-markdown @codemirror/language
npm install unified remark-parse remark-rehype rehype-react
npm install lucide-react
npm install -D tailwindcss @tailwindcss/postcss postcss autoprefixer
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Configure Tailwind CSS**

Create `src/index.css`:

```css
@import "tailwindcss";
```

Create `postcss.config.js`:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:

```ts
/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
});
```

Add to `tsconfig.app.json` under `compilerOptions`:

```json
"types": ["vitest/globals"]
```

- [ ] **Step 5: Clean up scaffolded files**

Replace `src/App.tsx` with a minimal placeholder:

```tsx
function App() {
  return <div className="h-screen">Resume Maker</div>;
}

export default App;
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

Delete `src/App.css` and `src/assets/` if they exist.

- [ ] **Step 6: Verify setup**

```bash
npm run dev
```

Open browser, confirm "Resume Maker" text renders. Then:

```bash
npx vitest run
```

Confirm vitest runs (0 tests found is OK).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + TS project with Tailwind and Vitest"
```

---

### Task 2: localStorage Utility

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`

- [ ] **Step 1: Write failing tests for storage**

Create `src/lib/storage.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { loadContent, saveContent, loadTemplate, saveTemplate } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

describe("loadContent", () => {
  it("returns null when nothing is stored", () => {
    expect(loadContent()).toBeNull();
  });

  it("returns stored content", () => {
    localStorage.setItem("resume-maker:content", "# Hello");
    expect(loadContent()).toBe("# Hello");
  });
});

describe("saveContent", () => {
  it("saves content to localStorage", () => {
    saveContent("# Test");
    expect(localStorage.getItem("resume-maker:content")).toBe("# Test");
  });
});

describe("loadTemplate", () => {
  it("returns 'classic' when nothing is stored", () => {
    expect(loadTemplate()).toBe("classic");
  });

  it("returns stored template", () => {
    localStorage.setItem("resume-maker:template", "modern");
    expect(loadTemplate()).toBe("modern");
  });
});

describe("saveTemplate", () => {
  it("saves template to localStorage", () => {
    saveTemplate("modern");
    expect(localStorage.getItem("resume-maker:template")).toBe("modern");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/storage.test.ts
```

Expected: FAIL — cannot find module `./storage`.

- [ ] **Step 3: Implement storage utility**

Create `src/lib/storage.ts`:

```ts
const CONTENT_KEY = "resume-maker:content";
const TEMPLATE_KEY = "resume-maker:template";

export type TemplateName = "classic" | "modern";

export function loadContent(): string | null {
  return localStorage.getItem(CONTENT_KEY);
}

export function saveContent(content: string): void {
  localStorage.setItem(CONTENT_KEY, content);
}

export function loadTemplate(): TemplateName {
  const value = localStorage.getItem(TEMPLATE_KEY);
  if (value === "classic" || value === "modern") return value;
  return "classic";
}

export function saveTemplate(template: TemplateName): void {
  localStorage.setItem(TEMPLATE_KEY, template);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/storage.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/storage.ts src/lib/storage.test.ts
git commit -m "feat: add localStorage utility for content and template persistence"
```

---

### Task 3: Default Resume Data

**Files:**
- Create: `src/data/default-resume.ts`

- [ ] **Step 1: Create default resume constant**

Create `src/data/default-resume.ts`:

```ts
export const DEFAULT_RESUME = `# 张三

> zhangsan@email.com | 138-0000-0000 | [GitHub](https://github.com/zhangsan) | 上海

## 工作经历

### 高级前端工程师 | ABC科技 | 2022 - 至今

- 主导了公司核心产品的前端架构重构，性能提升 40%
- 带领 5 人前端团队完成 3 个大型项目交付
- 设计并实现了组件库，提升团队开发效率 30%

### 前端工程师 | XYZ公司 | 2019 - 2022

- 负责电商平台的前端开发和维护
- 优化页面加载速度，首屏时间从 3s 降低到 1.2s
- 参与 code review，推动团队代码规范落地

## 教育背景

### 计算机科学与技术 学士 | 某某大学 | 2015 - 2019

- GPA 3.8/4.0，连续三年获得奖学金

## 技能

- **前端：** React, TypeScript, Next.js, Vue, Tailwind CSS, Webpack
- **后端：** Node.js, Express, PostgreSQL
- **工具：** Git, Docker, CI/CD, Linux
- **语言：** 英语（流利）、普通话（母语）

## 开源项目

### [awesome-tool](https://github.com/zhangsan/awesome-tool)

- 一个提升开发效率的 CLI 工具，GitHub 500+ stars
- 使用 TypeScript 编写，发布到 npm
`;
```

- [ ] **Step 2: Commit**

```bash
git add src/data/default-resume.ts
git commit -m "feat: add default sample resume for first-time users"
```

---

### Task 4: Markdown Parsing Pipeline

**Files:**
- Create: `src/lib/markdown.ts`, `src/lib/markdown.test.ts`

- [ ] **Step 1: Write failing tests for markdown parsing**

Create `src/lib/markdown.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseResumeToHtml } from "./markdown";

describe("parseResumeToHtml", () => {
  it("adds resume-name class to h1", async () => {
    const html = await parseResumeToHtml("# John Doe");
    expect(html).toContain('class="resume-name"');
    expect(html).toContain("John Doe");
  });

  it("adds resume-contact class to blockquote", async () => {
    const html = await parseResumeToHtml("> email@test.com | 123");
    expect(html).toContain('class="resume-contact"');
    expect(html).toContain("email@test.com");
  });

  it("wraps h2 sections in resume-section divs", async () => {
    const md = `## Work Experience\n\n- Did stuff\n\n## Education\n\n- Studied`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-section"');
    expect(html).toContain('class="resume-section-title"');
    expect(html).toContain("Work Experience");
    expect(html).toContain("Education");
  });

  it("adds resume-entry-title class to h3", async () => {
    const md = `## Work\n\n### Engineer | Corp | 2020`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-entry-title"');
    expect(html).toContain("Engineer");
  });

  it("parses a full resume without errors", async () => {
    const md = `# Name\n\n> contact\n\n## Section\n\n### Entry\n\n- Detail`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-name"');
    expect(html).toContain('class="resume-contact"');
    expect(html).toContain('class="resume-section"');
    expect(html).toContain('class="resume-entry-title"');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/markdown.test.ts
```

Expected: FAIL — cannot find module `./markdown`.

- [ ] **Step 3: Implement markdown parsing pipeline**

Create `src/lib/markdown.ts`:

```ts
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import type { Root, Element, ElementContent } from "hast";

function rehypeResume() {
  return (tree: Root) => {
    const newChildren: ElementContent[] = [];
    let currentSection: ElementContent[] | null = null;

    for (const node of tree.children) {
      if (node.type !== "element") {
        if (currentSection) {
          currentSection.push(node as ElementContent);
        } else {
          newChildren.push(node as ElementContent);
        }
        continue;
      }

      const el = node as Element;

      if (el.tagName === "h1") {
        el.properties = { ...el.properties, className: "resume-name" };
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
          currentSection = null;
        }
        newChildren.push(el);
      } else if (el.tagName === "blockquote") {
        el.properties = { ...el.properties, className: "resume-contact" };
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
          currentSection = null;
        }
        newChildren.push(el);
      } else if (el.tagName === "h2") {
        if (currentSection) {
          newChildren.push(wrapSection(currentSection));
        }
        el.properties = { ...el.properties, className: "resume-section-title" };
        currentSection = [el];
      } else if (el.tagName === "h3") {
        el.properties = { ...el.properties, className: "resume-entry-title" };
        if (currentSection) {
          currentSection.push(el);
        } else {
          newChildren.push(el);
        }
      } else {
        if (currentSection) {
          currentSection.push(el);
        } else {
          newChildren.push(el);
        }
      }
    }

    if (currentSection) {
      newChildren.push(wrapSection(currentSection));
    }

    tree.children = newChildren;
  };
}

function wrapSection(children: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: "resume-section" },
    children,
  };
}

const htmlProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeResume)
  .use(rehypeStringify);

export async function parseResumeToHtml(markdown: string): Promise<string> {
  const file = await htmlProcessor.process(markdown);
  return String(file);
}
```

- [ ] **Step 4: Install rehype-stringify**

```bash
npm install rehype-stringify
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run src/lib/markdown.test.ts
```

Expected: all 5 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/markdown.ts src/lib/markdown.test.ts package.json package-lock.json
git commit -m "feat: add Markdown-to-HTML parsing pipeline with resume semantic classes"
```

---

### Task 5: useResume Hook

**Files:**
- Create: `src/hooks/useResume.ts`

- [ ] **Step 1: Implement the useResume hook**

Create `src/hooks/useResume.ts`:

```ts
import { useState, useEffect, useRef, useCallback } from "react";
import { loadContent, saveContent, loadTemplate, saveTemplate } from "../lib/storage";
import type { TemplateName } from "../lib/storage";
import { DEFAULT_RESUME } from "../data/default-resume";

export function useResume() {
  const [markdown, setMarkdown] = useState<string>(() => {
    return loadContent() ?? DEFAULT_RESUME;
  });

  const [template, setTemplate] = useState<TemplateName>(() => {
    return loadTemplate();
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveContent(markdown);
    }, 500);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [markdown]);

  const changeTemplate = useCallback((t: TemplateName) => {
    setTemplate(t);
    saveTemplate(t);
  }, []);

  return { markdown, setMarkdown, template, changeTemplate };
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors (or only pre-existing warnings from scaffolded files).

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useResume.ts
git commit -m "feat: add useResume hook with debounced localStorage persistence"
```

---

### Task 6: Preview Component + Classic Template

**Files:**
- Create: `src/components/Preview.tsx`, `src/templates/classic.css`

- [ ] **Step 1: Create Preview component**

Create `src/components/Preview.tsx`:

```tsx
import "../templates/classic.css";
import type { TemplateName } from "../lib/storage";

interface PreviewProps {
  html: string;
  template: TemplateName;
}

export function Preview({ html, template }: PreviewProps) {
  return (
    <div className="h-full overflow-auto bg-gray-100 p-8 flex justify-center">
      <div
        className={`template-${template} bg-white shadow-lg w-[210mm] min-h-[297mm] p-[20mm] text-sm leading-relaxed`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create classic template CSS**

Create `src/templates/classic.css`:

```css
.template-classic {
  font-family: Georgia, "Noto Serif SC", "Times New Roman", serif;
  color: #000;
}

.template-classic .resume-name {
  text-align: center;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  letter-spacing: 0.05em;
}

.template-classic .resume-contact {
  text-align: center;
  font-size: 0.85rem;
  color: #444;
  border: none;
  padding: 0;
  margin: 0 0 1.25rem 0;
}

.template-classic .resume-contact p {
  margin: 0;
}

.template-classic .resume-contact a {
  color: #444;
  text-decoration: underline;
}

.template-classic .resume-section {
  margin-bottom: 1rem;
}

.template-classic .resume-section-title {
  font-size: 1.1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1.5px solid #000;
  padding-bottom: 0.2rem;
  margin: 1rem 0 0.5rem 0;
}

.template-classic .resume-entry-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.6rem 0 0.2rem 0;
}

.template-classic ul {
  margin: 0.2rem 0 0.4rem 1.2rem;
  padding: 0;
}

.template-classic li {
  margin-bottom: 0.15rem;
}

.template-classic a {
  color: #000;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Preview.tsx src/templates/classic.css
git commit -m "feat: add Preview component and classic template CSS"
```

---

### Task 7: Modern Template CSS

**Files:**
- Create: `src/templates/modern.css`

- [ ] **Step 1: Add modern.css import to Preview component**

Add the import to `src/components/Preview.tsx` (after the existing classic.css import):

```tsx
import "../templates/modern.css";
```

- [ ] **Step 2: Create modern template CSS**

Create `src/templates/modern.css`:

```css
.template-modern {
  font-family: Inter, "Noto Sans SC", system-ui, sans-serif;
  color: #2d3748;
}

.template-modern .resume-name {
  text-align: left;
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: #1a202c;
}

.template-modern .resume-contact {
  text-align: left;
  font-size: 0.85rem;
  color: #718096;
  border: none;
  padding: 0;
  margin: 0 0 1.25rem 0;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e2e8f0;
}

.template-modern .resume-contact p {
  margin: 0;
}

.template-modern .resume-contact a {
  color: #3b82f6;
  text-decoration: none;
}

.template-modern .resume-contact a:hover {
  text-decoration: underline;
}

.template-modern .resume-section {
  margin-bottom: 1rem;
}

.template-modern .resume-section-title {
  font-size: 1rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #3b82f6;
  border-left: 3px solid #3b82f6;
  padding-left: 0.5rem;
  margin: 1rem 0 0.5rem 0;
}

.template-modern .resume-entry-title {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0.6rem 0 0.2rem 0;
  color: #1a202c;
}

.template-modern ul {
  margin: 0.2rem 0 0.4rem 1.2rem;
  padding: 0;
}

.template-modern li {
  margin-bottom: 0.15rem;
}

.template-modern a {
  color: #3b82f6;
  text-decoration: none;
}

.template-modern a:hover {
  text-decoration: underline;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/templates/modern.css src/components/Preview.tsx
git commit -m "feat: add modern template CSS with blue accent color"
```

---

### Task 8: Editor Component

**Files:**
- Create: `src/components/Editor.tsx`

- [ ] **Step 1: Create Editor component**

Create `src/components/Editor.tsx`:

```tsx
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function Editor({ value, onChange }: EditorProps) {
  return (
    <div className="h-full overflow-hidden flex flex-col">
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[markdown()]}
        height="100%"
        className="flex-1 overflow-auto"
        basicSetup={{
          lineNumbers: true,
          foldGutter: false,
          highlightActiveLine: true,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/Editor.tsx
git commit -m "feat: add CodeMirror Markdown editor component"
```

---

### Task 9: Export Logic

**Files:**
- Create: `src/lib/export.ts`, `src/lib/export.test.ts`

- [ ] **Step 1: Write failing tests for export**

Create `src/lib/export.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildStandaloneHtml } from "./export";

describe("buildStandaloneHtml", () => {
  it("wraps resume HTML in a standalone document", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic");
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<h1>Name</h1>");
    expect(result).toContain("template-classic");
    expect(result).toContain("<style>");
  });

  it("uses the correct template class", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern");
    expect(result).toContain("template-modern");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/export.test.ts
```

Expected: FAIL — cannot find module `./export`.

- [ ] **Step 3: Implement export logic**

Create `src/lib/export.ts`:

```ts
import type { TemplateName } from "./storage";
import classicCssUrl from "../templates/classic.css?inline";
import modernCssUrl from "../templates/modern.css?inline";

const cssMap: Record<TemplateName, string> = {
  classic: classicCssUrl,
  modern: modernCssUrl,
};

export function buildStandaloneHtml(
  resumeHtml: string,
  template: TemplateName
): string {
  const css = cssMap[template];
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
<style>${css}</style>
<style>
body { margin: 0; display: flex; justify-content: center; background: #f3f4f6; }
.resume { width: 210mm; min-height: 297mm; padding: 20mm; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
@media print { body { background: #fff; } .resume { box-shadow: none; padding: 15mm; width: 100%; } }
</style>
</head>
<body>
<div class="resume template-${template}">
${resumeHtml}
</div>
</body>
</html>`;
}

export function exportHtml(resumeHtml: string, template: TemplateName): void {
  const html = buildStandaloneHtml(resumeHtml, template);
  download(html, "resume.html", "text/html");
}

export function exportMarkdown(markdown: string): void {
  download(markdown, "resume.md", "text/markdown");
}

export function exportPdf(resumeHtml: string, template: TemplateName): void {
  const html = buildStandaloneHtml(resumeHtml, template);
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.addEventListener("load", () => {
    printWindow.print();
  });
}

function download(content: string, filename: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/export.test.ts
```

Expected: all 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/export.ts src/lib/export.test.ts
git commit -m "feat: add export logic for PDF, HTML, and Markdown download"
```

---

### Task 10: Toolbar Component

**Files:**
- Create: `src/components/Toolbar.tsx`

- [ ] **Step 1: Create Toolbar component**

Create `src/components/Toolbar.tsx`:

```tsx
import { useState, useRef, useEffect } from "react";
import { Download, ChevronDown } from "lucide-react";
import type { TemplateName } from "../lib/storage";

interface ToolbarProps {
  template: TemplateName;
  onTemplateChange: (t: TemplateName) => void;
  onExportPdf: () => void;
  onExportHtml: () => void;
  onExportMarkdown: () => void;
}

export function Toolbar({
  template,
  onTemplateChange,
  onExportPdf,
  onExportHtml,
  onExportMarkdown,
}: ToolbarProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 mr-1">模板</span>
        <button
          onClick={() => onTemplateChange("classic")}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            template === "classic"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          经典
        </button>
        <button
          onClick={() => onTemplateChange("modern")}
          className={`px-2.5 py-1 text-xs rounded transition-colors ${
            template === "modern"
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          现代
        </button>
      </div>

      <div className="ml-auto relative" ref={dropdownRef}>
        <button
          onClick={() => setExportOpen(!exportOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          <Download size={14} />
          导出
          <ChevronDown size={12} />
        </button>
        {exportOpen && (
          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded shadow-lg z-10">
            <button
              onClick={() => { onExportPdf(); setExportOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              PDF
            </button>
            <button
              onClick={() => { onExportHtml(); setExportOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              HTML
            </button>
            <button
              onClick={() => { onExportMarkdown(); setExportOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
            >
              Markdown
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Toolbar.tsx
git commit -m "feat: add Toolbar with template switcher and export dropdown"
```

---

### Task 11: Header Component

**Files:**
- Create: `src/components/Header.tsx`

- [ ] **Step 1: Create Header component**

Create `src/components/Header.tsx`:

```tsx
import { FileText } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2">
        <FileText size={20} className="text-blue-600" />
        <span className="font-semibold text-sm">Resume Maker</span>
      </div>
      <a
        href="https://github.com"
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        GitHub
      </a>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Header.tsx
git commit -m "feat: add Header component with logo and GitHub link"
```

---

### Task 12: ResumePage Layout with Draggable Splitter

**Files:**
- Create: `src/components/ResumePage.tsx`

- [ ] **Step 1: Create ResumePage component**

Create `src/components/ResumePage.tsx`:

```tsx
import { useState, useCallback, useRef, useEffect } from "react";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { Toolbar } from "./Toolbar";
import { useResume } from "../hooks/useResume";
import { parseResumeToHtml } from "../lib/markdown";
import { exportPdf, exportHtml, exportMarkdown } from "../lib/export";

export function ResumePage() {
  const { markdown, setMarkdown, template, changeTemplate } = useResume();
  const [splitPercent, setSplitPercent] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const htmlRef = useRef("");
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    parseResumeToHtml(markdown).then((result) => {
      if (!cancelled) {
        htmlRef.current = result;
        forceUpdate((n) => n + 1);
      }
    });
    return () => { cancelled = true; };
  }, [markdown]);

  const handleMouseDown = useCallback(() => {
    dragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(Math.max(percent, 20), 80));
    }
    function handleMouseUp() {
      dragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleExportPdf = useCallback(() => {
    exportPdf(htmlRef.current, template);
  }, [template]);

  const handleExportHtml = useCallback(() => {
    exportHtml(htmlRef.current, template);
  }, [template]);

  const handleExportMd = useCallback(() => {
    exportMarkdown(markdown);
  }, [markdown]);

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        template={template}
        onTemplateChange={changeTemplate}
        onExportPdf={handleExportPdf}
        onExportHtml={handleExportHtml}
        onExportMarkdown={handleExportMd}
      />
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div style={{ width: `${splitPercent}%` }} className="overflow-hidden">
          <Editor value={markdown} onChange={setMarkdown} />
        </div>
        <div
          onMouseDown={handleMouseDown}
          className="w-1.5 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0"
        />
        <div style={{ width: `${100 - splitPercent}%` }} className="overflow-hidden">
          <Preview html={htmlRef.current} template={template} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ResumePage.tsx
git commit -m "feat: add ResumePage layout with draggable splitter"
```

---

### Task 13: App Integration & Final Wiring

**Files:**
- Modify: `src/App.tsx`, `src/index.css`, `index.html`

- [ ] **Step 1: Update App.tsx**

Replace `src/App.tsx`:

```tsx
import { Header } from "./components/Header";
import { ResumePage } from "./components/ResumePage";

function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 overflow-hidden">
        <ResumePage />
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 2: Update index.html title**

Update the `<title>` in `index.html` to:

```html
<title>Resume Maker</title>
```

Add Google Fonts link in `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
```

- [ ] **Step 3: Ensure index.css has Tailwind import**

`src/index.css` should contain:

```css
@import "tailwindcss";

body {
  margin: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 4: Delete unused scaffolded files**

```bash
rm -f src/App.css src/assets/react.svg public/vite.svg
```

- [ ] **Step 5: Run dev server and verify**

```bash
npm run dev
```

Open browser. Expected:
- Header with "Resume Maker" at top
- Left panel: CodeMirror editor with default sample resume
- Right panel: rendered resume preview with classic template
- Draggable splitter between panels
- Template switcher toggles between classic/modern styles
- Export dropdown offers PDF/HTML/Markdown options

- [ ] **Step 6: Run all tests**

```bash
npx vitest run
```

Expected: all tests pass (storage: 5, markdown: 5, export: 2 — total 12).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: wire up App with Header, ResumePage, and complete integration"
```

---

### Task 14: Print Styles & Polish

**Files:**
- Modify: `src/templates/classic.css`, `src/templates/modern.css`

- [ ] **Step 1: Add print styles to classic template**

Append to `src/templates/classic.css`:

```css
@media print {
  .template-classic {
    padding: 0;
    box-shadow: none;
    width: 100%;
  }

  .template-classic .resume-name {
    font-size: 1.5rem;
  }

  .template-classic .resume-section-title {
    margin-top: 0.75rem;
  }
}
```

- [ ] **Step 2: Add print styles to modern template**

Append to `src/templates/modern.css`:

```css
@media print {
  .template-modern {
    padding: 0;
    box-shadow: none;
    width: 100%;
    color: #2d3748;
  }

  .template-modern .resume-name {
    font-size: 1.5rem;
  }

  .template-modern .resume-section-title {
    margin-top: 0.75rem;
    color: #3b82f6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .template-modern .resume-contact {
    border-bottom-color: #e2e8f0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

- [ ] **Step 3: Verify PDF export**

Run `npm run dev`, click Export → PDF. Confirm:
- New window opens with resume content
- Print dialog appears
- Preview shows correct layout on A4

- [ ] **Step 4: Run all tests one final time**

```bash
npx vitest run
```

Expected: all 12 tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add print styles for both templates"
```
