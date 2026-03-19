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

        // Mock Tenant Modules
        await page.route('**/rest/v1/tenant_modules*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { module_code: 'masters', is_enabled: true },
                    { module_code: 'directory', is_enabled: true },
                    { module_code: 'control-tower', is_enabled: true }
                ])
            });
        });

        // Mock Bottleneck Heatmap
        await page.route('**/rest/v1/workflow_bottleneck_heatmap*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { office_id: 'off-1', office_name: 'Main Office', pending_tasks: 3 }
                ])
            });
        });

        // Mock Running Workflows Monitor
        await page.route('**/rest/v1/v_running_workflows_monitor*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { workflow_instance_id: 'inst-1', person_id: 'User 1', elapsed_time: '2h', current_status: 'Active' }
                ])
            });
        });

        // Mock Audit Logs
        await page.route('**/rest/v1/audit_logs*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { created_at: new Date().toISOString(), action: 'Test Action' }
                ])
            });
        });

        // Mock SOP Workflows
        await page.route('**/rest/v1/sop_workflow*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    workflow_id: 'wf-1',
                    workflow_name: 'Test Workflow',
                    status: 'DRAFT',
                    scope: 'TENANT',
                    is_template: false,
                    created_at: new Date().toISOString()
                }])
            });
        });

        // Mock Clone Workflow RPC
        await page.route('**/rest/v1/rpc/clone_workflow*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ workflow_id: 'wf-cloned' })
            });
        });

        // Mock Organisations (Already partly mocked via user_org_roles join, but direct calls exist)
        await page.route('**/rest/v1/organisations*', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([{
                    organisation_id: 'test-org-id',
                    organisation_name: 'Test Org',
                    organisation_type_id: 'type-1'
                }])
            });
        });

        // Inject session into localStorage
        await page.addInitScript(() => {
            const projectRefs = ['aaritujhokbxezuxcqnm', 'risrmpdbvoafowdvnonn'];
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
            projectRefs.forEach(ref => {
                window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
            });
        });
    });

    test('Verify Super Admin Console Access', async ({ page }) => {
        await page.goto('/superadmin-console');
        
        // Wait for initializing to finish
        const initializing = page.locator('text=INITIALIZING CONSOLE...');
        await expect(initializing).not.toBeVisible({ timeout: 15000 });

        // Check for Super Admin Console header via explicit ID
        await expect(page.locator('#admin-console-header')).toContainText(/Super Admin Console/i);
    });

    test('Verify Organization Admin Console Access', async ({ page }) => {
        // Navigating with a context code
        await page.goto('/GMCA/admin-console');

        await expect(page.locator('text=INITIALIZING CONSOLE...')).not.toBeVisible({ timeout: 15000 });

        // Check for Tenant Admin Console header via explicit ID
        await expect(page.locator('#admin-console-header')).toContainText(/GMCA Admin Console/i);
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
