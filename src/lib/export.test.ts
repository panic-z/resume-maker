import { describe, it, expect } from "vitest";
import { buildStandaloneHtml } from "./export";
import { DEFAULT_STYLE } from "./storage";

describe("buildStandaloneHtml", () => {
  it("wraps resume HTML in a standalone document", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<h1>Name</h1>");
    expect(result).toContain("template-classic");
    expect(result).toContain("<style>");
  });

  it("uses the correct template class", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern", DEFAULT_STYLE);
    expect(result).toContain("template-modern");
  });

  it("inlines custom style variables", () => {
    const style = { ...DEFAULT_STYLE, fontSize: 16, accentColor: "#ef4444" };
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern", style);
    expect(result).toContain("--resume-font-size:16px");
    expect(result).toContain("--resume-accent:#ef4444");
  });
});
