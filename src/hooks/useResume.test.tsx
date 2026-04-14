import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { useResume } from "./useResume";
import { DEFAULT_RESUMES } from "../data/default-resume";

function Probe({ language }: { language: "zh" | "en" }) {
  const { markdown, setMarkdown } = useResume(language);

  return (
    <div>
      <pre data-testid="markdown">{markdown}</pre>
      <button type="button" onClick={() => setMarkdown(DEFAULT_RESUMES.zh)}>
        set zh default
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
