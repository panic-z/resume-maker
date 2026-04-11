import { describe, expect, test } from "vitest";
import { getPreviewScale } from "./preview-layout";

describe("getPreviewScale", () => {
  test("keeps full size when the container is wider than the page", () => {
    expect(getPreviewScale(1200)).toBe(1);
  });

  test("scales the page down when the container is narrow", () => {
    expect(getPreviewScale(500)).toBeLessThan(1);
  });

  test("fits the scaled preview into a 320px-wide mobile container", () => {
    const scale = getPreviewScale(320);
    expect(794 * scale).toBeLessThanOrEqual(256);
  });

  test("keeps the preview readable on a 390px mobile viewport", () => {
    expect(getPreviewScale(390)).toBeGreaterThan(0.42);
  });
});
