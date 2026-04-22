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
