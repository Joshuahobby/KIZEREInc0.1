import { test, expect } from "@playwright/test";

test.describe("Claim Account Flow", () => {
  test("Claim Account page renders and validates inputs", async ({ page }) => {
    await page.goto("/claim-account");

    await expect(page.getByRole("heading", { name: /Claim Your Account/i })).toBeVisible();

    // Fill in invalid data
    await page.fill('input[placeholder="e.g. 1199880012345678"]', "123");
    await page.fill('input[placeholder="+250 7XX XXX XXX"]', "123");
    
    // Click submit
    await page.getByRole("button", { name: /Send Verification Code/i }).click();

    // Expect an error toast or validation message
    await expect(page.getByText(/Please enter valid National ID/i)).toBeVisible();
  });
});
