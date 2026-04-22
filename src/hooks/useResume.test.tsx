import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useResume } from "./useResume";
import { DEFAULT_RESUMES } from "../data/default-resume";
import type { PersistedResumeProject } from "../lib/storage";

const IMPORTED_PROJECT: PersistedResumeProject = {
  markdown: "# Imported Resume",
  template: "modern",
  style: {
    fontSize: 16,
    lineHeight: 1.8,
    accentColor: "#3b82f6",
    fontFamily: "sans",
    pagePadding: 24,
    backgroundMode: "custom-gradient",
    backgroundPreset: "plain",
    customGradient: {
      mode: "custom-gradient",
      direction: "to-right",
      from: "#112233",
      to: "#445566",
    },
    customImage: null,
  },
  customCss: ".resume { color: red; }",
  language: "en",
};

function Probe({ language }: { language: "zh" | "en" }) {
  const {
    markdown,
    setMarkdown,
    template,
    style,
    customCss,
    setCustomCss,
    importMarkdown,
    importProject,
  } = useResume(language);

  return (
    <div>
      <pre data-testid="markdown">{markdown}</pre>
      <pre data-testid="template">{template}</pre>
      <pre data-testid="style">{JSON.stringify(style)}</pre>
      <pre data-testid="custom-css">{customCss}</pre>
      <button type="button" onClick={() => setMarkdown(DEFAULT_RESUMES.zh)}>
        set zh default
      </button>
      <button type="button" onClick={() => setCustomCss(".resume { color: blue; }")}>
        set custom css
      </button>
      <button type="button" onClick={() => importMarkdown("# Imported Markdown")}>
        import markdown
      </button>
      <button type="button" onClick={() => importProject(IMPORTED_PROJECT)}>
        import project
      </button>
    </div>
  );
}

describe("useResume language switching", () => {
  test("switches to the current language default when stored custom content is later reset to a default resume", () => {
    localStorage.clear();
    localStorage.setItem("resume-maker:content", "# Custom Resume");

    const { rerender } = render(<Probe language="zh" />);

    expect(screen.getByTestId("markdown")).toHaveTextContent("# Custom Resume");

    act(() => {
      screen.getByRole("button", { name: "set zh default" }).click();
    });

    expect(screen.getByTestId("markdown")).toHaveTextContent("张三");

    rerender(<Probe language="en" />);

    expect(screen.getByTestId("markdown")).toHaveTextContent("Alex Carter");
  });
});

describe("useResume template defaults", () => {
  test("applies stored template defaults when style settings are missing", () => {
    localStorage.clear();
    localStorage.setItem("resume-maker:template", "modern");

    render(<Probe language="zh" />);

    expect(screen.getByTestId("template")).toHaveTextContent("modern");
    expect(screen.getByTestId("style")).toHaveTextContent('"fontFamily":"sans"');
    expect(screen.getByTestId("style")).toHaveTextContent('"accentColor":"#3b82f6"');
  });
});

describe("useResume style storage", () => {
  test("restores a persisted background preset from style storage", () => {
    localStorage.clear();
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({ backgroundPreset: "editorial-bands", fontSize: 14, lineHeight: 1.6, pagePadding: 20 }),
    );

    render(<Probe language="zh" />);

    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundPreset":"editorial-bands"');
  });

  test("restores a persisted custom gradient background from style storage", () => {
    localStorage.clear();
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "custom-gradient",
        backgroundPreset: "plain",
        customGradient: {
          mode: "custom-gradient",
          direction: "to-right",
          from: "#112233",
          to: "#445566",
        },
        fontSize: 14,
        lineHeight: 1.6,
        pagePadding: 20,
      }),
    );

    render(<Probe language="zh" />);

    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundMode":"custom-gradient"');
    expect(screen.getByTestId("style")).toHaveTextContent('"customGradient":{"mode":"custom-gradient","direction":"to-right","from":"#112233","to":"#445566"}');
  });

  test("restores a persisted custom image background from style storage", () => {
    localStorage.clear();
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        backgroundMode: "custom-image",
        backgroundPreset: "corner-frame",
        customImage: {
          mode: "custom-image",
          src: "data:image/png;base64,abc123",
          fit: "contain",
        },
        fontSize: 14,
        lineHeight: 1.6,
        pagePadding: 20,
      }),
    );

    render(<Probe language="zh" />);

    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundMode":"custom-image"');
    expect(screen.getByTestId("style")).toHaveTextContent('"customImage":{"mode":"custom-image","src":"data:image/png;base64,abc123","fit":"contain"}');
  });
});

describe("useResume imports", () => {
  test("imports markdown without changing the current template or style", () => {
    localStorage.clear();
    localStorage.setItem("resume-maker:template", "professional");
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        fontSize: 17,
        lineHeight: 1.9,
        accentColor: "#aa5500",
        fontFamily: "system",
        pagePadding: 26,
        backgroundMode: "preset",
        backgroundPreset: "editorial-bands",
      }),
    );

    render(<Probe language="zh" />);

    expect(screen.getByTestId("template")).toHaveTextContent("professional");
    expect(screen.getByTestId("style")).toHaveTextContent('"fontSize":17');
    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundPreset":"editorial-bands"');

    act(() => {
      screen.getByRole("button", { name: "import markdown" }).click();
    });

    expect(screen.getByTestId("markdown")).toHaveTextContent("# Imported Markdown");
    expect(screen.getByTestId("template")).toHaveTextContent("professional");
    expect(screen.getByTestId("style")).toHaveTextContent('"fontSize":17');
    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundPreset":"editorial-bands"');
  });

  test("imports a full project snapshot atomically", () => {
    localStorage.clear();
    localStorage.setItem("resume-maker:template", "professional");
    localStorage.setItem("resume-maker:content", "# Existing Resume");
    localStorage.setItem(
      "resume-maker:style",
      JSON.stringify({
        fontSize: 12,
        lineHeight: 1.4,
        accentColor: "#aa5500",
        fontFamily: "serif",
        pagePadding: 18,
        backgroundMode: "preset",
        backgroundPreset: "plain",
      }),
    );

    render(<Probe language="zh" />);

    act(() => {
      screen.getByRole("button", { name: "set custom css" }).click();
      screen.getByRole("button", { name: "import project" }).click();
    });

    expect(screen.getByTestId("markdown")).toHaveTextContent("# Imported Resume");
    expect(screen.getByTestId("template")).toHaveTextContent("modern");
    expect(screen.getByTestId("style")).toHaveTextContent('"fontSize":16');
    expect(screen.getByTestId("style")).toHaveTextContent('"backgroundMode":"custom-gradient"');
    expect(screen.getByTestId("style")).toHaveTextContent('"customGradient":{"mode":"custom-gradient","direction":"to-right","from":"#112233","to":"#445566"}');
    expect(screen.getByTestId("custom-css")).toHaveTextContent(".resume { color: red; }");
  });
});
