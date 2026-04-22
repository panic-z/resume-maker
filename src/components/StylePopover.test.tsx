import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { StylePopover } from "./StylePopover";

describe("StylePopover reset actions", () => {
  test("clears custom overrides for the selected element", () => {
    const onCssChange = vi.fn();

    render(
      <StylePopover
        language="zh"
        element={{
          selector: ".resume-name",
          label: "姓名",
          rect: new DOMRect(10, 10, 100, 20),
        }}
        customCss={".resume-name {\n  color: #ff0000;\n  font-size: 18px;\n}"}
        onCssChange={onCssChange}
        onClose={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "重置当前元素" }));

    expect(onCssChange).toHaveBeenCalledWith("");
  });

  test("closes on outside pointer interaction", () => {
    const onClose = vi.fn();

    render(
      <StylePopover
        language="zh"
        element={{
          selector: ".resume-name",
          label: "姓名",
          rect: new DOMRect(10, 10, 100, 20),
        }}
        customCss=""
        onCssChange={vi.fn()}
        onClose={onClose}
      />,
    );

    fireEvent.pointerDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("keeps the popover within the viewport when the selected element is near the bottom", () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 600,
    });

    const { container } = render(
      <StylePopover
        language="zh"
        element={{
          selector: ".resume-name",
          label: "姓名",
          rect: new DOMRect(10, 580, 100, 20),
        }}
        customCss=""
        onCssChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const popover = container.firstElementChild as HTMLDivElement;
    expect(popover.style.top).not.toBe("572px");
  });

  test("caps the popover width so it does not overflow narrow viewports", () => {
    const { container } = render(
      <StylePopover
        language="zh"
        element={{
          selector: ".resume-name",
          label: "姓名",
          rect: new DOMRect(10, 10, 100, 20),
        }}
        customCss=""
        onCssChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(container.firstElementChild).toHaveClass("max-w-[calc(100vw-16px)]");
  });

  test("does not render an invalid placeholder unit for unset font size", () => {
    render(
      <StylePopover
        language="zh"
        element={{
          selector: ".resume-name",
          label: "姓名",
          rect: new DOMRect(10, 10, 100, 20),
        }}
        customCss=""
        onCssChange={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByText("—px")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });
});
