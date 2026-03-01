-- ============================================
-- 0006_seed_roles_permissions
-- Default Governance Roles & Permissions
-- ============================================

-- =====================================================
-- 1️⃣ INSERT DEFAULT ROLES
-- =====================================================

insert into core.roles (role_id, role_name, role_scope)
values
    (uuid_generate_v4(), 'SUPER_ADMIN', 'GLOBAL'),
    (uuid_generate_v4(), 'TENANT_ADMIN', 'TENANT'),
    (uuid_generate_v4(), 'DEPARTMENT_HEAD', 'TENANT'),
    (uuid_generate_v4(), 'OFFICER', 'TENANT'),
    (uuid_generate_v4(), 'VIEWER', 'TENANT')
on conflict do nothing;


-- =====================================================
-- 2️⃣ INSERT DEFAULT PERMISSIONS
-- =====================================================

insert into core.permissions (permission_id, permission_code, module, action, description)
values
    (uuid_generate_v4(), 'TASK_CREATE', 'TASK', 'CREATE', 'Create new task'),
    (uuid_generate_v4(), 'TASK_UPDATE', 'TASK', 'UPDATE', 'Update task details'),
    (uuid_generate_v4(), 'TASK_ASSIGN', 'TASK', 'ASSIGN', 'Assign task to user'),
    (uuid_generate_v4(), 'TASK_VIEW', 'TASK', 'VIEW', 'View task'),
    (uuid_generate_v4(), 'TASK_APPROVE', 'TASK', 'APPROVE', 'Approve task'),
    (uuid_generate_v4(), 'TASK_ESCALATE', 'TASK', 'ESCALATE', 'Escalate task'),
    (uuid_generate_v4(), 'ADMIN_MANAGE_USERS', 'ADMIN', 'MANAGE_USERS', 'Manage users'),
    (uuid_generate_v4(), 'ADMIN_MANAGE_ROLES', 'ADMIN', 'MANAGE_ROLES', 'Manage roles'),
    (uuid_generate_v4(), 'ADMIN_VIEW_DASHBOARD', 'ADMIN', 'VIEW_DASHBOARD', 'View admin dashboard')
on conflict do nothing;


-- =====================================================
-- 3️⃣ ROLE → PERMISSION MAPPING
-- =====================================================

-- SUPER_ADMIN gets everything
insert into core.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from core.roles r
cross join core.permissions p
where r.role_name = 'SUPER_ADMIN'
on conflict do nothing;


-- TENANT_ADMIN
insert into core.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from core.roles r
join core.permissions p
    on p.permission_code in (
        'TASK_CREATE',
        'TASK_UPDATE',
        'TASK_ASSIGN',
        'TASK_VIEW',
        'TASK_APPROVE',
        'TASK_ESCALATE',
        'ADMIN_MANAGE_USERS',
        'ADMIN_VIEW_DASHBOARD'
    )
where r.role_name = 'TENANT_ADMIN'
on conflict do nothing;


-- DEPARTMENT_HEAD
insert into core.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from core.roles r
join core.permissions p
    on p.permission_code in (
        'TASK_CREATE',
        'TASK_UPDATE',
        'TASK_ASSIGN',
        'TASK_VIEW',
        'TASK_APPROVE',
        'ADMIN_VIEW_DASHBOARD'
    )
where r.role_name = 'DEPARTMENT_HEAD'
on conflict do nothing;


-- OFFICER
insert into core.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from core.roles r
join core.permissions p
    on p.permission_code in (
        'TASK_VIEW',
        'TASK_UPDATE'
    )
where r.role_name = 'OFFICER'
on conflict do nothing;


-- VIEWER
insert into core.role_permissions (role_id, permission_id)
select r.role_id, p.permission_id
from core.roles r
join core.permissions p
    on p.permission_code in (
        'TASK_VIEW'
    )
where r.role_name = 'VIEWER'
on conflict do nothing;