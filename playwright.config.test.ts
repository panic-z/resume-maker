import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("playwright config", () => {
  it("locks the dev server to the configured port", () => {
    const configPath = join(process.cwd(), "playwright.config.ts");
    const config = readFileSync(configPath, "utf-8");

    expect(config).toContain("http://127.0.0.1:4173");
    expect(config).toContain("--port 4173");
    expect(config).toContain("--strictPort");
    expect(config).toContain("reuseExistingServer: false");
    expect(config).toContain("process.env.NO_PROXY");
    expect(config).toContain("process.env.no_proxy");
  });
});
