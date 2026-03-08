-- =====================================================
-- FINANCE MODULE TESTING SEED SCRIPT
-- Purpose: Populates the finance schema with dummy data
-- linked to your first available tenant.
-- =====================================================

DO $$
DECLARE
    v_tenant_id uuid;
    v_user_id uuid;
    v_period_id uuid;
    v_cat_it_id uuid;
    v_cat_hr_id uuid;
    v_alloc_it_id uuid;
BEGIN
    -- 1. Get the first tenant and its first user to associate data
    SELECT tenant_id INTO v_tenant_id FROM core.tenants LIMIT 1;
    SELECT user_id INTO v_user_id FROM core.app_users WHERE tenant_id = v_tenant_id LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'No tenant found. Please create a tenant first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Seeding data for Tenant: %', v_tenant_id;

    -- 2. Create Budget Period (FY 2026)
    INSERT INTO finance.budget_periods (tenant_id, name, start_date, end_date, status)
    VALUES (v_tenant_id, 'FY 2026', '2026-01-01', '2026-12-31', 'OPEN')
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_period_id;

    -- 3. Create Categories
    INSERT INTO finance.budget_categories (tenant_id, name, description)
    VALUES (v_tenant_id, 'IT & Cloud', 'Software licenses, AWS, and Hardware')
    RETURNING id INTO v_cat_it_id;

    INSERT INTO finance.budget_categories (tenant_id, name, description)
    VALUES (v_tenant_id, 'HR & Training', 'Staff welfare and professional development')
    RETURNING id INTO v_cat_hr_id;

    -- 4. Create Allocations (IT: $100k, HR: $50k)
    INSERT INTO finance.budget_allocations (tenant_id, period_id, category_id, amount, currency)
    VALUES (v_tenant_id, v_period_id, v_cat_it_id, 100000.00, 'USD')
    RETURNING id INTO v_alloc_it_id;

    INSERT INTO finance.budget_allocations (tenant_id, period_id, category_id, amount, currency)
    VALUES (v_tenant_id, v_period_id, v_cat_hr_id, 50000.00, 'USD');

    -- 5. Create some dummy expenses for IT
    INSERT INTO finance.budget_expenses (tenant_id, allocation_id, amount, description, expense_date, status, incurred_by)
    VALUES (v_tenant_id, v_alloc_it_id, 1200.50, 'Monthly AWS Bill - February', '2026-02-15', 'APPROVED', v_user_id);

    INSERT INTO finance.budget_expenses (tenant_id, allocation_id, amount, description, expense_date, status, incurred_by)
    VALUES (v_tenant_id, v_alloc_it_id, 4500.00, 'New Macbook Pro - Dev Team', '2026-03-01', 'PENDING', v_user_id);

    INSERT INTO finance.budget_expenses (tenant_id, allocation_id, amount, description, expense_date, status, incurred_by)
    VALUES (v_tenant_id, v_alloc_it_id, 300.00, 'GitHub Enterprise Subscription', '2026-03-05', 'APPROVED', v_user_id);

    RAISE NOTICE 'Finance module seeding complete.';
END $$;
