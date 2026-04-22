import "@testing-library/jest-dom/vitest";
import { render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Preview } from "./Preview";
import { resumePaperBackgroundContract } from "../lib/export";
import { DEFAULT_STYLE } from "../lib/storage";
import { PAGE_HEIGHT_PX } from "./preview-layout";

function expectPreviewToUseSharedBackgroundContract(preview: HTMLElement | null) {
  expect(preview?.style.getPropertyValue("background-color")).toBe(resumePaperBackgroundContract.backgroundColor);
  expect(preview?.style.getPropertyValue("background-repeat")).toBe(resumePaperBackgroundContract.backgroundRepeat);
  expect(preview?.style.getPropertyValue("background-size")).toBe(resumePaperBackgroundContract.backgroundSize);
  expect(preview?.style.getPropertyValue("background-position")).toBe(resumePaperBackgroundContract.backgroundPosition);
}

function getRenderedPreview(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[id^="resume-preview-"]');
}

afterEach(() => {
  document.head.querySelector('[data-resume-custom]')?.remove();
  vi.restoreAllMocks();
});

describe("Preview custom CSS injection", () => {
  test("scopes selector rules without relying on CSS nesting syntax", () => {
    const { container } = render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{
          ...DEFAULT_STYLE,
        }}
        customCss=".resume-name { color: red; }"
        language="zh"
      />,
    );

    const preview = getRenderedPreview(container);
    expect(preview).not.toBeNull();
    const styleTag = document.head.querySelector('[data-resume-custom]');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain(`#${preview?.id} .resume-name {`);
    expect(styleTag?.textContent).toContain("color: red;");
    expect(styleTag?.textContent).not.toContain(`#${preview?.id} {\n.resume-name { color: red; }\n}`);
  });

  test("applies selected background css variables to the preview resume", () => {
    const { container } = render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{ ...DEFAULT_STYLE, backgroundPreset: "soft-arc" }}
        customCss=""
        language="zh"
      />,
    );

    const preview = getRenderedPreview(container);
    expectPreviewToUseSharedBackgroundContract(preview);
    expect(preview?.style.getPropertyValue("--resume-paper-overlay")).not.toBe("none");
    expect(preview?.style.getPropertyValue("--resume-paper-background")).toContain("linear-gradient");
  });

  test("binds preview background-image through the shared declarative contract", () => {
    expect(resumePaperBackgroundContract.backgroundImage).toBe(
      "var(--resume-paper-overlay), var(--resume-paper-background)",
    );
  });

  test("uses shared background output for custom image backgrounds in the preview", () => {
    const { container } = render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{
          ...DEFAULT_STYLE,
          backgroundMode: "custom-image",
          customImage: {
            mode: "custom-image",
            src: 'https://example.com/background "pattern".png?x=1&y=2',
            fit: "repeat",
          },
        }}
        customCss=""
        language="zh"
      />,
    );

    const preview = getRenderedPreview(container);
    expectPreviewToUseSharedBackgroundContract(preview);
    expect(preview?.style.getPropertyValue("--resume-paper-background")).toContain('https://example.com/background \\"pattern\\".png?x=1&y=2');
    expect(preview?.style.getPropertyValue("--resume-paper-background-repeat")).toBe("no-repeat, no-repeat, repeat");
    expect(preview?.style.getPropertyValue("--resume-paper-background-size")).toBe("auto, auto, auto");
  });

  test("uses shared background output for custom gradient backgrounds in the preview", () => {
    const { container } = render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{
          ...DEFAULT_STYLE,
          backgroundMode: "custom-gradient",
          customGradient: {
            mode: "custom-gradient",
            direction: "to-right",
            from: "#111827",
            to: "#f8fafc",
          },
        }}
        customCss=""
        language="zh"
      />,
    );

    const preview = getRenderedPreview(container);
    expectPreviewToUseSharedBackgroundContract(preview);
    expect(preview?.style.getPropertyValue("--resume-paper-overlay")).toBe("none, none");
    expect(preview?.style.getPropertyValue("--resume-paper-background")).toContain(
      "linear-gradient(90deg, #111827 0%, #f8fafc 100%)",
    );
    expect(preview?.style.getPropertyValue("--resume-paper-background-repeat")).toBe("no-repeat, no-repeat, no-repeat");
    expect(preview?.style.getPropertyValue("--resume-paper-background-size")).toBe("cover, cover, cover");
  });

  test("uses a distinct scope id for each preview instance", () => {
    const { container } = render(
      <>
        <Preview
          html="<h1 class='resume-name'>Name</h1>"
          template="classic"
          style={{ ...DEFAULT_STYLE }}
          customCss=".resume-name { color: red; }"
          language="zh"
        />
        <Preview
          html="<h1 class='resume-name'>Other</h1>"
          template="classic"
          style={{ ...DEFAULT_STYLE }}
          customCss=".resume-name { color: blue; }"
          language="zh"
        />
      </>,
    );

    const previews = container.querySelectorAll("[id]");
    expect(previews).toHaveLength(2);
    expect(previews[0]?.id).not.toBe(previews[1]?.id);

    const styleTags = document.head.querySelectorAll('[data-resume-custom]');
    expect(styleTags).toHaveLength(2);
    expect(styleTags[0]?.textContent).toContain(`#${previews[0]?.id}`);
    expect(styleTags[1]?.textContent).toContain(`#${previews[1]?.id}`);
  });

  test("renders dashed page markers when the preview content reaches additional A4 pages", () => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(PAGE_HEIGHT_PX * 2);

    const { container } = render(
      <Preview
        html="<h1 class='resume-name'>Name</h1>"
        template="classic"
        style={{ ...DEFAULT_STYLE }}
        customCss=""
        language="zh"
      />,
    );

    expect(container.querySelectorAll('[data-page-break-marker="true"]')).toHaveLength(2);
  });
});
