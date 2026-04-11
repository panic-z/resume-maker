const PAGE_WIDTH_PX = 794;

export function getPreviewScale(containerWidth: number) {
  const gutter = containerWidth <= 340 ? 64 : 32;
  const availableWidth = Math.max(containerWidth - gutter, 0);
  if (availableWidth === 0) return 0;

  const scale = availableWidth / PAGE_WIDTH_PX;
  return Math.min(1, Math.max(0, Number(scale.toFixed(3))));
}

export function isCompactLayout(viewportWidth: number) {
  return viewportWidth < 1024;
}
