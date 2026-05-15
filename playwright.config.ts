import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  timeout: 60000,
  snapshotPathTemplate: "{testDir}/{testFilePath}-snapshots/{arg}{ext}",
  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: true,
  },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    headless: true,
  },
});
