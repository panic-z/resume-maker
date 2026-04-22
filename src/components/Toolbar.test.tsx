import "@testing-library/jest-dom/vitest";
import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import { Toolbar } from "./Toolbar";
import { ResumeImportError } from "../lib/import";

const {
  parseImportedMarkdownMock,
  parseImportedProjectJsonMock,
  parseImportedPdfMock,
} = vi.hoisted(() => ({
  parseImportedMarkdownMock: vi.fn(),
  parseImportedProjectJsonMock: vi.fn(),
  parseImportedPdfMock: vi.fn(),
}));

vi.mock("../lib/import", async () => {
  const actual = await vi.importActual<typeof import("../lib/import")>("../lib/import");

  return {
    ...actual,
    parseImportedMarkdown: parseImportedMarkdownMock,
    parseImportedProjectJson: parseImportedProjectJsonMock,
    parseImportedPdf: parseImportedPdfMock,
  };
});

function renderToolbar(overrides: Partial<ComponentProps<typeof Toolbar>> = {}) {
  return render(
    <Toolbar
      language="zh"
      template="classic"
      onTemplateChange={vi.fn()}
      onExportPdf={vi.fn()}
      onExportHtml={vi.fn()}
      onExportMarkdown={vi.fn()}
      style={{
        fontFamily: "serif",
        fontSize: 14,
        lineHeight: 1.6,
        pagePadding: 20,
        accentColor: "#000000",
      }}
      onStyleChange={vi.fn()}
      onStyleReset={vi.fn()}
      editorTab="markdown"
      onEditorTabChange={vi.fn()}
      editMode={false}
      onEditModeChange={vi.fn()}
      compact={false}
      workspaceView="editor"
      onWorkspaceViewChange={vi.fn()}
      onImportMarkdown={vi.fn()}
      onImportProject={vi.fn()}
      {...overrides}
    />,
  );
}

describe("Toolbar style drawer", () => {
  beforeEach(() => {
    parseImportedMarkdownMock.mockReset();
    parseImportedProjectJsonMock.mockReset();
    parseImportedPdfMock.mockReset();
    Object.defineProperty(window, "confirm", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("does not keep the toolbar chrome above the style drawer overlay", () => {
    const { container } = renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));

    expect(screen.getByRole("dialog", { name: "样式" })).toBeInTheDocument();
    expect(container.querySelector(".z-50")).not.toBeInTheDocument();
  });

  test("opens style controls in a dialog drawer", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));

    expect(screen.getByRole("dialog", { name: "样式" })).toBeInTheDocument();
    expect(screen.getByText("字体")).toBeInTheDocument();
  });

  test("closes the style drawer from its close button", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));
    fireEvent.click(screen.getByRole("button", { name: "关闭样式面板" }));

    expect(screen.queryByRole("dialog", { name: "样式" })).not.toBeInTheDocument();
  });

  test("moves focus into the drawer and closes it on Escape", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));

    const closeButton = screen.getByRole("button", { name: "关闭样式面板" });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("dialog", { name: "样式" })).not.toBeInTheDocument();
  });

  test("closes the style drawer when clicking the backdrop", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("dialog", { name: "样式" })).not.toBeInTheDocument();
  });

  test("closes the style drawer on outside pointer interaction", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "样式" }));
    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("dialog", { name: "样式" })).not.toBeInTheDocument();
  });

  test("closes the export menu on outside pointer interaction", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "导出" }));
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    expect(screen.queryByRole("button", { name: "PDF" })).not.toBeInTheDocument();
  });

  test("opens the import menu with markdown, json, and pdf options", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "导入" }));

    expect(screen.getByRole("button", { name: "Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "JSON 项目" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "PDF（实验）" })).toBeInTheDocument();
  });

  test("calls the markdown import file picker when markdown import is clicked", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "导入" }));

    const input = screen.getByTestId("import-markdown-input");
    const clickSpy = vi.spyOn(input, "click");

    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  test("closes the import menu after triggering markdown import", () => {
    renderToolbar();

    fireEvent.click(screen.getByRole("button", { name: "导入" }));
    fireEvent.click(screen.getByRole("button", { name: "Markdown" }));

    expect(screen.queryByRole("button", { name: "JSON 项目" })).not.toBeInTheDocument();
  });

  test("imports markdown after confirmation and calls the resume import action with parsed markdown", async () => {
    const onImportMarkdown = vi.fn();
    parseImportedMarkdownMock.mockResolvedValue("# Imported");
    vi.mocked(window.confirm).mockReturnValue(true);

    renderToolbar({ onImportMarkdown });

    const input = screen.getByTestId("import-markdown-input") as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [new File(["# Raw"], "resume.md", { type: "text/markdown" })],
      },
    });

    await waitFor(() => {
      expect(parseImportedMarkdownMock).toHaveBeenCalledWith("# Raw");
    });
    expect(onImportMarkdown).toHaveBeenCalledWith("# Imported");
    expect(window.confirm).toHaveBeenCalledWith("导入 Markdown 会替换当前简历内容，是否继续？");
    expect(input.value).toBe("");
  });

  test("imports a project json snapshot after confirmation and calls the project import action", async () => {
    const project = {
      markdown: "# Imported",
      template: "modern" as const,
      style: {
        fontFamily: "sans" as const,
        fontSize: 14,
        lineHeight: 1.6,
        pagePadding: 20,
        accentColor: "#123456",
        backgroundMode: "preset" as const,
        backgroundPreset: "plain" as const,
        customGradient: null,
        customImage: null,
      },
      customCss: ".resume { color: red; }",
      language: "zh" as const,
    };
    const onImportProject = vi.fn();

    parseImportedProjectJsonMock.mockResolvedValue(project);
    vi.mocked(window.confirm).mockReturnValue(true);

    renderToolbar({ onImportProject });

    fireEvent.change(screen.getByLabelText("导入 JSON 项目文件"), {
      target: {
        files: [new File(['{"markdown":"# Imported"}'], "resume.json", { type: "application/json" })],
      },
    });

    await waitFor(() => {
      expect(parseImportedProjectJsonMock).toHaveBeenCalledWith('{"markdown":"# Imported"}');
    });
    expect(onImportProject).toHaveBeenCalledWith(project);
    expect(window.confirm).toHaveBeenCalledWith("导入项目会替换当前简历、模板和样式，是否继续？");
  });

  test("shows a localized error when pdf import parsing fails", async () => {
    parseImportedPdfMock.mockRejectedValue(new ResumeImportError("pdf-parse-failed"));
    vi.mocked(window.confirm).mockReturnValue(true);

    renderToolbar();

    fireEvent.change(screen.getByLabelText("导入 PDF 文件"), {
      target: {
        files: [new File(["fake"], "resume.pdf", { type: "application/pdf" })],
      },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("PDF 解析失败，请检查文件后重试");
  });
});
