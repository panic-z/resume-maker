import { describe, it, expect, beforeEach } from "vitest";
import { loadContent, saveContent, loadTemplate, saveTemplate } from "./storage";

beforeEach(() => {
  localStorage.clear();
});

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
