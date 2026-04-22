import { describe, expect, it } from "vitest";
import {
  parseImportedMarkdown,
  parseImportedProjectJson,
  convertPdfTextToMarkdown,
} from "./import";

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
