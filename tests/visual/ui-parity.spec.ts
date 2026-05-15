import { test, expect } from "@playwright/test";

test("dashboard visual parity", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot("dashboard.png", { fullPage: true });
});

test("study plan visual parity", async ({ page }) => {
  await page.goto("/study-plan", { waitUntil: "networkidle" });
  await expect(page).toHaveScreenshot("study-plan.png", { fullPage: true });
});
