import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { ResumePage } from "./ResumePage";

const changeTemplateSpy = vi.fn();
const changeStyleSpy = vi.fn();
const resetStyleSpy = vi.fn();
const setCustomCssSpy = vi.fn();

vi.mock("../hooks/useResume", () => ({
  useResume: () => ({
    markdown: "# Test User",
    setMarkdown: vi.fn(),
    template: "classic",
    changeTemplate: changeTemplateSpy,
    style: {
      fontFamily: "serif",
      fontSize: 14,
      lineHeight: 1.6,
      pagePadding: 20,
      accentColor: "#000000",
    },
    changeStyle: changeStyleSpy,
    resetStyle: resetStyleSpy,
    customCss: ".resume-name {\n  color: #ff0000;\n}",
    setCustomCss: setCustomCssSpy,
  }),
}));

vi.mock("../lib/markdown", () => ({
  parseResumeToHtml: vi.fn().mockResolvedValue("<h1>Test User</h1>"),
}));

vi.mock("./Editor", () => ({
  Editor: () => <div data-testid="editor-panel">editor</div>,
}));

vi.mock("./CssEditor", () => ({
  CssEditor: () => <div data-testid="css-editor-panel">css editor</div>,
}));

vi.mock("./Preview", () => ({
  Preview: ({ onElementSelect }: { onElementSelect?: (el: { selector: string; label: string; rect: DOMRect }) => void }) => (
    <div data-testid="preview-panel">
      preview
      <button
        type="button"
        onClick={() => onElementSelect?.({
          selector: ".resume-name",
          label: "Name",
          rect: new DOMRect(10, 10, 100, 30),
        })}
      >
        select element
      </button>
    </div>
  ),
}));

vi.mock("./StylePopover", () => ({
  StylePopover: () => <div data-testid="style-popover">popover</div>,
}));

vi.mock("./Toolbar", () => ({
  Toolbar: ({
    compact,
    workspaceView,
    onWorkspaceViewChange,
    onEditModeChange,
    onStyleReset,
  }: {
    compact: boolean;
    workspaceView: "editor" | "preview";
    onWorkspaceViewChange: (view: "editor" | "preview") => void;
    onEditModeChange: (value: boolean) => void;
    onStyleReset: () => void;
  }) => (
    <div data-testid="toolbar" data-compact={compact ? "yes" : "no"}>
      <button type="button" onClick={() => onWorkspaceViewChange("editor")}>
        show editor
      </button>
      <button type="button" onClick={() => onWorkspaceViewChange("preview")}>
        show preview
      </button>
      <button type="button" onClick={() => onEditModeChange(true)}>
        enable edit mode
      </button>
      <button type="button" onClick={onStyleReset}>
        reset all styles
      </button>
      <span>{workspaceView}</span>
    </div>
  ),
}));

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
  window.dispatchEvent(new Event("resize"));
}

describe("ResumePage responsive layout", () => {
  beforeEach(() => {
    changeTemplateSpy.mockReset();
    changeStyleSpy.mockReset();
    resetStyleSpy.mockReset();
    setCustomCssSpy.mockReset();
    setViewportWidth(1280);
  });

  test("shows editor and preview side by side on wide screens", async () => {
    render(<ResumePage language="zh" />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
      expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
    });
  });

  test("shows a single workspace panel on narrow screens and lets users switch views", async () => {
    setViewportWidth(768);
    render(<ResumePage language="zh" />);

    await waitFor(() => {
      expect(screen.getByTestId("editor-panel")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("preview-panel")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "show preview" }));

    await waitFor(() => {
      expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("editor-panel")).not.toBeInTheDocument();
  });

  test("closes the visual style popover when switching back to editor in compact mode", async () => {
    setViewportWidth(768);
    render(<ResumePage language="zh" />);

    fireEvent.click(screen.getByRole("button", { name: "show preview" }));
    fireEvent.click(screen.getByRole("button", { name: "enable edit mode" }));

    await waitFor(() => {
      expect(screen.getByTestId("preview-panel")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "select element" }));

    await waitFor(() => {
      expect(screen.getByTestId("style-popover")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "show editor" }));

    await waitFor(() => {
      expect(screen.queryByTestId("style-popover")).not.toBeInTheDocument();
    });
  });

  test("resets global styles and clears visual overrides together", () => {
    render(<ResumePage language="zh" />);

    fireEvent.click(screen.getByRole("button", { name: "reset all styles" }));

    expect(resetStyleSpy).toHaveBeenCalledTimes(1);
    expect(setCustomCssSpy).toHaveBeenCalledWith("");
  });
});
