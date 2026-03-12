import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

/**
 * Report & Search Lifecycle E2E Test
 */

test.describe('Report & Search Lifecycle', () => {
  const uniqueId = Math.floor(Math.random() * 100000);
  const username = `reporter_${uniqueId}@test.com`;
  const foundTitle = `Found Bag ${uniqueId}`;
  const lostTitle = `Lost Phone ${uniqueId}`;
  
  // ES module way to get __dirname
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const testImagePath = path.join(__dirname, 'test-image-report.png');
  
  test.beforeAll(async () => {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    fs.writeFileSync(testImagePath, Buffer.from(pngBase64, 'base64'));
  });

  test.afterAll(async () => {
    if (fs.existsSync(testImagePath)) {
      try { fs.unlinkSync(testImagePath); } catch (e) {}
    }
  });

  test.beforeEach(async ({ page }) => {
    // Suppress the recruitment popup during tests
    await page.addInitScript(() => {
      window.localStorage.setItem('hide-recruitment', 'true');
    });
  });

  test('should complete the full report & search lifecycle', async ({ page }) => {
    test.setTimeout(180000); // Increase timeout for complex lifecycle

    // --- Phase 1: Register & Login ---
    console.log('--- Phase 1: Register & Login ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Create Account|register/i }).click();

    const registerPanel = page.getByRole('tabpanel', { name: /Create Account/i });
    await registerPanel.locator('input[name="fullName"]').fill('Reporter User');
    await registerPanel.locator('input[name="username"]').fill(username);
    await registerPanel.locator('input[name="password"]').fill('password123');
    await registerPanel.locator('input[name="confirmPassword"]').fill('password123');
    await registerPanel.locator('input[id="terms"]').check();

    const submitBtn = registerPanel.getByRole('button', { name: /Create Account/i });
    await submitBtn.waitFor({ state: 'visible' });
    await submitBtn.click({ force: true });
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    console.log('Registered and on dashboard');

    // --- Phase 2: Create Found Report ---
    console.log('--- Phase 2: Create Found Report ---');
    await page.goto('/lost-found?action=report-found');
    await page.waitForTimeout(2000);

    // Step 1: Basic Information
    console.log('Filling Found report Step 1...');
    await page.getByPlaceholder(/Black Leather Wallet|Item Name/i).fill(foundTitle);
    
    await page.getByRole('combobox', { name: /Select a category/i }).click();
    await page.getByRole('option', { name: /Bags/i }).click();
    
    await page.getByPlaceholder(/Taxi Park|Location/i).fill('Nyabugogo Bus Station');
    await page.getByPlaceholder(/Include distinguishing features|Description/i).fill('Found a blue leather bag with documents inside near the station.');
    
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(1000);
    console.log('Found report Step 1 completed');

    // Step 2: Contact & Security
    console.log('Filling Found report Step 2...');
    await page.getByPlaceholder(/Phone number|instructions/i).fill('Contact: 0782222222');
    await page.getByPlaceholder(/Verification question/i).fill('What brand is the bag?');
    
    // Submit
    await page.getByRole('button', { name: /Submit Report/i }).click();
    
    // Wait for success toast
    await expect(
      page.getByText(/successfully|reported/i).first()
    ).toBeVisible({ timeout: 20000 });
    console.log('Found report submitted successfully');

    // --- Phase 3: Verify on Dashboard ---
    console.log('--- Phase 3: Verify on Dashboard ---');
    await page.goto('/dashboard?tab=reports');
    await page.waitForTimeout(3000);
    
    // Dashboard uses a Table with TableCell for titles
    await expect(page.getByText(foundTitle).first()).toBeVisible({ timeout: 25000 });
    console.log('Found report visible on dashboard table');

    // --- Phase 4: Create Lost Report ---
    console.log('--- Phase 4: Create Lost Report ---');
    await page.goto('/lost-found?action=report-lost');
    await page.waitForTimeout(2000);

    // Step 1
    console.log('Filling Lost report Step 1...');
    await page.getByPlaceholder(/Black Leather Wallet|Item Name/i).fill(lostTitle);
    
    await page.getByRole('combobox', { name: /Select a category/i }).click();
    await page.getByRole('option', { name: /Phones/i }).click();
    
    await page.getByPlaceholder(/Taxi Park|Location/i).fill('Kigali Convention Center');
    await page.getByPlaceholder(/Include distinguishing features|Description/i).fill('I lost my Samsung Galaxy near the parking area at around 3pm.');
    
    await page.getByRole('button', { name: /Next Step/i }).click();
    await page.waitForTimeout(1000);
    console.log('Lost report Step 1 completion');

    // Step 2
    console.log('Filling Lost report Step 2...');
    await page.getByPlaceholder(/Phone number|instructions/i).fill('Call me: 0781111111');
    
    const rewardInput = page.getByPlaceholder(/Reward Amount/i);
    if (await rewardInput.isVisible()) {
      await rewardInput.fill('0'); // Use 0 reward to ensure it's free and searchable immediately
    }

    // Submit
    await page.getByRole('button', { name: /Pay & Submit|Submit/i }).click();
    
    await expect(
      page.getByText(/successfully|reported/i).first()
    ).toBeVisible({ timeout: 20000 });
    console.log('Lost report submitted successfully');

    // --- Phase 5: Search ---
    console.log('--- Phase 5: Search for Reports ---');
    await page.goto('/search');
    await page.waitForTimeout(3000);
    
    // Ensure search page is loaded - look for the hero search input
    await expect(page.getByText(/Search & Discovery|EXPLORE HUB/i).first()).toBeVisible({ timeout: 15000 });
    
    // The hero search input uses the searchFilters.searchPlaceholder translation
    const heroSearchInput = page.getByPlaceholder(/Keyword, Serial Number/i);
    await expect(heroSearchInput).toBeVisible({ timeout: 15000 });
    
    // Type the lost title into the hero search input (triggers search on each keystroke via onChange)
    await heroSearchInput.fill(lostTitle);
    await page.waitForTimeout(3000);
    
    // Click the Apply button in the horizontal SearchFilters to trigger the search with filters
    const applyBtn = page.getByRole('button', { name: /Apply/i }).first();
    
    // Intercept search request
    const searchResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/search') && response.status() === 200,
      { timeout: 30000 }
    );
    await applyBtn.click();
    await searchResponsePromise;
    console.log('Search request completed for Lost item');
    await page.waitForTimeout(3000);
    
    // Assert search result visibility
    await expect(page.getByText(lostTitle).first()).toBeVisible({ timeout: 25000 });
    console.log('Search verified for Lost item');

    // --- Phase 6: Search with Filters ---
    console.log('--- Phase 6: Search with Filters (Found Item) ---');
    
    // Navigate directly to the search URL with the correct type filter.
    // The search page reads filters from URL params via useEffect, so this is
    // the most reliable way to set the filter state. The UI combobox interaction
    // was unreliable because the initialFilters useEffect re-syncs from URL and
    // could revert the visual selection.
    const foundSearchUrl = `/search?q=${encodeURIComponent(foundTitle)}&type=found`;
    console.log(`Navigating to: ${foundSearchUrl}`);
    
    const searchResponseForFound = page.waitForResponse(response => 
      response.url().includes('/api/search') && response.status() === 200,
      { timeout: 45000 }
    );
    await page.goto(foundSearchUrl);
    await searchResponseForFound;
    
    console.log('Search request completed for Found item');
    
    // Wait for results to render
    await page.waitForTimeout(3000);
    
    // Step 7: Verify search results
    await expect(page.getByRole('heading', { name: foundTitle }).first()).toBeVisible({ timeout: 45000 });
    console.log('Search verified for Found item');

    console.log('Report & Search Lifecycle test completed!');
  });
});
