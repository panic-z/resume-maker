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
    expect(html).toMatch(/Markdown resume builder/);
    expect(html).toMatch(/How Resume Maker Works/);
    expect(html).toMatch(/Frequently Asked Questions/);
    expect(html).toMatch(/Do I need an account to use Resume Maker\?/);
  });
});
