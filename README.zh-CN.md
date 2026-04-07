**中文** | [English](./README.md)

# Resume Maker

一款运行在浏览器中的简历编辑器——用 Markdown 撰写简历，实时预览，一键导出 PDF、HTML 或 `.md` 文件。纯前端，无需服务器、无需注册，数据保存在本地 `localStorage` 中。

## 功能特性

- **Markdown 编辑器** — 使用 Markdown 编写简历，实时预览（基于 CodeMirror）
- **5 套模板** — 经典、现代、简约、商务、创意，各有独特的排版风格和主题色
- **样式面板** — 通过滑块和预设色调节基础字体、字号、行距、页边距和主题色
- **自定义 CSS 编辑器** — 切换到 CSS 标签页，直接编写 CSS 精调样式；通过 `@scope` 自动隔离，不影响应用 UI
- **可视化编辑器** — 开启可视化模式，点击简历中的任意元素，弹出浮动面板直接调整样式
- **导出** — 支持导出 PDF（浏览器打印）、独立 HTML 文件、原始 Markdown
- **自动持久化** — 所有内容、模板选择、样式设置、自定义 CSS 均自动保存到 `localStorage`，采用防抖写入 + `beforeunload` 兜底刷新

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 编辑器 | CodeMirror 6（`@uiw/react-codemirror`）|
| Markdown | unified / remark / rehype 处理管线 |
| 样式 | Tailwind CSS 4（应用外壳）+ 原生 CSS（简历模板）|
| 测试 | Vitest（单元测试）+ Playwright（端到端测试）|

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行单元测试
npm test

# 运行端到端测试（自动启动开发服务器）
npm run test:e2e

# 生产构建
npm run build
```

## 项目结构

```
src/
├── components/
│   ├── Header.tsx          # 顶部栏
│   ├── Toolbar.tsx         # 模板切换、样式/CSS/可视化开关、导出菜单
│   ├── Editor.tsx          # Markdown CodeMirror 编辑器
│   ├── CssEditor.tsx       # CSS CodeMirror 编辑器
│   ├── Preview.tsx         # 简历实时预览，支持编辑模式点击检测
│   ├── ResumePage.tsx      # 主布局——编辑器、分隔线、预览、弹出面板
│   ├── StylePanel.tsx      # 全局样式控件（字体、字号、颜色、边距）
│   └── StylePopover.tsx    # 单元素可视化样式编辑器
├── hooks/
│   └── useResume.ts        # 核心状态——markdown、模板、样式、自定义 CSS
├── lib/
│   ├── markdown.ts         # Markdown → HTML 管线，含简历语义化 rehype 插件
│   ├── storage.ts          # localStorage 工具函数，带校验和错误处理
│   ├── export.ts           # PDF / HTML / Markdown 导出
│   ├── css-utils.ts        # CSS 规则生成、解析与合并
│   └── export.test.ts      # 导出功能单元测试
├── templates/
│   ├── classic.css
│   ├── modern.css
│   ├── minimal.css
│   ├── professional.css
│   └── creative.css
├── data/
│   └── default-resume.ts   # 默认示例简历内容
├── App.tsx
├── main.tsx
└── index.css
e2e/
└── resume-maker.spec.ts    # Playwright 端到端测试
```

## 许可证

MIT
