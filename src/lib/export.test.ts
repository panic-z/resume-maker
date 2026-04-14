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

  it("uses the requested document language in standalone exports", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE, "", "en");
    expect(result).toContain('<html lang="en">');
  });

  it("escapes inline style attribute values so exported HTML stays valid", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE);
    expect(result).toContain("&quot;Noto Serif SC&quot;");
    expect(result).not.toContain('style="--resume-font-size:14px;--resume-line-height:1.6;--resume-accent:#000000;--resume-font-family:Georgia, "Noto Serif SC"');
  });

  it("scopes custom CSS with standard selectors instead of CSS nesting", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic", DEFAULT_STYLE, ".resume-name { color: red; }");
    expect(result).toContain(".resume .resume-name {");
    expect(result).toContain("color: red;");
    expect(result).not.toContain(".resume {\n.resume-name { color: red; }\n}");
  });
});
