-- ==========================================
-- SGV PLATFORM INITIAL SEED DATA
-- ==========================================

-- Create Default Tenant
insert into core.tenants (
    tenant_id,
    tenant_name,
    tenant_code,
    status,
    created_at
)
values (
    gen_random_uuid(),
    'SGV Platform',
    'SGV',
    'ACTIVE',
    now()
)
on conflict do nothing;


-- ==========================================
-- Create Super Admin Profile
-- ==========================================

insert into core.profiles (
    id,
    email,
    role,
    tenant_id,
    created_at
)
select
    auth.users.id,
    auth.users.email,
    'SUPER_ADMIN',
    t.tenant_id,
    now()
from auth.users
cross join core.tenants t
where auth.users.email = 'admin@sgv.local'
limit 1
on conflict do nothing;


-- ==========================================
-- Welcome Notification
-- ==========================================

insert into core.notifications (
    id,
    user_id,
    message,
    type,
    created_at
)
select
    gen_random_uuid(),
    id,
    'Welcome to SGV Platform',
    'system',
    now()
from core.profiles
on conflict do nothing;