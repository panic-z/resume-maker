import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import { Preview } from "./Preview";

afterEach(() => {
  document.head.querySelector('[data-resume-custom]')?.remove();
});

describe("Preview custom CSS injection", () => {
  test("scopes selector rules without relying on CSS nesting syntax", () => {
    render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
        }}
        customCss=".resume-name { color: red; }"
        language="zh"
      />,
    );

    const styleTag = document.head.querySelector('[data-resume-custom]');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain("#resume-preview .resume-name {");
    expect(styleTag?.textContent).toContain("color: red;");
    expect(styleTag?.textContent).not.toContain("#resume-preview {\n.resume-name { color: red; }\n}");
  });
});
