import { defineConfig } from "@playwright/test";

for (const name of ["QA_BASE_URL", "QA_API_URL"]) {
  const value = process.env[name];
  if (!value || new URL(value).hostname !== "127.0.0.1") {
    throw new Error("Execute os testes pelo harness: node scripts/qa-environment.js --e2e");
  }
}

export default defineConfig({
  testDir: "./e2e", fullyParallel: false, workers: 1, timeout: 30000,
  reporter: "list", outputDir: "test-results",
  use: { baseURL: process.env.QA_BASE_URL, browserName: "chromium", viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure", screenshot: "only-on-failure" },
});
