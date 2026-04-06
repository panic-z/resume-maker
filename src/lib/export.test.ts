import { describe, it, expect } from "vitest";
import { buildStandaloneHtml } from "./export";

describe("buildStandaloneHtml", () => {
  it("wraps resume HTML in a standalone document", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "classic");
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<h1>Name</h1>");
    expect(result).toContain("template-classic");
    expect(result).toContain("<style>");
  });

  it("uses the correct template class", () => {
    const result = buildStandaloneHtml("<h1>Name</h1>", "modern");
    expect(result).toContain("template-modern");
  });
});
