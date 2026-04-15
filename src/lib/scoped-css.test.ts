import { describe, expect, it } from "vitest";
import { scopeCustomCss } from "./scoped-css";

describe("scopeCustomCss", () => {
  it("preserves nested at-rules while scoping inner selectors", () => {
    const result = scopeCustomCss("@media print { .resume-name { color: red; } }", ".resume");
    expect(result).toContain("@media print {");
    expect(result).toContain(".resume .resume-name {");
    expect(result.trim().endsWith("}")).toBe(true);
  });

  it("drops document-global at-rules from user CSS", () => {
    const result = scopeCustomCss(
      "@page { margin: 0; }\n@font-face { font-family: Evil; src: url(x); }\n@keyframes pulse { from { opacity: 0; } to { opacity: 1; } }\n.resume-name { color: red; }",
      ".resume",
    );
    expect(result).not.toContain("@page");
    expect(result).not.toContain("@font-face");
    expect(result).not.toContain("@keyframes");
    expect(result).toContain(".resume .resume-name {");
  });

  it("preserves braces inside quoted CSS values while scoping selectors", () => {
    const result = scopeCustomCss('.resume-name::after { content: "}"; color: red; }', ".resume");
    expect(result).toContain('.resume .resume-name::after {');
    expect(result).toContain('content: "}";');
    expect(result).toContain("color: red;");
    expect(result.trim().endsWith("}")).toBe(true);
  });
});
