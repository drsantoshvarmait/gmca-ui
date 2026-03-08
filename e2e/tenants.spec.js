import { test, expect } from '@playwright/test';

test.describe('Tenant Management UI Flow', () => {
    test('should allow navigating to and opening the tenant creation modal', async ({ page }) => {
        // 1. Navigate to Admin Console 
        // Note: In local dev, you'll need to be logged in for this to succeed
        await page.goto('/admin-console');

        // 2. Select the 'Tenants' tab (it's the first one by default)
        const tenantTab = page.locator('button:has-text("Tenants")');
        await expect(tenantTab).toBeVisible();
        await tenantTab.click();

        // 3. Verify the Tenant Management header is visible
        await expect(page.locator('h2')).toContainText('Tenant Management');

        // 4. Click 'Create New Tenant' button
        const createBtn = page.locator('button:has-text("+ Create New Tenant")');
        await expect(createBtn).toBeVisible();
        await createBtn.click();

        // 5. Verify Modal is open
        await expect(page.locator('h3')).toContainText('Register New Tenant');

        // 6. Fill in mandatory fields
        const testCode = `TEST-${Math.floor(Math.random() * 1000)}`;
        await page.fill('input[placeholder="e.g. MEDD"]', testCode);
        await page.fill('input[placeholder="e.g. Medical Education Department"]', 'Test Automation Tenant');

        // 7. Verify the inputs reflect the data
        await expect(page.locator('input[placeholder="e.g. MEDD"]')).toHaveValue(testCode);

        // 8. Close the modal (Safe test: don't actually submit to avoid cluttering DB unless requested)
        await page.click('button:has-text("Cancel")');
        await expect(page.locator('h3')).not.toBeVisible();
    });
});
