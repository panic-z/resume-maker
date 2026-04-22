import { describe, it, expect } from "vitest";
import { parseResumeToHtml } from "./markdown";

describe("parseResumeToHtml", () => {
  it("adds resume-name class to h1", async () => {
    const html = await parseResumeToHtml("# John Doe");
    expect(html).toContain('class="resume-name"');
    expect(html).toContain("John Doe");
  });

  it("adds resume-contact class to blockquote", async () => {
    const html = await parseResumeToHtml("> email@test.com | 123");
    expect(html).toContain('class="resume-contact"');
    expect(html).toContain("email@test.com");
  });

  it("wraps h2 sections in resume-section divs", async () => {
    const md = `## Work Experience\n\n- Did stuff\n\n## Education\n\n- Studied`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-section"');
    expect(html).toContain('class="resume-section-title"');
    expect(html).toContain("Work Experience");
    expect(html).toContain("Education");
  });

  it("adds resume-entry-title class to h3", async () => {
    const md = `## Work\n\n### Engineer | Corp | 2020`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-entry-title"');
    expect(html).toContain("Engineer");
  });

  it("parses a full resume without errors", async () => {
    const md = `# Name\n\n> contact\n\n## Section\n\n### Entry\n\n- Detail`;
    const html = await parseResumeToHtml(md);
    expect(html).toContain('class="resume-name"');
    expect(html).toContain('class="resume-contact"');
    expect(html).toContain('class="resume-section"');
    expect(html).toContain('class="resume-entry-title"');
  });

  it("strips unsafe javascript links from markdown", async () => {
    const html = await parseResumeToHtml("[Click me](javascript:alert(1))");
    expect(html).not.toContain("javascript:alert(1)");
    expect(html).toContain("<a");
  });

  it("does not pass through raw html with event handlers", async () => {
    const html = await parseResumeToHtml('<img src="x" onerror="alert(1)">');
    expect(html).not.toContain("onerror=");
    expect(html).not.toContain("<img");
  });

  it("adds safe external link attributes so preview clicks do not take over the editor tab", async () => {
    const html = await parseResumeToHtml("[Portfolio](https://example.com)");
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer noopener"');
  });
});
