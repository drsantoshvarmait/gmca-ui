-- ============================================
-- 0005_role_permission_matrix
-- Governance Grade Role-Based Access Control
-- ============================================

-- =====================================================
-- 1️⃣ PERMISSIONS MASTER TABLE
-- =====================================================

create table if not exists core.permissions (
    permission_id uuid primary key default gen_random_uuid(),
    permission_code text not null unique,
    module text not null,
    action text not null,
    description text,
    created_at timestamptz not null default now()
);

do $$ begin
    if not exists (select 1 from pg_indexes where indexname = 'idx_permissions_module') then
        create index idx_permissions_module on core.permissions(module);
    end if;
end $$;


-- =====================================================
-- 2️⃣ ROLE-PERMISSION MAPPING
-- =====================================================

create table if not exists core.role_permissions (
    role_id uuid not null
        references core.roles(role_id) on delete cascade,

    permission_id uuid not null
        references core.permissions(permission_id) on delete cascade,

    primary key (role_id, permission_id)
);


-- =====================================================
-- 3️⃣ CHECK PERMISSION FUNCTION
-- =====================================================

create or replace function core.has_permission(
    p_user_id uuid,
    p_permission_code text
)
returns boolean as $$
declare
    v_count int;
begin
    select count(*) into v_count
    from core.app_users u
    join core.role_permissions rp on rp.role_id = u.role_id
    join core.permissions p on p.permission_id = rp.permission_id
    where u.user_id = p_user_id
      and p.permission_code = p_permission_code
      and u.is_active = true;

    return v_count > 0;
end;
$$ language plpgsql stable;


-- =====================================================
-- 4️⃣ ENABLE RLS
-- =====================================================

alter table core.permissions enable row level security;
alter table core.role_permissions enable row level security;

drop policy if exists tenant_permission_isolation on core.role_permissions;
create policy tenant_permission_isolation
on core.role_permissions
for all
using (true);

drop policy if exists tenant_permission_read on core.permissions;
create policy tenant_permission_read
on core.permissions
for select
using (true);