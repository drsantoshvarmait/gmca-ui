import { test, expect } from '@playwright/test';

test.describe.skip('Authentication Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/.*login/);
    });

    test('should show login form elements', async ({ page }) => {
        await page.goto('/login');
        // The title in premium UI is "System Login" by default
        await expect(page.locator('h2')).toContainText('Login');
        await expect(page.locator('input[placeholder="e.g. name@department.gov"]')).toBeVisible();
        await expect(page.locator('input[placeholder="••••••••"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="e.g. name@department.gov"]', 'wrong@example.com');
        await page.fill('input[placeholder="••••••••"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for potential error message box (div with styling)
        // In premium UI, it contains a ⚠️ span and the message
        const errorBox = page.locator('div:has-text("⚠️")');
        await expect(errorBox).toBeVisible();
    });
});
