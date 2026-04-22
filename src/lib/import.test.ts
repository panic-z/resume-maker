import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseImportedMarkdown,
  parseImportedProjectJson,
  convertPdfTextToMarkdown,
  parseImportedPdf,
} from "./import";

const { getDocumentMock } = vi.hoisted(() => ({
  getDocumentMock: vi.fn(),
}));

vi.mock("pdfjs-dist", () => ({
  getDocument: getDocumentMock,
  GlobalWorkerOptions: {
    workerSrc: "",
  },
}));

beforeEach(() => {
  getDocumentMock.mockReset();
});

describe("parseImportedMarkdown", () => {
  it("returns UTF-8 markdown text unchanged except for normalizing line endings", async () => {
    await expect(parseImportedMarkdown("# Name\r\n\r\n- item\r\n")).resolves.toBe("# Name\n\n- item\n");
  });
});

describe("parseImportedProjectJson", () => {
  it("restores a valid project snapshot", async () => {
    const result = await parseImportedProjectJson(
      JSON.stringify({
        markdown: "# Name",
        template: "modern",
        style: { fontSize: 14, lineHeight: 1.6, accentColor: "#3b82f6", fontFamily: "sans", pagePadding: 20, backgroundMode: "preset", backgroundPreset: "plain", customGradient: null, customImage: null },
        customCss: ".resume-name { color: red; }",
        language: "en",
      }),
    );

    expect(result).toMatchObject({
      markdown: "# Name",
      template: "modern",
      customCss: ".resume-name { color: red; }",
      language: "en",
      style: {
        fontSize: 14,
        backgroundPreset: "plain",
      },
    });
  });

  it("throws invalid-project when the snapshot cannot be normalized", async () => {
    await expect(parseImportedProjectJson("{\"template\":\"mystery\"}")).rejects.toMatchObject({ code: "invalid-project" });
  });
});

describe("convertPdfTextToMarkdown", () => {
  it("turns extracted PDF text into editable markdown paragraphs", () => {
    expect(convertPdfTextToMarkdown("Name\nEmail\n\nExperience\nBuilt things")).toBe("# Name\n\nEmail\n\n## Experience\n\nBuilt things");
  });

  it("throws pdf-empty when extraction is blank", () => {
    try {
      convertPdfTextToMarkdown("   \n\n");
      throw new Error("expected pdf-empty");
    } catch (error) {
      expect(error).toMatchObject({ code: "pdf-empty" });
    }
  });
});

describe("parseImportedPdf", () => {
  it("extracts PDF text with pdf.js and converts it to markdown", async () => {
    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        getPage: vi
          .fn()
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: "Jane Doe", hasEOL: true },
                { str: "jane@example.com", hasEOL: true },
              ],
            }),
          })
          .mockResolvedValueOnce({
            getTextContent: vi.fn().mockResolvedValue({
              items: [
                { str: "Experience", hasEOL: true },
                { str: "Built things", hasEOL: true },
              ],
            }),
          }),
      }),
    });

    const file = new File([new Uint8Array([1, 2, 3])], "resume.pdf", { type: "application/pdf" });

    await expect(parseImportedPdf(file)).resolves.toBe("# Jane Doe\n\njane@example.com\n\n## Experience\n\nBuilt things");
    expect(getDocumentMock).toHaveBeenCalledTimes(1);
  });

  it("preserves pdf-empty when extracted text is blank", async () => {
    getDocumentMock.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getTextContent: vi.fn().mockResolvedValue({
            items: [{ str: "   ", hasEOL: true }],
          }),
        }),
      }),
    });

    const file = new File([new Uint8Array([4, 5, 6])], "empty.pdf", { type: "application/pdf" });

    await expect(parseImportedPdf(file)).rejects.toMatchObject({ code: "pdf-empty" });
  });

  it("maps unexpected pdf.js failures to pdf-parse-failed", async () => {
    getDocumentMock.mockImplementation(() => {
      throw new Error("boom");
    });

    const file = new File([new Uint8Array([7, 8, 9])], "broken.pdf", { type: "application/pdf" });

    await expect(parseImportedPdf(file)).rejects.toMatchObject({ code: "pdf-parse-failed" });
  });
});
