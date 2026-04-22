import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
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

const PDF_WORKER_SRC = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

function ensurePdfWorker() {
  if (typeof window === "undefined") {
    return;
  }

  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
  }
}

function extractTextFromPdfItems(items: unknown[]): string {
  const lines: string[] = [];
  let currentLine: string[] = [];

  for (const item of items) {
    if (!item || typeof item !== "object" || !("str" in item) || typeof item.str !== "string") {
      continue;
    }

    const segment = item.str.trim();
    if (segment) {
      currentLine.push(segment);
    }

    if ("hasEOL" in item && item.hasEOL) {
      const line = currentLine.join(" ").trim();
      if (line) {
        lines.push(line);
      }
      currentLine = [];
    }
  }

  const trailingLine = currentLine.join(" ").trim();
  if (trailingLine) {
    lines.push(trailingLine);
  }

  return lines.join("\n");
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

export async function parseImportedPdf(file: File): Promise<string> {
  try {
    ensurePdfWorker();

    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data }).promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      pageTexts.push(extractTextFromPdfItems(textContent.items));
    }

    return convertPdfTextToMarkdown(pageTexts.join("\n\n"));
  } catch (error) {
    if (error instanceof ResumeImportError) {
      throw error;
    }

    throw new ResumeImportError("pdf-parse-failed");
  }
}
