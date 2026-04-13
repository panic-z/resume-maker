/// <reference types="node" />
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("resume maker SEO shell", () => {
  it("includes social preview images and richer product metadata", () => {
    expect(html).toMatch(/<meta property="og:image" content="https:\/\/www\.cybershiba\.cn\/resume-maker\/og-cover\.svg"/);
    expect(html).toMatch(/<meta name="twitter:image" content="https:\/\/www\.cybershiba\.cn\/resume-maker\/og-cover\.svg"/);
    expect(html).toMatch(/"@type": "FAQPage"/);
    expect(html).toMatch(/"@type": "SoftwareApplication"/);
  });

  it("contains crawlable landing page content and FAQ copy", () => {
    expect(html).toMatch(/<section class="seo-content"/);
    expect(html).toMatch(/seo-summary/);
    expect(html).toMatch(/seo-faq/);
    expect(html).toMatch(/summary-card/);
    expect(html).toMatch(/<details>/);
  });

  it("supports bilingual seo copy instead of hard-coded english-only content", () => {
    expect(html).toMatch(/const seoMessages =/);
    expect(html).toMatch(/heroTitle: "Markdown resume builder with live preview and PDF export"/);
    expect(html).toMatch(/heroTitle: "支持实时预览和 PDF 导出的 Markdown 简历生成器"/);
    expect(html).toMatch(/faqTitle: "Frequently Asked Questions"/);
    expect(html).toMatch(/faqTitle: "常见问题"/);
  });
});
