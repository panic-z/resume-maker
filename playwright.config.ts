import { defineConfig } from "@playwright/test";

const localNoProxy = "127.0.0.1,localhost";
process.env.NO_PROXY = process.env.NO_PROXY
  ? `${process.env.NO_PROXY},${localNoProxy}`
  : localNoProxy;
process.env.no_proxy = process.env.no_proxy
  ? `${process.env.no_proxy},${localNoProxy}`
  : localNoProxy;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: false,
  },
});
