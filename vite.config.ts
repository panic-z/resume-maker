/// <reference types="vitest" />
/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("unified") ||
            id.includes("remark-parse") ||
            id.includes("remark-rehype") ||
            id.includes("rehype-stringify") ||
            id.includes("rehype-react")
          ) {
            return "markdown";
          }

          if (
            id.includes("@vercel/analytics") ||
            id.includes("@vercel/speed-insights")
          ) {
            return "vercel";
          }

          if (
            /\/node_modules\/react\//.test(id) ||
            /\/node_modules\/react-dom\//.test(id) ||
            /\/node_modules\/scheduler\//.test(id)
          ) {
            return "react-vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: [],
    passWithNoTests: true,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
