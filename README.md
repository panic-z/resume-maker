[中文](./README.zh-CN.md) | **English**

# Resume Maker

A browser-based resume editor that lets you write in Markdown and export pixel-perfect PDFs, HTML, or `.md` files. Fully client-side — no server, no sign-up, your data stays in `localStorage`.

## Features

- **Markdown Editor** — Write your resume in Markdown with live preview (powered by CodeMirror)
- **5 Templates** — Classic, Modern, Minimal, Professional, Creative — each with its own typography and accent color
- **Style Panel** — Adjust base font, font size, line height, page padding, and accent color with sliders and presets
- **Custom CSS Editor** — Switch to the CSS tab for full control; changes are scoped to the resume preview via `@scope`
- **Visual Editor** — Toggle visual mode, click any resume element, and tweak styles with a floating popover
- **Export** — Download as PDF (via browser print), standalone HTML, or raw Markdown
- **Persistence** — All content, template selection, style settings, and custom CSS are saved to `localStorage` with debounced writes and `beforeunload` flush

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Editor | CodeMirror 6 (`@uiw/react-codemirror`) |
| Markdown | unified / remark / rehype pipeline |
| Styling | Tailwind CSS 4 (app shell) + vanilla CSS (resume templates) |
| Testing | Vitest (unit) + Playwright (E2E) |

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run unit tests
npm test

# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Build for production
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── Header.tsx          # App header
│   ├── Toolbar.tsx         # Template switcher, style/CSS/visual toggles, export menu
│   ├── Editor.tsx          # Markdown CodeMirror editor
│   ├── CssEditor.tsx       # CSS CodeMirror editor
│   ├── Preview.tsx         # Live resume preview with edit-mode click detection
│   ├── ResumePage.tsx      # Main layout — editor, splitter, preview, popover
│   ├── StylePanel.tsx      # Global style controls (font, size, color, padding)
│   └── StylePopover.tsx    # Per-element visual style editor
├── hooks/
│   └── useResume.ts        # Central state — markdown, template, style, customCss
├── lib/
│   ├── markdown.ts         # Markdown → HTML pipeline with resume-aware rehype plugin
│   ├── storage.ts          # localStorage helpers with validation and error handling
│   ├── export.ts           # PDF / HTML / Markdown export
│   ├── css-utils.ts        # CSS rule generation, parsing, and merging
│   └── export.test.ts      # Unit tests for export
├── templates/
│   ├── classic.css
│   ├── modern.css
│   ├── minimal.css
│   ├── professional.css
│   └── creative.css
├── data/
│   └── default-resume.ts   # Default sample resume content
├── App.tsx
├── main.tsx
└── index.css
e2e/
└── resume-maker.spec.ts    # Playwright E2E tests
```

## License

MIT
