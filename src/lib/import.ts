import type { Language } from "./i18n";
import {
  normalizeImportedProject,
  type PersistedResumeProject,
  type StyleSettings,
  type TemplateName,
} from "./storage";

export interface ImportedProjectState {
  markdown: string;
  template: TemplateName;
  style: StyleSettings;
  customCss: string;
  language: Language;
}

export type ImportErrorCode =
  | "unsupported-type"
  | "read-failed"
  | "invalid-json"
  | "invalid-project"
  | "pdf-parse-failed"
  | "pdf-empty";

export class ResumeImportError extends Error {
  code: ImportErrorCode;

  constructor(code: ImportErrorCode, message = code) {
    super(message);
    this.name = "ResumeImportError";
    this.code = code;
  }
}

export async function parseImportedMarkdown(markdown: string): Promise<string> {
  return markdown.replace(/\r\n?/g, "\n");
}

export async function parseImportedProjectJson(raw: string): Promise<PersistedResumeProject> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ResumeImportError("invalid-json");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ResumeImportError("invalid-project");
  }

  try {
    return normalizeImportedProject(parsed as Record<string, unknown>);
  } catch {
    throw new ResumeImportError("invalid-project");
  }
}

export function convertPdfTextToMarkdown(text: string): string {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    throw new ResumeImportError("pdf-empty");
  }

  const blocks = normalized
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (blocks.length === 0) {
    throw new ResumeImportError("pdf-empty");
  }

  return blocks
    .map((block, index) => {
      const lines = block
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length === 0) {
        return "";
      }

      if (index === 0) {
        const [firstLine, ...rest] = lines;
        return [`# ${firstLine}`, ...rest].join("\n\n");
      }

      if (lines.length >= 2 && /^[A-Z][\w &/+-]*$/.test(lines[0])) {
        const [heading, ...rest] = lines;
        return [`## ${heading}`, ...rest].join("\n\n");
      }

      return lines.join("\n\n");
    })
    .filter(Boolean)
    .join("\n\n");
}
