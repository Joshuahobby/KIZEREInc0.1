import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Item Registration Lifecycle E2E Test
 */

test.describe('Item Registration Lifecycle', () => {
  const uniqueId = Math.floor(Math.random() * 100000);
  const username = `itemreg_${uniqueId}@test.com`;
  const itemName = `Test MacBook Pro ${uniqueId}`;
  const itemSerial = `SN-${uniqueId}-MBP`;
  
  // ES module way to get __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const testImagePath = path.join(__dirname, 'test-image.png');
  
  test.beforeAll(async () => {
    // Create a 1x1 transparent PNG if it doesn't exist
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));
  });

  test.afterAll(async () => {
    if (fs.existsSync(testImagePath)) {
      try {
        fs.unlinkSync(testImagePath);
      } catch (e) {
        console.error('Failed to cleanup test image:', e);
      }
    }
  });

  test('should complete the full item registration lifecycle', async ({ page }) => {
    test.setTimeout(120000);

    // --- Phase 1: Register & Login ---
    console.log('--- Phase 1: Register & Login ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Create Account|register/i }).click();

    const registerPanel = page.getByRole('tabpanel', { name: /Create Account/i });
    await registerPanel.locator('input[name="fullName"]').fill('Item Reg User');
    await registerPanel.locator('input[name="username"]').fill(username);
    await registerPanel.locator('input[name="password"]').fill('password123');
    await registerPanel.locator('input[name="confirmPassword"]').fill('password123');
    await registerPanel.locator('input[id="terms"]').check();

    const submitBtn = registerPanel.getByRole('button', { name: /Create Account/i });
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click({ force: true });
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    console.log('Registered and on dashboard');

    // --- Phase 2: Navigate to Item Registration ---
    console.log('--- Phase 2: Navigate to Item Registration ---');
    await page.goto('/register-item');
    await page.waitForTimeout(2000);
    await expect(page.getByText(/Register Your Item/i).first()).toBeVisible({ timeout: 10000 });
    console.log('Item registration page loaded');

    // --- Phase 3: Fill Step 1 (Item Details) ---
    console.log('--- Phase 3: Fill Item Details ---');
    const nameInput = page.locator('input[name="name"]');
    await nameInput.waitFor({ state: 'visible', timeout: 10000 });
    await nameInput.fill(itemName);

    await page.locator('[role="combobox"]').first().click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: /Electronics/i }).click();
    
    // Click "Review & Submit" to go to Verification step (Step 2 in UI, but Step 1 index in code)
    await page.getByRole('button', { name: /Review & Submit/i }).click();
    await page.waitForTimeout(1000);
    console.log('Advanced to Step 2: Verification');

    // --- Phase 4: Fill Step 2 (Verification) ---
    console.log('--- Phase 4: Fill Verification ---');
    
    // 1. Fill Unique Identifier
    const identifierInput = page.locator('input[name="uniqueIdentifier"]');
    await identifierInput.fill(itemSerial);
    console.log('Filled unique identifier');

    // 2. Upload Photo
    console.log('Uploading item photo...');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: /Add|Upload/i }).first().click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(testImagePath);
    
    // Wait for upload processing
    await page.waitForTimeout(2000);
    console.log('Photo uploaded');

    // 3. Click "Review & Submit" to go to Confirm step
    const reviewBtn = page.getByRole('button', { name: /Review & Submit/i });
    await expect(reviewBtn).toBeEnabled({ timeout: 10000 });
    await reviewBtn.click();
    await page.waitForTimeout(1000);
    console.log('On Step 3: Confirm step');

    // --- Phase 5: Submit ---
    console.log('--- Phase 5: Submit Registration ---');
    const finalSubmitBtn = page.getByRole('button', { name: /Complete Registration|Finish|Submit/i }).first();
    await finalSubmitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await finalSubmitBtn.click();

    // Wait for success screen
    await expect(
      page.getByText(/successfully|Registration Complete|QR Code/i).first()
    ).toBeVisible({ timeout: 20000 });
    console.log('Item registered successfully');

    // --- Phase 6: Verify on My Items ---
    console.log('--- Phase 6: Verify on My Items ---');
    await page.goto('/my-items');
    await page.waitForTimeout(2000);
    await expect(page.getByText(itemName).first()).toBeVisible({ timeout: 15000 });
    console.log('Item found on My Items page');

    console.log('Item Registration Lifecycle test completed!');
  });
});
