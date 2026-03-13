import { test, expect } from '@playwright/test';

test.describe('Tenant Management UI Flow', () => {
    test('should allow navigating to and opening the tenant creation modal', async ({ page }) => {
        // 1. Navigate to Admin Console 
        await page.goto('/admin-console');

        // Wait for console to initialize - it shows "INITIALIZING CONSOLE..." initially
        await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

        // 2. Select the 'Tenants' tab
        // In the new layout, it's under 'Masters' parent tab.
        // It might be auto-selected, but let's be explicit if needed.
        const tenantTab = page.locator('button:has-text("Tenants")');
        await expect(tenantTab).toBeVisible();
        await tenantTab.click();

        // 3. Verify the Tenant Directory header is visible (h1 in SuperTenantManager)
        await expect(page.locator('h1')).toContainText('Tenant Directory');

        // 4. Click 'Add Tenant' button
        const addBtn = page.locator('button:has-text("+ Add Tenant")');
        await expect(addBtn).toBeVisible();
        await addBtn.click();

        // 5. Verify Modal is open
        await expect(page.locator('h3')).toContainText('Add New Tenant');

        // 6. Fill in mandatory fields
        const testCode = `TEST-${Math.floor(Math.random() * 1000)}`;
        await page.fill('input[placeholder="e.g. HED"]', testCode);
        await page.fill('input[placeholder="e.g. Higher Education Dept"]', 'Test Automation Tenant');

        // 7. Verify the inputs reflect the data
        await expect(page.locator('input[placeholder="e.g. HED"]')).toHaveValue(testCode);

        // 8. Close the modal
        await page.click('button:has-text("Cancel")');
        await expect(page.locator('h3')).not.toBeVisible();
    });
});
