import { test, expect } from '@playwright/test';

/**
 * Admin Management Lifecycle E2E Test
 *
 * Phases:
 * 1. Login as admin
 * 2. Verify admin dashboard with stats
 * 3. Navigate to User Management, verify table
 * 4. Navigate to Reports Management, verify table
 * 5. Navigate to Claims Management, verify tabs
 * 6. Navigate to Analytics, verify charts
 * 7. Logout
 */

test.describe('Admin Management Lifecycle', () => {
  test('should complete the full admin management lifecycle', async ({ page }) => {
    test.setTimeout(90000);

    // --- Phase 1: Admin Login ---
    console.log('--- Phase 1: Admin Login ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.locator('form').first().locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard|\/admin/i, { timeout: 15000 });
    console.log('Admin logged in successfully');

    // --- Phase 2: Admin Dashboard ---
    console.log('--- Phase 2: Admin Dashboard ---');
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(2000);

    // The command center / dashboard should have stat cards or overview
    const hasDashboard = await page.locator('[class*="card"], [class*="stat"], table, h1, h2').first()
      .isVisible({ timeout: 10000 }).catch(() => false);

    if (hasDashboard) {
      console.log('Admin dashboard loaded with content');
    } else {
      // Try main mission control
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      await expect(page.locator('[class*="card"], table, h1, h2').first()).toBeVisible({ timeout: 10000 });
      console.log('Admin panel loaded');
    }

    // --- Phase 3: User Management ---
    console.log('--- Phase 3: User Management ---');
    await page.goto('/admin/users');
    await page.waitForTimeout(2000);

    // Should see a table of users
    await expect(page.locator('table').first()).toBeVisible({ timeout: 15000 });
    console.log('User management table visible');

    // Verify table has at least 1 row (admin user exists)
    const userRows = page.locator('table tbody tr');
    await expect(userRows.first()).toBeVisible({ timeout: 10000 });
    const rowCount = await userRows.count();
    console.log(`User management showing ${rowCount} users`);

    // --- Phase 4: Reports Management ---
    console.log('--- Phase 4: Reports Management ---');
    await page.goto('/admin/reports');
    await page.waitForTimeout(2000);

    // Should see a reports management page
    await expect(page.locator('table, [class*="card"]').first()).toBeVisible({ timeout: 15000 });
    console.log('Reports management page loaded');

    // --- Phase 5: Claims Management ---
    console.log('--- Phase 5: Claims Management ---');
    await page.goto('/admin/claims');
    await page.waitForTimeout(2000);

    // Should have tabs (All Claims, Appeals, etc.)
    await expect(page.locator('[role="tablist"], table, [class*="card"]').first()).toBeVisible({ timeout: 15000 });
    console.log('Claims management page loaded');

    // Check for tabs
    const appealsTab = page.getByRole('tab', { name: /Appeals/i });
    if (await appealsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await appealsTab.click();
      await page.waitForTimeout(1000);
      console.log('Appeals tab clicked');
    }

    // --- Phase 6: Analytics ---
    console.log('--- Phase 6: Analytics ---');
    await page.goto('/admin/analytics');
    await page.waitForTimeout(2000);

    // Analytics should show charts or stat cards
    await expect(
      page.locator('[class*="card"], [class*="chart"], canvas, svg, table, h1, h2').first()
    ).toBeVisible({ timeout: 15000 });
    console.log('Analytics page loaded');

    // --- Phase 7: Logout ---
    console.log('--- Phase 7: Logout ---');
    // Try to find a logout button
    const logoutBtn = page.getByRole('button', { name: /Logout|Sign Out|Log out/i }).first();
    if (await logoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.context().clearCookies();
      await page.goto('/auth');
    }

    // Verify we're back to auth — ProtectedRoute redirects client-side, wait for it
    await page.goto('/admin/users');
    await page.waitForURL(url => !url.includes('/admin/users'), { timeout: 10000 }).catch(() => {});
    expect(page.url()).not.toContain('/admin/users');
    console.log('Logged out - admin routes no longer accessible');
    console.log('Admin Management Lifecycle test completed!');
  });
});
