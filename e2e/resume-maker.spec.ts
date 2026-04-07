import { test, expect } from "@playwright/test";
import { readFileSync } from "fs";

test.describe("Resume Maker E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".cm-editor");
  });

  test("页面加载：显示 Header、编辑器和预览区", async ({ page }) => {
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("text=Resume Maker")).toBeVisible();

    const editor = page.locator(".cm-editor");
    await expect(editor).toBeVisible();

    await expect(page.locator(".resume-name")).toBeVisible();
    await expect(page.locator(".resume-name")).toContainText("张三");
  });

  test("默认简历内容完整渲染", async ({ page }) => {
    await expect(page.locator(".resume-contact")).toBeVisible();
    await expect(page.locator(".resume-contact")).toContainText("zhangsan@email.com");

    const sections = page.locator(".resume-section-title");
    await expect(sections).toHaveCount(4);

    const entries = page.locator(".resume-entry-title");
    expect(await entries.count()).toBeGreaterThanOrEqual(3);

    const sectionDivs = page.locator(".resume-section");
    await expect(sectionDivs).toHaveCount(4);
  });

  test("编辑 Markdown 实时更新预览", async ({ page }) => {
    const editor = page.locator(".cm-editor .cm-content");

    await editor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("# Li Si", { delay: 20 });
    await page.keyboard.press("Enter");
    await page.keyboard.press("Enter");
    await page.keyboard.type("> test@test.com", { delay: 20 });

    await expect(page.locator(".resume-name")).toContainText("Li Si", { timeout: 5000 });
    await expect(page.locator(".resume-contact")).toContainText("test@test.com");
  });

  test("模板切换：经典 → 现代 → 经典", async ({ page }) => {
    const previewContainer = page.locator("[class*='template-classic']");
    await expect(previewContainer).toBeVisible();

    await page.click("button:text('现代')");
    const modernContainer = page.locator("[class*='template-modern']");
    await expect(modernContainer).toBeVisible();

    await page.click("button:text('经典')");
    await expect(previewContainer).toBeVisible();
  });

  test("导出下拉菜单展开和关闭", async ({ page }) => {
    await page.click("button:text('导出')");

    await expect(page.locator("button:text('PDF')")).toBeVisible();
    await expect(page.locator("button:text('HTML')")).toBeVisible();
    await expect(page.locator("button:text('Markdown')")).toBeVisible();

    await page.click("header");
    await expect(page.locator("button:text('PDF')")).not.toBeVisible();
  });

  test("导出 Markdown 文件下载", async ({ page }) => {
    await page.click("button:text('导出')");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("button:text('Markdown')"),
    ]);

    expect(download.suggestedFilename()).toBe("resume.md");

    const dlPath = await download.path();
    const content = dlPath ? readFileSync(dlPath, "utf-8") : "";
    expect(content).toContain("# 张三");
  });

  test("导出 HTML 文件下载", async ({ page }) => {
    await page.click("button:text('导出')");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("button:text('HTML')"),
    ]);

    expect(download.suggestedFilename()).toBe("resume.html");

    const dlPath = await download.path();
    const content = dlPath ? readFileSync(dlPath, "utf-8") : "";
    expect(content).toContain("<!DOCTYPE html>");
    expect(content).toContain("template-classic");
    expect(content).toContain("resume-name");
  });

  test("拖拽分隔线调整面板宽度", async ({ page }) => {
    const splitter = page.locator(".cursor-col-resize");
    await expect(splitter).toBeVisible();

    const box = await splitter.boundingBox();
    if (!box) throw new Error("splitter not found");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();

    const newBox = await splitter.boundingBox();
    if (!newBox) throw new Error("splitter not found after drag");
    expect(newBox.x).toBeGreaterThan(box.x);
  });

  test("localStorage 持久化：刷新后恢复内容", async ({ page }) => {
    const editor = page.locator(".cm-editor .cm-content");

    await editor.click();
    await page.keyboard.press("Meta+a");
    await page.keyboard.press("Backspace");
    await page.keyboard.type("# Persistence Test", { delay: 20 });

    await page.waitForTimeout(800);
    await page.reload();

    await expect(page.locator(".resume-name")).toContainText("Persistence Test", { timeout: 5000 });
  });

  test("localStorage 持久化：模板选择刷新后保留", async ({ page }) => {
    await page.click("button:text('现代')");
    await expect(page.locator("[class*='template-modern']")).toBeVisible();

    await page.reload();

    await expect(page.locator("[class*='template-modern']")).toBeVisible();
  });
});

test.describe("样式调节面板", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".cm-editor");
  });

  test("点击样式按钮展开/收起面板", async ({ page }) => {
    const styleBtn = page.locator("button:text('样式')");
    await expect(styleBtn).toBeVisible();

    await styleBtn.click();

    await expect(page.getByText("字体")).toBeVisible();
    await expect(page.getByText("字号")).toBeVisible();
    await expect(page.getByText("行距")).toBeVisible();
    await expect(page.getByText("边距")).toBeVisible();
    await expect(page.getByText("主题色")).toBeVisible();
    await expect(page.getByText("重置")).toBeVisible();

    await styleBtn.click();
    await expect(page.getByText("主题色")).not.toBeVisible();
  });

  test("切换字体：衬线 / 无衬线 / 系统", async ({ page }) => {
    await page.click("button:text('样式')");

    const preview = page.locator("[class*='template-']");
    await expect(preview).toBeVisible();

    await page.click("button:text('无衬线')");
    const fontAfterSans = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-family")
    );
    expect(fontAfterSans).toContain("Inter");

    await page.click("button:text('系统默认')");
    const fontAfterSystem = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-family")
    );
    expect(fontAfterSystem).toContain("system-ui");

    await page.click("button:text('衬线体')");
    const fontAfterSerif = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-family")
    );
    expect(fontAfterSerif).toContain("Georgia");
  });

  test("调节字号滑块改变预览字体大小", async ({ page }) => {
    await page.click("button:text('样式')");

    const preview = page.locator("[class*='template-']");
    const fontSizeBefore = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-size")
    );
    expect(fontSizeBefore).toBe("14px");

    const sliders = page.locator("input[type='range']");
    const fontSizeSlider = sliders.nth(0);

    await fontSizeSlider.fill("16");

    const fontSizeAfter = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-size")
    );
    expect(fontSizeAfter).toBe("16px");
  });

  test("调节行距滑块改变预览行高", async ({ page }) => {
    await page.click("button:text('样式')");

    const preview = page.locator("[class*='template-']");
    const sliders = page.locator("input[type='range']");
    const lineHeightSlider = sliders.nth(1);

    await lineHeightSlider.fill("2");

    const lineHeight = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-line-height")
    );
    expect(lineHeight).toBe("2");
  });

  test("调节边距滑块改变预览内边距", async ({ page }) => {
    await page.click("button:text('样式')");

    const preview = page.locator("[class*='template-']");
    const paddingBefore = await preview.evaluate((el) => getComputedStyle(el).padding);

    const sliders = page.locator("input[type='range']");
    const paddingSlider = sliders.nth(2);

    await paddingSlider.fill("10");

    const paddingAfter = await preview.evaluate((el) => getComputedStyle(el).padding);
    expect(paddingAfter).not.toBe(paddingBefore);
  });

  test("点击预设主题色改变预览强调色", async ({ page }) => {
    await page.click("button:text('样式')");

    const preview = page.locator("[class*='template-']");

    const greenSwatch = page.locator("button[style*='background-color: rgb(16, 185, 129)']");
    if (await greenSwatch.count() === 0) {
      const greenSwatchHex = page.locator("button[style*='#10b981']");
      await greenSwatchHex.click();
    } else {
      await greenSwatch.click();
    }

    const accent = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-accent")
    );
    expect(accent).toBe("#10b981");
  });

  test("重置按钮恢复默认样式", async ({ page }) => {
    await page.click("button:text('样式')");

    const sliders = page.locator("input[type='range']");
    await sliders.nth(0).fill("18");

    const preview = page.locator("[class*='template-']");
    const bigFont = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-size")
    );
    expect(bigFont).toBe("18px");

    await page.click("button:text('重置')");

    const resetFont = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-size")
    );
    expect(resetFont).toBe("14px");
  });

  test("样式设置持久化：刷新后保留", async ({ page }) => {
    await page.click("button:text('样式')");

    const sliders = page.locator("input[type='range']");
    await sliders.nth(0).fill("16");

    await page.reload();
    await page.waitForSelector("[class*='template-']");

    const preview = page.locator("[class*='template-']");
    const fontSize = await preview.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-size")
    );
    expect(fontSize).toBe("16px");
  });

  test("切换模板联动字体和主题色", async ({ page }) => {
    await page.click("button:text('样式')");

    await page.click("button:text('现代')");
    const modern = page.locator("[class*='template-modern']");
    const fontModern = await modern.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-family")
    );
    expect(fontModern).toContain("Inter");
    const accentModern = await modern.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-accent")
    );
    expect(accentModern).toBe("#3b82f6");

    await page.click("button:text('经典')");
    const classic = page.locator("[class*='template-classic']");
    const fontClassic = await classic.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-font-family")
    );
    expect(fontClassic).toContain("Georgia");
    const accentClassic = await classic.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-accent")
    );
    expect(accentClassic).toBe("#000000");
  });

  test("导出 HTML 包含自定义样式变量", async ({ page }) => {
    await page.click("button:text('样式')");

    const sliders = page.locator("input[type='range']");
    await sliders.nth(0).fill("16");

    await page.click("button:text('样式')");

    await page.click("button:text('导出')");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("button:text('HTML')"),
    ]);

    const dlPath = await download.path();
    const content = dlPath ? readFileSync(dlPath, "utf-8") : "";
    expect(content).toContain("--resume-font-size:16px");
  });
});

test.describe("新增模板", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".cm-editor");
  });

  test("工具栏显示 5 个模板按钮", async ({ page }) => {
    await expect(page.locator("button:text('经典')")).toBeVisible();
    await expect(page.locator("button:text('现代')")).toBeVisible();
    await expect(page.locator("button:text('简约')")).toBeVisible();
    await expect(page.locator("button:text('商务')")).toBeVisible();
    await expect(page.locator("button:text('创意')")).toBeVisible();
  });

  test("切换到简约模板", async ({ page }) => {
    await page.click("button:text('简约')");
    await expect(page.locator("[class*='template-minimal']")).toBeVisible();
    await expect(page.locator(".resume-name")).toBeVisible();
  });

  test("切换到商务模板", async ({ page }) => {
    await page.click("button:text('商务')");
    await expect(page.locator("[class*='template-professional']")).toBeVisible();
    await expect(page.locator(".resume-name")).toBeVisible();
  });

  test("切换到创意模板", async ({ page }) => {
    await page.click("button:text('创意')");
    await expect(page.locator("[class*='template-creative']")).toBeVisible();
    await expect(page.locator(".resume-name")).toBeVisible();
  });

  test("新模板切换联动主题色", async ({ page }) => {
    await page.click("button:text('创意')");
    const creative = page.locator("[class*='template-creative']");
    const accent = await creative.evaluate(
      (el) => getComputedStyle(el).getPropertyValue("--resume-accent")
    );
    expect(accent).toBe("#7c3aed");
  });

  test("新模板选择刷新后保留", async ({ page }) => {
    await page.click("button:text('简约')");
    await expect(page.locator("[class*='template-minimal']")).toBeVisible();

    await page.reload();
    await page.waitForSelector("[class*='template-']");

    await expect(page.locator("[class*='template-minimal']")).toBeVisible();
  });

  test("新模板导出 HTML 包含正确模板类", async ({ page }) => {
    await page.click("button:text('商务')");
    await page.click("button:text('导出')");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("button:text('HTML')"),
    ]);

    const dlPath = await download.path();
    const content = dlPath ? readFileSync(dlPath, "utf-8") : "";
    expect(content).toContain("template-professional");
  });
});

test.describe("自定义 CSS 编辑器", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".cm-editor");
  });

  test("点击 CSS 按钮切换到 CSS 编辑器", async ({ page }) => {
    const cssBtn = page.locator("button:text('CSS')");
    await expect(cssBtn).toBeVisible();

    await cssBtn.click();

    const cssEditor = page.locator(".cm-editor");
    await expect(cssEditor).toBeVisible();
  });

  test("CSS 编辑器中输入样式实时影响预览", async ({ page }) => {
    await page.click("button:text('CSS')");

    const editor = page.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type(".resume-name { color: red; }", { delay: 10 });

    await page.waitForTimeout(300);

    const nameColor = await page.locator(".resume-name").evaluate(
      (el) => getComputedStyle(el).color
    );
    expect(nameColor).toBe("rgb(255, 0, 0)");
  });

  test("CSS 编辑器切回 Markdown 编辑器", async ({ page }) => {
    await page.click("button:text('CSS')");

    const editor = page.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type(".resume-name { color: blue; }", { delay: 10 });

    await page.click("button:text('CSS')");

    await expect(page.locator(".resume-name")).toBeVisible();
    const nameColor = await page.locator(".resume-name").evaluate(
      (el) => getComputedStyle(el).color
    );
    expect(nameColor).toBe("rgb(0, 0, 255)");
  });

  test("自定义 CSS 持久化：刷新后保留", async ({ page }) => {
    await page.click("button:text('CSS')");

    const editor = page.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type(".resume-name { color: green; }", { delay: 10 });

    await page.waitForTimeout(800);
    await page.reload();
    await page.waitForSelector(".resume-name");

    const nameColor = await page.locator(".resume-name").evaluate(
      (el) => getComputedStyle(el).color
    );
    expect(nameColor).toBe("rgb(0, 128, 0)");
  });

  test("导出 HTML 包含自定义 CSS", async ({ page }) => {
    await page.click("button:text('CSS')");

    const editor = page.locator(".cm-editor .cm-content");
    await editor.click();
    await page.keyboard.type(".resume-name { font-size: 30px; }", { delay: 10 });

    await page.click("button:text('CSS')");

    await page.click("button:text('导出')");

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("button:text('HTML')"),
    ]);

    const dlPath = await download.path();
    const content = dlPath ? readFileSync(dlPath, "utf-8") : "";
    expect(content).toContain("font-size: 30px");
  });
});

test.describe("可视化编辑器", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector(".cm-editor");
  });

  test("可视化按钮切换编辑模式", async ({ page }) => {
    const editBtn = page.locator("button:text('可视化')");
    await expect(editBtn).toBeVisible();

    await editBtn.click();
    await expect(page.getByText("点击元素编辑样式")).toBeVisible();

    await editBtn.click();
    await expect(page.getByText("点击元素编辑样式")).not.toBeVisible();
  });

  test("编辑模式下点击姓名弹出样式面板", async ({ page }) => {
    await page.click("button:text('可视化')");

    const name = page.locator(".resume-name");
    await name.click();

    await expect(page.getByText("姓名")).toBeVisible();
    await expect(page.getByText(".resume-name")).toBeVisible();
  });

  test("编辑模式下点击章节标题弹出样式面板", async ({ page }) => {
    await page.click("button:text('可视化')");

    const sectionTitle = page.locator(".resume-section-title").first();
    await sectionTitle.click();

    await expect(page.getByText("章节标题")).toBeVisible();
    await expect(page.getByText(".resume-section-title")).toBeVisible();
  });

  test("关闭可视化模式清除弹出面板", async ({ page }) => {
    await page.click("button:text('可视化')");
    await page.locator(".resume-name").click();
    await expect(page.getByText("姓名")).toBeVisible();

    await page.click("button:text('可视化')");
    await expect(page.getByText(".resume-name")).not.toBeVisible();
  });
});
