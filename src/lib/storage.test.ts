import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadContent, saveContent, loadTemplate, saveTemplate, loadLanguage } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

function mockNavigatorLanguage(language: string, languages = [language]) {
  vi.stubGlobal("navigator", {
    language,
    languages,
  });
}

describe("loadContent", () => {
  it("returns null when nothing is stored", () => {
    expect(loadContent()).toBeNull();
  });

  it("returns stored content", () => {
    localStorage.setItem("resume-maker:content", "# Hello");
    expect(loadContent()).toBe("# Hello");
  });
});

describe("saveContent", () => {
  it("saves content to localStorage", () => {
    saveContent("# Test");
    expect(localStorage.getItem("resume-maker:content")).toBe("# Test");
  });
});

describe("loadTemplate", () => {
  it("returns 'classic' when nothing is stored", () => {
    expect(loadTemplate()).toBe("classic");
  });

  it("returns stored template", () => {
    localStorage.setItem("resume-maker:template", "modern");
    expect(loadTemplate()).toBe("modern");
  });
});

describe("saveTemplate", () => {
  it("saves template to localStorage", () => {
    saveTemplate("modern");
    expect(localStorage.getItem("resume-maker:template")).toBe("modern");
  });
});

describe("loadLanguage", () => {
  it("returns stored language when present", () => {
    localStorage.setItem("resume-maker:language", "zh");
    mockNavigatorLanguage("en-US");
    expect(loadLanguage()).toBe("zh");
  });

  it("falls back to browser english by default", () => {
    mockNavigatorLanguage("en-US");
    expect(loadLanguage()).toBe("en");
  });

  it("falls back to chinese when browser language is chinese", () => {
    mockNavigatorLanguage("zh-CN");
    expect(loadLanguage()).toBe("zh");
  });
});
