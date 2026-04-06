import type { TemplateName } from "./storage";
import classicCss from "../templates/classic.css?inline";
import modernCss from "../templates/modern.css?inline";

const cssMap: Record<TemplateName, string> = {
  classic: classicCss,
  modern: modernCss,
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
