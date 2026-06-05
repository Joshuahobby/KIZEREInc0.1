import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    globalSetup: "./tests/e2e/global-setup",
    testDir: "./tests/e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 2,
    reporter: "list",
    timeout: 120000,
    expect: {
        timeout: 15000,
    },
    use: {
        baseURL: process.env.BASE_URL || "http://localhost:5000",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: "npm run dev",
        url: "http://localhost:5000",
        reuseExistingServer: true,
        timeout: 120000,
    },
});
