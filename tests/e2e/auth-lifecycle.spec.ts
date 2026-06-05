import { test, expect } from '@playwright/test';

/**
 * Authentication & Profile Lifecycle E2E Test
 */

test.describe('Auth & Profile Lifecycle', () => {
  const uniqueId = Math.floor(Math.random() * 100000);
  const username = `lifecycle_user_${uniqueId}@test.com`;
  const fullName = 'Lifecycle Test User';
  const newFullName = 'Updated Lifecycle User';

  test.beforeEach(async ({ page }) => {
    // Suppress the recruitment popup during tests
    await page.addInitScript(() => {
      window.localStorage.setItem('hide-recruitment', 'true');
    });
  });

  test('should complete the full auth & profile lifecycle', async ({ page }) => {
    test.setTimeout(150000); // Increase timeout for slow CI environments

    // --- Phase 1: Registration ---
    console.log('--- Phase 1: Registration ---');
    await page.goto('/auth');
    
    // Switch to Register tab
    await page.getByRole('tab', { name: /create account|register/i }).click();

    const registerPanel = page.getByRole('tabpanel', { name: /create account/i });
    await registerPanel.locator('input[name="fullName"]').fill(fullName);
    await registerPanel.locator('input[name="username"]').fill(username);
    await registerPanel.locator('input[name="password"]').fill('Password123!');
    await registerPanel.locator('input[name="confirmPassword"]').fill('Password123!');
    await registerPanel.locator('input[id="terms"]').check();

    // Click register button - use button[type="submit"] to avoid strict mode violations with the tab itself
    const registerBtn = registerPanel.locator('button[type="submit"]');
    await registerBtn.waitFor({ state: 'visible' });
    await registerBtn.click({ force: true });

    // --- Phase 2: Navigate to Dashboard ---
    console.log('--- Phase 2: Navigate to Dashboard ---');
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    // Check for "Welcome" heading or "Dashboard" link in navigation
    await expect(page.getByRole('heading', { name: /Welcome|Dashboard/i }).or(page.getByRole('link', { name: /Dashboard/i })).first()).toBeVisible({ timeout: 25000 });
    console.log('Registration success');
    await page.waitForTimeout(3000); // Give session time to stabilize

    // --- Phase 3: Profile Update ---
    console.log('--- Phase 3: Profile Update ---');
    await page.goto('/profile');
    
    // We must click "Edit Profile" to reveal the form
    const editBtn = page.getByRole('button', { name: /Edit Profile/i }).first();
    await editBtn.waitFor({ state: 'visible', timeout: 20000 });
    await editBtn.click();

    const nameInput = page.locator('input[name="fullName"]');
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.clear();
    await nameInput.fill(newFullName);
    
    // ProfileEditForm has a "Save" button (t("common.save"))
    await page.getByRole('button', { name: /Save|Update/i }).first().click();
    await expect(page.getByText(/successfully|updated/i).first()).toBeVisible({ timeout: 20000 });
    console.log('Profile updated');

    console.log('--- Phase 4: Logout & Relogin ---');
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    
    // Ensure sidebar is expanded if needed, or target the button directly
    const logoutBtn = page.getByTestId('logout-button').first();
    await expect(logoutBtn).toBeVisible({ timeout: 15000 });
    await logoutBtn.scrollIntoViewIfNeeded();
    await logoutBtn.click();
    // signOut() redirects to "/" (the landing page)
    await page.waitForTimeout(2000);
    // Use a regex that matches the base URL with or without trailing slash
    await expect(page).toHaveURL(/.*:5000\/?$/i, { timeout: 15000 });

    // Navigate to auth page for re-login
    await page.goto('/auth');
    await page.waitForTimeout(1000);

    // Login with credentials - name matches t('auth.signIn')
    const loginPanel = page.getByRole('tabpanel', { name: /sign in|login/i });
    await loginPanel.locator('input[name="username"]').fill(username);
    await loginPanel.locator('input[name="password"]').fill('Password123!');
    // Use button[type="submit"] to avoid strict mode violations with the tab itself
    await loginPanel.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    console.log('Relogin success');
  });
});
