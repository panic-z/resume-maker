import type { TemplateName, StyleSettings } from "./storage";
import { styleToCssVars } from "./storage";
import type { Language } from "./i18n";
import { messages } from "./i18n";
import classicCss from "../templates/classic.css?inline";
import modernCss from "../templates/modern.css?inline";
import minimalCss from "../templates/minimal.css?inline";
import professionalCss from "../templates/professional.css?inline";
import creativeCss from "../templates/creative.css?inline";

const cssMap: Record<TemplateName, string> = {
  classic: classicCss,
  modern: modernCss,
  minimal: minimalCss,
  professional: professionalCss,
  creative: creativeCss,
};

function buildInlineVars(style: StyleSettings): string {
  const vars = styleToCssVars(style);
  return Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
}

export function buildStandaloneHtml(
  resumeHtml: string,
  template: TemplateName,
  style: StyleSettings,
  customCss = "",
): string {
  const css = cssMap[template];
  const inlineVars = buildInlineVars(style);
  const customBlock = customCss.trim()
    ? `<style>.resume {\n${customCss}\n}</style>`
    : "";
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Resume</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Noto+Sans+SC:wght@400;600;700&family=Noto+Serif+SC:wght@400;700&display=swap" rel="stylesheet">
<style>${css}</style>
${customBlock}
<style>
body { margin: 0; display: flex; justify-content: center; background: #f3f4f6; }
.resume { width: 210mm; min-height: 297mm; padding: ${style.pagePadding}mm; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
@media print { body { background: #fff; } .resume { box-shadow: none; padding: ${Math.max(style.pagePadding - 5, 10)}mm; width: 100%; } }
</style>
</head>
<body>
<div class="resume template-${template}" style="${inlineVars}">
${resumeHtml}
</div>
</body>
</html>`;
}

export function exportHtml(resumeHtml: string, template: TemplateName, style: StyleSettings, customCss = ""): void {
  const html = buildStandaloneHtml(resumeHtml, template, style, customCss);
  download(html, "resume.html", "text/html");
}

export function exportMarkdown(markdown: string): void {
  download(markdown, "resume.md", "text/markdown");
}

export function exportPdf(
  resumeHtml: string,
  template: TemplateName,
  style: StyleSettings,
  customCss = "",
  language: Language = "zh",
): void {
  const html = buildStandaloneHtml(resumeHtml, template, style, customCss);
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert(messages[language].export.popupBlocked);
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();
  const triggerPrint = () => printWindow.print();
  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 0);
  } else {
    printWindow.addEventListener("load", triggerPrint);
  }
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
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
