import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/.*login/);
    });

    test('should show login form elements', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('h2')).toContainText('Login');
        await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
        await expect(page.locator('input[placeholder="Password"]')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show error on invalid credentials', async ({ page }) => {
        await page.goto('/login');
        await page.fill('input[placeholder="Email"]', 'wrong@example.com');
        await page.fill('input[placeholder="Password"]', 'wrongpassword');
        await page.click('button[type="submit"]');

        // Wait for potential error message
        const errorMessage = page.locator('p[style*="color: red"]');
        await expect(errorMessage).toBeVisible();
    });
});
