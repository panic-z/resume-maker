import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { Toolbar } from "./Toolbar";

function renderToolbar() {
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
    />,
  );
}

describe("Toolbar style drawer", () => {
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
});
