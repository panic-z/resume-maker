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
