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
});
