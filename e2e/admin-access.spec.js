import { test, expect } from '@playwright/test';

test.describe('Admin Functional Access Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Supabase Auth User
        await page.route('**/auth/v1/user', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-admin-id',
                    email: 'admin@example.com',
                    app_metadata: {},
                    user_metadata: {},
                    aud: 'authenticated',
                    role: 'authenticated'
                })
            });
        });

        // Mock Supabase Session
        await page.route('**/auth/v1/token*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    access_token: 'fake-token',
                    token_type: 'bearer',
                    expires_in: 3600,
                    refresh_token: 'fake-refresh',
                    user: { id: 'test-admin-id', email: 'admin@example.com' }
                })
            });
        });

        // Mock Profile role check
        await page.route('**/rest/v1/profiles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-admin-id',
                    role: 'SUPER_ADMIN',
                    email: 'admin@example.com'
                })
            });
        });

        // Mock User Org Roles
        await page.route('**/rest/v1/user_org_roles*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    organisation_id: 'test-org-id',
                    role: 'ADMIN',
                    organisations: {
                        organisation_name: 'Test Org',
                        organisation_code: 'TESTORG',
                        organisation_type: 'Administrative Unit',
                        tenant_id: 'test-tenant-id'
                    }
                }])
            });
        });

        // Mock Tenants check
        await page.route('**/rest/v1/tenants*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    tenant_id: 'test-tenant-id',
                    tenant_name: 'Test Tenant',
                    tenant_code: 'TEST'
                }])
            });
        });

        // Mock Control Tower Summary
        await page.route('**/rest/v1/v_admin_workflow_dashboard*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    active_count: 5,
                    pending_count: 10,
                    overdue_count: 2,
                    escalation_count: 1
                })
            });
        });

        // Inject session into localStorage
        await page.addInitScript(() => {
            const projectRef = 'aaritujhokbxezuxcqnm';
            const session = {
                access_token: 'fake-token',
                token_type: 'bearer',
                expires_in: 3600,
                refresh_token: 'fake-refresh',
                user: {
                    id: 'test-admin-id',
                    email: 'admin@example.com',
                    app_metadata: {},
                    user_metadata: {},
                    aud: 'authenticated',
                    role: 'authenticated'
                },
                expires_at: Math.floor(Date.now() / 1000) + 3600
            };
            window.localStorage.setItem(`sb-${projectRef}-auth-token`, JSON.stringify(session));
        });
    });

    test('Verify Super Admin Console Access', async ({ page }) => {
        await page.goto('/superadmin-console');
        
        // Wait for initializing to finish
        const initializing = page.locator('text=INITIALIZING CONSOLE...');
        await expect(initializing).not.toBeVisible({ timeout: 15000 });

        // Check for Super Admin Console header
        await expect(page.locator('h1')).toContainText(/Super Admin Console/i);
    });

    test('Verify Organization Admin Console Access', async ({ page }) => {
        // Navigating with a context code
        await page.goto('/GMCA/admin-console');

        await expect(page.locator('text=INITIALIZING CONSOLE...')).not.toBeVisible({ timeout: 15000 });

        // Check for Tenant Admin Console header
        await expect(page.locator('h1')).toContainText(/GMCA Admin Console/i);
    });

    test('Verify Admin Workflows Access', async ({ page }) => {
        await page.goto('/admin/workflows');
        
        // This page usually contains a list or builder for workflows
        await expect(page.locator('h2, h1')).toContainText(/Workflow/i);
    });

    test('Verify Control Tower Access', async ({ page }) => {
        await page.goto('/admin/control-tower');
        
        // Wait for loading
        await expect(page.locator('text=Loading...')).not.toBeVisible({ timeout: 15000 });
        
        // Control tower should have specific indicators
        await expect(page.locator('h2, h1')).toContainText(/Workflow Control Tower/i);
    });
});
