import { describe, expect, test } from "vitest";
import { removeCustomCssRule } from "./css-utils";

describe("removeCustomCssRule", () => {
  test("removes the matching selector block", () => {
    const css = ".resume-name {\n  color: #ff0000;\n}\n\n.resume-section {\n  margin-top: 1em;\n}";

    expect(removeCustomCssRule(css, ".resume-name")).toBe(".resume-section {\n  margin-top: 1em;\n}");
  });
});
