import { describe, expect, test } from "vitest";
import { getExistingProperties, mergeCustomCss, removeCustomCssRule } from "./css-utils";

describe("removeCustomCssRule", () => {
  test("removes the matching selector block", () => {
    const css = ".resume-name {\n  color: #ff0000;\n}\n\n.resume-section {\n  margin-top: 1em;\n}";

    expect(removeCustomCssRule(css, ".resume-name")).toBe(".resume-section {\n  margin-top: 1em;\n}");
  });
});

describe("mergeCustomCss", () => {
  test("preserves unrelated at-rules when updating a selector", () => {
    const css = "@media print {\n  .resume-name {\n    color: red;\n  }\n}\n\n.resume-contact {\n  color: blue;\n}";

    expect(mergeCustomCss(css, ".resume-contact", { color: "green" })).toBe(
      "@media print {\n  .resume-name {\n    color: red;\n  }\n}\n\n.resume-contact {\n  color: green;\n}",
    );
  });

  test("merges duplicate selector blocks into a single updated rule", () => {
    const css = ".resume-name {\n  color: red;\n}\n\n.resume-name {\n  font-size: 18px;\n}";

    expect(mergeCustomCss(css, ".resume-name", { "font-weight": "700" })).toBe(
      '.resume-name {\n  color: red;\n  font-size: 18px;\n  font-weight: 700;\n}',
    );
  });

  test("preserves cascade order relative to intervening rules when deduplicating selectors", () => {
    const css = ".resume-name {\n  color: red;\n}\n\nh1 {\n  color: blue;\n}\n\n.resume-name {\n  font-size: 18px;\n}";

    expect(mergeCustomCss(css, ".resume-name", { "font-weight": "700" })).toBe(
      'h1 {\n  color: blue;\n}\n\n.resume-name {\n  color: red;\n  font-size: 18px;\n  font-weight: 700;\n}',
    );
  });
});

describe("getExistingProperties", () => {
  test("reads only top-level selector declarations and ignores nested at-rules", () => {
    const css = "@media print {\n  .resume-name {\n    color: red;\n  }\n}\n\n.resume-contact {\n  color: blue;\n  margin-top: 1em;\n}";

    expect(getExistingProperties(css, ".resume-contact")).toEqual({
      color: "blue",
      "margin-top": "1em",
    });
  });

  test("preserves semicolons inside quoted declaration values", () => {
    const css = '.resume-name {\n  content: "A;B";\n  color: red;\n}';

    expect(getExistingProperties(css, ".resume-name")).toEqual({
      content: '"A;B"',
      color: "red",
    });
  });

  test("ignores CSS comments when reading declarations", () => {
    const css = ".resume-name {\n  /* keep this readable */\n  color: red;\n  margin-top: 1em;\n}";

    expect(getExistingProperties(css, ".resume-name")).toEqual({
      color: "red",
      "margin-top": "1em",
    });
  });
});

describe("mergeCustomCss with quoted values", () => {
  test("keeps quoted declaration values intact when merging another property", () => {
    const css = '.resume-name {\n  content: "A;B";\n}';

    expect(mergeCustomCss(css, ".resume-name", { content: '"A;B"', color: "red" })).toBe(
      '.resume-name {\n  content: "A;B";\n  color: red;\n}',
    );
  });

  test("preserves braces inside quoted values when merging another property", () => {
    const css = '.resume-name::after {\n  content: "}";\n}';

    expect(mergeCustomCss(css, ".resume-name::after", { content: '"}"', color: "red" })).toBe(
      '.resume-name::after {\n  content: "}";\n  color: red;\n}',
    );
  });

  test("preserves declarations that follow braces inside quoted values", () => {
    const css = '.resume-name::after {\n  content: "}";\n  color: red;\n}';

    expect(getExistingProperties(css, ".resume-name::after")).toEqual({
      content: '"}"',
      color: "red",
    });
  });
});
