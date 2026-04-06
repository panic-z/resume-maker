# Resume Maker — 设计文档

在线简历编辑网站：用户通过 Markdown 编写简历内容，实时预览渲染效果，支持导出 PDF / HTML / Markdown。

## 目标用户

求职者个人使用。自己编辑简历、预览效果、导出文件，无需注册登录。

## 技术方案

Vite + React + TypeScript 单页应用，纯前端，无后端依赖。数据存储在浏览器 localStorage。PDF 生成使用 `window.print()` + `@media print` CSS。

## 1. 整体架构与页面结构

单页应用，核心页面为编辑器页面，左右分栏布局：

- **左栏（编辑区）：** CodeMirror Markdown 编辑器，顶部工具栏包含模板切换和导出按钮。
- **右栏（预览区）：** 实时渲染的简历预览，模拟 A4 纸张比例，白色背景 + 阴影。
- **分栏可拖拽调整宽度**，默认 50/50。

页面顶部有简洁的 header，包含网站名称和少量全局操作。

### 技术选型

- **框架：** Vite + React + TypeScript
- **页面样式：** Tailwind CSS
- **简历模板样式：** 独立 CSS 文件（精确控制 + 兼容 `@media print`）
- **Markdown 编辑器：** `@uiw/react-codemirror` + `@codemirror/lang-markdown`

## 2. Markdown 结构约定与解析

用户使用标准 Markdown 编写简历，通过层级约定映射为简历区块：

### 约定规则

- `# 标题` (h1) — 姓名
- `> 引用块` — 联系信息（邮箱、电话、链接等，用 `|` 分隔）
- `## 二级标题` (h2) — 简历分区标题（工作经历、教育背景、技能等）
- `### 三级标题` (h3) — 分区内条目标题（职位 | 公司 | 时间）
- 分区内用标准 Markdown 自由书写：列表、粗体、斜体、链接等

### 示例 Markdown

```markdown
# 张三

> zhangsan@email.com | 138-0000-0000 | [GitHub](https://github.com/zhangsan) | 上海

## 工作经历

### 高级前端工程师 | ABC科技 | 2022 - 至今

- 主导了公司核心产品的前端架构重构，性能提升 40%
- 带领 5 人前端团队完成 3 个大型项目交付

### 前端工程师 | XYZ公司 | 2019 - 2022

- 负责电商平台的前端开发和维护

## 教育背景

### 计算机科学学士 | 某某大学 | 2015 - 2019

## 技能

- **前端：** React, TypeScript, Next.js, Tailwind CSS
- **工具：** Git, Docker, CI/CD
```

### 解析管线

使用 `unified` 生态处理 Markdown：

1. `remark-parse` — 将 Markdown 解析为 MDAST
2. `remark-rehype` — 转为 HAST（HTML AST）
3. 自定义 `rehype` 插件 — 根据层级约定为 HTML 元素添加语义化 CSS 类名（`.resume-name`, `.resume-contact`, `.resume-section` 等）
4. `rehype-react` — 渲染为 React 组件

这样用户写的是纯 Markdown，零学习成本，结构语义在 AST 层处理。

## 3. 简历模板系统

提供 2 种模板，一键切换，预览即时更新。

### 模板 A — "经典"（默认）

- 单栏布局，从上到下排列
- 姓名居中加粗，联系信息居中一行
- 分区标题带底部分隔线
- 字体：衬线体（`Georgia`, `Noto Serif SC`）
- 配色：纯黑白

### 模板 B — "现代简约"

- 单栏布局，姓名左对齐，联系信息在姓名右侧或下方
- 分区标题用左侧竖线装饰
- 字体：无衬线体（`Inter`, `Noto Sans SC`）
- 配色：深蓝灰（`#2d3748`）主色 + 蓝色强调色（`#3b82f6`）

### 实现方式

- 每个模板是一个独立 CSS 文件（`classic.css`, `modern.css`）
- 选择器基于 rehype 插件生成的语义化类名
- 切换模板 = 切换 CSS 文件，HTML 结构不变
- 每个模板 CSS 同时包含屏幕样式和 `@media print` 样式

### 交互

工具栏上的模板选择器（两个缩略图按钮），点击即时切换。

## 4. 导出功能

工具栏上"导出"下拉按钮，展开三个选项。

### PDF 导出

- 点击后打开新窗口或隐藏 iframe，只包含简历 HTML + 模板 CSS
- 触发 `window.print()`，用户在打印对话框中选择"另存为 PDF"
- `@media print` 中设定 A4 纸张尺寸、边距，隐藏非简历内容
- 文字可选中/搜索，文件体积小

### HTML 导出

- 将简历 HTML + 模板 CSS 打包为自包含的 `.html` 文件
- CSS 内联到 `<style>` 标签，字体用 Google Fonts CDN
- 使用 `Blob` + `URL.createObjectURL` + `<a download>` 触发下载

### Markdown 导出

- 将编辑器 Markdown 源文本保存为 `.md` 文件下载
- 同样使用 `Blob` 下载方式

## 5. 数据持久化与状态管理

### 状态管理

使用 `useState` + `useContext`，不引入额外状态库。核心状态：

- `markdownContent: string` — Markdown 内容
- `selectedTemplate: 'classic' | 'modern'` — 当前模板

### localStorage 持久化

- Markdown 内容每次编辑后自动保存（防抖 500ms）
- 模板选择也保存
- Key 命名：`resume-maker:content`, `resume-maker:template`
- 页面加载时从 localStorage 恢复；首次访问加载默认示例简历

### 默认示例简历

首次访问预填一份完整中文示例简历（即第 2 节中的示例），用户一打开即可看到效果，直接修改。

## 6. 项目结构

```
resume-maker/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # 顶部导航栏
│   │   ├── Editor.tsx            # CodeMirror Markdown 编辑器
│   │   ├── Preview.tsx           # 简历实时预览
│   │   ├── Toolbar.tsx           # 工具栏（模板切换、导出）
│   │   └── ResumePage.tsx        # 编辑器页面主布局（左右分栏）
│   ├── templates/
│   │   ├── classic.css           # 经典模板样式
│   │   └── modern.css            # 现代模板样式
│   ├── lib/
│   │   ├── markdown.ts           # unified/remark/rehype 解析管线
│   │   ├── export.ts             # 导出逻辑（PDF/HTML/Markdown）
│   │   └── storage.ts            # localStorage 读写封装
│   ├── hooks/
│   │   └── useResume.ts          # 简历状态管理 hook
│   ├── data/
│   │   └── default-resume.md     # 默认示例简历
│   ├── App.tsx
│   ├── App.css
│   ├── index.css                 # Tailwind 入口 + 全局样式
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

## 7. 关键依赖

| 包名 | 用途 |
|------|------|
| `react`, `react-dom` | UI 框架 |
| `@uiw/react-codemirror`, `@codemirror/lang-markdown` | Markdown 编辑器 |
| `unified`, `remark-parse`, `remark-rehype`, `rehype-react` | Markdown 解析管线 |
| `tailwindcss`, `postcss`, `autoprefixer` | 页面布局样式 |
| `lucide-react` | 图标库 |

无后端依赖，无路由库，无状态管理库。
