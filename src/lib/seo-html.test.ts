/// <reference types="node" />
import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

function extractInlineScript(source: string, marker: string): string {
  const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(source)) !== null) {
    if (match[1].includes(marker)) {
      return match[1];
    }
  }

  throw new Error(`Unable to find script containing marker: ${marker}`);
}

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

  it("rewrites structured data URLs when the page URL changes", () => {
    const canonicalScript = extractInlineScript(html, "const canonicalUrl =");
    const canonicalElement = {
      href: "",
      setAttribute(name: string, value: string) {
        if (name === "href") this.href = value;
      },
    };
    const ogUrlElement = {
      content: "",
      setAttribute(name: string, value: string) {
        if (name === "content") this.content = value;
      },
    };
    const structuredDataElement = {
      textContent: html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? "",
    };
    const document = {
      querySelector(selector: string) {
        if (selector === 'link[rel="canonical"]') return canonicalElement;
        if (selector === 'meta[property="og:url"]') return ogUrlElement;
        if (selector === 'script[type="application/ld+json"]') return structuredDataElement;
        return null;
      },
    };
    const window = {
      location: {
        origin: "https://preview.cybershiba.cn",
        pathname: "/resume-maker/zh",
      },
    };

    new Function("window", "document", canonicalScript)(window, document);

    const structuredData = JSON.parse(structuredDataElement.textContent);
    const entries = Array.isArray(structuredData) ? structuredData : [structuredData];
    const urls = entries
      .filter((entry) => typeof entry?.url === "string")
      .map((entry) => entry.url);

    expect(urls).toContain("https://preview.cybershiba.cn/resume-maker/zh");
  });
});
