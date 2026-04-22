import type { Language } from "./i18n";
import type { StyleSettings, TemplateName } from "./storage";

export interface ImportedProjectState {
  markdown: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
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
