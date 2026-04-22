import "@testing-library/jest-dom/vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { beforeEach, describe, expect, test, vi, afterEach } from "vitest";
import { StylePanel } from "./StylePanel";
import { readBackgroundImage } from "../lib/background-utils";

vi.mock("../lib/background-utils", async () => {
  const actual = await vi.importActual<typeof import("../lib/background-utils")>("../lib/background-utils");
  return {
    ...actual,
    readBackgroundImage: vi.fn(),
  };
});

const mockedReadBackgroundImage = vi.mocked(readBackgroundImage);

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

function renderStylePanel(overrides?: Partial<ComponentProps<typeof StylePanel>["style"]>) {
  const onChange = vi.fn();

  render(
    <StylePanel
      language="zh"
      style={{
        fontFamily: "serif",
        fontSize: 14,
        lineHeight: 1.6,
        pagePadding: 20,
        accentColor: "#000000",
        backgroundMode: "preset",
        backgroundPreset: "plain",
        customGradient: null,
        customImage: null,
        ...overrides,
      }}
      onChange={onChange}
      onReset={vi.fn()}
      onClose={() => {}}
    />,
  );

  return { onChange };
}

describe("StylePanel focus management", () => {
  beforeEach(() => {
    mockedReadBackgroundImage.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("removing a custom image falls back to the plain preset background", () => {
    const { onChange } = renderStylePanel({
      backgroundMode: "custom-image",
      backgroundPreset: "corner-frame",
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,abc123",
        fit: "contain",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "移除图片" }));

    expect(onChange).toHaveBeenCalledWith({
      backgroundMode: "preset",
      backgroundPreset: "plain",
      customImage: null,
    });
  });

  test("uploading an image applies a custom-image background when reading succeeds", async () => {
    mockedReadBackgroundImage.mockResolvedValueOnce({
      ok: true,
      dataUrl: "data:image/png;base64,uploaded",
      mimeType: "image/png",
    });

    const { onChange } = renderStylePanel({
      backgroundMode: "custom-image",
    });

    const file = new File(["image"], "background.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("上传图片"), {
      target: { files: [file] },
    });

    expect(mockedReadBackgroundImage).toHaveBeenCalledWith(file);
    expect(await screen.findByText("background.png")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({
      backgroundMode: "custom-image",
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,uploaded",
        fit: "cover",
      },
    });
  });

  test("uploading an unsupported image shows a localized error", async () => {
    mockedReadBackgroundImage.mockResolvedValueOnce({
      ok: false,
      code: "unsupported-type",
    });

    renderStylePanel({
      backgroundMode: "custom-image",
    });

    const file = new File(["image"], "background.gif", { type: "image/gif" });
    fireEvent.change(screen.getByLabelText("上传图片"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("仅支持 PNG、JPEG 或 WebP")).toBeInTheDocument();
  });

  test("renders background preset controls", () => {
    render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "preset",
          backgroundPreset: "plain",
          customGradient: null,
          customImage: null,
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("背景")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "纯白" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "角框" })).toBeInTheDocument();
  });

  test("renders background mode controls", () => {
    render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "custom-gradient",
          backgroundPreset: "plain",
          customGradient: {
            mode: "custom-gradient",
            direction: "to-right",
            from: "#112233",
            to: "#445566",
          },
          customImage: null,
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "预设" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "自定义渐变" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "自定义图片" })).toBeInTheDocument();
    expect(screen.getByLabelText("起始颜色")).toHaveValue("#112233");
    expect(screen.getByLabelText("结束颜色")).toHaveValue("#445566");
  });

  test("changing a custom gradient control emits a nested style patch", () => {
    const onChange = vi.fn();

    render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "custom-gradient",
          backgroundPreset: "plain",
          customGradient: {
            mode: "custom-gradient",
            direction: "to-right",
            from: "#112233",
            to: "#445566",
          },
          customImage: null,
        }}
        onChange={onChange}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("起始颜色"), { target: { value: "#abcdef" } });

    expect(onChange).toHaveBeenCalledWith({
      customGradient: {
        mode: "custom-gradient",
        direction: "to-right",
        from: "#abcdef",
        to: "#445566",
      },
    });
  });

  test("renders a modal backdrop that blocks underlying pointer interactions", () => {
    const { container } = render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "preset",
          backgroundPreset: "plain",
          customGradient: null,
          customImage: null,
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(container.firstChild).toHaveClass("fixed", "inset-x-0", "bottom-0", "z-40");
    expect(container.firstChild).not.toHaveClass("pointer-events-none");
    expect(container.querySelector('[aria-hidden="true"]')).not.toHaveClass("pointer-events-none");
  });

  test("positions the overlay below the toolbar trigger when one is provided", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue(new DOMRect(0, 0, 100, 96));

    const triggerRef = { current: trigger };
    const { container } = render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "preset",
          backgroundPreset: "plain",
          customGradient: null,
          customImage: null,
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
        triggerRef={triggerRef}
      />,
    );

    expect(container.firstChild).toHaveStyle({ top: "96px" });
  });

  test("renders custom-image controls for an existing image skeleton state", () => {
    render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "custom-image",
          backgroundPreset: "plain",
          customGradient: null,
          customImage: {
            mode: "custom-image",
            src: "data:image/png;base64,abc123",
            fit: "contain",
          },
        }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(screen.getByRole("button", { name: "替换图片" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "移除图片" })).toBeEnabled();
    expect(screen.getByText("当前图片")).toBeInTheDocument();
    expect(screen.getByText("已选择图片")).toBeInTheDocument();
    expect(screen.getByLabelText("铺放方式")).toHaveValue("contain");
    expect(screen.getByLabelText("铺放方式")).toBeEnabled();
    expect(screen.queryByText("暂未选择图片，上传功能将在后续任务中接入。")).not.toBeInTheDocument();
  });

  test("changing custom image fit emits a nested style patch", () => {
    const onChange = vi.fn();

    render(
      <StylePanel
        language="zh"
        style={{
          fontFamily: "serif",
          fontSize: 14,
          lineHeight: 1.6,
          pagePadding: 20,
          accentColor: "#000000",
          backgroundMode: "custom-image",
          backgroundPreset: "plain",
          customGradient: null,
          customImage: {
            mode: "custom-image",
            src: "data:image/png;base64,abc123",
            fit: "cover",
          },
        }}
        onChange={onChange}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    fireEvent.change(screen.getByLabelText("铺放方式"), { target: { value: "repeat" } });

    expect(onChange).toHaveBeenCalledWith({
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,abc123",
        fit: "repeat",
      },
    });
  });

  test("keeps slider focus while style changes rerender the panel", () => {
    const style = {
      fontFamily: "serif" as const,
      fontSize: 14,
      lineHeight: 1.6,
      pagePadding: 20,
      accentColor: "#000000",
      backgroundMode: "preset" as const,
      backgroundPreset: "plain" as const,
      customGradient: null,
      customImage: null,
    };

    const { rerender } = render(
      <StylePanel
        language="zh"
        style={style}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    const slider = screen.getAllByRole("slider")[0];
    slider.focus();
    expect(slider).toHaveFocus();

    rerender(
      <StylePanel
        language="zh"
        style={{ ...style, fontSize: 15 }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(slider).toHaveFocus();
  });

  test("clears the upload error after a successful retry", async () => {
    mockedReadBackgroundImage
      .mockResolvedValueOnce({
        ok: false,
        code: "read-failed",
      })
      .mockResolvedValueOnce({
        ok: true,
        dataUrl: "data:image/webp;base64,retry",
        mimeType: "image/webp",
      });

    const { onChange } = renderStylePanel({
      backgroundMode: "custom-image",
    });

    const firstFile = new File(["bad"], "broken.webp", { type: "image/webp" });
    const secondFile = new File(["good"], "fixed.webp", { type: "image/webp" });
    const input = screen.getByLabelText("上传图片");

    fireEvent.change(input, { target: { files: [firstFile] } });
    expect(await screen.findByText("图片读取失败，请重试")).toBeInTheDocument();

    fireEvent.change(input, { target: { files: [secondFile] } });

    expect(await screen.findByText("fixed.webp")).toBeInTheDocument();
    expect(screen.queryByText("图片读取失败，请重试")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({
      backgroundMode: "custom-image",
      customImage: {
        mode: "custom-image",
        src: "data:image/webp;base64,retry",
        fit: "cover",
      },
    });
  });

  test("ignores a stale upload result after the user removes the image", async () => {
    const pendingUpload = deferred<Awaited<ReturnType<typeof readBackgroundImage>>>();
    mockedReadBackgroundImage.mockReturnValueOnce(pendingUpload.promise);

    const { onChange } = renderStylePanel({
      backgroundMode: "custom-image",
      customImage: {
        mode: "custom-image",
        src: "data:image/png;base64,existing",
        fit: "contain",
      },
    });

    const file = new File(["new"], "new-image.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("上传图片"), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: "移除图片" }));

    await act(async () => {
      pendingUpload.resolve({
        ok: true,
        dataUrl: "data:image/png;base64,late",
        mimeType: "image/png",
      });
      await pendingUpload.promise;
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({
      backgroundMode: "preset",
      backgroundPreset: "plain",
      customImage: null,
    });
    expect(screen.queryByText("new-image.png")).not.toBeInTheDocument();
  });

  test("ignores a stale upload result after the user switches background mode", async () => {
    const pendingUpload = deferred<Awaited<ReturnType<typeof readBackgroundImage>>>();
    mockedReadBackgroundImage.mockReturnValueOnce(pendingUpload.promise);

    const { onChange } = renderStylePanel({
      backgroundMode: "custom-image",
    });

    const file = new File(["new"], "late-image.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("上传图片"), {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByRole("button", { name: "预设" }));

    await act(async () => {
      pendingUpload.resolve({
        ok: true,
        dataUrl: "data:image/png;base64,late-mode-switch",
        mimeType: "image/png",
      });
      await pendingUpload.promise;
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ backgroundMode: "preset" });
    expect(screen.queryByText("late-image.png")).not.toBeInTheDocument();
  });

  test("clears local uploaded image state when parent style clears customImage", async () => {
    mockedReadBackgroundImage.mockResolvedValueOnce({
      ok: true,
      dataUrl: "data:image/png;base64,uploaded",
      mimeType: "image/png",
    });

    const style = {
      fontFamily: "serif" as const,
      fontSize: 14,
      lineHeight: 1.6,
      pagePadding: 20,
      accentColor: "#000000",
      backgroundMode: "custom-image" as const,
      backgroundPreset: "plain" as const,
      customGradient: null,
      customImage: null,
    };

    const { rerender } = render(
      <StylePanel
        language="zh"
        style={style}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    const file = new File(["image"], "background.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("上传图片"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("background.png")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "移除图片" })).toBeEnabled();

    rerender(
      <StylePanel
        language="zh"
        style={{ ...style, backgroundMode: "preset", customImage: null }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByText("background.png")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "移除图片" })).not.toBeInTheDocument();
  });
});
