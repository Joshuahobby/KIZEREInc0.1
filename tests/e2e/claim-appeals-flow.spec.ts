import { test, expect } from '@playwright/test';

/**
 * E2E test scenario for the claim appeals flow:
 * 1. Setup: Register User A (Finder), User B (Claimant), and Admin User.
 * 2. User A creates a "Lost" report.
 * 3. User B files an ownership claim for the report.
 * 4. User A rejects User B's claim.
 * 5. User B submits an appeal for the rejected claim.
 * 6. Admin User reviews and approves the appeal.
 * 7. Verify the claim status returns to "pending" for re-evaluation.
 */

test.describe('Claim Appeals Flow', () => {
  const uniqueId = Math.floor(Math.random() * 1000000);
  const finderUsername = `finder_${uniqueId}@example.com`;
  const claimantUsername = `claimant_${uniqueId}@example.com`;
  const reportTitle = `Lost Wallet - ${uniqueId}`;

  test('should complete the full claim appeal lifecycle', async ({ page }) => {
    test.setTimeout(240000); // Increase timeout further for this complex flow
    console.log('--- Phase 1: Registration ---');
    
    // Register Finder (User A)
    await page.goto('/auth');
    console.log('Navigated to /auth for Finder registration');
    await page.getByRole('tab', { name: /Create Account|register/i }).click();
    console.log('Switched to Register tab');
    
    const registerPanel = page.getByRole('tabpanel', { name: /Create Account/i });
    await registerPanel.locator('input[name="fullName"]').fill('Finder User');
    await registerPanel.locator('input[name="username"]').fill(finderUsername);
    await registerPanel.locator('input[name="password"]').fill('Password123!');
    await registerPanel.locator('input[name="confirmPassword"]').fill('Password123!');
    await registerPanel.locator('input[id="terms"]').check();
    console.log('Filled Finder registration form');
    
    const registrationSubmitBtn = registerPanel.getByRole('button', { name: /Create Account/i });
    await registrationSubmitBtn.waitFor({ state: 'visible' });
    await registrationSubmitBtn.click({ force: true });
    console.log('Clicked Finder registration button');
    
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    console.log('Finder registered successfully');
    await page.context().clearCookies();

    // Register Claimant (User B)
    await page.goto('/auth');
    console.log('Navigated to /auth for Claimant registration');
    await page.getByRole('tab', { name: /Create Account|register/i }).click();
    await page.waitForTimeout(1000); 
    
    const registerPanelB = page.getByRole('tabpanel', { name: /Create Account/i });
    await registerPanelB.locator('input[name="fullName"]').fill('Claimant User');
    await registerPanelB.locator('input[name="username"]').fill(claimantUsername);
    await registerPanelB.locator('input[name="password"]').fill('Password123!');
    await registerPanelB.locator('input[name="confirmPassword"]').fill('Password123!');
    await registerPanelB.locator('input[id="terms"]').check();
    console.log('Filled Claimant registration form');
    
    const submitBtnB = registerPanelB.getByRole('button', { name: /Create Account/i });
    await submitBtnB.waitFor({ state: 'visible' });
    await submitBtnB.click({ force: true });
    console.log('Clicked Claimant registration button');
    
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 30000 });
    console.log('Claimant registered successfully');
    await page.context().clearCookies();

    // --- 2. CREATE REPORT (User A: Finder) ---
    console.log('--- Phase 2: Create Report (Found) ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', finderUsername);
    await page.fill('input[name="password"]', 'Password123!');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 15000 });

    // Navigate to Create Report Wizard (Found)
    await page.goto('/lost-found?action=report-found');
    console.log('Navigated to Report Wizard (Found)');
    
    // Fill Step 1
    await page.getByLabel(/Item Name/i).fill(reportTitle);
    await page.getByLabel(/Select a Category/i).click();
    await page.getByRole('option', { name: /Electronics/i }).click();
    console.log('Selected category');
    
    await page.getByLabel(/Location/i).fill('Kigali City Center');
    await page.getByLabel(/Description/i).fill('Found a luxury wallet with some cards inside.');
    console.log('Filled Step 1');
    await page.getByRole('button', { name: /Next Step/i }).click();
    
    // Fill Step 2
    await page.getByLabel(/Contact Details/i).fill('Finder Contact: 0780000000');
    await page.getByLabel(/Security Challenge Question/i).fill('What are the initials on the card?');
    console.log('Filled Step 2');
    
    // Submit
    await page.getByRole('button', { name: /Submit Report|Finish|Pay/i }).click();
    console.log('Clicked Finish button');
    
    await expect(page.locator('text=Found item reported successfully').first()).toBeVisible({ timeout: 20000 });
    console.log('Report submitted successfully');

    // Find the report on Dashboard to get its ID
    await page.goto('/dashboard?tab=reports');
    console.log('Navigated to Dashboard Reports tab');
    
    // In Reports tab, it's a table. Wait for it to load.
    await expect(page.locator('table')).toBeVisible({ timeout: 15000 });
    
    const reportRow = page.locator('table tr').filter({ hasText: reportTitle }).first();
    await reportRow.click();
    
    // Wait for the report detail page - checking for either /report/ or /reports/
    await expect(page).toHaveURL(/\/report(s)?\/\d+/);
    
    const reportUrl = page.url();
    const reportId = reportUrl.split('/').pop();
    console.log(`Report captured with ID: ${reportId}`);
    await page.context().clearCookies();

    // --- 3. FILE CLAIM (User B: Owner) ---
    console.log('--- Phase 3: File Claim ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', claimantUsername);
    await page.fill('input[name="password"]', 'Password123!');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/dashboard/i, { timeout: 15000 });
    
    await page.goto(`/report/${reportId}`);
    console.log(`Navigated to Report ${reportId}`);
    
    // File Claim button should now be visible since it is a FOUND report
    await page.getByRole('button', { name: /File Ownership Claim|File Claim/i }).click();
    console.log('Clicked File Claim button');
    
    // Fill claim wizard
    await page.getByLabel(/Proof Of Ownership/i).fill('This is my item. I have the receipt. The initials are J.D.');
    await page.getByLabel(/Verification Question/i).fill('J.D.');
    await page.getByRole('button', { name: /Submit Claim/i }).click();
    
    await expect(page.locator('text=Claim submitted successfully').first()).toBeVisible();
    console.log('Claim filed successfully');
    
    await page.goto('/my-claims');
    console.log('Navigated to /my-claims, waiting for data...');
    
    // Wait for the table to be visible, which means loading is done and we have at least one claim
    const table = page.locator('table');
    await table.waitFor({ state: 'visible', timeout: 30000 });
    
    const claimRow = table.locator('tbody tr').first();
    await claimRow.waitFor({ state: 'visible', timeout: 15000 });
    const claimIdText = await claimRow.locator('td').first().innerText();
    const claimId = claimIdText.replace('#', '').trim();
    console.log(`Claim captured with ID: ${claimId}`);
    await page.context().clearCookies();

    // --- 4. REJECT CLAIM (User A: Finder) ---
    console.log('--- Phase 4: Reject Claim ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', finderUsername);
    await page.fill('input[name="password"]', 'Password123!');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard');

    await page.goto(`/claims/${claimId}`);
    // Finder sees the claim on their report
    await page.getByRole('button', { name: /Reject/i }).click();
    await page.getByLabel(/Reason for Rejection/i).fill('Not enough details to prove ownership.');
    console.log('Confirming Rejection...');
    await page.getByRole('button', { name: /Confirm Rejection/i }).click();
    console.log('Clicked Confirm Rejection button, waiting for toast or badge update');
    
    // Wait for success toast or status badge update
    await Promise.any([
      expect(page.getByText('Successfully rejected the claim.').first()).toBeVisible({ timeout: 20000 }),
      expect(page.getByText(/rejected/i).first()).toBeVisible({ timeout: 20000 })
    ]);
    
    console.log('Claim rejected successfully');
    await page.context().clearCookies();

    // --- 5. SUBMIT APPEAL (User B: Owner) ---
    console.log('--- Phase 5: Submit Appeal ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', claimantUsername);
    await page.fill('input[name="password"]', 'Password123!');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard');

    await page.goto(`/claims/${claimId}`);
    await page.getByRole('button', { name: /Appeal Decision/i }).click();
    await page.getByLabel(/Reason for Appeal/i).fill('I can provide more proof, like the brand of the wallet which is LV.');
    await page.getByRole('button', { name: /Submit Appeal/i }).click();
    
    await expect(page.locator('text=Appeal submitted successfully').first()).toBeVisible({ timeout: 15000 });
    console.log('Appeal submitted successfully');
    await page.context().clearCookies();

    // --- 6. ADMIN RESOLVE APPEAL ---
    console.log('--- Phase 6: Admin Resolve Appeal ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', 'admin'); 
    await page.fill('input[name="password"]', 'admin123');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/(dashboard|admin)/);

    await page.goto('/admin/claims');
    const appealsTab = page.getByRole('tab', { name: /Appeals/i });
    await appealsTab.waitFor({ state: 'visible', timeout: 30000 });
    await appealsTab.click();
    
    // Find our claim and resolve
    const appealRow = page.locator('tr').filter({ hasText: `#${claimId}` }).first();
    await expect(appealRow).toBeVisible({ timeout: 30000 });
    await appealRow.getByRole('button', { name: /Actions/i }).click();
    await page.getByText(/Resolve Appeal/i).click();
    
    await page.getByPlaceholder(/Explain why you are approving or rejecting this appeal/i).fill('Valid appeal. Finder should re-review.');
    await page.getByRole('button', { name: /Approve Appeal/i }).click();
    
    await expect(page.locator('text=Appeal Resolved').first()).toBeVisible({ timeout: 15000 });
    console.log('Appeal resolved by admin');
    await page.context().clearCookies();

    // --- 7. VERIFY STATUS (User B: Owner) ---
    console.log('--- Phase 7: Final Verification ---');
    await page.goto('/auth');
    await page.getByRole('tab', { name: /Sign In|login/i }).click();
    await page.fill('input[name="username"]', claimantUsername);
    await page.fill('input[name="password"]', 'Password123!');
    await page.locator('form').first().locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/dashboard');

    await page.goto(`/claims/${claimId}`);
    // Status should be "pending" again (re-opened)
    await page.waitForTimeout(2000);
    await expect(page.getByText(/pending|Under Review/i).first()).toBeVisible({ timeout: 20000 });
    await expect(page.getByText(/Claim Appeal: Approved/i).first()).toBeVisible({ timeout: 20000 });
    console.log('Test completed successfully!');
  });
});
